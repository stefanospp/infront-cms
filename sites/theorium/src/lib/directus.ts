import { createDirectusClient, getPublishedItems } from '@agency/utils';

// Directus connection — env vars set at build/deploy time
const directusUrl = import.meta.env.DIRECTUS_URL;
const directusToken = import.meta.env.DIRECTUS_TOKEN;

export const client = directusUrl ? createDirectusClient(directusUrl, directusToken) : null;

// Types matching Directus collections
export interface Resource {
  id: string;
  title: string;
  subject: 'Biology' | 'Chemistry' | 'Physics' | 'Mathematics';
  exam_board: 'IGCSE' | 'A-Level' | 'IB' | 'Pancyprian' | 'SAT';
  resource_type: 'Revision Notes' | 'Past Papers' | 'Topic Summary' | 'Formula Sheet' | 'Checklist';
  description: string | null;
  drive_url: string;
  sort: number;
}

export interface Course {
  id: string;
  title: string;
  subject: 'Biology' | 'Chemistry' | 'Physics' | 'Mathematics';
  level: string;
  description: string;
  syllabus: string[];
  schedule: string;
  start_date: string;
  duration: string;
  price: string;
  zoom_url: string;
  course_status: 'upcoming' | 'in-progress' | 'full' | 'completed';
  max_students: number | null;
  sort: number;
}

// Fetch all published resources, sorted by subject then sort order
export async function getResources(options?: { limit?: number }): Promise<Resource[]> {
  if (!client) return getFallbackResources();
  try {
    return await getPublishedItems<Resource>(client, 'resources', {
      sort: ['subject', 'sort'],
      limit: options?.limit,
    });
  } catch {
    return getFallbackResources();
  }
}

// Fetch all published courses, upcoming first
export async function getCourses(options?: { limit?: number }): Promise<Course[]> {
  if (!client) return getFallbackCourses();
  try {
    return await getPublishedItems<Course>(client, 'courses', {
      sort: ['sort', '-start_date'],
      limit: options?.limit,
    });
  } catch {
    return getFallbackCourses();
  }
}

// Fallback data when Directus is not configured (dev/build without CMS)
function getFallbackResources(): Resource[] {
  return [
    {
      id: '1',
      title: 'IGCSE Biology — Cell Structure & Organisation',
      subject: 'Biology',
      exam_board: 'IGCSE',
      resource_type: 'Revision Notes',
      description: 'Complete revision notes covering cell structure, organelles, and levels of organisation for IGCSE Biology.',
      drive_url: '#',
      sort: 1,
    },
    {
      id: '2',
      title: 'A-Level Chemistry — Organic Chemistry Summary',
      subject: 'Chemistry',
      exam_board: 'A-Level',
      resource_type: 'Topic Summary',
      description: 'Concise summary of all organic chemistry reactions, mechanisms, and functional groups for A-Level.',
      drive_url: '#',
      sort: 2,
    },
    {
      id: '3',
      title: 'IGCSE Physics — Forces & Motion Formula Sheet',
      subject: 'Physics',
      exam_board: 'IGCSE',
      resource_type: 'Formula Sheet',
      description: 'All formulae for forces, motion, energy, and waves in one printable sheet.',
      drive_url: '#',
      sort: 3,
    },
    {
      id: '4',
      title: 'A-Level Maths — Pure Mathematics Revision Notes',
      subject: 'Mathematics',
      exam_board: 'A-Level',
      resource_type: 'Revision Notes',
      description: 'Comprehensive notes on algebra, calculus, trigonometry, and proof for A-Level Pure Maths.',
      drive_url: '#',
      sort: 4,
    },
    {
      id: '5',
      title: 'IB Biology HL — Genetics & Evolution',
      subject: 'Biology',
      exam_board: 'IB',
      resource_type: 'Revision Notes',
      description: 'Detailed notes for IB Higher Level Biology covering Topics 3, 4, and 10.',
      drive_url: '#',
      sort: 5,
    },
    {
      id: '6',
      title: 'Pancyprian Exam — Βιολογία Checklist',
      subject: 'Biology',
      exam_board: 'Pancyprian',
      resource_type: 'Checklist',
      description: 'Topic checklist for Pancyprian Biology exam preparation (Sciences direction).',
      drive_url: '#',
      sort: 6,
    },
  ];
}

function getFallbackCourses(): Course[] {
  return [
    {
      id: '1',
      title: 'A-Level Biology Intensive Revision',
      subject: 'Biology',
      level: 'A-Level',
      description: 'Intensive 8-week revision course covering all A-Level Biology topics. Focus on exam technique, past paper practice, and high-yield topics.',
      syllabus: ['Cell biology & microscopy', 'Genetics & inheritance', 'Ecology & ecosystems', 'Human physiology', 'Exam technique & past papers'],
      schedule: 'Every Saturday, 10:00 — 12:00',
      start_date: '2026-09-06',
      duration: '8 weeks',
      price: '€160',
      zoom_url: '#',
      course_status: 'upcoming',
      max_students: 12,
      sort: 1,
    },
    {
      id: '2',
      title: 'IGCSE Chemistry Crash Course',
      subject: 'Chemistry',
      level: 'IGCSE',
      description: 'Fast-paced revision for IGCSE Chemistry. Covers the entire syllabus with focus on common exam questions and practical skills.',
      syllabus: ['Atomic structure & bonding', 'Stoichiometry', 'Organic chemistry', 'Energetics & rates', 'Practical exam preparation'],
      schedule: 'Tuesdays & Thursdays, 17:00 — 18:30',
      start_date: '2026-09-09',
      duration: '6 weeks',
      price: '€120',
      zoom_url: '#',
      course_status: 'upcoming',
      max_students: 10,
      sort: 2,
    },
    {
      id: '3',
      title: 'UCAT Preparation Bootcamp',
      subject: 'Mathematics',
      level: 'UCAT',
      description: 'Comprehensive UCAT preparation covering all four subtests. Timed practice, strategy sessions, and score tracking.',
      syllabus: ['Verbal Reasoning strategies', 'Decision Making techniques', 'Quantitative Reasoning drills', 'Situational Judgement', 'Full mock tests'],
      schedule: 'Weekends, 09:00 — 13:00',
      start_date: '2026-06-01',
      duration: '4 weekends',
      price: '€200',
      zoom_url: '#',
      course_status: 'upcoming',
      max_students: 8,
      sort: 3,
    },
  ];
}
