import type {
  CmsItem, SiteSettingsData, HeroData, SectionHeadingData, PageContentData,
  ContactContentData, ResourceData, CourseData, SchoolData, ExamDestinationData,
  MedicalBlockData, TutoringTierData, TutoringStepData, TutoringSubjectData, PageData,
} from './types';

export type * from './types';

// ─── SonicJs client ───────────────────────────────────────────────────────────

interface SonicJsResponse<T> {
  data: CmsItem<T>[];
  meta?: Record<string, unknown>;
}

async function fetchCollection<T>(collection: string, options?: { limit?: number }): Promise<CmsItem<T>[]> {
  const cmsUrl = import.meta.env.SONICJS_URL;
  if (!cmsUrl) return [];

  try {
    const params = new URLSearchParams({ status: 'published' });
    if (options?.limit) params.set('limit', String(options.limit));

    const res = await fetch(`${cmsUrl}/api/collections/${collection}/content?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return [];

    const json = (await res.json()) as SonicJsResponse<T>;
    return json.data ?? [];
  } catch {
    return [];
  }
}

function parseJson<T>(value: unknown): T {
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return value as unknown as T; }
  }
  return value as T;
}

function sortByField<T extends { sort?: number }>(items: CmsItem<T>[]): CmsItem<T>[] {
  return [...items].sort((a, b) => ((a.data as any).sort ?? 999) - ((b.data as any).sort ?? 999));
}

// ─── Site Settings ────────────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<CmsItem<SiteSettingsData> | null> {
  const items = await fetchCollection<SiteSettingsData>('site_settings', { limit: 1 });
  if (items[0]) {
    items[0].data.nav_items = parseJson(items[0].data.nav_items);
    return items[0];
  }
  return FALLBACK_SETTINGS;
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export async function getHero(): Promise<CmsItem<HeroData> | null> {
  const items = await fetchCollection<HeroData>('hero_content', { limit: 1 });
  if (items[0]) {
    items[0].data.ticker_items = parseJson(items[0].data.ticker_items);
    return items[0];
  }
  return FALLBACK_HERO;
}

// ─── Section Headings ─────────────────────────────────────────────────────────

export async function getSectionHeading(section: string): Promise<CmsItem<SectionHeadingData> | null> {
  const items = await fetchCollection<SectionHeadingData>('section_headings');
  return items.find(i => i.data.section === section || i.slug === section) ?? null;
}

export async function getAllSectionHeadings(): Promise<CmsItem<SectionHeadingData>[]> {
  return sortByField(await fetchCollection<SectionHeadingData>('section_headings'));
}

// ─── Page Content (inner page hero text) ──────────────────────────────────────

export async function getPageContent(page: string): Promise<CmsItem<PageContentData> | null> {
  const items = await fetchCollection<PageContentData>('page_content');
  return items.find(i => i.data.page === page || i.slug === `${page}-page`) ?? null;
}

// ─── Contact Content ──────────────────────────────────────────────────────────

export async function getContactContent(): Promise<CmsItem<ContactContentData> | null> {
  const items = await fetchCollection<ContactContentData>('contact_content', { limit: 1 });
  return items[0] ?? FALLBACK_CONTACT;
}

// ─── Resources ────────────────────────────────────────────────────────────────

export async function getResources(options?: { limit?: number }): Promise<CmsItem<ResourceData>[]> {
  const items = sortByField(await fetchCollection<ResourceData>('resources', options));
  return items.length > 0 ? items : FALLBACK_RESOURCES;
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export async function getCourses(options?: { limit?: number }): Promise<CmsItem<CourseData>[]> {
  const items = sortByField(await fetchCollection<CourseData>('courses', options));
  items.forEach(i => { i.data.syllabus = parseJson(i.data.syllabus); });
  return items.length > 0 ? items : FALLBACK_COURSES;
}

// ─── Schools ──────────────────────────────────────────────────────────────────

export async function getSchools(): Promise<CmsItem<SchoolData>[]> {
  const items = sortByField(await fetchCollection<SchoolData>('schools'));
  items.forEach(i => {
    i.data.qualifications = parseJson(i.data.qualifications);
    i.data.subjects = parseJson(i.data.subjects);
  });
  return items.length > 0 ? items : FALLBACK_SCHOOLS;
}

// ─── Exam Destinations ────────────────────────────────────────────────────────

export async function getExamDestinations(): Promise<CmsItem<ExamDestinationData>[]> {
  const items = sortByField(await fetchCollection<ExamDestinationData>('exam_destinations'));
  items.forEach(i => { i.data.subjects = parseJson(i.data.subjects); });
  return items.length > 0 ? items : FALLBACK_EXAMS;
}

// ─── Medical Block ────────────────────────────────────────────────────────────

export async function getMedicalBlock(): Promise<CmsItem<MedicalBlockData> | null> {
  const items = await fetchCollection<MedicalBlockData>('medical_block', { limit: 1 });
  if (items[0]) {
    items[0].data.subjects = parseJson(items[0].data.subjects);
    return items[0];
  }
  return FALLBACK_MEDICAL;
}

// ─── Tutoring Tiers ───────────────────────────────────────────────────────────

export async function getTutoringTiers(): Promise<CmsItem<TutoringTierData>[]> {
  const items = sortByField(await fetchCollection<TutoringTierData>('tutoring_tiers'));
  items.forEach(i => { i.data.benefits = parseJson(i.data.benefits); });
  return items.length > 0 ? items : FALLBACK_TIERS;
}

// ─── Tutoring Steps ───────────────────────────────────────────────────────────

export async function getTutoringSteps(page: 'tutoring' | 'courses'): Promise<CmsItem<TutoringStepData>[]> {
  const items = sortByField(await fetchCollection<TutoringStepData>('tutoring_steps'));
  const filtered = items.filter(i => i.data.page === page);
  return filtered.length > 0 ? filtered : FALLBACK_STEPS.filter(s => s.data.page === page);
}

// ─── Tutoring Subjects ────────────────────────────────────────────────────────

export async function getTutoringSubjects(): Promise<CmsItem<TutoringSubjectData>[]> {
  const items = sortByField(await fetchCollection<TutoringSubjectData>('tutoring_subjects'));
  items.forEach(i => { i.data.levels = parseJson(i.data.levels); });
  return items.length > 0 ? items : FALLBACK_SUBJECTS;
}

// ─── Pages ────────────────────────────────────────────────────────────────────

export async function getPages(): Promise<CmsItem<PageData>[]> {
  const items = await fetchCollection<PageData>('pages');
  items.forEach(i => { i.data.body = parseJson(i.data.body); });
  return items;
}

export async function getPageBySlug(slug: string): Promise<CmsItem<PageData> | null> {
  const pages = await getPages();
  return pages.find(p => p.slug === slug) ?? null;
}

// ─── Fallback data ────────────────────────────────────────────────────────────

const fb = <T>(id: string, title: string, slug: string, data: T): CmsItem<T> => ({
  id, title, slug, status: 'published', data, created_at: 0, updated_at: 0,
});

const FALLBACK_SETTINGS = fb<SiteSettingsData>('fb-settings', 'Theorium', 'site-settings', {
  tagline: 'Private Science & Maths Tutoring', url: 'https://theorium.infront.cy', locale: 'en-GB',
  contact_email: 'theodora@theorium.cy', contact_phone: '+357 99 000 000', contact_city: 'Larnaca', contact_country: 'Cyprus',
  nav_items: [{ label: 'Tutoring', href: '/tutoring' }, { label: 'Resources', href: '/resources' }, { label: 'Courses', href: '/courses' }],
  nav_cta_label: 'Get in touch', nav_cta_href: '/#contact',
  footer_text: '© 2025 THEORIUM · PRIVATE SCIENCE & MATHS TUITION · LARNACA, CYPRUS',
  meta_default_title: 'Theorium | Private Science & Maths Tuition in Larnaca, Cyprus',
  meta_title_template: '%s | Theorium', meta_default_description: 'One-on-one science and maths lessons for IGCSE, A-Level, IB, and Pancyprian students in Larnaca.',
  meta_og_image: '/og-default.svg', structured_data_type: 'LocalBusiness',
});

const FALLBACK_HERO = fb<HeroData>('fb-hero', 'Homepage Hero', 'homepage-hero', {
  badge: 'Private tutoring · Larnaca, Cyprus', heading: 'Science & Maths.', heading_highlight: 'Every level.',
  subheading: 'One-on-one after-school lessons for students at <strong class="text-[var(--th-black)]">American Academy</strong>, <strong class="text-[var(--th-black)]">Pascal</strong>, <strong class="text-[var(--th-black)]">MedHigh</strong>, and Cypriot public schools. From IGCSE to university entrance — including <strong class="text-[var(--th-black)]">medical school admissions</strong>.',
  cta_text: 'Send a message', cta_href: '#contact', whatsapp_url: 'https://wa.me/35799000000', viber_url: 'viber://chat?number=%2B35799000000',
  ticker_items: ['BIOLOGY', 'CHEMISTRY', 'PHYSICS', 'MATHEMATICS', 'IGCSE', 'A-LEVEL', 'IB DIPLOMA', 'ΠΑΓΚΥΠΡΙΕΣ', 'UCAT', 'SAT', 'MEDICAL SCHOOL', 'LARNACA, CYPRUS'],
});

const FALLBACK_CONTACT = fb<ContactContentData>('fb-contact', 'Contact', 'contact', {
  direct_heading: 'Send a message directly',
  direct_description: 'The quickest way to reach Theodora. Tell her your school, subject, and level and she will get back to you directly.',
  location_note: 'In-person lessons · address shared on contact',
});

const FALLBACK_MEDICAL = fb<MedicalBlockData>('fb-medical', 'Medical School Applications', 'medical-block', {
  description: 'For students targeting Medicine, Dentistry, Pharmacy, Veterinary Science, or Biomedical Sciences at UK, Dutch, German, or Cypriot universities.',
  subjects: ['A-Level Biology (required)', 'A-Level Chemistry (required)', 'UCAT prep', 'IB HL Biology', 'IB HL Chemistry', 'Biochemistry foundations', 'Human physiology', 'Pancyprian Sciences (Επιστήμες Υγείας direction)'],
});

const FALLBACK_RESOURCES: CmsItem<ResourceData>[] = [
  fb('fb-r1', 'IGCSE Biology — Cell Structure & Organisation', 'igcse-bio', { subject: 'Biology', exam_board: 'IGCSE', resource_type: 'Revision Notes', description: 'Complete revision notes covering cell structure, organelles, and levels of organisation.', drive_url: '#', sort: 1 }),
  fb('fb-r2', 'A-Level Chemistry — Organic Chemistry Summary', 'alevel-chem', { subject: 'Chemistry', exam_board: 'A-Level', resource_type: 'Topic Summary', description: 'Concise summary of all organic chemistry reactions and mechanisms.', drive_url: '#', sort: 2 }),
  fb('fb-r3', 'IGCSE Physics — Forces & Motion Formula Sheet', 'igcse-phys', { subject: 'Physics', exam_board: 'IGCSE', resource_type: 'Formula Sheet', description: 'All formulae for forces, motion, energy, and waves.', drive_url: '#', sort: 3 }),
  fb('fb-r4', 'A-Level Maths — Pure Mathematics Revision Notes', 'alevel-maths', { subject: 'Mathematics', exam_board: 'A-Level', resource_type: 'Revision Notes', description: 'Comprehensive notes on algebra, calculus, trigonometry, and proof.', drive_url: '#', sort: 4 }),
  fb('fb-r5', 'IB Biology HL — Genetics & Evolution', 'ib-bio', { subject: 'Biology', exam_board: 'IB', resource_type: 'Revision Notes', description: 'Detailed notes for IB Higher Level Biology.', drive_url: '#', sort: 5 }),
  fb('fb-r6', 'Pancyprian Exam — Βιολογία Checklist', 'pancyprian-bio', { subject: 'Biology', exam_board: 'Pancyprian', resource_type: 'Checklist', description: 'Topic checklist for Pancyprian Biology exam preparation.', drive_url: '#', sort: 6 }),
];

const FALLBACK_COURSES: CmsItem<CourseData>[] = [
  fb('fb-c1', 'A-Level Biology Intensive Revision', 'alevel-bio', { subject: 'Biology', level: 'A-Level', description: 'Intensive 8-week revision course.', syllabus: ['Cell biology', 'Genetics', 'Ecology', 'Physiology', 'Exam technique'], schedule: 'Every Saturday, 10:00–12:00', start_date: '2026-09-06', duration: '8 weeks', price: '€160', zoom_url: '#', course_status: 'upcoming', max_students: 12, sort: 1 }),
  fb('fb-c2', 'IGCSE Chemistry Crash Course', 'igcse-chem', { subject: 'Chemistry', level: 'IGCSE', description: 'Fast-paced revision for IGCSE Chemistry.', syllabus: ['Atomic structure', 'Stoichiometry', 'Organic chemistry', 'Energetics', 'Practical'], schedule: 'Tue & Thu, 17:00–18:30', start_date: '2026-09-09', duration: '6 weeks', price: '€120', zoom_url: '#', course_status: 'upcoming', max_students: 10, sort: 2 }),
  fb('fb-c3', 'UCAT Preparation Bootcamp', 'ucat-prep', { subject: 'Mathematics', level: 'UCAT', description: 'Comprehensive UCAT preparation.', syllabus: ['Verbal Reasoning', 'Decision Making', 'Quantitative Reasoning', 'Situational Judgement', 'Mock tests'], schedule: 'Weekends, 09:00–13:00', start_date: '2026-06-01', duration: '4 weekends', price: '€200', zoom_url: '#', course_status: 'upcoming', max_students: 8, sort: 3 }),
];

const FALLBACK_SCHOOLS: CmsItem<SchoolData>[] = [
  fb('fb-s1', 'American Academy Larnaca', 'american-academy', { type: 'Private English School', qualifications: [{ label: 'GCSE / IGCSE', color: 'yellow' }, { label: 'A-Level / AS', color: 'green' }, { label: 'School curriculum', color: 'default' }], subjects: [{ name: 'Biology', accentColor: 'green', topics: 'IGCSE · AS & A2 Biology' }, { name: 'Chemistry', accentColor: 'green', topics: 'IGCSE · AS & A2 Chemistry' }, { name: 'Physics', accentColor: 'blue', topics: 'IGCSE · AS & A2 Physics' }, { name: 'Mathematics', accentColor: 'orange', topics: 'Compulsory · A-Level optional' }], sort: 1 }),
  fb('fb-s2', 'Pascal Private School Larnaka', 'pascal', { type: 'Private English School · IB World School', qualifications: [{ label: 'IGCSE', color: 'yellow' }, { label: 'A-Level / IAL', color: 'green' }, { label: 'IB Diploma', color: 'blue' }, { label: 'Apolytirion', color: 'default' }], subjects: [{ name: 'Biology', accentColor: 'green', topics: 'IGCSE · A-Level · IB SL & HL' }, { name: 'Chemistry', accentColor: 'green', topics: 'IGCSE · A-Level · IB SL & HL' }, { name: 'Physics', accentColor: 'blue', topics: 'IGCSE · A-Level · IB SL & HL' }, { name: 'Mathematics', accentColor: 'orange', topics: 'A-Level · IB AA & AI SL/HL' }], sort: 2 }),
  fb('fb-s3', 'MedHigh Private English School', 'medhigh', { type: 'Private English School', qualifications: [{ label: 'GCSE / IGCSE', color: 'yellow' }, { label: 'A-Level', color: 'green' }, { label: 'SAT', color: 'orange' }, { label: 'Apolytirion', color: 'default' }], subjects: [{ name: 'Biology', accentColor: 'green', topics: 'IGCSE · A-Level' }, { name: 'Chemistry', accentColor: 'green', topics: 'IGCSE · A-Level' }, { name: 'Physics', accentColor: 'blue', topics: 'IGCSE · A-Level' }, { name: 'Mathematics', accentColor: 'orange', topics: 'IGCSE · A-Level · SAT' }], sort: 3 }),
  fb('fb-s4', 'Cyprus Public Schools — Lyceum', 'cyprus-public', { type: 'Γενικό Λύκειο · Gymnasium', qualifications: [{ label: 'Παγκύπριες Εξετάσεις', color: 'purple' }, { label: 'Apolytirion', color: 'default' }, { label: 'Greek Curriculum', color: 'default' }], subjects: [{ name: 'Biology (Βιολογία)', accentColor: 'green', topics: 'Pancyprian exam preparation' }, { name: 'Chemistry (Χημεία)', accentColor: 'green', topics: 'Pancyprian exam preparation' }, { name: 'Physics (Φυσική)', accentColor: 'blue', topics: 'Pancyprian exam preparation' }, { name: 'Mathematics (Μαθηματικά)', accentColor: 'orange', topics: 'Pancyprian Maths' }], sort: 4 }),
];

const FALLBACK_EXAMS: CmsItem<ExamDestinationData>[] = [
  fb('fb-e1', 'United Kingdom', 'uk', { flag: '🇬🇧', exam_name: 'UCAT', tag_label: 'Medicine & Dentistry', tag_color: 'green', description: 'UCAT is required by all 36 UK medical and dental schools.', subjects: ['Quantitative Reasoning', 'Decision Making', 'Verbal Reasoning', 'Situational Judgement'], sort: 1 }),
  fb('fb-e2', 'United States', 'us', { flag: '🇺🇸', exam_name: 'SAT / AP', tag_label: 'All programmes', tag_color: 'yellow', description: 'SAT preparation with focus on the Math section.', subjects: ['SAT Math', 'AP Biology', 'AP Chemistry', 'AP Physics', 'AP Calculus'], sort: 2 }),
  fb('fb-e3', 'Netherlands & Germany', 'nl-de', { flag: '🇳🇱 🇩🇪', exam_name: 'Science Foundations', tag_label: 'Medicine & Sciences', tag_color: 'blue', description: 'Strong A-Level or IB results required.', subjects: ['A-Level Biology', 'A-Level Chemistry', 'A-Level Maths', 'IB HL Sciences'], sort: 3 }),
];

const FALLBACK_TIERS: CmsItem<TutoringTierData>[] = [
  fb('fb-t1', 'Private 1-on-1', 'private', { emoji: '👤', size_label: null, description: "Fully personalised sessions.", benefits: ['Personalised lesson plans', 'Flexible scheduling', 'Exam-focused revision', 'Progress tracking'], best_for: 'Targeted help, intensive exam prep.', price: '€30', price_unit: '/hour', accent_color: 'var(--th-yellow)', cta_text: 'Book a Private Session', cta_url: 'https://wa.me/35799000000', sort: 1 }),
  fb('fb-t2', 'Small Group', 'group', { emoji: '👥', size_label: '(2–4 students)', description: "Collaborative sessions.", benefits: ['Same level grouping', 'Interactive problem-solving', 'Shared cost', 'Peer learning'], best_for: 'Friends studying together.', price: '€15', price_unit: '/student/hour', accent_color: 'var(--th-blue)', cta_text: 'Book a Group Session', cta_url: 'https://wa.me/35799000000', sort: 2 }),
];

const FALLBACK_STEPS: CmsItem<TutoringStepData>[] = [
  fb('fb-st1', 'Get in Touch', 'tutoring-1', { emoji: '1', description: 'Message via WhatsApp or Viber.', page: 'tutoring', sort: 1 }),
  fb('fb-st2', 'Connect on Zoom', 'tutoring-2', { emoji: '2', description: 'Join via Zoom Business.', page: 'tutoring', sort: 2 }),
  fb('fb-st3', 'Learn & Improve', 'tutoring-3', { emoji: '3', description: 'Work through topics at your pace.', page: 'tutoring', sort: 3 }),
  fb('fb-st4', 'Live on Zoom', 'courses-1', { emoji: '📹', description: 'Interactive sessions with screen sharing.', page: 'courses', sort: 1 }),
  fb('fb-st5', 'Small Groups', 'courses-2', { emoji: '👥', description: '8–12 students per session.', page: 'courses', sort: 2 }),
  fb('fb-st6', 'Easy Booking', 'courses-3', { emoji: '💳', description: 'Register and pay through Zoom Events.', page: 'courses', sort: 3 }),
];

const FALLBACK_SUBJECTS: CmsItem<TutoringSubjectData>[] = [
  fb('fb-su1', 'Biology', 'biology', { accent_color: 'var(--th-green)', levels: ['IGCSE', 'A-Level', 'IB SL/HL', 'Pancyprian'], sort: 1 }),
  fb('fb-su2', 'Chemistry', 'chemistry', { accent_color: 'var(--th-green)', levels: ['IGCSE', 'A-Level', 'IB SL/HL', 'Pancyprian'], sort: 2 }),
  fb('fb-su3', 'Physics', 'physics', { accent_color: 'var(--th-blue)', levels: ['IGCSE', 'A-Level', 'IB SL/HL', 'Pancyprian'], sort: 3 }),
  fb('fb-su4', 'Mathematics', 'mathematics', { accent_color: 'var(--th-orange)', levels: ['IGCSE', 'A-Level', 'IB AA/AI', 'SAT', 'Pancyprian'], sort: 4 }),
];
