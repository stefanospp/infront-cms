/**
 * Seed script for Theorium SonicJs CMS
 *
 * Usage:
 *   1. Start the dev server: npm run dev
 *   2. Run this script:      npm run seed
 *
 * This creates an admin user and populates all 9 collections
 * with the same data that exists as fallbacks in directus.ts.
 */

const API_URL = process.env.SONICJS_URL || 'http://localhost:8787';

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getAdminToken(): Promise<string> {
  // Try to register first (will fail silently if user exists)
  await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@theorium.cy',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: 'admin1234!',
    }),
  }).catch(() => {});

  // Login
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@theorium.cy',
      password: 'admin1234!',
    }),
  });

  if (!res.ok) {
    throw new Error(`Login failed: ${res.statusText}`);
  }

  const data = (await res.json()) as { token: string };
  return data.token;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCollectionId(token: string, collectionName: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/collections`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as { data: Array<{ id: string; name: string }> };
  const col = data.data.find((c) => c.name === collectionName);
  if (!col) throw new Error(`Collection not found: ${collectionName}`);
  return col.id;
}

async function createContent(
  token: string,
  collectionId: string,
  title: string,
  slug: string,
  data: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title,
      slug,
      collectionId,
      status: 'published',
      data,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  Failed to create "${title}": ${err}`);
  }
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

async function seedSiteContent(token: string, colId: string) {
  console.log('Seeding site_content...');
  await createContent(token, colId, 'Site Content', 'site-content', {
    hero_badge: 'Private tutoring · Larnaca, Cyprus',
    hero_heading: 'Science & Maths.',
    hero_heading_highlight: 'Every level.',
    hero_subheading:
      'One-on-one after-school lessons for students at <strong class="text-[var(--th-black)]">American Academy</strong>, <strong class="text-[var(--th-black)]">Pascal</strong>, <strong class="text-[var(--th-black)]">MedHigh</strong>, and Cypriot public schools. From IGCSE to university entrance — including <strong class="text-[var(--th-black)]">medical school admissions</strong>.',
    hero_cta_primary_text: 'Send a message',
    hero_cta_primary_href: '#contact',
    hero_whatsapp_url: 'https://wa.me/35799000000',
    hero_viber_url: 'viber://chat?number=%2B35799000000',
    ticker_items: JSON.stringify([
      'BIOLOGY', 'CHEMISTRY', 'PHYSICS', 'MATHEMATICS',
      'IGCSE', 'A-LEVEL', 'IB DIPLOMA', 'ΠΑΓΚΥΠΡΙΕΣ',
      'UCAT', 'SAT', 'MEDICAL SCHOOL', 'LARNACA, CYPRUS',
    ]),
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
  });
}

async function seedMedicalBlock(token: string, colId: string) {
  console.log('Seeding medical_block...');
  await createContent(token, colId, 'Medical School Applications', 'medical-block', {
    description:
      'For students targeting Medicine, Dentistry, Pharmacy, Veterinary Science, or Biomedical Sciences at UK, Dutch, German, or Cypriot universities. A-Level Biology and Chemistry are compulsory entry requirements for virtually every medical programme. Subject-level tuition ensures the scientific depth these programmes demand.',
    subjects: JSON.stringify([
      'A-Level Biology (required)',
      'A-Level Chemistry (required)',
      'UCAT prep',
      'IB HL Biology',
      'IB HL Chemistry',
      'Biochemistry foundations',
      'Human physiology',
      'Pancyprian Sciences (Επιστήμες Υγείας direction)',
    ]),
  });
}

async function seedResources(token: string, colId: string) {
  console.log('Seeding resources...');
  const resources = [
    { title: 'IGCSE Biology — Cell Structure & Organisation', slug: 'igcse-bio-cell-structure', subject: 'Biology', exam_board: 'IGCSE', resource_type: 'Revision Notes', description: 'Complete revision notes covering cell structure, organelles, and levels of organisation for IGCSE Biology.', drive_url: '#', sort: 1 },
    { title: 'A-Level Chemistry — Organic Chemistry Summary', slug: 'alevel-chem-organic', subject: 'Chemistry', exam_board: 'A-Level', resource_type: 'Topic Summary', description: 'Concise summary of all organic chemistry reactions, mechanisms, and functional groups for A-Level.', drive_url: '#', sort: 2 },
    { title: 'IGCSE Physics — Forces & Motion Formula Sheet', slug: 'igcse-phys-forces-formulas', subject: 'Physics', exam_board: 'IGCSE', resource_type: 'Formula Sheet', description: 'All formulae for forces, motion, energy, and waves in one printable sheet.', drive_url: '#', sort: 3 },
    { title: 'A-Level Maths — Pure Mathematics Revision Notes', slug: 'alevel-maths-pure', subject: 'Mathematics', exam_board: 'A-Level', resource_type: 'Revision Notes', description: 'Comprehensive notes on algebra, calculus, trigonometry, and proof for A-Level Pure Maths.', drive_url: '#', sort: 4 },
    { title: 'IB Biology HL — Genetics & Evolution', slug: 'ib-bio-hl-genetics', subject: 'Biology', exam_board: 'IB', resource_type: 'Revision Notes', description: 'Detailed notes for IB Higher Level Biology covering Topics 3, 4, and 10.', drive_url: '#', sort: 5 },
    { title: 'Pancyprian Exam — Βιολογία Checklist', slug: 'pancyprian-bio-checklist', subject: 'Biology', exam_board: 'Pancyprian', resource_type: 'Checklist', description: 'Topic checklist for Pancyprian Biology exam preparation (Sciences direction).', drive_url: '#', sort: 6 },
  ];

  for (const r of resources) {
    const { title, slug, ...data } = r;
    await createContent(token, colId, title, slug, data);
  }
}

async function seedCourses(token: string, colId: string) {
  console.log('Seeding courses...');
  const courses = [
    { title: 'A-Level Biology Intensive Revision', slug: 'alevel-bio-intensive', subject: 'Biology', level: 'A-Level', description: 'Intensive 8-week revision course covering all A-Level Biology topics. Focus on exam technique, past paper practice, and high-yield topics.', syllabus: JSON.stringify(['Cell biology & microscopy', 'Genetics & inheritance', 'Ecology & ecosystems', 'Human physiology', 'Exam technique & past papers']), schedule: 'Every Saturday, 10:00 — 12:00', start_date: '2026-09-06', duration: '8 weeks', price: '€160', zoom_url: '#', course_status: 'upcoming', max_students: 12, sort: 1 },
    { title: 'IGCSE Chemistry Crash Course', slug: 'igcse-chem-crash', subject: 'Chemistry', level: 'IGCSE', description: 'Fast-paced revision for IGCSE Chemistry. Covers the entire syllabus with focus on common exam questions and practical skills.', syllabus: JSON.stringify(['Atomic structure & bonding', 'Stoichiometry', 'Organic chemistry', 'Energetics & rates', 'Practical exam preparation']), schedule: 'Tuesdays & Thursdays, 17:00 — 18:30', start_date: '2026-09-09', duration: '6 weeks', price: '€120', zoom_url: '#', course_status: 'upcoming', max_students: 10, sort: 2 },
    { title: 'UCAT Preparation Bootcamp', slug: 'ucat-prep-bootcamp', subject: 'Mathematics', level: 'UCAT', description: 'Comprehensive UCAT preparation covering all four subtests. Timed practice, strategy sessions, and score tracking.', syllabus: JSON.stringify(['Verbal Reasoning strategies', 'Decision Making techniques', 'Quantitative Reasoning drills', 'Situational Judgement', 'Full mock tests']), schedule: 'Weekends, 09:00 — 13:00', start_date: '2026-06-01', duration: '4 weekends', price: '€200', zoom_url: '#', course_status: 'upcoming', max_students: 8, sort: 3 },
  ];

  for (const c of courses) {
    const { title, slug, ...data } = c;
    await createContent(token, colId, title, slug, data);
  }
}

async function seedSchools(token: string, colId: string) {
  console.log('Seeding schools...');
  const schools = [
    {
      title: 'American Academy Larnaca', slug: 'american-academy',
      type: 'Private English School',
      qualifications: JSON.stringify([{ label: 'GCSE / IGCSE', color: 'yellow' }, { label: 'A-Level / AS', color: 'green' }, { label: 'School curriculum', color: 'default' }]),
      subjects: JSON.stringify([
        { name: 'Biology', accentColor: 'green', topics: 'IGCSE Double & Triple Science · AS & A2 Biology · Cell biology, genetics, human physiology, ecology' },
        { name: 'Chemistry', accentColor: 'green', topics: 'IGCSE Double & Triple Science · AS & A2 Chemistry · Atomic structure, organic chemistry, quantitative analysis' },
        { name: 'Physics', accentColor: 'blue', topics: 'IGCSE Double & Triple Science · AS & A2 Physics · Forces, electricity, waves, nuclear physics' },
        { name: 'Mathematics', accentColor: 'orange', topics: 'Compulsory Years 1–5 · A-Level Maths optional · Algebra, calculus, statistics, pure & applied' },
      ]),
      sort: 1,
    },
    {
      title: 'Pascal Private School Larnaka', slug: 'pascal-larnaka',
      type: 'Private English School · IB World School',
      qualifications: JSON.stringify([{ label: 'IGCSE', color: 'yellow' }, { label: 'A-Level / IAL', color: 'green' }, { label: 'IB Diploma', color: 'blue' }, { label: 'Apolytirion', color: 'default' }]),
      subjects: JSON.stringify([
        { name: 'Biology', accentColor: 'green', topics: 'IGCSE · GCE A-Level / IAL · IB SL & HL · Molecular biology, evolution, plant science' },
        { name: 'Chemistry', accentColor: 'green', topics: 'IGCSE · GCE A-Level / IAL · IB SL & HL · Physical, inorganic & organic chemistry' },
        { name: 'Physics', accentColor: 'blue', topics: 'IGCSE · GCE A-Level / IAL · IB SL & HL · Mechanics, fields, thermal physics' },
        { name: 'Mathematics', accentColor: 'orange', topics: '3 difficulty levels · A-Level Maths · IB Maths AA & AI SL/HL · Further Maths available' },
      ]),
      sort: 2,
    },
    {
      title: 'MedHigh Private English School', slug: 'medhigh',
      type: 'Private English School',
      qualifications: JSON.stringify([{ label: 'GCSE / IGCSE', color: 'yellow' }, { label: 'A-Level', color: 'green' }, { label: 'SAT', color: 'orange' }, { label: 'Apolytirion', color: 'default' }]),
      subjects: JSON.stringify([
        { name: 'Biology', accentColor: 'green', topics: 'IGCSE · A-Level Biology · Edexcel & Cambridge boards' },
        { name: 'Chemistry', accentColor: 'green', topics: 'IGCSE · A-Level Chemistry · Edexcel & Cambridge boards · Practical focus' },
        { name: 'Physics', accentColor: 'blue', topics: 'IGCSE · A-Level Physics · Edexcel & Cambridge boards' },
        { name: 'Mathematics', accentColor: 'orange', topics: 'IGCSE · A-Level Maths · SAT Maths preparation · Edexcel board' },
      ]),
      sort: 3,
    },
    {
      title: 'Cyprus Public Schools — Lyceum', slug: 'cyprus-public-lyceum',
      type: 'Γενικό Λύκειο · Gymnasium',
      qualifications: JSON.stringify([{ label: 'Παγκύπριες Εξετάσεις', color: 'purple' }, { label: 'Apolytirion', color: 'default' }, { label: 'Greek Curriculum', color: 'default' }]),
      subjects: JSON.stringify([
        { name: 'Biology (Βιολογία)', accentColor: 'green', topics: 'Γυμνάσιο & Λύκειο curriculum · Pancyprian exam preparation · Sciences & Health Sciences direction' },
        { name: 'Chemistry (Χημεία)', accentColor: 'green', topics: 'Γυμνάσιο & Λύκειο curriculum · Pancyprian exam preparation · Sciences direction' },
        { name: 'Physics (Φυσική)', accentColor: 'blue', topics: 'Γυμνάσιο & Λύκειο curriculum · Pancyprian exam preparation · Sciences direction' },
        { name: 'Mathematics (Μαθηματικά)', accentColor: 'orange', topics: 'Γυμνάσιο & Λύκειο curriculum · Pancyprian Maths · Economic & Computer Studies direction' },
      ]),
      sort: 4,
    },
  ];

  for (const s of schools) {
    const { title, slug, ...data } = s;
    await createContent(token, colId, title, slug, data);
  }
}

async function seedExamDestinations(token: string, colId: string) {
  console.log('Seeding exam_destinations...');
  const exams = [
    { title: 'United Kingdom', slug: 'uk', flag: '🇬🇧', exam_name: 'UCAT', tag_label: 'Medicine & Dentistry', tag_color: 'green', description: 'UCAT is required by all 36 UK medical and dental schools. Tests verbal reasoning, decision-making, quantitative reasoning, and situational judgement. The BMAT was discontinued in 2024 — UCAT is now the sole UK undergraduate medical admissions test.', subjects: JSON.stringify(['Quantitative Reasoning', 'Decision Making', 'Verbal Reasoning', 'Situational Judgement']), sort: 1 },
    { title: 'United States', slug: 'us', flag: '🇺🇸', exam_name: 'SAT / AP', tag_label: 'All programmes', tag_color: 'yellow', description: 'SAT preparation with focus on the Math section. AP subject preparation in Biology, Chemistry, Physics, and Calculus for students targeting US university entry from Cyprus.', subjects: JSON.stringify(['SAT Math', 'AP Biology', 'AP Chemistry', 'AP Physics', 'AP Calculus']), sort: 2 },
    { title: 'Netherlands & Germany', slug: 'nl-de', flag: '🇳🇱 🇩🇪', exam_name: 'Science Foundations', tag_label: 'Medicine & Sciences', tag_color: 'blue', description: 'Dutch and German universities require strong A-Level or IB science and maths results. Preparation focused on subject-level depth for medicine, biomedical sciences, pharmacy, and engineering programmes.', subjects: JSON.stringify(['A-Level Biology', 'A-Level Chemistry', 'A-Level Maths', 'IB HL Sciences']), sort: 3 },
  ];

  for (const e of exams) {
    const { title, slug, ...data } = e;
    await createContent(token, colId, title, slug, data);
  }
}

async function seedTutoringTiers(token: string, colId: string) {
  console.log('Seeding tutoring_tiers...');
  const tiers = [
    { title: 'Private 1-on-1', slug: 'private', emoji: '👤', size_label: '', description: "Fully personalised sessions tailored to the student's syllabus, pace, and goals. One-on-one attention means faster progress and targeted exam preparation.", benefits: JSON.stringify(['Personalised lesson plans', 'Flexible scheduling', 'Exam-focused revision', 'Progress tracking & feedback']), best_for: 'Students needing targeted help on specific topics, intensive exam preparation, or catching up on missed content.', price: '€30', price_unit: '/hour', accent_color: 'var(--th-yellow)', cta_text: 'Book a Private Session', cta_url: 'https://wa.me/35799000000?text=Hi%20Theodora%2C%20I%27d%20like%20to%20book%20a%20private%20tutoring%20session.', sort: 1 },
    { title: 'Small Group', slug: 'group', emoji: '👥', size_label: '(2–4 students)', description: 'Collaborative sessions with 2–4 students at the same level. Interactive problem-solving with the benefit of peer learning at a shared cost.', benefits: JSON.stringify(['Same subject & level grouping', 'Interactive problem-solving', 'Shared cost — more affordable', 'Peer learning & discussion']), best_for: 'Friends studying together, students who learn well in groups, or those looking for a more affordable tutoring option.', price: '€15', price_unit: '/student/hour', accent_color: 'var(--th-blue)', cta_text: 'Book a Group Session', cta_url: 'https://wa.me/35799000000?text=Hi%20Theodora%2C%20I%27d%20like%20to%20book%20a%20small%20group%20tutoring%20session.', sort: 2 },
  ];

  for (const t of tiers) {
    const { title, slug, ...data } = t;
    await createContent(token, colId, title, slug, data);
  }
}

async function seedTutoringSteps(token: string, colId: string) {
  console.log('Seeding tutoring_steps...');
  const steps = [
    // Tutoring page steps
    { title: 'Get in Touch', slug: 'tutoring-step-1', emoji: '1', description: "Message via WhatsApp or Viber with your school, subject, and level. We'll find the right session for you.", page: 'tutoring', sort: 1 },
    { title: 'Connect on Zoom', slug: 'tutoring-step-2', emoji: '2', description: 'Join your session via Zoom Business from anywhere. Screen sharing, whiteboard, and interactive tools included.', page: 'tutoring', sort: 2 },
    { title: 'Learn & Improve', slug: 'tutoring-step-3', emoji: '3', description: 'Work through topics at your pace with expert guidance. Track progress and build confidence for exams.', page: 'tutoring', sort: 3 },
    // Courses page steps
    { title: 'Live on Zoom', slug: 'courses-step-1', emoji: '📹', description: 'Interactive sessions with screen sharing, Q&A, and real-time problem solving.', page: 'courses', sort: 1 },
    { title: 'Small Groups', slug: 'courses-step-2', emoji: '👥', description: '8–12 students per session for personalised attention and questions.', page: 'courses', sort: 2 },
    { title: 'Easy Booking', slug: 'courses-step-3', emoji: '💳', description: 'Register and pay securely through Zoom Events. Instant confirmation.', page: 'courses', sort: 3 },
  ];

  for (const s of steps) {
    const { title, slug, ...data } = s;
    await createContent(token, colId, title, slug, data);
  }
}

async function seedTutoringSubjects(token: string, colId: string) {
  console.log('Seeding tutoring_subjects...');
  const subjects = [
    { title: 'Biology', slug: 'biology', accent_color: 'var(--th-green)', levels: JSON.stringify(['IGCSE', 'A-Level', 'IB SL/HL', 'Pancyprian']), sort: 1 },
    { title: 'Chemistry', slug: 'chemistry', accent_color: 'var(--th-green)', levels: JSON.stringify(['IGCSE', 'A-Level', 'IB SL/HL', 'Pancyprian']), sort: 2 },
    { title: 'Physics', slug: 'physics', accent_color: 'var(--th-blue)', levels: JSON.stringify(['IGCSE', 'A-Level', 'IB SL/HL', 'Pancyprian']), sort: 3 },
    { title: 'Mathematics', slug: 'mathematics', accent_color: 'var(--th-orange)', levels: JSON.stringify(['IGCSE', 'A-Level', 'IB AA/AI', 'SAT', 'Pancyprian']), sort: 4 },
  ];

  for (const s of subjects) {
    const { title, slug, ...data } = s;
    await createContent(token, colId, title, slug, data);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSeeding Theorium CMS at ${API_URL}\n`);

  const token = await getAdminToken();
  console.log('Authenticated as admin\n');

  // Get collection IDs
  const collectionIds = new Map<string, string>();
  const collections = [
    'site_content', 'medical_block', 'resources', 'courses',
    'schools', 'exam_destinations', 'tutoring_tiers', 'tutoring_steps', 'tutoring_subjects',
  ];

  for (const name of collections) {
    collectionIds.set(name, await getCollectionId(token, name));
  }

  // Seed all collections
  await seedSiteContent(token, collectionIds.get('site_content')!);
  await seedMedicalBlock(token, collectionIds.get('medical_block')!);
  await seedResources(token, collectionIds.get('resources')!);
  await seedCourses(token, collectionIds.get('courses')!);
  await seedSchools(token, collectionIds.get('schools')!);
  await seedExamDestinations(token, collectionIds.get('exam_destinations')!);
  await seedTutoringTiers(token, collectionIds.get('tutoring_tiers')!);
  await seedTutoringSteps(token, collectionIds.get('tutoring_steps')!);
  await seedTutoringSubjects(token, collectionIds.get('tutoring_subjects')!);

  console.log('\nSeed complete! All collections populated.\n');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
