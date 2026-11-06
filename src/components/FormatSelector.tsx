import React, { useRef, useState } from 'react';
import { 
  FileCode, Upload, FileText, CheckCircle, ChevronDown, ChevronUp, 
  Sliders, BookOpen, Quote, Sparkles 
} from 'lucide-react';
import { STANDARD_FORMATS, REFERENCING_STYLES, ReferencingStyle } from '../types/siwes';
import { getRecommendedReferencesForStudent } from '../utils/referenceCatalog';

interface FormatSelectorProps {
  selectedFormat: string;
  onSelectFormat: (formatId: string) => void;
  customGuidelineText: string;
  onCustomGuidelineChange: (text: string) => void;
  additionalNotes: string;
  onAdditionalNotesChange: (notes: string) => void;
  referencingStyle: ReferencingStyle;
  onReferencingStyleChange: (style: ReferencingStyle) => void;
  studentDepartment?: string;
  studentFaculty?: string;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedFormat,
  onSelectFormat,
  customGuidelineText,
  onCustomGuidelineChange,
  additionalNotes,
  onAdditionalNotesChange,
  referencingStyle,
  onReferencingStyleChange,
  studentDepartment = '',
  studentFaculty = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showAdditionalNotes, setShowAdditionalNotes] = useState(false);
  const [showCitationGuide, setShowCitationGuide] = useState(false);

  // Recommended reference books and journals tailored to the student's department
  const recommendedCitations = getRecommendedReferencesForStudent(
    studentDepartment,
    studentFaculty,
    referencingStyle
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onCustomGuidelineChange(content || `Uploaded Guideline: ${file.name}`);
      onSelectFormat('custom');
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-50 to-white px-4 py-3 border-b border-rose-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-md bg-[#6B1522] text-white flex items-center justify-center text-xs font-bold">
            3
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-gray-900">
              Technical Report Format & Guidelines
            </h3>
            <p className="text-[11px] text-gray-500">
              Select standard institutional outline or upload your department's specific report format
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STANDARD_FORMATS.map((fmt) => {
            const isSelected = selectedFormat === fmt.id;
            return (
              <div
                key={fmt.id}
                onClick={() => onSelectFormat(fmt.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#801828] bg-rose-50/40 ring-1 ring-[#801828] shadow-xs'
                    : 'border-gray-200 hover:border-rose-200 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                      {fmt.name}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ml-2 mt-0.5 border ${
                        isSelected
                          ? 'bg-[#801828] border-[#801828] text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                    {fmt.description}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-gray-100 text-[10px] text-gray-400 font-mono truncate">
                  {fmt.outline}
                </div>
              </div>
            );
          })}
        </div>

        {/* Referencing & Academic Citation Style Section */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
            <div className="flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-[#801828]" />
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Academic Referencing Style & Citations
              </label>
            </div>
            <span className="text-[11px] text-gray-500">
              For Chapter References & In-text Citations
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {REFERENCING_STYLES.map((style) => {
              const isSelected = referencingStyle === style.id;
              return (
                <button
                  type="button"
                  key={style.id}
                  onClick={() => onReferencingStyleChange(style.id)}
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#801828] bg-rose-50/70 text-[#6B1522] ring-1 ring-[#801828] shadow-2xs'
                      : 'border-gray-200 hover:border-rose-200 bg-white text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold">{style.shortName}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#801828]"></span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 line-clamp-1 leading-tight">
                    {style.id === 'apa-7' ? 'Standard / Recommended' : style.id === 'ieee' ? 'Engineering & Tech' : style.id === 'harvard' ? 'Author-Date' : style.id === 'vancouver' ? 'Medical/Science' : 'Humanities'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Collapsible Citation Preview & Discipline Books */}
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => setShowCitationGuide(!showCitationGuide)}
              className="text-[11px] text-[#801828] hover:text-[#6B1522] font-semibold flex items-center space-x-1"
            >
              <Quote className="w-3 h-3" />
              <span>
                {showCitationGuide
                  ? 'Hide Cited Literature Preview'
                  : `Preview Cited Books & Journals for ${studentDepartment ? studentDepartment : 'Your Discipline'} (${REFERENCING_STYLES.find(s => s.id === referencingStyle)?.shortName || 'APA 7th'})`}
              </span>
              {showCitationGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showCitationGuide && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                  <span className="font-semibold text-gray-800 text-[11px]">
                    Standard Reference Example ({REFERENCING_STYLES.find(s => s.id === referencingStyle)?.name}):
                  </span>
                  <span className="text-[10px] font-mono text-[#801828] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    {referencingStyle.toUpperCase()}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-gray-700 bg-white p-2 rounded border border-gray-200 leading-relaxed select-all">
                  {REFERENCING_STYLES.find(s => s.id === referencingStyle)?.example}
                </p>

                <div className="pt-1">
                  <div className="text-[11px] font-semibold text-gray-800 mb-1 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-[#801828]" />
                    <span>Discipline Textbooks & Journals Automatically Cited:</span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {recommendedCitations.map((item, idx) => (
                      <div
                        key={item.citation.id || idx}
                        className="p-1.5 bg-white rounded border border-gray-100 text-[10px] text-gray-700 font-mono leading-relaxed"
                      >
                        {item.formatted}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Custom Guideline Upload & Text Area if Custom is active */}
        {selectedFormat === 'custom' && (
          <div className="mt-3 p-4 bg-rose-50/30 rounded-xl border border-rose-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-[#801828]">
                  Custom Departmental Format / Outline
                </h4>
                <p className="text-[11px] text-gray-500">
                  Upload your department’s handout or paste the exact chapter headings required.
                </p>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.doc,.docx,text/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg border border-gray-300 shadow-2xs transition"
                >
                  <Upload className="w-3.5 h-3.5 text-[#801828]" />
                  <span>{uploadedFileName ? 'Replace File' : 'Upload Format Document'}</span>
                </button>
              </div>
            </div>

            {uploadedFileName && (
              <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Loaded file: <strong>{uploadedFileName}</strong></span>
              </div>
            )}

            <textarea
              rows={4}
              value={customGuidelineText}
              onChange={(e) => onCustomGuidelineChange(e.target.value)}
              placeholder="e.g. Chapter 1: Introduction & Establishment Profile; Chapter 2: Hardware Architecture & Network Engineering; Chapter 3: Software Implementation & Database Design; Chapter 4: Testing & Troubleshooting; Chapter 5: Conclusion & Recommendations..."
              className="w-full p-2.5 text-xs font-mono bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] text-gray-800"
            />
          </div>
        )}

        {/* Optional Focus / Additional Instructions */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdditionalNotes(!showAdditionalNotes)}
            className="text-xs text-[#801828] hover:text-[#6B1522] font-semibold flex items-center space-x-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>
              {showAdditionalNotes
                ? 'Hide Additional Directives'
                : '+ Add Special Directives (e.g. Emphasize HSE, Specific Machinery, Network Protocols)'}
            </span>
            {showAdditionalNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showAdditionalNotes && (
            <div className="mt-2.5 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Additional Instructions & Technical Focus
              </label>
              <textarea
                rows={2}
                value={additionalNotes}
                onChange={(e) => onAdditionalNotesChange(e.target.value)}
                placeholder="e.g. 'Pay special attention to safety measures in the high voltage switchyard', 'Include detailed steps for Cisco router configuration in Chapter 3', 'Detail the microbiological media preparation formula'..."
                className="w-full p-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#801828] text-gray-800"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
