import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { getRecommendedReferencesForStudent, ReferencingStyle } from './src/utils/referenceCatalog.ts';

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
}

// Multi-model generator with automatic retry to prevent timeouts
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    systemInstruction: string;
    parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
    responseMimeType?: string;
    label?: string;
  }
): Promise<string> {
  const models = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  let lastError: Error | null = null;
  const tag = params.label ? `[AI:${params.label}]` : '[AI]';

  for (let attempt = 1; attempt <= 2; attempt++) {
    for (const model of models) {
      try {
        console.log(`${tag} Attempt ${attempt} generating content using model: ${model}...`);

        const config: Record<string, unknown> = {
          systemInstruction: params.systemInstruction,
        };

        if (model === 'gemini-4-hydrogen') {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

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
          console.log(`${tag} Successfully generated content with ${model} on attempt ${attempt} (${text.length} chars)`);
          return text;
        }
      } catch (err: unknown) {
        console.warn(`${tag} Model ${model} attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
        lastError = err instanceof Error ? err : new Error(String(err));
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

    // Depth guidance tailored so even standard format strictly exceeds 18-25+ academic pages
    const depthTargets: Record<string, { part1Words: string; part2Words: string; part3Words: string; desc: string }> = {
      'standard-15-20': {
        part1Words: '2,000 - 2,600 words',
        part2Words: '2,800 - 3,600 words',
        part3Words: '2,000 - 2,600 words',
        desc: 'Expanded Standard Technical Report (18-26+ typed A4 pages, 6,800+ total words)',
      },
      'comprehensive-20-35': {
        part1Words: '2,600 - 3,400 words',
        part2Words: '3,600 - 4,800 words',
        part3Words: '2,500 - 3,400 words',
        desc: 'Comprehensive Defense Monograph (25-35+ typed A4 pages, 8,700+ total words)',
      },
      'exhaustive-35-50': {
        part1Words: '3,200 - 4,200 words',
        part2Words: '4,800 - 6,500 words',
        part3Words: '3,200 - 4,200 words',
        desc: 'Exhaustive Academic Dissertation-Grade Report (35-50 typed A4 pages, 11,200+ total words)',
      },
    };
    const depthConfig = depthTargets[targetLength] || depthTargets['comprehensive-20-35'];

    // Stage 0: If scanned PDFs or page photos were uploaded, extract complete structured transcript once
    let consolidatedLogbookText = logbookNotes?.trim() || '';
    if (logbookImages && logbookImages.length > 0) {
      const scanParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      for (let i = 0; i < Math.min(logbookImages.length, 8); i++) {
        const img = logbookImages[i];
        if (img.base64 && img.mimeType) {
          const cleanBase64 = img.base64.replace(/^data:[^;]+;base64,/, '').trim();
          scanParts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: cleanBase64,
            },
          });
        }
      }

      if (scanParts.length > 0) {
        scanParts.push({
          text: `Inspect ALL uploaded scanned SIWES logbook documents/pages carefully.
Extract EVERY single recorded week, date range, daily/weekly task, machine/tool/software mentioned, technical observation, safety precaution, and supervisor remark in chronological order.
Be exhaustive—do not skip any week or detail. Format clearly week-by-week (Week 1, Week 2, etc.).`,
        });

        const extractedText = await generateContentWithFallback(ai, {
          label: 'OCR-Extract',
          systemInstruction:
            'You are a meticulous academic document transcriber specializing in extracting complete week-by-week industrial training logbook records from scanned PDFs and photographs.',
          parts: scanParts,
        });

        consolidatedLogbookText = consolidatedLogbookText
          ? `STUDENT TYPED NOTES:\n${consolidatedLogbookText}\n\nTRANSCRIBED SCANNED LOGBOOK RECORDS:\n${extractedText}`
          : extractedText;
      }
    }

    const validStyle = (['apa-7', 'ieee', 'harvard', 'mla', 'vancouver'].includes(referencingStyle)
      ? referencingStyle
      : 'apa-7') as ReferencingStyle;

    const canonicalRefs = getRecommendedReferencesForStudent(
      studentInfo.department || '',
      studentInfo.faculty || '',
      validStyle
    );

    const sharedBibliographyBlock = canonicalRefs
      .map((r, i) => `${i + 1}. In-text token: "${r.inText}" -> Full Reference: ${r.formatted}`)
      .join('\n');

    const sharedContext = `
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

FORMAT & ACADEMIC SPECIFICATIONS:
- Format Standard: ${formatGuideline || 'Universal 5-Chapter Technical Report Standard'}
- Target Volume: ${depthConfig.desc}
- Referencing Style: ${activeStyleName}
${customGuidelineText ? `CUSTOM DEPARTMENTAL INSTRUCTIONS:\n${customGuidelineText}\n` : ''}
${additionalNotes ? `SPECIAL EMPHASIS DIRECTIVES:\n${additionalNotes}\n` : ''}

CANONICAL REFERENCE CATALOG FOR IN-TEXT CITATIONS (${activeStyleName}):
All chapters MUST draw from and cite these verified references using their EXACT in-text tokens where technically, legally, or theoretically applicable:
${sharedBibliographyBlock}

COMPLETE LOGBOOK RECORDS & WEEKLY ACTIVITIES:
${consolidatedLogbookText}
`;

    const formattingRules = `PRESENTATION & CITATION DISCIPLINE (STRICT ACADEMIC STANDARDS):
- The report must be completely plain, formal, and scholarly for direct physical printing and binding.
- Do NOT include any decorative designs, HTML tags, emojis, badges, images, markdown image tags (![...]), or callout blocks.
- Use standard markdown headers (# for Chapter/Major titles, ## for Sections, ### for Sub-sections), plain standard markdown tables (| Header 1 | Header 2 |), and rich multi-paragraph justified academic prose.
- Do NOT generate a cover page or signature certification page (handled automatically by the frontend exporter).
- MANDATORY IN-TEXT CITATIONS: Every chapter MUST include substantive in-text citations in ${activeStyleName} whenever referencing statutory frameworks (e.g., SIWES/ITF laws), HSE/OSHA/ISO safety protocols, operating principles of equipment/software, theoretical equations/algorithms, or industry best practices. Use the exact in-text tokens from the Canonical Reference Catalog above so that every in-text citation corresponds accurately to the # REFERENCES section.`;

    // Run 3 specialized generation parts in parallel so every chapter achieves full academic depth without truncation
    const part1Prompt = `${sharedContext}

TASK FOR PART 1 (PRELIMINARIES + CHAPTER 1 + CHAPTER 2):
Write ONLY the Preliminary Sections, Chapter One, and Chapter Two in exhaustive academic detail.
Target length for Part 1: ${depthConfig.part1Words}.

Required Exact Structure:
# DEDICATION
(Formal academic dedication)

# ACKNOWLEDGEMENTS
(Formal multi-paragraph acknowledgement of the Institution, ITF/SIWES Directorate, ${studentInfo.hostOrg || 'Host Organization'}, ${studentInfo.industrySupervisor || 'Industry Supervisor'}, ${studentInfo.academicSupervisor || 'Academic Supervisor'}, colleagues, and family)

# ABSTRACT / EXECUTIVE SUMMARY
(Rigorous 300-400 word scholarly abstract summarizing the industrial attachment scope, technical operations, methodologies deployed, key outcomes, and conclusions)

# TABLE OF CONTENTS
(Complete structured outline covering Chapters 1 to 5 including 3.2 Weekly Activity Matrix, 3.3 In-Depth Weekly Activity Breakdown & Technical Narrative, 4.1 Comprehensive Summary of Industrial Training Experience, 5.1 Detailed Conclusion, References, and Appendix)

# CHAPTER ONE: INTRODUCTION & ESTABLISHMENT PROFILE
## 1.1 Background, Legal Mandate, and Objectives of SIWES (Extensive academic exposition citing the ITF Decree/Act No. 47 of 1971, institutional mandate, and role in bridging theory and practice—MUST include in-text citations to ITF and Mafe from the Canonical Reference Catalog)
## 1.2 History, Scale, and Corporate Profile of ${studentInfo.hostOrg || 'the Host Establishment'} (Thorough profile of operations, market/technical scope, and industrial relevance)
## 1.3 Mission, Vision, Quality Policies, and Core Corporate Values
## 1.4 Organizational Structure & Comprehensive Organogram Description (Detailed breakdown of governance, reporting lines, and departmental hierarchy)
## 1.5 Key Operational Units, Functional Departments, and Interrelationships

# CHAPTER TWO: INDUSTRIAL SAFETY, TOOLS, EQUIPMENT & WORK ENVIRONMENT
## 2.1 Industrial Safety Framework & Health, Safety and Environment (HSE) Regulations (Detailed statutory and workplace safety protocols relevant to ${studentInfo.department || 'the discipline'}—MUST cite OSHA / statutory safety references in-text)
## 2.2 Hazard Identification, Risk Assessment (HIRA) & Personal Protective Equipment (PPE) (Comprehensive table/analysis of workplace hazards, risk controls, and PPE specifications with relevant safety citations)
## 2.3 Comprehensive Catalog of Major Machinery, Instruments, Hardware, and Software Utilized (Exhaustive technical catalog derived from the student's logbook and unit—detailing working principles, technical specifications, calibration, operational parameters, and maintenance standards, citing foundational engineering/computing/science literature from the Canonical Reference Catalog)

STOP immediately after completing Section 2.3. Do NOT write Chapter 3 yet.`;

    const part2Prompt = `${sharedContext}

TASK FOR PART 2 (CHAPTER THREE - EXHAUSTIVE INDUSTRIAL ACTIVITIES & WEEK-BY-WEEK TECHNICAL NARRATIVE):
Write ONLY Chapter Three in maximum, defense-grade engineering/scientific depth.
Target length for Part 2: ${depthConfig.part2Words}.

Required Exact Structure:
# CHAPTER THREE: INDUSTRIAL EXPERIENCE & DETAILED TECHNICAL ACTIVITIES
## 3.1 Overview of Departmental Deployment & Rotations (${studentInfo.unit || 'Assigned Unit'})
(Detailed narrative of onboarding, induction, workstation/unit assignment, workflow supervision, and rotation schedule.)

## 3.2 Comprehensive Weekly Activity Matrix
(Construct an exhaustive Markdown Table covering EVERY SINGLE WEEK from the logbook/duration with columns:
| Week | Unit / Section | Specific Technical Activities Performed | Equipment, Tools & Software Utilized | Technical / Scientific Principles Applied |)

## 3.3 In-Depth Weekly Activity Breakdown & Technical Narrative
(CRITICAL MANDATE: This section MUST come directly AFTER the Section 3.2 Matrix!
Systematically create an individual subsection for EVERY SINGLE WEEK logged—e.g.:
### Week 1: [Descriptive Technical Title]
### Week 2: [Descriptive Technical Title]
...continuing sequentially through every single week of the student's logbook/attachment!
For EACH week, write 2 to 3 substantial, rigorous academic paragraphs explaining:
- Exact operational steps and methodologies executed during that week;
- Underlying engineering, computing, or scientific principles and theoretical mechanisms (cite relevant textbooks/journals from the Canonical Reference Catalog in ${activeStyleName} where theoretical concepts, standards, or equations apply);
- Hardware specifications, software stacks, instruments, reagents, or parameters configured/monitored;
- Safety precautions (HSE), quality assurance checks, supervisor feedback, and technical observations/outcomes.
Do NOT compress multiple weeks together unless the source logbook explicitly grouped them, and never write brief 1-sentence summaries!)

## 3.4 Major Technical Projects & Case Studies
(Present 4 to 5 comprehensive, deep-dive engineering/scientific case studies drawn from the student's work. For each project include: Background & Problem Statement, Theoretical Framework [with academic in-text citations], Apparatus/Tools/Tech Stack, Step-by-Step Execution Methodology, Diagnostic/Testing/Performance Results, and Safety Controls.)

## 3.5 Technical Workflows, System Architecture, and Operational Process Descriptions
(Detailed narrative explanations of core system architectures, process pipelines, diagnostic workflows, and quality control loops encountered at ${studentInfo.hostOrg || 'the host establishment'}, backed by in-text citations to standard engineering/computing/scientific methodologies.)

Start directly with # CHAPTER THREE: INDUSTRIAL EXPERIENCE & DETAILED TECHNICAL ACTIVITIES and STOP after completing Section 3.5. Do NOT include any images or photo tags.`;

    const part3Prompt = `${sharedContext}

TASK FOR PART 3 (CHAPTER FOUR + CHAPTER FIVE + REFERENCES + APPENDIX):
Write ONLY Chapter Four, Chapter Five, References, and Appendix in exhaustive academic rigor.
Target length for Part 3: ${depthConfig.part3Words}.

Required Exact Structure:
# CHAPTER FOUR: SUMMARY OF INDUSTRIAL TRAINING (IT) EXPERIENCE, CHALLENGES AND SOLUTIONS
## 4.1 Comprehensive Summary of Industrial Training (IT) Experience
(CRITICAL REQUIREMENT: Write an exhaustive, deeply analytical synthesis of **800 to 1,200 words** BEFORE Challenges & Solutions! Organize across multiple well-developed paragraphs covering:
- Holistic overview of the entire ${studentInfo.duration || 'attachment'} industrial immersion at ${studentInfo.hostOrg || 'the host organization'};
- Synthesis of multi-unit technical operations, daily engineering/scientific workflows, and practical skills mastered;
- Explicit analysis of how classroom theoretical courses in ${studentInfo.department || 'the student’s discipline'} translated into real-world industrial problem-solving (with relevant in-text citations from the Canonical Reference Catalog);
- Concrete operational deliverables, process improvements, and measurable contributions made to the host organization;
- Cross-functional teamwork, reporting discipline, and supervisory mentorship experienced.)

## 4.2 Industrial, Technical, and Operational Challenges Encountered
(Detailed multi-paragraph analysis of 5 to 7 genuine technical, infrastructural, workflow, equipment, compatibility, or environmental challenges encountered during the attachment.)

## 4.3 Practical Troubleshooting and Solutions Proffered
(Systematic, step-by-step engineering, scientific, and operational troubleshooting methodologies deployed to mitigate and resolve each challenge listed in 4.2, citing recognized technical literature/standards where applicable.)

## 4.4 Technical Competencies Acquired, Professional Ethics & Personal Growth
(Detailed evaluation of hard technical competencies, soft skills, time management, workplace ethics, safety consciousness, and career readiness.)

# CHAPTER FIVE: CONCLUSION, RECOMMENDATIONS & IMPACT
## 5.1 Detailed Conclusion
(CRITICAL REQUIREMENT: Write an exhaustive, substantive **600 to 900 word** scholarly conclusion—NOT a short wrap-up! Systematically evaluate:
- Overall attainment of the statutory SIWES objectives and departmental learning outcomes, citing statutory ITF/SIWES literature where appropriate;
- Synthesis of the transformative technical, analytical, and professional growth achieved during the ${studentInfo.duration || 'attachment'} period;
- Long-term impact of the training on the student's academic capstone preparation, professional engineering/scientific identity, and national industrial manpower readiness;
- Final closing appraisal of the partnership between ${studentInfo.institution || 'the institution'} and ${studentInfo.hostOrg || 'the host establishment'}.)

## 5.2 Recommendations to the Academic Institution (${studentInfo.institution || 'Institution'})
(Specific, actionable multi-paragraph recommendations regarding curriculum modernization, laboratory/workshop upgrades, SIWES supervision, and academic-industry linkage.)

## 5.3 Recommendations to the Host Establishment (${studentInfo.hostOrg || 'Host Organization'})
(Constructive, actionable recommendations regarding intern onboarding, equipment maintenance/redundancy, tooling, safety culture, and structured mentorship.)

## 5.4 Strategic Advice to Prospective SIWES Students
(Detailed, practical guidance on placement preparation, logbook documentation discipline, workplace attitude, safety compliance, and technical curiosity.)

# REFERENCES
(CRITICAL REQUIREMENT: List EVERY reference from the Canonical Reference Catalog above using the EXACT formatting shown for ${activeStyleName}, PLUS 2 to 4 additional verified, real peer-reviewed textbooks/journals/standards relevant to ${studentInfo.department || 'the discipline'}—making at least 10 to 14 complete entries formatted strictly in ${activeStyleName}. Ensure exact correspondence with the in-text citations used across Chapters 1 to 5.)

# APPENDIX
(Structured verification reference, summary of logbook endorsement milestones, and industrial abbreviations/glossary table.)

Start directly with # CHAPTER FOUR: SUMMARY OF INDUSTRIAL TRAINING (IT) EXPERIENCE, CHALLENGES AND SOLUTIONS.`;

    const baseSystem = `You are a senior university engineering/science dissertation examiner and SIWES technical report specialist.
Produce publication-ready academic prose suitable for hardcover university binding and oral defense.
${formattingRules}`;

    // Execute the 3 parts concurrently with minor stagger to avoid burst throttling
    const [part1Markdown, part2Markdown, part3Markdown] = await Promise.all([
      generateContentWithFallback(ai, {
        label: 'Part1-Ch1-2',
        systemInstruction: baseSystem,
        parts: [{ text: part1Prompt }],
      }),
      new Promise<string>((resolve) => setTimeout(resolve, 250)).then(() =>
        generateContentWithFallback(ai, {
          label: 'Part2-Ch3',
          systemInstruction: baseSystem,
          parts: [{ text: part2Prompt }],
        })
      ),
      new Promise<string>((resolve) => setTimeout(resolve, 500)).then(() =>
        generateContentWithFallback(ai, {
          label: 'Part3-Ch4-5-Refs',
          systemInstruction: baseSystem,
          parts: [{ text: part3Prompt }],
        })
      ),
    ]);

    const reportMarkdown = [part1Markdown.trim(), part2Markdown.trim(), part3Markdown.trim()]
      .filter(Boolean)
      .join('\n\n');

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

// Expand / Deepen a specific report section to reach 25-50 pages
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
      studentInfo,
      referencingStyle = 'apa-7',
    } = req.body as {
      fullReportMarkdown: string;
      chapterKey?: string;
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

    const validStyle = (['apa-7', 'ieee', 'harvard', 'mla', 'vancouver'].includes(referencingStyle)
      ? referencingStyle
      : 'apa-7') as ReferencingStyle;

    const canonicalRefs = getRecommendedReferencesForStudent(
      studentInfo.department || '',
      studentInfo.faculty || '',
      validStyle
    );
    const sharedBibliographyBlock = canonicalRefs
      .map((r, i) => `${i + 1}. In-text token: "${r.inText}" -> Full Reference: ${r.formatted}`)
      .join('\n');

    const systemInstruction = `You are an expert academic technical writing specialist and university dissertation supervisor.
Your task is to take an existing SIWES technical report and substantially expand its technical depth, analytical density, and academic volume to reach an exhaustive 30-50 page monograph standard.

Focus on expanding:
1. CHAPTER THREE (Section 3.3 & 3.4): Expand every individual week in Section 3.3 "In-Depth Weekly Activity Breakdown & Technical Narrative" with deeper engineering/scientific theory, operational steps, and HSE controls, plus add 2 additional major technical case studies in Section 3.4.
2. CHAPTER FOUR (Section 4.1): Deepen "Summary of Industrial Training (IT) Experience" into a comprehensive 1,000+ word multi-paragraph synthesis before Challenges and Solutions.
3. CHAPTER FIVE (Section 5.1): Expand "Detailed Conclusion" into a substantive 700-900 word academic synthesis with deeper institutional and industry recommendations.
4. IN-TEXT CITATIONS & REFERENCES: Integrate in-text citations naturally wherever technical principles, standards, or methodologies are discussed across all chapters, using these verified references and matching them 1-to-1 in # REFERENCES (${activeStyleName}):
${sharedBibliographyBlock}

Do NOT include any images or markdown image tags. Return the complete, expanded report in clean markdown.`;

    const promptText = `
STUDENT PROFILE:
- Name: ${studentInfo.name}
- Department: ${studentInfo.department}
- Host Organization: ${studentInfo.hostOrg}
- Unit: ${studentInfo.unit}

CURRENT TECHNICAL REPORT (To expand into 30-50 page academic volume):
${fullReportMarkdown}

TASK:
Substantially expand and deepen every chapter of this report while preserving its exact 5-chapter structure. Deepen Section 3.3 week-by-week explanations, Section 4.1 Detailed IT Summary, Section 5.1 Detailed Conclusion, and expand scholarly references formatted in ${activeStyleName}. Return the full expanded report in clean markdown.`;

    const expandedMarkdown = await generateContentWithFallback(ai, {
      label: 'Expand-Report',
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
