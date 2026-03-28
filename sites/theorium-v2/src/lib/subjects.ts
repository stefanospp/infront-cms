/**
 * Shared subject data — single source of truth for listings and detail pages.
 * When wired to Payload CMS, this will be replaced by fetch calls.
 */

export interface SubjectLevel {
  label: string;
  filled: boolean;
}

export interface SchoolSubject {
  code: string;
  name: string;
  slug: string;
  description: string;
  levels: SubjectLevel[];
}

export interface SchoolData {
  name: string;
  location: string;
  examBoards: string;
  subjects: SchoolSubject[];
}

export interface SubjectDetail {
  slug: string;
  name: string;
  code: string;
  color: string;
  tagline: string;
  fullDescription: string;
  levels: {
    name: string;
    examBoards: string[];
    topics: string[];
  }[];
  whyStudy: string[];
  schools: string[];
}

const allSchools = [
  'American Academy Larnaca',
  'American Academy Nicosia',
  'Pascal English School',
  'Med High',
  'The English School',
  'The Grammar School',
  'G.C. School of Careers',
  'The International School of Limassol',
  'The Junior & Senior School',
  'Heritage Private School',
  'Forum',
];

export const subjectDetails: SubjectDetail[] = [
  {
    slug: 'biology',
    name: 'Biology',
    code: 'BIO',
    color: '#ffb3c6',
    tagline: 'From cells to ecosystems — understand the science of life.',
    fullDescription: 'Biology is the study of living organisms and their interactions with the environment. Our Biology tuition covers the full IGCSE and A-Level syllabus, with additional support for IB students at Pascal. Lessons focus on building deep understanding through diagrams, past paper practice, and exam technique — not just memorisation.',
    levels: [
      {
        name: 'IGCSE',
        examBoards: ['Cambridge', 'Edexcel'],
        topics: ['Cell biology & organisation', 'Transport in plants and animals', 'Genetics & inheritance', 'Natural selection & evolution', 'Ecology & ecosystems', 'Human physiology & coordination'],
      },
      {
        name: 'A-Level',
        examBoards: ['Cambridge', 'Edexcel'],
        topics: ['Biological molecules & enzymes', 'Cell division & cell cycle', 'Gas exchange & transport', 'Genetics & gene expression', 'Energy & respiration', 'Ecology & sustainability'],
      },
      {
        name: 'IB HL/SL',
        examBoards: ['IB'],
        topics: ['Cell biology', 'Molecular biology', 'Genetics', 'Ecology', 'Evolution & biodiversity', 'Human physiology', 'Internal Assessment support'],
      },
    ],
    whyStudy: [
      'Essential for medicine, dentistry, veterinary science, and biomedical courses',
      'Develops analytical and data interpretation skills',
      'Strong practical component — learn to design and evaluate experiments',
      'High demand subject with clear career pathways',
    ],
    schools: allSchools,
  },
  {
    slug: 'chemistry',
    name: 'Chemistry',
    code: 'CHE',
    color: '#fff33b',
    tagline: 'Master reactions, structures, and calculations.',
    fullDescription: 'Chemistry bridges the gap between physics and biology, and is a requirement for most science-related university courses. Our Chemistry tuition builds confidence in organic chemistry, stoichiometric calculations, and data analysis. Every lesson connects theory to exam questions so students know exactly how to earn marks.',
    levels: [
      {
        name: 'IGCSE',
        examBoards: ['Cambridge', 'Edexcel'],
        topics: ['Atomic structure & the periodic table', 'Bonding & structure', 'Stoichiometry & moles', 'Electrochemistry', 'Chemical energetics', 'Organic chemistry basics'],
      },
      {
        name: 'A-Level',
        examBoards: ['Cambridge', 'Edexcel'],
        topics: ['Advanced organic chemistry', 'Reaction kinetics', 'Chemical equilibria', 'Electrochemistry & redox', 'Transition metals', 'Spectroscopy & analysis'],
      },
      {
        name: 'IB HL/SL',
        examBoards: ['IB'],
        topics: ['Stoichiometric relationships', 'Atomic structure', 'Periodicity', 'Bonding', 'Energetics & thermochemistry', 'Chemical kinetics', 'Internal Assessment support'],
      },
    ],
    whyStudy: [
      'Required for medicine, pharmacy, chemical engineering, and materials science',
      'Develops quantitative and problem-solving skills',
      'Practical skills in experimental design and data analysis',
      'Strong foundation for understanding how the physical world works',
    ],
    schools: allSchools,
  },
  {
    slug: 'physics',
    name: 'Physics',
    code: 'PHY',
    color: '#b8ff6b',
    tagline: 'Forces, energy, waves — understand how the universe works.',
    fullDescription: 'Physics is the most mathematical of the three sciences, and students often find it the most challenging. Our Physics tuition focuses on building problem-solving confidence — working through mechanics, electricity, and waves with clear step-by-step methods. We also dedicate time to practical paper preparation, teaching students how to handle data, uncertainties, and experimental evaluation.',
    levels: [
      {
        name: 'IGCSE',
        examBoards: ['Cambridge', 'Edexcel'],
        topics: ['Forces & motion', 'Energy & thermal physics', 'Waves & light', 'Electricity & magnetism', 'Nuclear physics', 'Space physics'],
      },
      {
        name: 'A-Level',
        examBoards: ['Cambridge', 'Edexcel'],
        topics: ['Mechanics & kinematics', 'Electric fields & capacitance', 'Gravitational fields', 'Oscillations & waves', 'Quantum physics', 'Nuclear physics & radioactivity'],
      },
      {
        name: 'IB HL/SL',
        examBoards: ['IB'],
        topics: ['Measurements & uncertainties', 'Mechanics', 'Thermal physics', 'Waves', 'Electricity & magnetism', 'Atomic & nuclear physics', 'Internal Assessment support'],
      },
    ],
    whyStudy: [
      'Essential for engineering, computer science, architecture, and physics degrees',
      'Develops mathematical reasoning and analytical thinking',
      'Highly valued by universities for demonstrating rigour',
      'Opens doors to a wide range of STEM careers',
    ],
    schools: allSchools,
  },
];

/**
 * School definitions — CMS-ready. Each school has exam boards and level offerings.
 * When wired to Payload, this becomes a collection.
 */
interface SchoolDef {
  name: string;
  location: string;
  examBoards: string;
  levels: { label: string; filled: boolean }[];
}

const schoolDefs: SchoolDef[] = [
  { name: 'American Academy Larnaca', location: 'Larnaca', examBoards: 'GCSE · IGCSE · A-Level', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }] },
  { name: 'American Academy Nicosia', location: 'Nicosia', examBoards: 'IGCSE · A-Level', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }] },
  { name: 'Pascal English School', location: 'Larnaca', examBoards: 'Cambridge · Edexcel · IB', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }, { label: 'IB HL/SL', filled: false }] },
  { name: 'Med High', location: 'Larnaca', examBoards: 'Cambridge · Edexcel', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }] },
  { name: 'The English School', location: 'Nicosia', examBoards: 'Cambridge · Pearson · AQA', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }] },
  { name: 'The Grammar School', location: 'Nicosia', examBoards: 'IGCSE · AS · A-Level', levels: [{ label: 'IGCSE', filled: true }, { label: 'AS', filled: false }, { label: 'A-Level', filled: false }] },
  { name: 'G.C. School of Careers', location: 'Nicosia', examBoards: 'Edexcel / Pearson', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }] },
  { name: 'The International School of Limassol', location: 'Limassol', examBoards: 'IB Diploma', levels: [{ label: 'IB MYP', filled: true }, { label: 'IB DP', filled: false }] },
  { name: 'The Junior & Senior School', location: 'Nicosia', examBoards: 'IGCSE · A-Level · IB (2025)', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }, { label: 'IB DP', filled: false }] },
  { name: 'Heritage Private School', location: 'Limassol', examBoards: 'Cambridge · Pearson', levels: [{ label: 'IGCSE', filled: true }, { label: 'AS', filled: false }, { label: 'A-Level', filled: false }] },
  { name: 'Forum', location: 'Larnaca', examBoards: 'IGCSE · A-Level', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }] },
];

export const schoolData: SchoolData[] = schoolDefs.map((school) => ({
  name: school.name,
  location: school.location,
  examBoards: school.examBoards,
  subjects: subjectDetails.map((s) => ({
    code: s.code,
    name: s.name,
    slug: s.slug,
    description: s.levels[0]!.topics.slice(0, 4).join(', '),
    levels: school.levels,
  })),
}));

export function getSubjectBySlug(slug: string): SubjectDetail | undefined {
  return subjectDetails.find((s) => s.slug === slug);
}

export function getRelatedCourses(subjectName: string) {
  // Import dynamically to avoid circular deps — will be used in detail page
  return [];
}
