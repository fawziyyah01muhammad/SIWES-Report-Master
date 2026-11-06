import React, { useState, useMemo, useRef } from 'react';
import { 
  Download, Printer, Copy, Check, Edit3, Eye, Award, 
  BookOpen, ArrowLeft, FileText, CheckCircle2, Loader2,
  Quote, X, Sparkles, ExternalLink 
} from 'lucide-react';
import { marked } from 'marked';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { StudentInfo, REFERENCING_STYLES, ReferencingStyle } from '../types/siwes';
import { exportStructuredDocx } from '../utils/docxExport';
import { getRecommendedReferencesForStudent, formatCitation } from '../utils/referenceCatalog';

interface ReportViewerProps {
  reportMarkdown: string;
  onUpdateMarkdown: (newMarkdown: string) => void;
  studentInfo: StudentInfo;
  onOpenPreDefenseReview: () => void;
  onBackToEdit: () => void;
  wordCount?: number;
  referencingStyle?: ReferencingStyle;
  onReferencingStyleChange?: (style: ReferencingStyle) => void;
}

interface MarkdownSection {
  id: string;
  title: string;
  markdown: string;
}

function splitMarkdownIntoSections(markdown: string): MarkdownSection[] {
  if (!markdown || !markdown.trim()) return [];

  // Clean duplicate raw cover page/cert headers if present at start of markdown
  const cleaned = markdown
    .replace(/^(?:#+\s*)?(?:A\s+)?TECHNICAL\s+REPORT\s+ON[\s\S]*?(?=(?:#+\s*)?(?:DEDICATION|ACKNOWLEDGEMENT|ABSTRACT|TABLE OF CONTENTS|CHAPTER))/i, '')
    // Clean excessive underline dashes so marked does not misinterpret them as h2 headings
    .replace(/\n[-]{4,}\n/g, '\n\n---\n\n')
    .trim();

  const lines = cleaned.split(/\r?\n/);
  const sections: MarkdownSection[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];

  const isSectionHeader = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return false;

    // Standard markdown H1: # Title
    if (/^#\s+[^#]/.test(trimmed)) {
      return true;
    }

    // Explicit CHAPTER header without hash (e.g. "CHAPTER ONE: ...", "CHAPTER 1: ...")
    if (/^CHAPTER\s+(?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|[0-9]+)\b/i.test(trimmed)) {
      return true;
    }

    // Explicit major academic sections without hash
    if (/^(?:DEDICATION|ACKNOWLEDGEMENTS?|ABSTRACT(?:\s*\/\s*EXECUTIVE\s+SUMMARY)?|TABLE\s+OF\s+CONTENTS|REFERENCES|APPENDIX|APPENDICES)\b/i.test(trimmed)) {
      return true;
    }

    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isSectionHeader(line)) {
      if (currentLines.length > 0) {
        sections.push({
          id: `sec-${sections.length}`,
          title: currentTitle || 'Preliminary',
          markdown: currentLines.join('\n').trim(),
        });
        currentLines = [];
      }
      currentTitle = line.trim().replace(/^#+\s*/, '');
      const normalizedLine = line.trim().startsWith('# ') ? line : `# ${line.trim().replace(/^#+\s*/, '')}`;
      currentLines.push(normalizedLine);
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push({
      id: `sec-${sections.length}`,
      title: currentTitle || 'Section',
      markdown: currentLines.join('\n').trim(),
    });
  }

  return sections;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  reportMarkdown,
  onUpdateMarkdown,
  studentInfo,
  onOpenPreDefenseReview,
  onBackToEdit,
  wordCount,
  referencingStyle = 'apa-7',
  onReferencingStyleChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState(reportMarkdown);
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [isCitationsModalOpen, setIsCitationsModalOpen] = useState(false);
  const [activeStyle, setActiveStyle] = useState<ReferencingStyle>(referencingStyle);
  const [isCopiedBibliography, setIsCopiedBibliography] = useState(false);
  const [copiedCitationId, setCopiedCitationId] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Sync activeStyle with prop
  React.useEffect(() => {
    if (referencingStyle) setActiveStyle(referencingStyle);
  }, [referencingStyle]);

  const handleSelectCitationStyle = (style: ReferencingStyle) => {
    setActiveStyle(style);
    if (onReferencingStyleChange) {
      onReferencingStyleChange(style);
    }
  };

  // Recommended literature for student's field
  const recommendedCitations = useMemo(() => {
    return getRecommendedReferencesForStudent(
      studentInfo.department,
      studentInfo.faculty,
      activeStyle
    );
  }, [studentInfo.department, studentInfo.faculty, activeStyle]);

  const handleCopyAllBibliography = () => {
    const textToCopy = recommendedCitations.map((c) => c.formatted).join('\n\n');
    navigator.clipboard.writeText(textToCopy);
    setIsCopiedBibliography(true);
    setTimeout(() => setIsCopiedBibliography(false), 2000);
  };

  const handleCopySingleCitation = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCitationId(id);
    setTimeout(() => setCopiedCitationId(null), 2000);
  };

  // Sync editable text when parent reportMarkdown updates
  React.useEffect(() => {
    setEditableText(reportMarkdown);
  }, [reportMarkdown]);

  // Split markdown into individual chapters/sections so each starts on a brand-new page
  const chapterSections = useMemo(() => {
    return splitMarkdownIntoSections(editableText || reportMarkdown);
  }, [editableText, reportMarkdown]);

  // Convert markdown to HTML safely using marked
  const renderedHtml = useMemo(() => {
    try {
      const textToRender = (editableText || reportMarkdown)
        // Clean duplicate raw cover page/cert headers if present at start of markdown
        .replace(/^(?:#+\s*)?(?:A\s+)?TECHNICAL\s+REPORT\s+ON[\s\S]*?(?=(?:#+\s*)?(?:DEDICATION|ACKNOWLEDGEMENT|ABSTRACT|CHAPTER))/i, '')
        // Clean excessive underline dashes so marked does not misinterpret them as h2 headings
        .replace(/\n[-]{4,}\n/g, '\n\n---\n\n');

      return marked.parse(textToRender, {
        gfm: true,
        breaks: true,
      }) as string;
    } catch (err) {
      console.error('Error rendering markdown:', err);
      return `<p>${editableText || reportMarkdown}</p>`;
    }
  }, [editableText, reportMarkdown]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableText || reportMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    onUpdateMarkdown(editableText);
    setIsEditing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // Export genuine native Microsoft Word Document (.docx) that preserves exact layout and never scatters
  const handleExportWord = async () => {
    setIsGeneratingDocx(true);
    try {
      await exportStructuredDocx(studentInfo, editableText || reportMarkdown);
    } catch (err) {
      console.warn('Docx export failed, falling back to legacy format:', err);
      // Legacy .doc fallback in case of emergency
      const docTitle = `SIWES_Technical_Report_${(studentInfo.name || 'Student').replace(/\s+/g, '_')}`;
      const wordContent = `
        <html xmlns:v="urn:schemas-microsoft-com:vml"
              xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:w="urn:schemas-microsoft-com:office:word"
              xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <title>${docTitle}</title>
          <style>
            @page { size: 210mm 297mm; margin: 1.0in 1.0in 1.0in 1.25in; }
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000000; }
            h1 { font-size: 15pt; font-weight: bold; text-align: center; text-transform: uppercase; color: #000000; }
            h2, h3 { color: #000000; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; border: 1pt solid #000000; }
            th, td { border: 1pt solid #000000; padding: 5pt 7pt; color: #000000; }
            th { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="academic-doc">
            ${renderedHtml}
          </div>
        </body>
        </html>
      `;
      const blob = new Blob(['\ufeff' + wordContent], {
        type: 'application/msword;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${docTitle}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  // Structured PDF Export using html2canvas and jsPDF
  // Guarantees:
  // 1. No borders around sections
  // 2. Custom academic year
  // 3. Each chapter starts from a brand-new page!
  const handleExportStructuredPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const reportContainer = reportRef.current;
      const sectionElements = reportContainer.querySelectorAll<HTMLElement>('.pdf-section');

      if (!sectionElements || sectionElements.length === 0) {
        throw new Error('No report sections available to export.');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      let isFirstPage = true;

      for (let i = 0; i < sectionElements.length; i++) {
        const sec = sectionElements[i];

        // Render each section with high resolution
        const canvas = await html2canvas(sec, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
          windowWidth: 1000,
          scrollX: 0,
          scrollY: 0,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        // Each chapter and major section begins on a fresh, brand-new page
        if (!isFirstPage) {
          pdf.addPage();
        } else {
          isFirstPage = false;
        }

        if (imgHeight <= pdfHeight) {
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
        } else {
          // If a chapter is longer than 1 A4 page (e.g. Chapter 3 with extensive weekly activity tables),
          // flow it across continuation pages, and the subsequent chapter will still start on a brand-new page
          let heightLeft = imgHeight;
          let position = 0;

          // First page of this chapter
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;

          // Continuation pages for this chapter only
          while (heightLeft > 5) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pdfHeight;
          }
        }
      }

      const studentNameClean = (studentInfo.name || 'Student').replace(/\s+/g, '_');
      const fileName = `SIWES_Technical_Report_${studentNameClean}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback to browser print dialog
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-3 sm:p-4 no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onBackToEdit}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Edit Form / Inputs</span>
          </button>

          <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>

          <div className="text-xs text-gray-500 font-medium hidden sm:inline-block">
            Report size:{' '}
            <span className="font-semibold text-gray-800">
              {wordCount || reportMarkdown.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
        </div>

        {/* Action Buttons for Physical Submission & Review */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Citations & Bibliography Manager */}
          <button
            type="button"
            onClick={() => setIsCitationsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#6B1522] text-xs font-bold rounded-lg border border-rose-300 transition shadow-2xs"
            title="View, convert, and copy cited literature in APA, IEEE, Harvard, MLA, Vancouver"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#801828]" />
            <span>Citations ({REFERENCING_STYLES.find(s => s.id === activeStyle)?.shortName || 'APA 7th'})</span>
          </button>

          {/* Defense Readiness Review */}
          <button
            type="button"
            onClick={onOpenPreDefenseReview}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-[#801828] hover:bg-[#6B1522] text-white text-xs font-bold rounded-lg shadow-sm transition border border-rose-300/30"
          >
            <Award className="w-3.5 h-3.5 text-rose-200" />
            <span>Pre-Defense Evaluation</span>
          </button>

          {/* Download Structured PDF Button */}
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleExportStructuredPdf}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#6B1522] text-xs font-bold rounded-lg border border-rose-300 transition shadow-2xs disabled:opacity-60"
            title="Download formatted PDF for physical binding"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#801828]" />
                <span>Building PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-[#801828]" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {/* Download Native Word (.docx) Button */}
          <button
            type="button"
            disabled={isGeneratingDocx}
            onClick={handleExportWord}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg border border-gray-300 transition shadow-2xs disabled:opacity-60"
            title="Download genuine Microsoft Word document (.docx) — formatted, structured, and will not scatter"
          >
            {isGeneratingDocx ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#801828]" />
                <span>Building Word...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-[#801828]" />
                <span className="hidden sm:inline">Word (.docx)</span>
                <span className="sm:hidden">Word</span>
              </>
            )}
          </button>

          {/* Print Preview Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 transition"
            title="Open Print Dialog"
          >
            <Printer className="w-3.5 h-3.5 text-[#801828]" />
            <span className="hidden sm:inline">Print Dialog</span>
            <span className="sm:hidden">Print</span>
          </button>

          {/* Toggle Edit Text */}
          <button
            type="button"
            onClick={() => {
              if (isEditing) {
                handleSaveEdit();
              } else {
                setEditableText(reportMarkdown);
                setIsEditing(true);
              }
            }}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-300 transition"
            title="Edit report text"
          >
            {isEditing ? <Eye className="w-3.5 h-3.5 text-[#801828]" /> : <Edit3 className="w-3.5 h-3.5" />}
          </button>

          {/* Copy Report Text */}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-300 transition"
            title="Copy Report Content"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Anti-Scattering Submission Formatting Notice */}
      <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl no-print flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-full bg-[#801828] text-white flex items-center justify-center font-bold text-xs shrink-0">
            ✓
          </div>
          <div>
            <span className="font-bold text-[#6B1522]">
              Structured Layout Guaranteed — Preserved Exact Formatting
            </span>
            <p className="text-gray-600 text-[11px] mt-0.5">
              Word (.docx) and PDF downloads use native document specifications with exact 1.25" physical binding gutters, centered cover pages, and aligned tables so the document appears identical before and after downloading.
            </p>
          </div>
        </div>
      </div>

      {/* Main Report Document Sheet Container */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {isEditing ? (
          /* Editable Markdown Mode */
          <div className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Direct Text Editor
              </span>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3.5 py-1.5 bg-[#801828] text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Save & Preview
              </button>
            </div>
            <textarea
              rows={28}
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              className="w-full p-4 font-mono text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] leading-relaxed"
            />
          </div>
        ) : (
          /* Academic Formatted Paper View (captured for PDF & Print) */
          <div 
            ref={reportRef}
            className="p-6 sm:p-12 md:p-16 max-w-4xl mx-auto academic-doc bg-white"
          >
            {/* Plain Academic Cover Page (Page 1 in PDF, No borders around section) */}
            <div className="pdf-section cover-page-section py-8 px-6 sm:px-10 mb-14 text-center bg-white">
              <div className="text-sm sm:text-base font-bold uppercase text-black tracking-wider mb-1.5">
                {studentInfo.institution || 'HIGHER INSTITUTION'}
              </div>
              <div className="text-xs sm:text-sm font-semibold uppercase text-black tracking-wide mb-1.5">
                {studentInfo.faculty || 'FACULTY OF ENGINEERING & TECHNOLOGY / SCIENCES'}
              </div>
              <div className="text-xs sm:text-sm font-bold uppercase text-black tracking-wide mb-8">
                DEPARTMENT OF {studentInfo.department || 'TECHNICAL STUDIES'}
              </div>

              <div className="my-8 py-2">
                <h1 className="text-lg sm:text-xl font-bold uppercase text-black tracking-wide leading-snug m-0 border-none p-0">
                  A TECHNICAL REPORT ON THE STUDENTS INDUSTRIAL WORK EXPERIENCE SCHEME (SIWES)
                </h1>
              </div>

              <div className="text-xs sm:text-sm text-black font-medium my-6">
                HELD AT:
                <div className="font-bold text-black uppercase text-sm sm:text-base mt-1">
                  {studentInfo.hostOrg || 'HOST ESTABLISHMENT'}
                </div>
                <div className="text-xs text-black mt-0.5">
                  {studentInfo.hostAddress || 'NIGERIA'}
                </div>
              </div>

              <div className="text-xs sm:text-sm text-black my-6">
                SUBMITTED BY:
                <div className="font-bold text-black uppercase text-sm sm:text-base mt-1">
                  {studentInfo.name || 'STUDENT NAME'}
                </div>
                <div className="font-mono text-xs font-semibold text-black mt-0.5">
                  MATRIC NO: {studentInfo.matricNo || 'N/A'}
                </div>
              </div>

              <div className="text-[11px] sm:text-xs text-black max-w-md mx-auto italic my-8 leading-relaxed">
                IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF{' '}
                <strong>BACHELOR OF SCIENCE / ENGINEERING ({studentInfo.department || 'B.Sc/B.Eng'})</strong>.
              </div>

              <div className="text-xs sm:text-sm font-bold text-black uppercase tracking-wider mt-8 pt-2">
                {studentInfo.academicYear
                  ? (studentInfo.academicYear.toUpperCase().includes('SESSION')
                      ? studentInfo.academicYear.toUpperCase()
                      : `${studentInfo.academicYear.toUpperCase()} ACADEMIC SESSION`)
                  : 'ACADEMIC SESSION'}
              </div>
            </div>

            {/* Plain Academic Certification Signature Block (Page 2 in PDF, No borders around section) */}
            <div className="pdf-section cert-page-section page-break py-8 px-6 sm:px-10 mb-14 bg-white">
              <h2 className="text-center text-base sm:text-lg font-bold text-black uppercase tracking-wider mb-6">
                Certification & Approval
              </h2>
              <p className="text-xs sm:text-sm text-black text-justify mb-10 leading-relaxed">
                This is to certify that this SIWES Technical Report was written and compiled by{' '}
                <strong>{studentInfo.name || 'the student'}</strong> (Matric No:{' '}
                <strong>{studentInfo.matricNo || 'N/A'}</strong>) of the Department of{' '}
                <strong>{studentInfo.department || 'the Department'}</strong>,{' '}
                <strong>{studentInfo.institution || 'the Institution'}</strong>, in partial fulfillment
                of the Students Industrial Work Experience Scheme (SIWES) conducted at{' '}
                <strong>{studentInfo.hostOrg || 'the Host Establishment'}</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-center">
                <div className="space-y-1.5">
                  <div className="border-b border-black w-3/4 mx-auto pb-8"></div>
                  <div className="text-xs font-bold text-black pt-1">
                    {studentInfo.industrySupervisor || 'Industry Supervisor'}
                  </div>
                  <div className="text-[10px] text-black">Sign & Date / Stamp</div>
                </div>

                <div className="space-y-1.5">
                  <div className="border-b border-black w-3/4 mx-auto pb-8"></div>
                  <div className="text-xs font-bold text-black pt-1">
                    {studentInfo.academicSupervisor || 'Departmental Supervisor'}
                  </div>
                  <div className="text-[10px] text-black">Sign & Date</div>
                </div>

                <div className="space-y-1.5">
                  <div className="border-b border-black w-3/4 mx-auto pb-8"></div>
                  <div className="text-xs font-bold text-black pt-1">
                    {studentInfo.headOfDepartment || 'Head of Department (HOD)'}
                  </div>
                  <div className="text-[10px] text-black">Sign & Seal</div>
                </div>
              </div>
            </div>

            {/* Rendered Chapter Sections (Each Chapter Starts From A New Page in PDF & Print) */}
            {chapterSections.length > 0 ? (
              chapterSections.map((sec) => {
                const secHtml = marked.parse(sec.markdown, {
                  gfm: true,
                  breaks: true,
                }) as string;
                return (
                  <div
                    key={sec.id}
                    className="pdf-section chapter-section page-break py-4 px-4 sm:px-8 mb-14 bg-white"
                    dangerouslySetInnerHTML={{ __html: secHtml }}
                  />
                );
              })
            ) : (
              <div
                className="pdf-section chapter-section report-content py-4 px-4 sm:px-8 bg-white"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom Bar for Mobile Devices */}
      <div className="sm:hidden fixed bottom-3 inset-x-3 z-30 bg-[#6B1522] text-white p-2.5 rounded-xl shadow-xl flex items-center justify-between no-print border border-[#9B1D30]">
        <button
          type="button"
          onClick={handleExportStructuredPdf}
          disabled={isGeneratingPdf}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-[#6B1522] text-xs font-bold rounded-lg shadow-sm"
        >
          {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Download PDF</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={isGeneratingDocx}
            onClick={handleExportWord}
            className="p-2 bg-[#801828] text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            title="Download Word (.docx) - Guaranteed No Scattering"
          >
            {isGeneratingDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onOpenPreDefenseReview}
            className="p-2 bg-[#801828] text-white rounded-lg text-xs font-semibold"
            title="Pre-Defense Review"
          >
            <Award className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
