import React from 'react';
import { Award, CheckCircle2, AlertTriangle, HelpCircle, X, ShieldCheck } from 'lucide-react';
import { TechnicalReviewData } from '../types/siwes';

interface PreDefenseReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: TechnicalReviewData | null;
  isLoading: boolean;
  studentName?: string;
}

export const PreDefenseReviewModal: React.FC<PreDefenseReviewModalProps> = ({
  isOpen,
  onClose,
  review,
  isLoading,
  studentName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-rose-200 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6B1522] via-[#801828] to-[#9B1D30] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold font-heading text-lg">
              <Award className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg">
                Pre-Defense Technical Evaluation
              </h3>
              <p className="text-xs text-rose-100/90">
                Defense readiness assessment for {studentName || 'Student'}
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-gray-800">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-rose-200 border-t-[#801828] animate-spin"></div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-800">
                  Evaluating technical report against defense benchmarks...
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Checking technical depth, logbook fidelity, methodology, and formatting.
                </p>
              </div>
            </div>
          ) : review ? (
            <>
              {/* Scorecard Box */}
              <div className="bg-gradient-to-br from-rose-50 via-white to-rose-50/50 p-4 sm:p-5 rounded-xl border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-xs font-bold text-[#801828] uppercase tracking-wider">
                    Estimated Pre-Defense Grade
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900 font-heading">
                    {review.grade}
                  </div>
                  <p className="text-xs text-gray-600 max-w-sm">
                    {review.verdict}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center bg-white border-2 border-[#801828] w-24 h-24 rounded-2xl shadow-sm shrink-0">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#801828]">
                    {review.totalScore}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-gray-500">
                    / 100 Marks
                  </span>
                </div>
              </div>

              {/* Criteria Scores */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2.5 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#801828]" />
                  <span>Defense Criteria Breakdown</span>
                </h4>

                <div className="space-y-2">
                  {review.criteriaScores.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50/80 rounded-lg border border-gray-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-gray-800">
                        <span>{c.name}</span>
                        <span className="text-[#801828] font-bold">
                          {c.score} / {c.max}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#801828] h-1.5 rounded-full"
                          style={{ width: `${(c.score / c.max) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-gray-500 text-[11px] pt-0.5">{c.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-2">
                  <div className="text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Report Strengths</span>
                  </div>
                  <ul className="text-xs text-emerald-950 space-y-1.5 pl-3 list-disc">
                    {(review.keyStrengths || []).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
                  <div className="text-xs font-bold text-amber-800 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Areas to Polish for Defense</span>
                  </div>
                  <ul className="text-xs text-amber-950 space-y-1.5 pl-3 list-disc">
                    {(review.areasForImprovement || []).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Defense Oral Questions to Prepare For */}
              {review.defenseOralQuestions && review.defenseOralQuestions.length > 0 && (
                <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200/80 space-y-2.5">
                  <div className="text-xs font-bold text-[#801828] uppercase tracking-wider flex items-center space-x-1.5">
                    <HelpCircle className="w-4 h-4 text-[#801828]" />
                    <span>Likely Panel Defense Viva Questions</span>
                  </div>
                  <p className="text-[11px] text-gray-600">
                    Defense panelists frequently test students on the following areas from their report:
                  </p>

                  <div className="space-y-2 pt-1">
                    {review.defenseOralQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-lg border border-rose-200 shadow-2xs space-y-1"
                      >
                        <p className="text-xs font-bold text-gray-900">
                          Q{idx + 1}: {q.question}
                        </p>
                        <p className="text-[11px] text-gray-500 italic">
                          Why the panel asks: {q.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 text-xs">
              No evaluation data available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#801828] hover:bg-[#6B1522] text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
