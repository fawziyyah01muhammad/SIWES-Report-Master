import React from 'react';
import { BookOpen, FileCheck, FileText, HelpCircle } from 'lucide-react';

interface NavbarProps {
  onOpenTips: () => void;
  onReset: () => void;
  hasReport: boolean;
  onViewReport?: () => void;
  onStartNew?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTips,
  onReset,
  hasReport,
  onViewReport,
  onStartNew,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#6B1522] text-white shadow-md border-b border-[#801828]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onStartNew}>
          <div className="w-10 h-10 rounded-lg bg-white text-[#6B1522] flex items-center justify-center font-bold shadow-inner">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-heading tracking-wide text-lg font-bold leading-tight">
                SIWES REPORT STUDIO
              </span>
              <span className="text-[10px] uppercase tracking-wider bg-white/15 text-rose-100 px-1.5 py-0.5 rounded font-medium border border-white/20">
                Defense Ready
              </span>
            </div>
            <p className="text-xs text-rose-100/90 font-medium">
              Technical Report & Submission Document Generator
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {hasReport && onViewReport && (
            <button
              onClick={onViewReport}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white text-[#6B1522] hover:bg-rose-50 text-xs font-semibold rounded-md shadow transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Current Report</span>
            </button>
          )}

          <button
            onClick={onOpenTips}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#801828] hover:bg-[#9B1D30] text-rose-50 text-xs font-medium rounded-md transition border border-rose-300/20"
            title="Physical Submission Guidelines & Checklist"
          >
            <FileCheck className="w-3.5 h-3.5 text-rose-200" />
            <span className="hidden sm:inline">Submission Guidelines</span>
            <span className="sm:hidden">Guide</span>
          </button>

          <button
            onClick={onReset}
            className="text-xs text-rose-200 hover:text-white px-2 py-1.5 rounded transition"
            title="Reset to New Student"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
};
