import React from 'react';
import { X, FileText, CheckSquare, Award, BookOpen, Layers } from 'lucide-react';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-rose-200 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6B1522] via-[#801828] to-[#9B1D30] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg">
                Technical Report Submission Guidelines
              </h3>
              <p className="text-xs text-rose-100/90">
                Formatting & Specifications for Physical Hardcover or Spiral Binding
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-gray-700">
          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 font-academic text-gray-800 leading-relaxed">
            The SIWES Technical Report represents your formal defense submission detailing practical industrial experience, engineering methodologies, and problem-solving acquired during attachment.
          </div>

          {/* Physical Submission Specifications */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#801828] mb-2 flex items-center space-x-1.5">
              <Layers className="w-4 h-4" />
              <span>Physical Document & Binding Standards</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <strong className="text-gray-900 block mb-0.5">Page Margins & Gutter</strong>
                Left margin: 1.25 inches (32mm) gutter to ensure text is never clipped during spiral or hard-cover binding. Right, top, bottom: 1.0 inch.
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <strong className="text-gray-900 block mb-0.5">Typography & Spacing</strong>
                12pt Times New Roman or serif font with 1.5 line spacing. Text is justified for professional academic alignment.
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <strong className="text-gray-900 block mb-0.5">Preliminary Sheets</strong>
                Includes Title Cover Page, Certification Approval Sheet, Dedication, Acknowledgements, and Abstract.
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <strong className="text-gray-900 block mb-0.5">Chapter Structure</strong>
                Chapters 1 through 5, with numbered subheadings (e.g. 1.0, 1.1, 2.0, 3.0), weekly activity matrices, and labeled figures.
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#801828] mb-2 flex items-center space-x-1.5">
              <CheckSquare className="w-4 h-4" />
              <span>Defense Submission Checklist</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-600 list-disc pl-4">
              <li>Export and print on clean white A4 80gsm paper.</li>
              <li>Obtain original signatures on the Certification Page from your Industry Supervisor, Departmental Supervisor, and Head of Department (HOD).</li>
              <li>Bind the document (comb, spiral, or departmental hardcover cloth binding) according to your faculty's specific color code.</li>
              <li>Have your endorsed physical logbook ready to accompany your bound technical report during defense presentation.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#801828] hover:bg-[#6B1522] text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
