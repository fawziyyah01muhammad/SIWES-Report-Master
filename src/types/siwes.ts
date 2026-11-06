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

export const STANDARD_FORMATS = [
  {
    id: 'universal-5ch',
    name: 'Universal 5-Chapter Technical Report Standard',
    description: 'Standard multi-chapter academic format structured for physical bound submission.',
    outline: 'Preliminary Pages -> Ch 1: Establishment Profile -> Ch 2: Tools & HSE -> Ch 3: Weekly Industrial Experience -> Ch 4: Challenges & Solutions -> Ch 5: Conclusion & Recommendations',
  },
  {
    id: 'engineering-coren',
    name: 'Engineering & Industrial Technology Standard',
    description: 'Structured for Electrical, Mechanical, Civil, Chemical, and Computer Engineering disciplines.',
    outline: 'Heavy emphasis on technical schematics, machinery operations, preventive maintenance, engineering design, and safety protocols.',
  },
  {
    id: 'comp-sci-it',
    name: 'Computer Science & Software Engineering',
    description: 'Geared towards Software Development, Networking, Cloud, Cybersecurity, and Data Science.',
    outline: 'Emphasizes System Architecture, Database Schemas, API Endpoints, CI/CD, Algorithmic Solutions, and SDLC.',
  },
  {
    id: 'applied-sciences',
    name: 'Applied Sciences & Laboratory Technology',
    description: 'Specialized for Biochemistry, Microbiology, Chemistry, Physics, and Lab Technology.',
    outline: 'Focuses on Good Laboratory Practices (GLP), Reagents, Assay Protocols, Spectrophotometry, and Quality Assurance.',
  },
  {
    id: 'custom',
    name: 'Custom Departmental Handout Guideline',
    description: 'Upload or paste your department’s specific guidelines or handbook instructions.',
    outline: 'AI strictly mirrors the custom chapter arrangement provided by your departmental committee.',
  },
];
