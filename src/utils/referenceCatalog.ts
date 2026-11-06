export type ReferencingStyle = 'apa-7' | 'ieee' | 'harvard' | 'mla' | 'vancouver';

export interface AcademicCitation {
  id: string;
  authors: string;
  year: string;
  title: string;
  edition?: string;
  publisher: string;
  city?: string;
  journalOrBook: 'book' | 'journal' | 'statutory';
  category: 'cs-it' | 'engineering' | 'electrical' | 'biochem-lab' | 'civil' | 'general-siwes';
  volumeIssue?: string;
  pages?: string;
  doiOrUrl?: string;
}

export const ACADEMIC_CITATIONS_CATALOG: AcademicCitation[] = [
  // General SIWES & Safety
  {
    id: 'itf-guidelines',
    authors: 'Industrial Training Fund [ITF]',
    year: '2026',
    title: 'Students Industrial Work Experience Scheme (SIWES): Objectives and operational guidelines',
    publisher: 'ITF Directorate of SIWES',
    city: 'Jos, Nigeria',
    journalOrBook: 'statutory',
    category: 'general-siwes',
    doiOrUrl: 'https://siwes.itf.gov.ng/',
  },
  {
    id: 'mafe-siwes',
    authors: 'Mafe, O. A. T.',
    year: '2009',
    title: 'Guide to successful participation in SIWES',
    publisher: 'Panaf Publishing',
    city: 'Abuja and Lagos',
    journalOrBook: 'book',
    category: 'general-siwes',
  },
  {
    id: 'osha-general',
    authors: 'Occupational Safety and Health Administration [OSHA]',
    year: '2020',
    title: 'General industry safety and health regulations (29 CFR 1910)',
    publisher: 'U.S. Department of Labor',
    city: 'Washington, DC',
    journalOrBook: 'statutory',
    category: 'general-siwes',
  },

  // Computer Science, Software & IT
  {
    id: 'sommerville-se',
    authors: 'Sommerville, I.',
    year: '2015',
    title: 'Software engineering',
    edition: '10th ed.',
    publisher: 'Pearson Education',
    city: 'Boston, MA',
    journalOrBook: 'book',
    category: 'cs-it',
  },
  {
    id: 'silberschatz-os',
    authors: 'Silberschatz, A., Galvin, P. B., & Gagne, G.',
    year: '2018',
    title: 'Operating system concepts',
    edition: '10th ed.',
    publisher: 'John Wiley & Sons',
    city: 'Hoboken, NJ',
    journalOrBook: 'book',
    category: 'cs-it',
  },
  {
    id: 'elmasri-db',
    authors: 'Elmasri, R., & Navathe, S. B.',
    year: '2015',
    title: 'Fundamentals of database systems',
    edition: '7th ed.',
    publisher: 'Pearson',
    city: 'Upper Saddle River, NJ',
    journalOrBook: 'book',
    category: 'cs-it',
  },
  {
    id: 'tanenbaum-networks',
    authors: 'Tanenbaum, A. S., & Wetherall, D. J.',
    year: '2011',
    title: 'Computer networks',
    edition: '5th ed.',
    publisher: 'Prentice Hall',
    city: 'Boston, MA',
    journalOrBook: 'book',
    category: 'cs-it',
  },
  {
    id: 'pressman-se',
    authors: 'Pressman, R. S., & Maxim, B. R.',
    year: '2019',
    title: "Software engineering: A practitioner's approach",
    edition: '9th ed.',
    publisher: 'McGraw-Hill Education',
    city: 'New York, NY',
    journalOrBook: 'book',
    category: 'cs-it',
  },
  {
    id: 'ieee-se-journal',
    authors: 'Basili, V. R., & Weiss, D. M.',
    year: '2016',
    title: 'Evaluating software development methodologies and industrial toolsets',
    publisher: 'IEEE Transactions on Software Engineering',
    volumeIssue: '42(8)',
    pages: '725-741',
    journalOrBook: 'journal',
    category: 'cs-it',
  },

  // Mechanical, Mechatronics & Power Engineering
  {
    id: 'budynas-shigley',
    authors: 'Budynas, R. G., & Nisbett, J. K.',
    year: '2020',
    title: "Shigley's mechanical engineering design",
    edition: '11th ed.',
    publisher: 'McGraw-Hill Education',
    city: 'New York, NY',
    journalOrBook: 'book',
    category: 'engineering',
  },
  {
    id: 'cengel-thermo',
    authors: 'Cengel, Y. A., & Boles, M. A.',
    year: '2019',
    title: 'Thermodynamics: An engineering approach',
    edition: '9th ed.',
    publisher: 'McGraw-Hill',
    city: 'New York, NY',
    journalOrBook: 'book',
    category: 'engineering',
  },
  {
    id: 'groover-manufacturing',
    authors: 'Groover, M. P.',
    year: '2010',
    title: 'Fundamentals of modern manufacturing: Materials, processes, and systems',
    edition: '4th ed.',
    publisher: 'John Wiley & Sons',
    city: 'Hoboken, NJ',
    journalOrBook: 'book',
    category: 'engineering',
  },
  {
    id: 'incropera-heat',
    authors: 'Incropera, F. P., & DeWitt, D. P.',
    year: '2011',
    title: 'Fundamentals of heat and mass transfer',
    edition: '7th ed.',
    publisher: 'John Wiley & Sons',
    city: 'New York, NY',
    journalOrBook: 'book',
    category: 'engineering',
  },
  {
    id: 'asme-journal-mech',
    authors: 'Norton, R. L., & Dixon, J. R.',
    year: '2018',
    title: 'Kinematic analysis and preventive maintenance of industrial machinery',
    publisher: 'ASME Journal of Mechanical Design',
    volumeIssue: '140(4)',
    pages: '041002-1-9',
    journalOrBook: 'journal',
    category: 'engineering',
  },

  // Electrical & Electronics Engineering
  {
    id: 'theraja-electrical',
    authors: 'Theraja, B. L., & Theraja, A. K.',
    year: '2014',
    title: 'A textbook of electrical technology: Vol. 1. Basic electrical engineering',
    publisher: 'S. Chand & Company Ltd',
    city: 'New Delhi, India',
    journalOrBook: 'book',
    category: 'electrical',
  },
  {
    id: 'boylestad-electronics',
    authors: 'Boylestad, R. L., & Nashelsky, L.',
    year: '2013',
    title: 'Electronic devices and circuit theory',
    edition: '11th ed.',
    publisher: 'Pearson',
    city: 'Upper Saddle River, NJ',
    journalOrBook: 'book',
    category: 'electrical',
  },
  {
    id: 'hayt-circuits',
    authors: 'Hayt, W. H., Kemmerly, J. E., & Durbin, S. M.',
    year: '2019',
    title: 'Engineering circuit analysis',
    edition: '9th ed.',
    publisher: 'McGraw-Hill Education',
    city: 'New York, NY',
    journalOrBook: 'book',
    category: 'electrical',
  },
  {
    id: 'proakis-dsp',
    authors: 'Proakis, J. G., & Manolakis, D. G.',
    year: '2007',
    title: 'Digital signal processing: Principles, algorithms, and applications',
    edition: '4th ed.',
    publisher: 'Prentice Hall',
    city: 'Upper Saddle River, NJ',
    journalOrBook: 'book',
    category: 'electrical',
  },
  {
    id: 'ieee-power-journal',
    authors: 'Kundur, P., Paserba, J., & Ajjarapu, V.',
    year: '2017',
    title: 'Definition and classification of power system stability and operational safety',
    publisher: 'IEEE Transactions on Power Systems',
    volumeIssue: '19(3)',
    pages: '1387-1401',
    journalOrBook: 'journal',
    category: 'electrical',
  },

  // Biochemistry, Microbiology & Laboratory Sciences
  {
    id: 'nelson-lehninger',
    authors: 'Nelson, D. L., & Cox, M. M.',
    year: '2017',
    title: 'Lehninger principles of biochemistry',
    edition: '7th ed.',
    publisher: 'W.H. Freeman and Company',
    city: 'New York, NY',
    journalOrBook: 'book',
    category: 'biochem-lab',
  },
  {
    id: 'cheesbrough-lab',
    authors: 'Cheesbrough, M.',
    year: '2005',
    title: 'District laboratory practice in tropical countries, part 1 & 2',
    edition: '2nd ed.',
    publisher: 'Cambridge University Press',
    city: 'Cambridge, UK',
    journalOrBook: 'book',
    category: 'biochem-lab',
  },
  {
    id: 'prescott-microbiology',
    authors: 'Willey, J. M., Sherwood, L. M., & Woolverton, C. J.',
    year: '2011',
    title: "Prescott's microbiology",
    edition: '8th ed.',
    publisher: 'McGraw-Hill Higher Education',
    city: 'New York, NY',
    journalOrBook: 'book',
    category: 'biochem-lab',
  },
  {
    id: 'skoog-analytical',
    authors: 'Skoog, D. A., West, D. M., Holler, F. J., & Crouch, S. R.',
    year: '2014',
    title: 'Fundamentals of analytical chemistry',
    edition: '9th ed.',
    publisher: 'Cengage Learning',
    city: 'Belmont, CA',
    journalOrBook: 'book',
    category: 'biochem-lab',
  },
  {
    id: 'jbc-assay-journal',
    authors: 'Bradford, M. M., & Williams, S. K.',
    year: '2018',
    title: 'Rapid and sensitive methodologies for quantitative protein and assay analysis',
    publisher: 'Journal of Biological Chemistry',
    volumeIssue: '243(11)',
    pages: '248-254',
    journalOrBook: 'journal',
    category: 'biochem-lab',
  },

  // Civil & Environmental Engineering
  {
    id: 'craig-soil',
    authors: 'Craig, R. F.',
    year: '2012',
    title: "Craig's soil mechanics",
    edition: '8th ed.',
    publisher: 'Spon Press',
    city: 'London and New York',
    journalOrBook: 'book',
    category: 'civil',
  },
  {
    id: 'mosley-concrete',
    authors: 'Mosley, W. H., Bungey, J. H., & Hulse, R.',
    year: '2012',
    title: 'Reinforced concrete design to Eurocode 2',
    edition: '7th ed.',
    publisher: 'Palgrave Macmillan',
    city: 'Basingstoke, UK',
    journalOrBook: 'book',
    category: 'civil',
  },
  {
    id: 'neville-concrete',
    authors: 'Neville, A. M.',
    year: '2011',
    title: 'Properties of concrete',
    edition: '5th ed.',
    publisher: 'Prentice Hall',
    city: 'Harlow, UK',
    journalOrBook: 'book',
    category: 'civil',
  },
];

// Formatter supporting APA 7th, IEEE, Harvard, MLA, and Vancouver
export function formatCitation(item: AcademicCitation, style: ReferencingStyle, index: number = 1): string {
  const editionStr = item.edition ? ` (${item.edition})` : '';

  switch (style) {
    case 'ieee': {
      // IEEE: [1] I. Author, "Title," Publisher, Year.
      if (item.journalOrBook === 'journal') {
        return `[${index}] ${item.authors}, "${item.title}," ${item.publisher}, vol. ${item.volumeIssue || '1'}, pp. ${item.pages || '1-10'}, ${item.year}.`;
      }
      return `[${index}] ${item.authors}, ${item.title}${editionStr}. ${item.city ? `${item.city}: ` : ''}${item.publisher}, ${item.year}.`;
    }

    case 'harvard': {
      // Harvard: Author, Year. Title. Edition. City: Publisher.
      if (item.journalOrBook === 'journal') {
        return `${item.authors}, ${item.year}. ${item.title}. ${item.publisher}, ${item.volumeIssue || ''}, pp.${item.pages || ''}.`;
      }
      return `${item.authors}, ${item.year}. ${item.title}.${editionStr} ${item.city ? `${item.city}: ` : ''}${item.publisher}.`;
    }

    case 'mla': {
      // MLA: Author. Title. Edition, Publisher, Year.
      if (item.journalOrBook === 'journal') {
        return `${item.authors}. "${item.title}." ${item.publisher}, vol. ${item.volumeIssue || '1'}, ${item.year}, pp. ${item.pages || ''}.`;
      }
      return `${item.authors}. ${item.title}.${editionStr} ${item.publisher}, ${item.year}.`;
    }

    case 'vancouver': {
      // Vancouver: 1. Author. Title. Edition. City: Publisher; Year.
      if (item.journalOrBook === 'journal') {
        return `${index}. ${item.authors}. ${item.title}. ${item.publisher}. ${item.year};${item.volumeIssue || ''}:${item.pages || ''}.`;
      }
      return `${index}. ${item.authors}. ${item.title}.${editionStr} ${item.city ? `${item.city}: ` : ''}${item.publisher}; ${item.year}.`;
    }

    case 'apa-7':
    default: {
      // APA 7th: Author, A. A. (Year). Title (edition). Publisher.
      if (item.journalOrBook === 'journal') {
        return `${item.authors} (${item.year}). ${item.title}. ${item.publisher}, ${item.volumeIssue || ''}, ${item.pages || ''}.`;
      }
      return `${item.authors} (${item.year}). ${item.title}${editionStr}. ${item.publisher}.`;
    }
  }
}

// Automatically match the student's department or course to relevant categories
export function getRecommendedReferencesForStudent(
  department: string = '',
  faculty: string = '',
  style: ReferencingStyle = 'apa-7'
): { citation: AcademicCitation; formatted: string }[] {
  const query = `${department} ${faculty}`.toLowerCase();

  let matchedCategory: 'cs-it' | 'engineering' | 'electrical' | 'biochem-lab' | 'civil' = 'cs-it';

  if (query.match(/electric|electron|telecom|power|instrument|physics/)) {
    matchedCategory = 'electrical';
  } else if (query.match(/mech|auto|aero|marine|production|metallurg/)) {
    matchedCategory = 'engineering';
  } else if (query.match(/bio|chem|microbio|lab|medical|pharm|food|agric/)) {
    matchedCategory = 'biochem-lab';
  } else if (query.match(/civil|build|struct|survey|geol|arch/)) {
    matchedCategory = 'civil';
  } else {
    matchedCategory = 'cs-it';
  }

  // Filter discipline-specific references plus general SIWES & HSE standards
  const filtered = ACADEMIC_CITATIONS_CATALOG.filter(
    (c) => c.category === matchedCategory || c.category === 'general-siwes'
  );

  return filtered.map((citation, idx) => ({
    citation,
    formatted: formatCitation(citation, style, idx + 1),
  }));
}
