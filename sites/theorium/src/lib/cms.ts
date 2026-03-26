import type {
  Resource, Course, SiteContent, School, ExamDestination,
  MedicalBlockData, TutoringTier, TutoringStep, TutoringSubject,
} from './types';

// Re-export all types for backward compatibility with page imports
export type {
  Resource, Course, SiteContent, School, ExamDestination,
  MedicalBlockData, TutoringTier, TutoringStep, TutoringSubject,
} from './types';
export type { BadgeColor, SubjectColor, QualBadge, SubjectCell, TagColor } from './types';

// ─── SonicJs helpers ────────────────────────────────────────────────────────

interface SonicJsContentItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  collectionId: string;
  data: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

interface SonicJsResponse {
  data: SonicJsContentItem[];
  meta?: Record<string, unknown>;
}

async function fetchCollection(collection: string, options?: { limit?: number }): Promise<SonicJsContentItem[]> {
  const cmsUrl = import.meta.env.SONICJS_URL;
  if (!cmsUrl) return [];

  try {
    const params = new URLSearchParams();
    params.set('status', 'published');
    if (options?.limit) params.set('limit', String(options.limit));

    const url = `${cmsUrl}/api/collections/${collection}/content?${params}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return [];

    const json = (await response.json()) as SonicJsResponse;
    return json.data ?? [];
  } catch {
    return [];
  }
}

/** Parse a JSON string field that may already be parsed or may be a raw string */
function parseJsonField<T>(value: unknown): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }
  return value as T;
}

/** Sort items by data.sort field */
function sortByOrder(items: SonicJsContentItem[]): SonicJsContentItem[] {
  return [...items].sort((a, b) => {
    const aSort = typeof a.data.sort === 'number' ? a.data.sort : 999;
    const bSort = typeof b.data.sort === 'number' ? b.data.sort : 999;
    return aSort - bSort;
  });
}

// ─── Query functions (same signatures as directus.ts) ────────────────────────

export async function getResources(options?: { limit?: number }): Promise<Resource[]> {
  const items = sortByOrder(await fetchCollection('resources', options));
  if (items.length === 0) return getFallbackResources();

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    subject: item.data.subject as Resource['subject'],
    exam_board: item.data.exam_board as Resource['exam_board'],
    resource_type: item.data.resource_type as Resource['resource_type'],
    description: (item.data.description as string) ?? null,
    drive_url: item.data.drive_url as string,
    sort: (item.data.sort as number) ?? 0,
  }));
}

export async function getCourses(options?: { limit?: number }): Promise<Course[]> {
  const items = sortByOrder(await fetchCollection('courses', options));
  if (items.length === 0) return getFallbackCourses();

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    subject: item.data.subject as Course['subject'],
    level: (item.data.level as string) ?? '',
    description: (item.data.description as string) ?? '',
    syllabus: parseJsonField<string[]>(item.data.syllabus) ?? [],
    schedule: (item.data.schedule as string) ?? '',
    start_date: (item.data.start_date as string) ?? '',
    duration: (item.data.duration as string) ?? '',
    price: (item.data.price as string) ?? '',
    zoom_url: (item.data.zoom_url as string) ?? '',
    course_status: (item.data.course_status as Course['course_status']) ?? 'upcoming',
    max_students: (item.data.max_students as number) ?? null,
    sort: (item.data.sort as number) ?? 0,
  }));
}

export async function getSiteContent(): Promise<SiteContent> {
  // Fetch from 4 focused collections in parallel
  const [heroItems, sectionItems, pageItems, contactItems] = await Promise.all([
    fetchCollection('hero_content', { limit: 1 }),
    fetchCollection('section_headings'),
    fetchCollection('page_content'),
    fetchCollection('contact_content', { limit: 1 }),
  ]);

  // If no CMS data at all, return fallback
  if (heroItems.length === 0 && sectionItems.length === 0) return getFallbackSiteContent();

  const hero = heroItems[0]?.data ?? {};
  const contact = contactItems[0]?.data ?? {};

  // Build section lookup by slug (slug = section name)
  const section = (name: string) => {
    const item = sectionItems.find((s) => s.data.section === name || s.slug === name);
    return item?.data ?? {};
  };

  // Build page lookup by slug
  const page = (name: string) => {
    const item = pageItems.find((p) => p.data.page === name || p.slug === `${name}-page`);
    return item?.data ?? {};
  };

  const schools = section('schools');
  const exams = section('exams');
  const resources = section('resources');
  const courses = section('courses');
  const contactSec = section('contact');
  const resourcesPage = page('resources');
  const coursesPage = page('courses');
  const tutoringPage = page('tutoring');

  return {
    hero_badge: (hero.badge as string) ?? '',
    hero_heading: (hero.heading as string) ?? '',
    hero_heading_highlight: (hero.heading_highlight as string) ?? '',
    hero_subheading: (hero.subheading as string) ?? '',
    hero_cta_primary_text: (hero.cta_text as string) ?? '',
    hero_cta_primary_href: (hero.cta_href as string) ?? '',
    hero_whatsapp_url: (hero.whatsapp_url as string) ?? '',
    hero_viber_url: (hero.viber_url as string) ?? '',
    ticker_items: parseJsonField<string[]>(hero.ticker_items) ?? [],
    schools_badge: (schools.badge as string) ?? '',
    schools_heading: (schools.heading as string) ?? '',
    schools_subtitle: (schools.subtitle as string) ?? '',
    exams_badge: (exams.badge as string) ?? '',
    exams_heading: (exams.heading as string) ?? '',
    exams_subtitle: (exams.subtitle as string) ?? '',
    exams_band_text: (exams.band_text as string) ?? '',
    resources_badge: (resources.badge as string) ?? '',
    resources_heading: (resources.heading as string) ?? '',
    resources_subtitle: (resources.subtitle as string) ?? '',
    courses_badge: (courses.badge as string) ?? '',
    courses_heading: (courses.heading as string) ?? '',
    courses_subtitle: (courses.subtitle as string) ?? '',
    contact_badge: (contactSec.badge as string) ?? '',
    contact_heading: (contactSec.heading as string) ?? '',
    contact_direct_heading: (contact.direct_heading as string) ?? '',
    contact_direct_description: (contact.direct_description as string) ?? '',
    contact_location_note: (contact.location_note as string) ?? '',
    resources_page_title: (resourcesPage.page_title as string) ?? '',
    resources_page_subtitle: (resourcesPage.page_subtitle as string) ?? '',
    courses_page_title: (coursesPage.page_title as string) ?? '',
    courses_page_subtitle: (coursesPage.page_subtitle as string) ?? '',
    tutoring_page_title: (tutoringPage.page_title as string) ?? '',
    tutoring_page_subtitle: (tutoringPage.page_subtitle as string) ?? '',
  };
}

export async function getSchools(): Promise<School[]> {
  const items = sortByOrder(await fetchCollection('schools'));
  if (items.length === 0) return getFallbackSchools();

  return items.map((item) => ({
    id: item.id,
    name: item.title, // SonicJs title = school name
    type: (item.data.type as string) ?? '',
    qualifications: parseJsonField(item.data.qualifications) ?? [],
    subjects: parseJsonField(item.data.subjects) ?? [],
  }));
}

export async function getExamDestinations(): Promise<ExamDestination[]> {
  const items = sortByOrder(await fetchCollection('exam_destinations'));
  if (items.length === 0) return getFallbackExamDestinations();

  return items.map((item) => ({
    id: item.id,
    destination: item.title, // SonicJs title = destination name
    flag: (item.data.flag as string) ?? '',
    exam_name: (item.data.exam_name as string) ?? '',
    tag_label: (item.data.tag_label as string) ?? '',
    tag_color: (item.data.tag_color as ExamDestination['tag_color']) ?? 'green',
    description: (item.data.description as string) ?? '',
    subjects: parseJsonField<string[]>(item.data.subjects) ?? [],
  }));
}

export async function getMedicalBlock(): Promise<MedicalBlockData> {
  const items = await fetchCollection('medical_block', { limit: 1 });
  if (items.length === 0 || !items[0]) return getFallbackMedicalBlock();

  return {
    title: items[0].title, // SonicJs native title
    description: (items[0].data.description as string) ?? '',
    subjects: parseJsonField<string[]>(items[0].data.subjects) ?? [],
  };
}

export async function getTutoringTiers(): Promise<TutoringTier[]> {
  const items = sortByOrder(await fetchCollection('tutoring_tiers'));
  if (items.length === 0) return getFallbackTutoringTiers();

  return items.map((item) => ({
    id: item.id,
    name: item.title, // SonicJs title = tier name
    emoji: (item.data.emoji as string) ?? '',
    size_label: (item.data.size_label as string) || null,
    description: (item.data.description as string) ?? '',
    benefits: parseJsonField<string[]>(item.data.benefits) ?? [],
    best_for: (item.data.best_for as string) ?? '',
    price: (item.data.price as string) ?? '',
    price_unit: (item.data.price_unit as string) ?? '',
    accent_color: (item.data.accent_color as string) ?? '',
    cta_text: (item.data.cta_text as string) ?? '',
    cta_url: (item.data.cta_url as string) ?? '',
  }));
}

export async function getTutoringSteps(page: 'tutoring' | 'courses'): Promise<TutoringStep[]> {
  // Fetch all steps, filter client-side (SonicJs can't filter on JSON data fields)
  const items = sortByOrder(await fetchCollection('tutoring_steps'));
  const filtered = items.filter((item) => item.data.page === page);
  if (filtered.length === 0) return getFallbackTutoringSteps(page);

  return filtered.map((item) => ({
    id: item.id,
    emoji: (item.data.emoji as string) ?? '',
    title: item.title, // SonicJs native title
    description: (item.data.description as string) ?? '',
    page: item.data.page as TutoringStep['page'],
  }));
}

export async function getTutoringSubjects(): Promise<TutoringSubject[]> {
  const items = sortByOrder(await fetchCollection('tutoring_subjects'));
  if (items.length === 0) return getFallbackTutoringSubjects();

  return items.map((item) => ({
    id: item.id,
    name: item.title, // SonicJs title = subject name
    accent_color: (item.data.accent_color as string) ?? '',
    levels: parseJsonField<string[]>(item.data.levels) ?? [],
  }));
}

// ─── Fallback data ────────────────────────────────────────────────────────────

function getFallbackSiteContent(): SiteContent {
  return {
    hero_badge: 'Private tutoring · Larnaca, Cyprus',
    hero_heading: 'Science & Maths.',
    hero_heading_highlight: 'Every level.',
    hero_subheading:
      'One-on-one after-school lessons for students at <strong class="text-[var(--th-black)]">American Academy</strong>, <strong class="text-[var(--th-black)]">Pascal</strong>, <strong class="text-[var(--th-black)]">MedHigh</strong>, and Cypriot public schools. From IGCSE to university entrance — including <strong class="text-[var(--th-black)]">medical school admissions</strong>.',
    hero_cta_primary_text: 'Send a message',
    hero_cta_primary_href: '#contact',
    hero_whatsapp_url: 'https://wa.me/35799000000',
    hero_viber_url: 'viber://chat?number=%2B35799000000',
    ticker_items: [
      'BIOLOGY', 'CHEMISTRY', 'PHYSICS', 'MATHEMATICS',
      'IGCSE', 'A-LEVEL', 'IB DIPLOMA', 'ΠΑΓΚΥΠΡΙΕΣ',
      'UCAT', 'SAT', 'MEDICAL SCHOOL', 'LARNACA, CYPRUS',
    ],
    schools_badge: 'Curriculum Coverage',
    schools_heading: 'Your school. <mark>Your subjects.</mark>',
    schools_subtitle: 'Lessons tailored to the specific curriculum, exam board, and syllabus at each school.',
    exams_badge: 'Higher Education',
    exams_heading: 'University exams &<br /><mark>medical school.</mark>',
    exams_subtitle: 'Preparation for entrance exams and admissions to universities in the UK, US, Netherlands, Germany, and Cyprus.',
    exams_band_text: 'University Entrance Exam Preparation',
    resources_badge: 'Free Resources',
    resources_heading: 'STUDY <mark>MATERIALS.</mark>',
    resources_subtitle: 'Free revision notes, past papers, and topic summaries. Download and study at your own pace.',
    courses_badge: 'Online Courses',
    courses_heading: 'REVISION <mark>COURSES.</mark>',
    courses_subtitle: 'Live group revision sessions on Zoom. Small classes, exam-focused, with expert guidance.',
    contact_badge: 'Contact',
    contact_heading: 'Get in touch<mark>.</mark>',
    contact_direct_heading: 'Send a message directly',
    contact_direct_description:
      'The quickest way to reach Theodora. Tell her your school, subject, and level and she will get back to you directly.',
    contact_location_note: 'In-person lessons · address shared on contact',
    resources_page_title: 'FREE STUDY <mark>RESOURCES.</mark>',
    resources_page_subtitle:
      'Revision notes, past papers, formula sheets, and topic summaries organised by subject and exam board. All free — download and study.',
    courses_page_title: 'ONLINE REVISION <mark>COURSES.</mark>',
    courses_page_subtitle:
      'Live group revision sessions via Zoom. Small classes, exam-focused, with personalised feedback. Book your place through Zoom Events.',
    tutoring_page_title: 'ONLINE <mark>TUTORING.</mark>',
    tutoring_page_subtitle:
      'Private and small group science & maths lessons via Zoom. Same expert tuition, from anywhere in Cyprus or abroad.',
  };
}

function getFallbackSchools(): School[] {
  return [
    {
      name: 'American Academy Larnaca',
      type: 'Private English School',
      qualifications: [
        { label: 'GCSE / IGCSE', color: 'yellow' },
        { label: 'A-Level / AS', color: 'green' },
        { label: 'School curriculum', color: 'default' },
      ],
      subjects: [
        { name: 'Biology', accentColor: 'green', topics: 'IGCSE Double & Triple Science · AS & A2 Biology · Cell biology, genetics, human physiology, ecology' },
        { name: 'Chemistry', accentColor: 'green', topics: 'IGCSE Double & Triple Science · AS & A2 Chemistry · Atomic structure, organic chemistry, quantitative analysis' },
        { name: 'Physics', accentColor: 'blue', topics: 'IGCSE Double & Triple Science · AS & A2 Physics · Forces, electricity, waves, nuclear physics' },
        { name: 'Mathematics', accentColor: 'orange', topics: 'Compulsory Years 1–5 · A-Level Maths optional · Algebra, calculus, statistics, pure & applied' },
      ],
    },
    {
      name: 'Pascal Private School Larnaka',
      type: 'Private English School · IB World School',
      qualifications: [
        { label: 'IGCSE', color: 'yellow' },
        { label: 'A-Level / IAL', color: 'green' },
        { label: 'IB Diploma', color: 'blue' },
        { label: 'Apolytirion', color: 'default' },
      ],
      subjects: [
        { name: 'Biology', accentColor: 'green', topics: 'IGCSE · GCE A-Level / IAL · IB SL & HL · Molecular biology, evolution, plant science' },
        { name: 'Chemistry', accentColor: 'green', topics: 'IGCSE · GCE A-Level / IAL · IB SL & HL · Physical, inorganic & organic chemistry' },
        { name: 'Physics', accentColor: 'blue', topics: 'IGCSE · GCE A-Level / IAL · IB SL & HL · Mechanics, fields, thermal physics' },
        { name: 'Mathematics', accentColor: 'orange', topics: '3 difficulty levels · A-Level Maths · IB Maths AA & AI SL/HL · Further Maths available' },
      ],
    },
    {
      name: 'MedHigh Private English School',
      type: 'Private English School',
      qualifications: [
        { label: 'GCSE / IGCSE', color: 'yellow' },
        { label: 'A-Level', color: 'green' },
        { label: 'SAT', color: 'orange' },
        { label: 'Apolytirion', color: 'default' },
      ],
      subjects: [
        { name: 'Biology', accentColor: 'green', topics: 'IGCSE · A-Level Biology · Edexcel & Cambridge boards' },
        { name: 'Chemistry', accentColor: 'green', topics: 'IGCSE · A-Level Chemistry · Edexcel & Cambridge boards · Practical focus' },
        { name: 'Physics', accentColor: 'blue', topics: 'IGCSE · A-Level Physics · Edexcel & Cambridge boards' },
        { name: 'Mathematics', accentColor: 'orange', topics: 'IGCSE · A-Level Maths · SAT Maths preparation · Edexcel board' },
      ],
    },
    {
      name: 'Cyprus Public Schools — Lyceum',
      type: 'Γενικό Λύκειο · Gymnasium',
      qualifications: [
        { label: 'Παγκύπριες Εξετάσεις', color: 'purple' },
        { label: 'Apolytirion', color: 'default' },
        { label: 'Greek Curriculum', color: 'default' },
      ],
      subjects: [
        { name: 'Biology (Βιολογία)', accentColor: 'green', topics: 'Γυμνάσιο & Λύκειο curriculum · Pancyprian exam preparation · Sciences & Health Sciences direction' },
        { name: 'Chemistry (Χημεία)', accentColor: 'green', topics: 'Γυμνάσιο & Λύκειο curriculum · Pancyprian exam preparation · Sciences direction' },
        { name: 'Physics (Φυσική)', accentColor: 'blue', topics: 'Γυμνάσιο & Λύκειο curriculum · Pancyprian exam preparation · Sciences direction' },
        { name: 'Mathematics (Μαθηματικά)', accentColor: 'orange', topics: 'Γυμνάσιο & Λύκειο curriculum · Pancyprian Maths · Economic & Computer Studies direction' },
      ],
    },
  ];
}

function getFallbackExamDestinations(): ExamDestination[] {
  return [
    { destination: 'United Kingdom', flag: '🇬🇧', exam_name: 'UCAT', tag_label: 'Medicine & Dentistry', tag_color: 'green', description: 'UCAT is required by all 36 UK medical and dental schools. Tests verbal reasoning, decision-making, quantitative reasoning, and situational judgement. The BMAT was discontinued in 2024 — UCAT is now the sole UK undergraduate medical admissions test.', subjects: ['Quantitative Reasoning', 'Decision Making', 'Verbal Reasoning', 'Situational Judgement'] },
    { destination: 'United States', flag: '🇺🇸', exam_name: 'SAT / AP', tag_label: 'All programmes', tag_color: 'yellow', description: 'SAT preparation with focus on the Math section. AP subject preparation in Biology, Chemistry, Physics, and Calculus for students targeting US university entry from Cyprus.', subjects: ['SAT Math', 'AP Biology', 'AP Chemistry', 'AP Physics', 'AP Calculus'] },
    { destination: 'Netherlands & Germany', flag: '🇳🇱 🇩🇪', exam_name: 'Science Foundations', tag_label: 'Medicine & Sciences', tag_color: 'blue', description: 'Dutch and German universities require strong A-Level or IB science and maths results. Preparation focused on subject-level depth for medicine, biomedical sciences, pharmacy, and engineering programmes.', subjects: ['A-Level Biology', 'A-Level Chemistry', 'A-Level Maths', 'IB HL Sciences'] },
  ];
}

function getFallbackMedicalBlock(): MedicalBlockData {
  return {
    title: 'Medical School Applications',
    description: 'For students targeting Medicine, Dentistry, Pharmacy, Veterinary Science, or Biomedical Sciences at UK, Dutch, German, or Cypriot universities. A-Level Biology and Chemistry are compulsory entry requirements for virtually every medical programme. Subject-level tuition ensures the scientific depth these programmes demand.',
    subjects: ['A-Level Biology (required)', 'A-Level Chemistry (required)', 'UCAT prep', 'IB HL Biology', 'IB HL Chemistry', 'Biochemistry foundations', 'Human physiology', 'Pancyprian Sciences (Επιστήμες Υγείας direction)'],
  };
}

function getFallbackTutoringTiers(): TutoringTier[] {
  return [
    { name: 'Private 1-on-1', emoji: '👤', size_label: null, description: "Fully personalised sessions tailored to the student's syllabus, pace, and goals. One-on-one attention means faster progress and targeted exam preparation.", benefits: ['Personalised lesson plans', 'Flexible scheduling', 'Exam-focused revision', 'Progress tracking & feedback'], best_for: 'Students needing targeted help on specific topics, intensive exam preparation, or catching up on missed content.', price: '€30', price_unit: '/hour', accent_color: 'var(--th-yellow)', cta_text: 'Book a Private Session', cta_url: 'https://wa.me/35799000000?text=Hi%20Theodora%2C%20I%27d%20like%20to%20book%20a%20private%20tutoring%20session.' },
    { name: 'Small Group', emoji: '👥', size_label: '(2–4 students)', description: 'Collaborative sessions with 2–4 students at the same level. Interactive problem-solving with the benefit of peer learning at a shared cost.', benefits: ['Same subject & level grouping', 'Interactive problem-solving', 'Shared cost — more affordable', 'Peer learning & discussion'], best_for: 'Friends studying together, students who learn well in groups, or those looking for a more affordable tutoring option.', price: '€15', price_unit: '/student/hour', accent_color: 'var(--th-blue)', cta_text: 'Book a Group Session', cta_url: 'https://wa.me/35799000000?text=Hi%20Theodora%2C%20I%27d%20like%20to%20book%20a%20small%20group%20tutoring%20session.' },
  ];
}

function getFallbackTutoringSteps(page: 'tutoring' | 'courses'): TutoringStep[] {
  if (page === 'tutoring') {
    return [
      { emoji: '1', title: 'Get in Touch', description: "Message via WhatsApp or Viber with your school, subject, and level. We'll find the right session for you.", page: 'tutoring' },
      { emoji: '2', title: 'Connect on Zoom', description: 'Join your session via Zoom Business from anywhere. Screen sharing, whiteboard, and interactive tools included.', page: 'tutoring' },
      { emoji: '3', title: 'Learn & Improve', description: 'Work through topics at your pace with expert guidance. Track progress and build confidence for exams.', page: 'tutoring' },
    ];
  }
  return [
    { emoji: '📹', title: 'Live on Zoom', description: 'Interactive sessions with screen sharing, Q&A, and real-time problem solving.', page: 'courses' },
    { emoji: '👥', title: 'Small Groups', description: '8–12 students per session for personalised attention and questions.', page: 'courses' },
    { emoji: '💳', title: 'Easy Booking', description: 'Register and pay securely through Zoom Events. Instant confirmation.', page: 'courses' },
  ];
}

function getFallbackTutoringSubjects(): TutoringSubject[] {
  return [
    { name: 'Biology', accent_color: 'var(--th-green)', levels: ['IGCSE', 'A-Level', 'IB SL/HL', 'Pancyprian'] },
    { name: 'Chemistry', accent_color: 'var(--th-green)', levels: ['IGCSE', 'A-Level', 'IB SL/HL', 'Pancyprian'] },
    { name: 'Physics', accent_color: 'var(--th-blue)', levels: ['IGCSE', 'A-Level', 'IB SL/HL', 'Pancyprian'] },
    { name: 'Mathematics', accent_color: 'var(--th-orange)', levels: ['IGCSE', 'A-Level', 'IB AA/AI', 'SAT', 'Pancyprian'] },
  ];
}

function getFallbackResources(): Resource[] {
  return [
    { id: '1', title: 'IGCSE Biology — Cell Structure & Organisation', subject: 'Biology', exam_board: 'IGCSE', resource_type: 'Revision Notes', description: 'Complete revision notes covering cell structure, organelles, and levels of organisation for IGCSE Biology.', drive_url: '#', sort: 1 },
    { id: '2', title: 'A-Level Chemistry — Organic Chemistry Summary', subject: 'Chemistry', exam_board: 'A-Level', resource_type: 'Topic Summary', description: 'Concise summary of all organic chemistry reactions, mechanisms, and functional groups for A-Level.', drive_url: '#', sort: 2 },
    { id: '3', title: 'IGCSE Physics — Forces & Motion Formula Sheet', subject: 'Physics', exam_board: 'IGCSE', resource_type: 'Formula Sheet', description: 'All formulae for forces, motion, energy, and waves in one printable sheet.', drive_url: '#', sort: 3 },
    { id: '4', title: 'A-Level Maths — Pure Mathematics Revision Notes', subject: 'Mathematics', exam_board: 'A-Level', resource_type: 'Revision Notes', description: 'Comprehensive notes on algebra, calculus, trigonometry, and proof for A-Level Pure Maths.', drive_url: '#', sort: 4 },
    { id: '5', title: 'IB Biology HL — Genetics & Evolution', subject: 'Biology', exam_board: 'IB', resource_type: 'Revision Notes', description: 'Detailed notes for IB Higher Level Biology covering Topics 3, 4, and 10.', drive_url: '#', sort: 5 },
    { id: '6', title: 'Pancyprian Exam — Βιολογία Checklist', subject: 'Biology', exam_board: 'Pancyprian', resource_type: 'Checklist', description: 'Topic checklist for Pancyprian Biology exam preparation (Sciences direction).', drive_url: '#', sort: 6 },
  ];
}

function getFallbackCourses(): Course[] {
  return [
    { id: '1', title: 'A-Level Biology Intensive Revision', subject: 'Biology', level: 'A-Level', description: 'Intensive 8-week revision course covering all A-Level Biology topics. Focus on exam technique, past paper practice, and high-yield topics.', syllabus: ['Cell biology & microscopy', 'Genetics & inheritance', 'Ecology & ecosystems', 'Human physiology', 'Exam technique & past papers'], schedule: 'Every Saturday, 10:00 — 12:00', start_date: '2026-09-06', duration: '8 weeks', price: '€160', zoom_url: '#', course_status: 'upcoming', max_students: 12, sort: 1 },
    { id: '2', title: 'IGCSE Chemistry Crash Course', subject: 'Chemistry', level: 'IGCSE', description: 'Fast-paced revision for IGCSE Chemistry. Covers the entire syllabus with focus on common exam questions and practical skills.', syllabus: ['Atomic structure & bonding', 'Stoichiometry', 'Organic chemistry', 'Energetics & rates', 'Practical exam preparation'], schedule: 'Tuesdays & Thursdays, 17:00 — 18:30', start_date: '2026-09-09', duration: '6 weeks', price: '€120', zoom_url: '#', course_status: 'upcoming', max_students: 10, sort: 2 },
    { id: '3', title: 'UCAT Preparation Bootcamp', subject: 'Mathematics', level: 'UCAT', description: 'Comprehensive UCAT preparation covering all four subtests. Timed practice, strategy sessions, and score tracking.', syllabus: ['Verbal Reasoning strategies', 'Decision Making techniques', 'Quantitative Reasoning drills', 'Situational Judgement', 'Full mock tests'], schedule: 'Weekends, 09:00 — 13:00', start_date: '2026-06-01', duration: '4 weekends', price: '€200', zoom_url: '#', course_status: 'upcoming', max_students: 8, sort: 3 },
  ];
}
