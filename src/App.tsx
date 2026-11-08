import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, BookOpen, AlertCircle, RefreshCw, 
  ArrowRight, CheckCircle2, FileCheck2, FileText, RotateCcw 
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { GuideBanner } from './components/GuideBanner';
import { StudentProfileForm } from './components/StudentProfileForm';
import { LogbookUploader } from './components/LogbookUploader';
import { FormatSelector } from './components/FormatSelector';
import { ReportViewer } from './components/ReportViewer';
import { PreDefenseReviewModal } from './components/PreDefenseReviewModal';
import { GuidelinesModal } from './components/GuidelinesModal';
import { StudentInfo, UploadedImage, SampleDataset, TechnicalReviewData, ReferencingStyle, ReportDepth } from './types/siwes';

const DEFAULT_STUDENT_INFO: StudentInfo = {
  name: '',
  matricNo: '',
  institution: '',
  faculty: '',
  department: '',
  level: '400 Level (SIWES II)',
  hostOrg: '',
  hostAddress: '',
  unit: '',
  duration: '6 Months',
  academicYear: '',
  industrySupervisor: '',
  academicSupervisor: '',
  headOfDepartment: '',
};

const INITIAL_SAMPLES: SampleDataset[] = [
  {
    id: 'cs-fintech',
    title: 'Computer Science & Software (Fintech Hub, Lagos)',
    badge: 'Software & IT',
    studentInfo: {
      name: 'Chioma Adebayo',
      matricNo: 'CSC/2022/4109',
      institution: 'University of Lagos',
      faculty: 'Faculty of Science',
      department: 'Computer Sciences',
      level: '400 Level',
      hostOrg: 'Fintech Innovation Hub',
      hostAddress: 'Herbert Macaulay Way, Yaba, Lagos State',
      unit: 'Backend Engineering & Cloud Infrastructure Unit',
      duration: '6 Months (April - September)',
      academicYear: '2024/2025 Session',
      industrySupervisor: 'Engr. Babatunde Fashola (Lead DevOps)',
      academicSupervisor: 'Dr. (Mrs.) E. A. Ogundipe',
      headOfDepartment: 'Prof. A. S. Balogun',
    },
    formatGuideline: 'Computer Science & Software Engineering 5-Chapter Format',
    logbookNotes: `Week 1 (Orientation & Onboarding):
- IT induction, received company security badges and GitHub access.
- Setup Ubuntu development workstation, configured SSH keys and Docker.
- Health and safety lecture on ergonomics and data privacy compliance.

Week 2 & 3 (API Development & Database Integration):
- Assigned to Payment Gateway Microservices team.
- Developed RESTful API endpoints using Node.js/TypeScript and Express for webhook event processing.
- Designed PostgreSQL relational schemas with foreign key constraints and indexed transactional tables.

Week 4 & 5 (Payment Reconciliation & Redis Caching):
- Integrated Redis cache cluster to store idempotent payment transaction keys, preventing double-debit anomalies.
- Handled network timeout retry mechanisms using exponential backoff algorithms.`,
  },
  {
    id: 'mech-power',
    title: 'Mechanical Engineering (Power Station, Ogun)',
    badge: 'Engineering',
    studentInfo: {
      name: 'Emeka Emmanuel Okafor',
      matricNo: 'MEE/2021/0892',
      institution: 'Federal University of Technology, Owerri',
      faculty: 'School of Engineering and Engineering Technology',
      department: 'Mechanical Engineering',
      level: '400 Level',
      hostOrg: 'Power Generation Complex',
      hostAddress: 'Ikorodu Power Station Complex, Lagos State',
      unit: 'Turbine Maintenance & Auxiliary Systems Department',
      duration: '6 Months',
      academicYear: '2024/2025 Session',
      industrySupervisor: 'Engr. K. O. Alabi, FNSE (Chief Maintenance Engineer)',
      academicSupervisor: 'Prof. C. I. Nwachukwu',
      headOfDepartment: 'Engr. Dr. P. O. Eze',
    },
    formatGuideline: 'Engineering & Technology 5-Chapter Format',
    logbookNotes: `Week 1: General Safety Induction, permit-to-work (PTW) procedures, PPE issuance (safety helmet, steel-toe boots, ear defenders).
Week 2-3: Gas Turbine Component Inspection. Studied axial flow compressor blades for foreign object damage (FOD).
Week 4-5: Overhaul of centrifugal boiler feed pump and mechanical seal replacement.`,
  },
];

export default function App() {
  const [studentInfo, setStudentInfo] = useState<StudentInfo>(DEFAULT_STUDENT_INFO);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [logbookNotes, setLogbookNotes] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('universal-5ch');
  const [customGuidelineText, setCustomGuidelineText] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [referencingStyle, setReferencingStyle] = useState<ReferencingStyle>('apa-7');
  const [reportDepth, setReportDepth] = useState<ReportDepth>('comprehensive-20-35');
  
  // App views & modals
  const [viewMode, setViewMode] = useState<'form' | 'report'>('form');
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [wordCount, setWordCount] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Review modal
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [technicalReview, setTechnicalReview] = useState<TechnicalReviewData | null>(null);

  // Guidelines modal
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  // Sample datasets initialized with fallback presets
  const [samples, setSamples] = useState<SampleDataset[]>(INITIAL_SAMPLES);

  // Fetch updated sample datasets on mount
  useEffect(() => {
    fetch('/api/sample-datasets')
      .then((res) => {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return res.json();
        }
        return null;
      })
      .then((data) => {
        if (data && data.samples && data.samples.length > 0) {
          setSamples(data.samples);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch sample datasets from server:', err);
      });
  }, []);

  const handleSelectSample = (sample: SampleDataset) => {
    setStudentInfo(sample.studentInfo);
    setLogbookNotes(sample.logbookNotes);
    setSelectedFormat(sample.id === 'cs-fintech' ? 'comp-sci-it' : sample.id === 'mech-power' ? 'engineering-coren' : 'applied-sciences');
    setError(null);
  };

  const handleLoadSampleNotes = () => {
    if (samples.length > 0) {
      setLogbookNotes(samples[0].logbookNotes);
    } else {
      setLogbookNotes(
        `Week 1: Safety induction, PPE issuance, overview of departmental hierarchy.\nWeek 2: Diagnostic testing on equipment, cable termination, and daily status logging.\nWeek 3: Routine preventive maintenance, troubleshooting faulty components.\nWeek 4: Software and system configuration, database backup automation.\nWeek 5: Fieldwork inspection, calibration of sensors, and supervisor review.\nWeek 6: Mid-attachment presentation, resolution of operational bottlenecks.`
      );
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all fields and start a new student report?')) {
      setStudentInfo(DEFAULT_STUDENT_INFO);
      setImages([]);
      setLogbookNotes('');
      setReportMarkdown('');
      setViewMode('form');
      setError(null);
      setTechnicalReview(null);
    }
  };

  const handleGenerateReport = async () => {
    // Validation
    if (!studentInfo.name.trim()) {
      setError('Please provide your Student Full Name in Step 1.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!studentInfo.institution.trim()) {
      setError('Please provide your Higher Institution name in Step 1.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (images.length === 0 && (!logbookNotes || logbookNotes.trim().length === 0)) {
      setError('Please upload your scanned logbook (PDF or page photos) or enter your weekly activities in Step 2.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setError(null);
    setIsGenerating(true);
    setGenerationStep(1);

    // Progress step simulation for smooth UX
    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 2500);

    try {
      const response = await fetch('/api/generate-siwes-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentInfo,
          logbookNotes,
          logbookImages: images.map((img) => ({
            mimeType: img.mimeType,
            base64: img.base64,
          })),
          formatGuideline: selectedFormat,
          customGuidelineText,
          additionalNotes,
          referencingStyle,
          targetLength: reportDepth,
        }),
      });

      clearInterval(stepInterval);

      // Safe content-type checking to avoid unexpected token '<'
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const rawText = await response.text();
        if (response.status === 404) {
          throw new Error('Backend API endpoint not found (404). If deployed on Vercel, ensure vercel.json is deployed and GEMINI_API_KEY is configured in Project Settings > Environment Variables.');
        }
        if (response.status === 413) {
          throw new Error('The uploaded scanned page photos are too large. Please remove a few pages or use lower resolution photos.');
        }
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw new Error('The AI generation server experienced high demand or timed out. Please click "Try Again" below.');
        }
        throw new Error(`The server encountered an issue (${response.status}). Please try again.`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate technical report.');
      }

      if (!data.reportMarkdown) {
        throw new Error('No report markdown was returned from the generator.');
      }

      setReportMarkdown(data.reportMarkdown);
      setWordCount(data.wordCount || 0);
      setViewMode('report');
      setIsGenerating(false);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // confetti fallback
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      clearInterval(stepInterval);
      setIsGenerating(false);
      console.error('Report generation error:', err);
      const msg = err instanceof Error ? err.message : 'An error occurred during report generation.';
      setError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenPreDefenseReview = async () => {
    setIsReviewOpen(true);
    if (technicalReview) return; // already loaded

    setIsReviewLoading(true);
    try {
      const response = await fetch('/api/coordinator-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportMarkdown,
          studentInfo,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON review response.');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch technical evaluation.');
      }

      setTechnicalReview(data.review);
    } catch (err) {
      console.error('Review error:', err);
    } finally {
      setIsReviewLoading(false);
    }
  };

  const stepLabels = [
    'Initializing report generation engine...',
    'Inspecting scanned logbook PDF document & entries...',
    'Synthesizing weekly activities into engineering & technical principles...',
    'Formatting 5 Chapters with physical submission layout and binding gutter...',
    'Finalizing title sheet, certification signature block, and references...',
  ];

  return (
    <div className="min-h-screen bg-[#FDFBFB] text-gray-800 flex flex-col font-sans">
      <Navbar
        onOpenTips={() => setIsTipsOpen(true)}
        onReset={handleReset}
        hasReport={Boolean(reportMarkdown)}
        onViewReport={() => setViewMode('report')}
        onStartNew={() => setViewMode('form')}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8">
        {/* Error message with quick retry button */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-[#801828] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-[#6B1522]">Notice:</strong>
                <p className="mt-0.5 text-gray-700">{error}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleGenerateReport}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#801828] hover:bg-[#6B1522] text-white text-xs font-semibold rounded-lg shadow-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-gray-500 hover:text-gray-800 text-xs font-semibold px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {viewMode === 'form' ? (
          <div>
            {/* Student Guide & Quick Presets */}
            <GuideBanner
              samples={samples}
              onSelectSample={handleSelectSample}
            />

            {/* Step 1: Student Information */}
            <StudentProfileForm
              studentInfo={studentInfo}
              onChange={setStudentInfo}
            />

            {/* Step 2: Logbook Upload / Notes */}
            <LogbookUploader
              images={images}
              onImagesChange={setImages}
              logbookNotes={logbookNotes}
              onNotesChange={setLogbookNotes}
              onLoadSampleNotes={handleLoadSampleNotes}
            />

            {/* Step 3: Technical Report Format & Referencing Style */}
            <FormatSelector
              selectedFormat={selectedFormat}
              onSelectFormat={setSelectedFormat}
              customGuidelineText={customGuidelineText}
              onCustomGuidelineChange={setCustomGuidelineText}
              additionalNotes={additionalNotes}
              onAdditionalNotesChange={setAdditionalNotes}
              referencingStyle={referencingStyle}
              onReferencingStyleChange={setReferencingStyle}
              reportDepth={reportDepth}
              onReportDepthChange={setReportDepth}
              studentDepartment={studentInfo.department}
              studentFaculty={studentInfo.faculty}
            />

            {/* Generate CTA Button Container */}
            <div className="mt-8 mb-12 flex flex-col items-center justify-center">
              {error && (
                <div className="mb-4 w-full p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-[#801828] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-[#6B1522]">Unable to Generate Report:</strong>
                      <p className="mt-0.5 text-gray-700">{error}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleGenerateReport}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#801828] hover:bg-[#6B1522] text-white text-xs font-semibold rounded-lg shadow-xs transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="text-gray-500 hover:text-gray-800 text-xs font-semibold px-2 py-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerateReport}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#801828] hover:bg-[#6B1522] text-white font-bold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2.5 border border-rose-300/30 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-rose-200" />
                    <span>Compiling Technical Report...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-rose-200 group-hover:scale-110 transition-transform" />
                    <span>Generate Defense-Ready Technical Report</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 mt-2 text-center">
                Formatted for physical printing and binding with standard academic margins.
              </p>
            </div>
          </div>
        ) : (
          /* Report View Mode */
          <ReportViewer
            reportMarkdown={reportMarkdown}
            onUpdateMarkdown={setReportMarkdown}
            studentInfo={studentInfo}
            onOpenPreDefenseReview={handleOpenPreDefenseReview}
            onBackToEdit={() => setViewMode('form')}
            wordCount={wordCount}
            referencingStyle={referencingStyle}
            onReferencingStyleChange={setReferencingStyle}
          />
        )}
      </main>

      {/* Loading Modal with step progress */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-rose-200">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-full border-4 border-rose-200 border-t-[#801828] animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#801828]">
                SIWES
              </div>
            </div>

            <div>
              <h3 className="font-heading font-bold text-lg text-gray-900">
                Generating Technical Report
              </h3>
              <p className="text-xs text-[#801828] font-semibold mt-1">
                {stepLabels[generationStep] || stepLabels[0]}
              </p>
            </div>

            <div className="space-y-2 text-left bg-rose-50/60 p-3.5 rounded-xl border border-rose-100 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className={`w-4 h-4 ${generationStep >= 1 ? 'text-emerald-600' : 'text-gray-300'}`} />
                <span>Reading student profile & institution</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className={`w-4 h-4 ${generationStep >= 2 ? 'text-emerald-600' : 'text-gray-300'}`} />
                <span>Deciphering scanned logbook entries (PDF / photos)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className={`w-4 h-4 ${generationStep >= 3 ? 'text-emerald-600' : 'text-gray-300'}`} />
                <span>Expanding weekly industrial operations</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className={`w-4 h-4 ${generationStep >= 4 ? 'text-emerald-600' : 'text-gray-300'}`} />
                <span>Applying 5-Chapter submission structure</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400">
              AI is compiling an extensive multi-chapter academic document ready for physical binding.
            </p>
          </div>
        </div>
      )}

      {/* Pre-Defense Technical Review Modal */}
      <PreDefenseReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        review={technicalReview}
        isLoading={isReviewLoading}
        studentName={studentInfo.name}
      />

      {/* Submission Guidelines Modal */}
      <GuidelinesModal
        isOpen={isTipsOpen}
        onClose={() => setIsTipsOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500 no-print">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-gray-700">
            SIWES Report Studio: Technical Report & Submission Generator
          </p>
          <p className="text-[11px] text-gray-400">
            Formatted with 1.25-inch binding gutter for physical hardcover or spiral bound submission.
          </p>
        </div>
      </footer>
    </div>
  );
}
