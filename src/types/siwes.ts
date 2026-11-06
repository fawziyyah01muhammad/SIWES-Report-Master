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
    description: 'Standard multi-chapter academic format structured for physical bound submission.',
    outline: 'Preliminary Pages -> Ch 1: Establishment Profile -> Ch 2: Tools & HSE -> Ch 3: Weekly Industrial Experience -> Ch 4: IT Experience Summary, Challenges & Solutions -> Ch 5: Conclusion -> References',
  },
  {
    id: 'engineering-coren',
    name: 'Engineering & Industrial Technology Standard',
    description: 'Structured for Electrical, Mechanical, Civil, Chemical, and Computer Engineering disciplines.',
    outline: 'Heavy emphasis on technical schematics, machinery operations, preventive maintenance, engineering design, safety protocols, and IT synthesis.',
  },
  {
    id: 'comp-sci-it',
    name: 'Computer Science & Software Engineering',
    description: 'Geared towards Software Development, Networking, Cloud, Cybersecurity, and Data Science.',
    outline: 'Emphasizes System Architecture, Database Schemas, API Endpoints, CI/CD, Algorithmic Solutions, and IT Experience Synthesis.',
  },
  {
    id: 'applied-sciences',
    name: 'Applied Sciences & Laboratory Technology',
    description: 'Specialized for Biochemistry, Microbiology, Chemistry, Physics, and Lab Technology.',
    outline: 'Focuses on Good Laboratory Practices (GLP), Reagents, Assay Protocols, Spectrophotometry, Quality Assurance, and IT Synthesis.',
  },
  {
    id: 'custom',
    name: 'Custom Departmental Handout Guideline',
    description: 'Upload or paste your department’s specific guidelines or handbook instructions.',
    outline: 'AI strictly mirrors the custom chapter arrangement provided by your departmental committee.',
  },
];
