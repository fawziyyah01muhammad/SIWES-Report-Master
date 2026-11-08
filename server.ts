import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

interface StudentInfo {
  name: string;
  matricNo: string;
  institution: string;
  faculty: string;
  department: string;
  level: string;
  hostOrg: string;
  hostAddress: string;
  unit: string;
  duration: string;
  academicYear: string;
  industrySupervisor: string;
  academicSupervisor: string;
  headOfDepartment?: string;
}

interface ImageUpload {
  mimeType: string;
  base64: string;
  pageNumber?: number;
  caption?: string;
}

// Multi-model generator with automatic retry to prevent timeouts
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    systemInstruction: string;
    parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
    responseMimeType?: string;
  }
): Promise<string> {
  // Use gemini-3.1-flash-lite with fallback to gemini-flash-latest
  // Use fast, high-token models with automatic fallback
  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    for (const model of models) {
      try {
        console.log(`[AI] Attempt ${attempt} generating comprehensive report using model: ${model}...`);
        
        const config: Record<string, unknown> = {
          systemInstruction: params.systemInstruction,
          maxOutputTokens: 8192,
        };

        if (params.responseMimeType) {
          config.responseMimeType = params.responseMimeType;
        }

        // 85-second timeout per model attempt to allow deep multi-page generation
        const timeoutMs = 85000;
        const generatePromise = ai.models.generateContent({
          model,
          contents: { parts: params.parts },
          config,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Model ${model} timed out after ${Math.round(timeoutMs / 1000)}s`)),
            timeoutMs
          )
        );

        const response = await Promise.race([generatePromise, timeoutPromise]);
        const text = response?.text;

        if (text && text.trim().length > 0) {
          console.log(`[AI] Successfully generated content with ${model} on attempt ${attempt} (${text.length} chars)`);
          return text;
        }
      } catch (err: unknown) {
        console.warn(`[AI] Model ${model} attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
        lastError = err instanceof Error ? err : new Error(String(err));
        // Small pause before second attempt
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    }
  }

  throw lastError || new Error('Report generation failed. Please click Try Again or verify logbook content.');
}

export const app = express();
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ limit: '60mb', extended: true }));

// Initialize server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Create API router for modular routing
const apiRouter = express.Router();

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    service: 'SIWES Technical Report Generator API',
  });
});

// Generate SIWES Technical Report
apiRouter.post('/generate-siwes-report', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured on the server. Please check Settings > Secrets.',
        });
      }

      const {
        studentInfo,
        logbookNotes,
        logbookImages = [],
        formatGuideline,
        customGuidelineText,
        additionalNotes,
        referencingStyle = 'apa-7',
        targetLength = 'comprehensive-20-35',
      } = req.body as {
        studentInfo: StudentInfo;
        logbookNotes?: string;
        logbookImages?: ImageUpload[];
        formatGuideline?: string;
        customGuidelineText?: string;
        additionalNotes?: string;
        referencingStyle?: string;
        targetLength?: string;
      };

      if (!studentInfo || !studentInfo.name || !studentInfo.institution) {
        return res.status(200).json({
          success: false,
          error: 'Please provide at least the Student Full Name and Higher Institution.',
        });
      }

      if ((!logbookImages || logbookImages.length === 0) && (!logbookNotes || logbookNotes.trim().length === 0)) {
        return res.status(200).json({
          success: false,
          error: 'Please upload at least one scanned logbook page or provide logbook activity notes.',
        });
      }

      const styleNames: Record<string, string> = {
        'apa-7': 'APA 7th Edition (Author, Year)',
        'ieee': 'IEEE Style ([1] Numbered Citations)',
        'harvard': 'Harvard Style (Author, Year)',
        'mla': 'MLA 9th Edition',
        'vancouver': 'Vancouver / Numeric Style',
      };
      const activeStyleName = styleNames[referencingStyle] || 'APA 7th Edition';

      const systemInstruction = `You are an expert academic technical writing specialist, university dissertation examiner, and engineering evaluator specializing in higher institution Students Industrial Work Experience Scheme (SIWES) technical reports formatted for physical binding and defense submission.

Your goal is to transform student industrial work experience logbooks and departmental guidelines into an exemplary, highly comprehensive, exhaustive, and defense-ready SIWES Technical Report (equivalent to 20 to 50 standard typed academic pages depending on student input).

CRITICAL DIRECTIVES FOR MAXIMUM ACADEMIC DEPTH & VOLUME:
1. VOICE, ACADEMIC RIGOR & EXPANSION:
   - This must be an extensive, highly detailed, scholarly, and publication-ready technical document suitable for physical binding and defense submission.
   - Do NOT summarize or shorten sections into brief bullet points. Write extensive multi-paragraph technical expositions with rigorous explanations of operating principles, chemical/biological mechanisms, mechanical dynamics, software algorithms, network schematics, mathematical formulations, and engineering standards.
   - Read the student's logbook notes and attached files thoroughly. Take every recorded activity and expand it into thorough, academic depth—explaining principles of operation, technical methodology, health & safety precautions (HSE), machinery/software specifications, and troubleshooting steps.

2. REPORT CHAPTER STRUCTURE (Start directly with # DEDICATION, as the institutional Cover Sheet and Supervisor Certification Sheet are compiled automatically by the system):
   - # DEDICATION
   - # ACKNOWLEDGEMENTS (Acknowledging University/Polytechnic Directorate, Host Organization, Supervisors, Family)
   - # ABSTRACT / EXECUTIVE SUMMARY (Concise 250-350 word academic summary)
   - # TABLE OF CONTENTS (Structured list of chapters and sub-sections)
   - # CHAPTER ONE: INTRODUCTION & ESTABLISHMENT PROFILE
     ## 1.1 Background, Legal Mandate, and Objectives of the Industrial Attachment (Citing ITF Act and institutional mandates)
     ## 1.2 History, Scale & Profile of the Host Establishment (${studentInfo.hostOrg || 'Host Establishment'})
     ## 1.3 Mission, Vision, Quality Policies, and Core Corporate Values
     ## 1.4 Organizational Structure & Comprehensive Organogram Description
     ## 1.5 Key Operational Units, Functional Departments, and Interrelationships
   - # CHAPTER TWO: INDUSTRIAL SAFETY, TOOLS, EQUIPMENT & WORK ENVIRONMENT
     ## 2.1 Industrial Safety Framework & Health (HSE) Regulations
     ## 2.2 Hazard Identification, Risk Assessment (HIRA) & Personal Protective Equipment (PPE)
     ## 2.3 Comprehensive Catalog of Major Machinery, Instruments, Hardware, and Software Utilized (Detailed working principles, manufacturer specifications, calibration, and operational parameters)
   - # CHAPTER THREE: INDUSTRIAL EXPERIENCE & DETAILED TECHNICAL ACTIVITIES
     ## 3.1 Overview of Departmental Deployment & Rotations (${studentInfo.unit || 'Assigned Unit'})
     ## 3.2 Comprehensive Weekly Activity Matrix (An exhaustive Markdown Table covering the weekly progression with Week, Unit/Area, Specific Tasks, Machinery/Tools/Software Utilized, and Engineering Principles Applied)
     ## 3.3 Major Technical Projects & Case Studies (Deep-dive, step-by-step breakdown of at least 3-5 distinct major projects or tasks completed, detailing background, theoretical principles, step-by-step methodology, apparatus/software, observations, safety precautions, and diagnostic/testing results)
     ## 3.4 Technical Workflows, Schematics, and Flowchart Descriptions (Include [Figure 3.1: ...], [Figure 3.2: ...] with descriptive architectural/process breakdowns)
   - # CHAPTER FOUR: SUMMARY OF INDUSTRIAL TRAINING (IT) EXPERIENCE, CHALLENGES AND SOLUTIONS
     ## 4.1 Summary of Industrial Training Experience (An extensive, comprehensive synthesis of the student's entire industrial attachment, work culture, multi-unit rotations, core competencies mastered, and direct operational contributions made to ${studentInfo.hostOrg || 'the establishment'} before challenges and solutions)
     ## 4.2 Industrial, Technical, and Operational Challenges Encountered (Detailed analysis of operational bottlenecks, hardware/software incompatibilities, system breakdowns, environmental/safety hazards, and resource limitations)
     ## 4.3 Practical Troubleshooting and Solutions Proffered (Direct engineering, scientific, and systematic methodologies deployed to troubleshoot and resolve each challenge)
     ## 4.4 Technical Competencies Acquired, Professional Ethics & Personal Growth (Synthesis of soft skills, professional engineering ethics, safety culture, and industry readiness)
   - # CHAPTER FIVE: CONCLUSION, RECOMMENDATIONS & IMPACT
     ## 5.1 Conclusion (Comprehensive synthesis of industrial attachment outcomes and professional maturation)
     ## 5.2 Recommendations to the Academic Institution
     ## 5.3 Recommendations to the Host Establishment
     ## 5.4 Strategic Advice to Prospective SIWES Students
   - # REFERENCES (Authentic scholarly textbooks, engineering manuals, peer-reviewed journals, and statutory guidelines formatted strictly in ${activeStyleName})
   - # APPENDIX (Form verification reference, logbook entry notes)

3. SCHOLARLY CITATIONS & REFERENCES (${activeStyleName}):
   - Include genuine, peer-reviewed academic textbooks, authoritative industry manuals, published conference abstracts, and recognized journals specific to the student's field (${studentInfo.department || 'the discipline'}).
   - For engineering/computing/sciences, cite recognized standard literature (e.g., Sommerville, Silberschatz, Pressman for Computing; Shigley/Budynas, Theraja, Boylestad for Engineering; Lehninger, Cheesbrough for Sciences; and official Industrial Training Fund [ITF] guidelines).
   - Integrate in-text citations naturally in Chapters 1, 2, and 3 (e.g., citing authors/year for methodologies, standard procedures, and technical principles).
   - In the # REFERENCES section, list at least 8-12 complete, academically authentic references strictly formatted in ${activeStyleName}.

4. PRESENTATION DISCIPLINE (PLAIN FORMATTING):
   - Do NOT output any duplicate cover page, student name headers, or signature lines at the beginning. Start immediately with # DEDICATION.
   - The report must be completely plain and formal. Do not include any decorative designs, HTML styling, font colors, emojis, badges, or callout blocks.
   - Always use standard markdown headers (# for Chapter titles, ## for Sections, ### for Sub-sections), plain standard markdown tables (| Header 1 | Header 2 |), plain paragraphs, and numbered or bulleted lists.
   - Ensure clean, academic prose suitable for direct physical printing and binding.`;

      // Build contents parts (images + prompt)
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      // Add scanned files if provided (PDFs or images)
      if (logbookImages && logbookImages.length > 0) {
        for (let i = 0; i < Math.min(logbookImages.length, 8); i++) {
          const img = logbookImages[i];
          if (img.base64 && img.mimeType) {
            const cleanBase64 = img.base64.replace(/^data:[^;]+;base64,/, '').trim();
            parts.push({
              inlineData: {
                mimeType: img.mimeType,
                data: cleanBase64,
              },
            });
          }
        }
      }

      const promptText = `
STUDENT & ATTACHMENT PROFILE:
- Full Name: ${studentInfo.name}
- Matriculation/Reg Number: ${studentInfo.matricNo || 'N/A'}
- Institution: ${studentInfo.institution}
- Faculty/School: ${studentInfo.faculty || 'Engineering & Technology / Sciences'}
- Department & Course: ${studentInfo.department}
- Level of Study: ${studentInfo.level || '300 / 400 Level'}
- Host Establishment/Company: ${studentInfo.hostOrg}
- Host Address/Location: ${studentInfo.hostAddress || 'Nigeria'}
- Primary Unit/Department Placed: ${studentInfo.unit || 'Technical Operations'}
- Attachment Duration: ${studentInfo.duration || '6 Months'}
- Academic Session/Year: ${studentInfo.academicYear || 'Current Academic Session'}
- Industry-Based Supervisor: ${studentInfo.industrySupervisor || 'Engr./Mr./Mrs. Industry Supervisor'}
- Institutional/Academic Supervisor: ${studentInfo.academicSupervisor || 'Dr./Prof. Institutional Supervisor'}
- Head of Department: ${studentInfo.headOfDepartment || 'Head of Department'}

SELECTED TECHNICAL REPORT FORMAT & CITATION STYLE:
- Format Standard: ${formatGuideline || 'Universal 5-Chapter Technical Report Standard'}
- Target Depth / Volume: ${targetLength} (Generate maximum academic depth, detailed multi-week activity matrix, and at least 3-5 comprehensive technical case studies equivalent to 20-50 pages)
- Referencing Style: ${activeStyleName} (Generate authentic discipline-specific books and journals with in-text citations)
- Chapter 4 Requirement: You MUST include Section 4.1 "Summary of Industrial Training Experience" before Section 4.2 "Industrial and Operational Challenges Encountered".
${customGuidelineText ? `CUSTOM DEPARTMENTAL INSTRUCTIONS:\n${customGuidelineText}\n` : ''}
${additionalNotes ? `SPECIAL EMPHASIS DIRECTIVES:\n${additionalNotes}\n` : ''}

STUDENT LOGBOOK NOTES & TRANSCRIPT:
${logbookNotes && logbookNotes.trim().length > 0 ? logbookNotes : 'Please inspect the attached scanned logbook PDF document or page photos directly and extract all recorded activities, dates, equipment, and remarks.'}

TASK:
Analyze all the scanned logbook PDF documents, page images, and notes provided above. Read through each week of activities in the scanned logbook. Synthesize every activity into an exhaustive, highly detailed, and defense-ready SIWES Technical Report according to the required 5-chapter structure. Ensure it is ready for physical printing and submission. Return the report in full markdown format.`;

      parts.push({ text: promptText });

      const reportMarkdown = await generateContentWithFallback(ai, {
        systemInstruction,
        parts,
      });

      const wordCount = reportMarkdown.split(/\s+/).filter(Boolean).length;

      return res.json({
        success: true,
        reportMarkdown,
        wordCount,
        generatedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      console.error('Error generating SIWES report:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate SIWES report';
      return res.status(200).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // Expand / Deepen a specific report section to reach 20-50 pages
  apiRouter.post('/expand-chapter', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured on the server.',
        });
      }

      const {
        fullReportMarkdown,
        chapterKey,
        studentInfo,
        referencingStyle = 'apa-7',
      } = req.body as {
        fullReportMarkdown: string;
        chapterKey: string;
        studentInfo: StudentInfo;
        referencingStyle?: string;
      };

      if (!fullReportMarkdown || fullReportMarkdown.trim().length < 50) {
        return res.status(200).json({
          success: false,
          error: 'Valid report content is required for expansion.',
        });
      }

      const styleNames: Record<string, string> = {
        'apa-7': 'APA 7th Edition',
        'ieee': 'IEEE Style',
        'harvard': 'Harvard Style',
        'mla': 'MLA 9th Edition',
        'vancouver': 'Vancouver Style',
      };
      const activeStyleName = styleNames[referencingStyle] || 'APA 7th Edition';

      const systemInstruction = `You are an expert academic technical writing specialist and university dissertation supervisor.
Your task is to take an existing SIWES technical report and substantially expand its technical depth, analytical density, and academic volume to reach an exhaustive 20-50 page monograph standard.

Focus on expanding:
1. CHAPTER THREE: Add 2-3 additional deep-dive engineering/scientific case studies, full operational procedures, detailed testing parameters, and equipment specifications.
2. CHAPTER FOUR: Ensure Section 4.1 "Summary of Industrial Training Experience" provides an extensive synthesis of the entire attachment period before Section 4.2 Challenges and 4.3 Solutions.
3. REFERENCES: Ensure at least 10-12 authentic discipline-specific books, peer-reviewed journals, and standards in ${activeStyleName} with corresponding in-text citations.

Return the complete, expanded report in markdown. Keep all existing chapters, enhance their depth, and output the entire expanded report.`;

      const promptText = `
STUDENT PROFILE:
- Name: ${studentInfo.name}
- Department: ${studentInfo.department}
- Host Organization: ${studentInfo.hostOrg}
- Unit: ${studentInfo.unit}

CURRENT TECHNICAL REPORT (To expand into 20-50 page academic volume):
${fullReportMarkdown}

TASK:
Substantially expand and deepen this report. Add technical case studies, expand the weekly matrix with deep technical commentary, ensure Chapter 4 Section 4.1 "Summary of Industrial Training Experience" is rich and detailed, and expand scholarly references formatted in ${activeStyleName}. Return the full expanded report in clean markdown.`;

      const expandedMarkdown = await generateContentWithFallback(ai, {
        systemInstruction,
        parts: [{ text: promptText }],
      });

      const wordCount = expandedMarkdown.split(/\s+/).filter(Boolean).length;

      return res.json({
        success: true,
        reportMarkdown: expandedMarkdown,
        wordCount,
        generatedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      console.error('Error expanding chapter:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to expand report section';
      return res.status(200).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // Pre-Defense Evaluation Endpoint
  apiRouter.post('/coordinator-review', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured on the server.',
        });
      }

      const { reportMarkdown, studentInfo } = req.body as {
        reportMarkdown: string;
        studentInfo?: StudentInfo;
      };

      if (!reportMarkdown || reportMarkdown.trim().length < 50) {
        return res.status(200).json({
          success: false,
          error: 'Valid report content is required for review.',
        });
      }

      const systemInstruction = `You are an experienced academic technical evaluator and defense panel reviewer for SIWES technical reports.
Review this student's SIWES Technical Report against standard academic grading benchmarks.
Provide an objective, academically rigorous, and constructive assessment.

Return your response strictly in valid JSON format matching this schema:
{
  "totalScore": number (out of 100),
  "grade": string (e.g. "A (Distinction)", "B+ (Very Good)", etc.),
  "verdict": string (one-sentence executive verdict),
  "criteriaScores": [
    { "name": "Technical Depth & Engineering Rigor", "score": number, "max": 25, "feedback": string },
    { "name": "Logbook Fidelity & Weekly Progression", "score": number, "max": 25, "feedback": string },
    { "name": "Academic Presentation & Structure", "score": number, "max": 20, "feedback": string },
    { "name": "Industrial Safety (HSE) & Standards", "score": number, "max": 15, "feedback": string },
    { "name": "Recommendations & Analytical Conclusion", "score": number, "max": 15, "feedback": string }
  ],
  "keyStrengths": [string],
  "areasForImprovement": [string],
  "defenseOralQuestions": [
    { "question": string, "rationale": string }
  ]
}`;

      const responseText = await generateContentWithFallback(ai, {
        systemInstruction,
        parts: [{ text: `Review this SIWES report for student ${studentInfo?.name || 'Student'} (${studentInfo?.department || 'Department'} at ${studentInfo?.institution || 'Institution'}):\n\n${reportMarkdown.slice(0, 15000)}` }],
        responseMimeType: 'application/json',
      });

      // Extract JSON cleanly in case wrapped in markdown block
      const cleanJson = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      const reviewData = JSON.parse(cleanJson);

      return res.json({
        success: true,
        review: reviewData,
      });
    } catch (err: unknown) {
      console.error('Error conducting technical review:', err);
      const errorMessage = err instanceof Error ? err.message : 'Technical review failed';
      return res.status(200).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // Sample data endpoint for quick testing
  apiRouter.get('/sample-datasets', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({
      samples: [
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
- Setup Ubuntu 22.04 LTS development workstation, configured SSH keys, Docker engine, and Postman API workspace.
- Health and safety lecture on ergonomics, data privacy compliance, and clean desk policy.

Week 2 & 3 (API Development & Database Integration):
- Assigned to the Payment Gateway Microservices team.
- Developed RESTful API endpoints using Node.js/TypeScript and Express for webhook event processing.
- Designed PostgreSQL relational schemas with foreign key constraints and indexed transactional tables to minimize query latency.
- Conducted unit testing with Jest; achieved 92% code coverage.

Week 4 & 5 (Payment Reconciliation & Redis Caching):
- Integrated Redis cache cluster to store idempotent payment transaction keys, preventing double-debit anomalies.
- Handled edge cases: network timeout retry mechanism using exponential backoff algorithm.
- Monitored queue workers with RabbitMQ and BullMQ for asynchronous notification dispatch (email and SMS alerts).

Week 6 & 7 (Cloud Infrastructure & Dockerization):
- Containerized Node.js microservices into lightweight Alpine Docker images.
- Implemented multi-stage Docker builds to reduce container image size from 850MB to 120MB.
- Assisted lead DevOps engineer in configuring Kubernetes deployment manifests and ingress controllers.

Week 8 & 9 (Security Audit & Bug Fixes):
- Mitigated SQL injection risks via parameterized ORM queries.
- Implemented JWT token rotation with RSA-256 digital signatures for merchant authentication.
- Resolved race condition in the automated refund processing service.

Week 10 & 11 (CI/CD Pipeline & Monitoring):
- Created GitHub Actions CI/CD workflow for automated linting, test execution, and deployment to staging cluster.
- Configured Prometheus metrics scraping and Grafana dashboards tracking API latency (p95 < 120ms) and HTTP 5xx error rates.

Week 12 (Documentation, Handover & Presentation):
- Compiled OpenAPI 3.0 API documentation for internal developers.
- Conducted final sprint demo to the Head of Engineering.
- Obtained weekly logbook endorsements and supervisor assessment completion.`,
        },
        {
          id: 'mech-power',
          title: 'Mechanical / Electrical Engineering (Power Station, Ogun)',
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
          logbookNotes: `Week 1: General Safety Induction, permit-to-work (PTW) procedures, PPE issuance (safety helmet, steel-toe boots, ear defenders, high-visibility vest).
Week 2-3: Gas Turbine Component Inspection. Studied axial flow compressor blades for foreign object damage (FOD) and erosion. Assisted in borescope visual inspection of combustion liners and transition pieces.
Week 4-5: Lubrication & Hydraulic Systems. Dismantled duplex oil filters, measured oil viscosity and dielectric breakdown. Calibrated thermocouple sensors and RTDs on bearing oil sumps.
Week 6-7: Cooling Water Circulation & Heat Exchangers. Cleaned shell-and-tube condenser tubes using high-pressure hydro-blasting at 400 bar. Replaced leaking neoprene gaskets on circulating water piping.
Week 8-9: Vibration Analysis & Dynamic Balancing. Collected vibration velocity and acceleration data on bearings using SKF Microlog analyzer. Identified rotor misalignment and performed dial indicator alignment.
Week 10-11: Overhaul of Boiler Feed Pump (BFP). Replaced mechanical seals and thrust bearings on 500kW multistage centrifugal pump. Tested pump hydrostatic pressure up to 60 bar.
Week 12: Environmental monitoring, emission testing, report consolidation, final sign-off by Plant Director.`,
        },
        {
          id: 'biochem-lab',
          title: 'Biochemistry & Medical Lab (Pharmaceutical Plant, Ibadan)',
          badge: 'Applied Sciences',
          studentInfo: {
            name: 'Amina Fatima Bello',
            matricNo: 'BCH/2022/104',
            institution: 'Ahmadu Bello University, Zaria',
            faculty: 'Faculty of Life Sciences',
            department: 'Department of Biochemistry',
            level: '300 Level',
            hostOrg: 'Chemical & Pharmaceutical Industries Ltd',
            hostAddress: 'Awe Industrial Layout, Oyo State',
            unit: 'Quality Control (QC) & Microbiology Laboratory',
            duration: '3 Months',
            academicYear: '2024/2025 Session',
            industrySupervisor: 'Pharm. (Mrs.) R. A. Yusuf',
            academicSupervisor: 'Dr. M. S. Danladi',
            headOfDepartment: 'Prof. I. A. Yakubu',
          },
          formatGuideline: 'Applied Sciences & Laboratory 5-Chapter Format',
          logbookNotes: `Week 1: Good Laboratory Practices (GLP), chemical hazard disposal, autoclave sterilization techniques, MSDS review.
Week 2-3: Raw Material Testing. Evaluated active pharmaceutical ingredients (API) using UV-Visible spectrophotometry and thin-layer chromatography (TLC). Calculated percentage purity of Paracetamol powder samples.
Week 4-5: In-process Quality Control (IPQC). Conducted friability testing, tablet hardness tests with Monsanto hardness tester, and disintegration time profiling on 500mg tablets.
Week 6-7: Microbiological Assay. Prepared Nutrient Agar and MacConkey Agar. Performed total viable bacterial count and coliform testing on purified plant borehole water using membrane filtration.
Week 8-9: Finished Product Analysis. Performed dissolution testing using USP Dissolution Apparatus II (Paddle method). Monitored drug release kinetics over 45 minutes.
Week 10: Stability testing under accelerated climate conditions (40°C / 75% RH). Data compilation and final supervisor review.`,
        },
      ],
    });
  });

// Mount router on both '/api' and '/' to ensure full compatibility with Vercel rewrites and standalone dev
app.use('/api', apiRouter);
app.use('/', apiRouter);

// API 404 handler: ensure unhandled API endpoints always return JSON, not HTML
app.all('/api/*', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({
    success: false,
    error: `API route ${req.method} ${req.originalUrl} not found.`,
  });
});

export default app;

async function startServer() {
  // Setup Vite development middlewares or serve static build
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`SIWES Report Generator server running on http://0.0.0.0:${port}`);
  });
}

// Only start HTTP listener when running as a standalone server (not on Vercel)
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
