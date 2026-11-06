import React, { useState, useMemo, useRef } from 'react';
import { 
  Download, Printer, Copy, Check, Edit3, Eye, Award, 
  BookOpen, ArrowLeft, FileText, CheckCircle2, Loader2 
} from 'lucide-react';
import { marked } from 'marked';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { StudentInfo } from '../types/siwes';
import { exportStructuredDocx } from '../utils/docxExport';

interface ReportViewerProps {
  reportMarkdown: string;
  onUpdateMarkdown: (newMarkdown: string) => void;
  studentInfo: StudentInfo;
  onOpenPreDefenseReview: () => void;
  onBackToEdit: () => void;
  wordCount?: number;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  reportMarkdown,
  onUpdateMarkdown,
  studentInfo,
  onOpenPreDefenseReview,
  onBackToEdit,
  wordCount,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState(reportMarkdown);
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Sync editable text when parent reportMarkdown updates
  React.useEffect(() => {
    setEditableText(reportMarkdown);
  }, [reportMarkdown]);

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

  // Structured PDF Export using html2canvas and jsPDF for physical submission
  const handleExportStructuredPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = reportRef.current;
      
      // Render canvas with high scale for crisp vector-like text printing
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        windowWidth: 1000,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add remaining pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const fileName = `SIWES_Technical_Report_${(studentInfo.name || 'Student').replace(/\s+/g, '_')}.pdf`;
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
            {/* Plain Academic Cover Page Presentation */}
            <div className="border border-black p-6 sm:p-10 mb-12 text-center bg-white">
              <div className="text-sm sm:text-base font-bold uppercase text-black tracking-wider mb-1">
                {studentInfo.institution || 'HIGHER INSTITUTION'}
              </div>
              <div className="text-xs sm:text-sm font-semibold uppercase text-black tracking-wide mb-1">
                {studentInfo.faculty || 'FACULTY OF ENGINEERING & TECHNOLOGY / SCIENCES'}
              </div>
              <div className="text-xs sm:text-sm font-bold uppercase text-black tracking-wide mb-6">
                DEPARTMENT OF {studentInfo.department || 'TECHNICAL STUDIES'}
              </div>

              <div className="my-6 py-4 border-y border-black">
                <h1 className="text-lg sm:text-xl font-bold uppercase text-black tracking-wide leading-snug m-0 border-none p-0">
                  A TECHNICAL REPORT ON THE STUDENTS INDUSTRIAL WORK EXPERIENCE SCHEME (SIWES)
                </h1>
              </div>

              <div className="text-xs sm:text-sm text-black font-medium my-4">
                HELD AT:
                <div className="font-bold text-black uppercase text-sm sm:text-base mt-0.5">
                  {studentInfo.hostOrg || 'HOST ESTABLISHMENT'}
                </div>
                <div className="text-xs text-black">
                  {studentInfo.hostAddress || 'NIGERIA'}
                </div>
              </div>

              <div className="text-xs sm:text-sm text-black my-5">
                SUBMITTED BY:
                <div className="font-bold text-black uppercase text-sm sm:text-base mt-0.5">
                  {studentInfo.name || 'STUDENT NAME'}
                </div>
                <div className="font-mono text-xs font-semibold text-black">
                  MATRIC NO: {studentInfo.matricNo || 'N/A'}
                </div>
              </div>

              <div className="text-[11px] sm:text-xs text-black max-w-md mx-auto italic mt-6 leading-relaxed">
                IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF{' '}
                <strong>BACHELOR OF SCIENCE / ENGINEERING ({studentInfo.department || 'B.Sc/B.Eng'})</strong>.
              </div>

              <div className="text-xs font-bold text-black uppercase tracking-wider mt-6 pt-3 border-t border-black">
                {studentInfo.academicYear || '2024/2025 ACADEMIC SESSION'}
              </div>
            </div>

            {/* Plain Academic Certification Signature Block */}
            <div className="mb-12 p-6 border border-black bg-white page-break">
              <h2 className="text-center text-base font-bold text-black uppercase tracking-wider mb-4">
                Certification & Approval
              </h2>
              <p className="text-xs text-black text-justify mb-8 leading-relaxed">
                This is to certify that this SIWES Technical Report was written and compiled by{' '}
                <strong>{studentInfo.name || 'the student'}</strong> (Matric No:{' '}
                <strong>{studentInfo.matricNo || 'N/A'}</strong>) of the Department of{' '}
                <strong>{studentInfo.department || 'the Department'}</strong>,{' '}
                <strong>{studentInfo.institution || 'the Institution'}</strong>, in partial fulfillment
                of the Students Industrial Work Experience Scheme (SIWES) conducted at{' '}
                <strong>{studentInfo.hostOrg || 'the Host Establishment'}</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-center">
                <div className="space-y-1">
                  <div className="border-b border-black w-3/4 mx-auto pb-6"></div>
                  <div className="text-xs font-bold text-black pt-1">
                    {studentInfo.industrySupervisor || 'Industry Supervisor'}
                  </div>
                  <div className="text-[10px] text-black">Sign & Date / Stamp</div>
                </div>

                <div className="space-y-1">
                  <div className="border-b border-black w-3/4 mx-auto pb-6"></div>
                  <div className="text-xs font-bold text-black pt-1">
                    {studentInfo.academicSupervisor || 'Departmental Supervisor'}
                  </div>
                  <div className="text-[10px] text-black">Sign & Date</div>
                </div>

                <div className="space-y-1">
                  <div className="border-b border-black w-3/4 mx-auto pb-6"></div>
                  <div className="text-xs font-bold text-black pt-1">
                    {studentInfo.headOfDepartment || 'Head of Department (HOD)'}
                  </div>
                  <div className="text-[10px] text-black">Sign & Seal</div>
                </div>
              </div>
            </div>

            {/* Rendered Markdown Body Content */}
            <div
              className="report-content"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
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
