import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ChevronRight, FileCheck2, Printer, Download } from 'lucide-react';
import { SampleDataset } from '../types/siwes';

interface GuideBannerProps {
  onSelectSample: (sample: SampleDataset) => void;
  samples: SampleDataset[];
}

export const GuideBanner: React.FC<GuideBannerProps> = ({
  onSelectSample,
  samples,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-rose-100 overflow-hidden mb-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#6B1522] via-[#801828] to-[#9B1D30] text-white p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white shadow-inner">
              <FileCheck2 className="w-6 h-6 text-rose-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-heading font-bold text-base sm:text-lg text-white">
                  SIWES Technical Report Studio
                </h2>
                <span className="bg-white/15 text-rose-100 text-[11px] px-2 py-0.5 rounded-full font-medium border border-white/20">
                  Physical Submission Ready
                </span>
              </div>
              <p className="text-xs text-rose-100/90 mt-0.5">
                Generate structured, defense-ready technical reports from your scanned logbook
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs bg-white text-[#6B1522] hover:bg-rose-50 px-3 py-1.5 rounded-md font-semibold transition self-end sm:self-auto flex items-center space-x-1 shadow-xs"
          >
            <span>{isExpanded ? 'Hide Instructions' : 'Submission Instructions'}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* Short informative summary */}
        <p className="mt-3 text-xs sm:text-sm text-rose-50 leading-relaxed font-academic border-l-2 border-rose-300/40 pl-3">
          Follow the 3-step workflow below: enter your attachment details, upload your scanned logbook (as a PDF document or weekly page photos), and select your format. The AI compiles a structured, multi-chapter technical report ready to download as a structured PDF or Word document for physical binding.
        </p>
      </div>

      {/* Expanded Advice & Checklist */}
      {isExpanded && (
        <div className="p-4 sm:p-5 bg-rose-50/50 border-b border-rose-100 text-xs sm:text-sm text-gray-700 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-lg border border-rose-200/60 shadow-xs">
              <div className="flex items-center space-x-2 text-[#6B1522] font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>1. Scanned PDF or Photos Upload</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Upload your multi-page scanned logbook PDF or snap photos of weekly activities, supervisor notes, and equipment diagrams.
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-rose-200/60 shadow-xs">
              <div className="flex items-center space-x-2 text-[#6B1522] font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>2. Academic Technical Depth</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                The AI structures the content into 5 standard chapters with technical principles, health & safety (HSE), and weekly activity tables.
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-rose-200/60 shadow-xs">
              <div className="flex items-center space-x-2 text-[#6B1522] font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>3. Download Structured PDF / Word</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                Export directly as a structured PDF or Word document with cover page, certification page, 1.5 line spacing, and A4 margins for spiral or hard-cover binding.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instant Test Presets bar */}
      <div className="p-3 sm:p-4 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1.5 text-gray-600">
          <Sparkles className="w-4 h-4 text-[#801828]" />
          <span className="font-semibold text-gray-800">Quick Test:</span>
          <span className="text-gray-500 hidden sm:inline">Load sample student logbook & activities:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {samples.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-[#6B1522] border border-rose-200/80 font-medium transition text-xs flex items-center space-x-1"
            >
              <span>{sample.badge}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
