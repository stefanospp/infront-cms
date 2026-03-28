/**
 * Shared resource data — single source of truth.
 * When wired to Payload CMS, this will be replaced by fetch calls.
 * Resources are either downloadable files or external links.
 */

export interface Resource {
  slug: string;
  name: string;
  description: string;
  subject: string;
  level: string;
  type: 'Past Papers' | 'Notes' | 'Worksheets' | 'Reference' | 'Video' | 'External Link';
  examBoard: string;
  fileType?: string;
  fileSize?: string;
  url?: string;
  date: string;
  color: string;
  status: 'available' | 'coming-soon';
}

export const resources: Resource[] = [
  // Biology
  {
    slug: 'igcse-biology-past-papers-cambridge',
    name: 'IGCSE Biology Past Papers (2020–2025)',
    description: 'Complete set of Cambridge IGCSE Biology past papers with mark schemes and examiner reports.',
    subject: 'Biology',
    level: 'IGCSE',
    type: 'Past Papers',
    examBoard: 'Cambridge',
    fileType: 'PDF',
    fileSize: '24 MB',
    date: '2025-09',
    color: '#ffb3c6',
    status: 'available',
  },
  {
    slug: 'alevel-biology-revision-notes-edexcel',
    name: 'A-Level Biology Revision Notes',
    description: 'Comprehensive topic-by-topic revision notes covering the full Edexcel A-Level Biology specification.',
    subject: 'Biology',
    level: 'A-Level',
    type: 'Notes',
    examBoard: 'Edexcel',
    fileType: 'PDF',
    fileSize: '8.2 MB',
    date: '2025-11',
    color: '#ffb3c6',
    status: 'available',
  },
  {
    slug: 'cell-biology-worksheet-pack',
    name: 'Cell Biology Worksheet Pack',
    description: '15 worksheets covering cell structure, transport, division, and specialisation. Includes answer keys.',
    subject: 'Biology',
    level: 'IGCSE',
    type: 'Worksheets',
    examBoard: 'All Boards',
    fileType: 'PDF',
    fileSize: '3.4 MB',
    date: '2025-10',
    color: '#ffb3c6',
    status: 'available',
  },
  {
    slug: 'ib-biology-ia-guide',
    name: 'IB Biology IA Planning Guide',
    description: 'Step-by-step guide to planning your IB Biology Internal Assessment — topic ideas, structure, and marking criteria.',
    subject: 'Biology',
    level: 'IB',
    type: 'Reference',
    examBoard: 'IB',
    fileType: 'PDF',
    fileSize: '1.8 MB',
    date: '2025-08',
    color: '#ffb3c6',
    status: 'available',
  },
  // Chemistry
  {
    slug: 'igcse-chemistry-past-papers-cambridge',
    name: 'IGCSE Chemistry Past Papers (2020–2025)',
    description: 'Cambridge IGCSE Chemistry past papers with full mark schemes. Papers 1–6 included.',
    subject: 'Chemistry',
    level: 'IGCSE',
    type: 'Past Papers',
    examBoard: 'Cambridge',
    fileType: 'PDF',
    fileSize: '22 MB',
    date: '2025-09',
    color: '#fff33b',
    status: 'available',
  },
  {
    slug: 'organic-chemistry-summary-sheets',
    name: 'Organic Chemistry Summary Sheets',
    description: 'Reaction pathway maps, functional group summaries, and mechanism diagrams for A-Level organic chemistry.',
    subject: 'Chemistry',
    level: 'A-Level',
    type: 'Notes',
    examBoard: 'All Boards',
    fileType: 'PDF',
    fileSize: '4.6 MB',
    date: '2025-12',
    color: '#fff33b',
    status: 'available',
  },
  {
    slug: 'alevel-chemistry-practice-problems',
    name: 'A-Level Chemistry Practice Problems',
    description: '120 exam-style calculation problems with worked solutions covering stoichiometry, energetics, and kinetics.',
    subject: 'Chemistry',
    level: 'A-Level',
    type: 'Worksheets',
    examBoard: 'Edexcel',
    fileType: 'PDF',
    fileSize: '5.1 MB',
    date: '2025-11',
    color: '#fff33b',
    status: 'available',
  },
  {
    slug: 'periodic-table-reference',
    name: 'Periodic Table & Data Booklet',
    description: 'Printable periodic table with key data — electronegativity, ionisation energies, and electron configurations.',
    subject: 'Chemistry',
    level: 'IGCSE',
    type: 'Reference',
    examBoard: 'All Boards',
    fileType: 'PDF',
    fileSize: '0.5 MB',
    date: '2025-06',
    color: '#fff33b',
    status: 'available',
  },
  // Physics
  {
    slug: 'igcse-physics-past-papers-cambridge',
    name: 'IGCSE Physics Past Papers (2020–2025)',
    description: 'Complete Cambridge IGCSE Physics past papers with mark schemes and examiner reports.',
    subject: 'Physics',
    level: 'IGCSE',
    type: 'Past Papers',
    examBoard: 'Cambridge',
    fileType: 'PDF',
    fileSize: '20 MB',
    date: '2025-09',
    color: '#b8ff6b',
    status: 'available',
  },
  {
    slug: 'mechanics-revision-guide',
    name: 'Mechanics & Forces Revision Guide',
    description: 'Detailed notes on forces, motion, momentum, and energy with diagrams and worked examples.',
    subject: 'Physics',
    level: 'IGCSE',
    type: 'Notes',
    examBoard: 'All Boards',
    fileType: 'PDF',
    fileSize: '6.3 MB',
    date: '2025-10',
    color: '#b8ff6b',
    status: 'available',
  },
  {
    slug: 'alevel-physics-formula-sheet',
    name: 'A-Level Physics Formula Sheet',
    description: 'All formulae needed for A-Level Physics in a single printable sheet, organised by topic.',
    subject: 'Physics',
    level: 'A-Level',
    type: 'Reference',
    examBoard: 'All Boards',
    fileType: 'PDF',
    fileSize: '0.3 MB',
    date: '2025-07',
    color: '#b8ff6b',
    status: 'available',
  },
  {
    slug: 'electricity-circuits-worksheets',
    name: 'Electricity & Circuits Worksheets',
    description: '12 worksheets on current, voltage, resistance, series/parallel circuits, and electrical energy.',
    subject: 'Physics',
    level: 'IGCSE',
    type: 'Worksheets',
    examBoard: 'All Boards',
    fileType: 'PDF',
    fileSize: '2.8 MB',
    date: '2025-11',
    color: '#b8ff6b',
    status: 'coming-soon',
  },
];

export function getResourceBySlug(slug: string): Resource | undefined {
  return resources.find((r) => r.slug === slug);
}
