export interface StudentInfo {
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

export interface UploadedImage {
  id: string;
  name: string;
  mimeType: string;
  base64: string;
  previewUrl: string;
  size: number;
}

export interface CriteriaScore {
  name: string;
  score: number;
  max: number;
  feedback: string;
}

export interface DefenseQuestion {
  question: string;
  rationale: string;
}

export interface TechnicalReviewData {
  totalScore: number;
  grade: string;
  verdict: string;
  criteriaScores: CriteriaScore[];
  keyStrengths: string[];
  areasForImprovement: string[];
  defenseOralQuestions: DefenseQuestion[];
}

export interface SampleDataset {
  id: string;
  title: string;
  badge: string;
  studentInfo: StudentInfo;
  formatGuideline: string;
  logbookNotes: string;
}

export type ReferencingStyle = 'apa-7' | 'ieee' | 'harvard' | 'mla' | 'vancouver';

export interface CitationStyleOption {
  id: ReferencingStyle;
  name: string;
  shortName: string;
  description: string;
  example: string;
}

export const REFERENCING_STYLES: CitationStyleOption[] = [
  {
    id: 'apa-7',
    name: 'APA 7th Edition (American Psychological Association)',
    shortName: 'APA 7th',
    description: 'Standard across Nigerian Universities & Polytechnics. Author-date style with hanging indent.',
    example: 'Sommerville, I. (2015). Software engineering (10th ed.). Pearson Education.',
  },
  {
    id: 'ieee',
    name: 'IEEE (Institute of Electrical and Electronics Engineers)',
    shortName: 'IEEE',
    description: 'Standard for Engineering, Telecommunications, and Computer Science. Numbered brackets [1].',
    example: '[1] I. Sommerville, Software Engineering, 10th ed. Boston, MA: Pearson, 2015.',
  },
  {
    id: 'harvard',
    name: 'Harvard Referencing System',
    shortName: 'Harvard',
    description: 'Author-date citation system widely used in science, environmental, and technology faculties.',
    example: 'Sommerville, I., 2015. Software engineering. 10th ed. Boston: Pearson.',
  },
  {
    id: 'mla',
    name: 'MLA 9th Edition (Modern Language Association)',
    shortName: 'MLA 9th',
    description: 'Author-page citation format common in multidisciplinary and applied programs.',
    example: 'Sommerville, Ian. Software Engineering. 10th ed., Pearson, 2015.',
  },
  {
    id: 'vancouver',
    name: 'Vancouver / Numeric System',
    shortName: 'Vancouver',
    description: 'Numbered reference style widely used in Medical Laboratory Sciences and Biochemistry.',
    example: '1. Sommerville I. Software engineering. 10th ed. Boston: Pearson; 2015.',
  },
];

export const STANDARD_FORMATS = [
  {
    id: 'universal-5ch',
    name: 'Universal 5-Chapter Technical Report Standard',
    description: 'Standard multi-chapter academic format structured for physical bound submission (20+ pages).',
    outline: 'Preliminary Pages -> Ch 1: Establishment Profile -> Ch 2: Tools & HSE -> Ch 3: Weekly Matrix & Sec 3.3 Weekly Narratives -> Ch 4: Detailed IT Summary & Challenges -> Ch 5: Detailed Conclusion & Recommendations',
  },
  {
    id: 'engineering-coren',
    name: 'Engineering & Industrial Technology Standard',
    description: 'Structured for Electrical, Mechanical, Civil, Chemical, and Computer Engineering disciplines.',
    outline: 'Heavy emphasis on technical schematics, machinery operations, weekly engineering narratives, safety protocols, IT synthesis, and detailed conclusion.',
  },
  {
    id: 'comp-sci-it',
    name: 'Computer Science & Software Engineering',
    description: 'Geared towards Software Development, Networking, Cloud, Cybersecurity, and Data Science.',
    outline: 'Emphasizes System Architecture, Database Schemas, API Endpoints, Weekly Activity Narratives, IT Experience Summary, and Detailed Conclusion.',
  },
  {
    id: 'applied-sciences',
    name: 'Applied Sciences & Laboratory Technology',
    description: 'Specialized for Biochemistry, Microbiology, Chemistry, Physics, and Lab Technology.',
    outline: 'Focuses on Good Laboratory Practices (GLP), Reagents, Assay Protocols, Weekly Breakdowns, Quality Assurance, and Detailed IT Synthesis.',
  },
  {
    id: 'custom',
    name: 'Custom Departmental Handout Guideline',
    description: 'Upload or paste your department’s specific guidelines or handbook instructions.',
    outline: 'AI strictly mirrors the custom chapter arrangement provided by your departmental committee.',
  },
];

export type ReportDepth = 'comprehensive-20-35' | 'exhaustive-35-50' | 'standard-15-20';

export interface ReportDepthOption {
  id: ReportDepth;
  name: string;
  targetPages: string;
  description: string;
  badge: string;
}

export const REPORT_DEPTH_OPTIONS: ReportDepthOption[] = [
  {
    id: 'comprehensive-20-35',
    name: 'Comprehensive Defense Monograph',
    targetPages: '25 – 35 Pages',
    description: 'Detailed weekly matrix, Section 3.3 week-by-week narrative breakdown, 4-5 major case studies, extensive IT summary, detailed conclusion & cited literature.',
    badge: 'Recommended (25–35 Pages)',
  },
  {
    id: 'exhaustive-35-50',
    name: 'Exhaustive Academic Technical Report',
    targetPages: '35 – 50 Pages',
    description: 'Maximum depth dissertation-grade volume with full week-by-week expositions, multi-department rotations, diagnostic tables, and 12-15+ cited references.',
    badge: 'Max Depth (35–50 Pages)',
  },
  {
    id: 'standard-15-20',
    name: 'Expanded Standard Technical Report',
    targetPages: '18 – 25 Pages',
    description: 'Expanded 5-chapter institutional format with Section 3.3 weekly explanations, detailed IT summary, thorough conclusion, and core citations.',
    badge: 'Standard+ (18–25 Pages)',
  },
];
