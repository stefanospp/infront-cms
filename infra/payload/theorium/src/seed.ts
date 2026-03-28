/**
 * Seed script for Theorium CMS
 * Run: PAYLOAD_URL=http://localhost:3000 pnpm run seed
 */

const PAYLOAD_URL = process.env.PAYLOAD_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'hello@infront.cy';
const ADMIN_PASSWORD = 'Inf-cms-TH-2026!';

let token = '';

async function api(method: string, endpoint: string, body?: unknown) {
  const res = await fetch(`${PAYLOAD_URL}/api${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${endpoint} failed: ${res.status} ${text.substring(0, 200)}`);
  }
  return res.json();
}

async function login() {
  try {
    const res = await fetch(`${PAYLOAD_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    if (res.ok) {
      const data = await res.json();
      token = data.token;
      return;
    }
  } catch {}

  // Try first-register
  const res = await fetch(`${PAYLOAD_URL}/api/users/first-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'Admin', role: 'admin' }),
  });
  if (!res.ok) throw new Error('Could not login or create admin user');
  const data = await res.json();
  token = data.token;
}

async function seedIfEmpty(collection: string, items: unknown[]) {
  const existing = await api('GET', `/${collection}?limit=1`);
  if (existing.totalDocs > 0) {
    console.log(`  ⏭ ${collection}: ${existing.totalDocs} items exist, skipping`);
    return;
  }
  for (const item of items) {
    await api('POST', `/${collection}`, item);
  }
  console.log(`  ✓ ${collection}: ${items.length} items created`);
}

async function seed() {
  console.log('🌱 Seeding Theorium CMS...');
  console.log(`  Target: ${PAYLOAD_URL}`);
  await login();
  console.log('  ✓ Authenticated\n');

  // ── Schools ──
  console.log('📚 Collections:');
  await seedIfEmpty('schools', [
    { name: 'American Academy Larnaca', location: 'Larnaca', examBoards: 'GCSE · IGCSE · A-Level', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }], order: 1 },
    { name: 'American Academy Nicosia', location: 'Nicosia', examBoards: 'IGCSE · A-Level', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }], order: 2 },
    { name: 'Pascal English School', location: 'Larnaca', examBoards: 'Cambridge · Edexcel · IB', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }, { label: 'IB HL/SL', filled: false }], order: 3 },
    { name: 'Med High', location: 'Larnaca', examBoards: 'Cambridge · Edexcel', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }], order: 4 },
    { name: 'The English School', location: 'Nicosia', examBoards: 'Cambridge · Pearson · AQA', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }], order: 5 },
    { name: 'The Grammar School', location: 'Nicosia', examBoards: 'IGCSE · AS · A-Level', levels: [{ label: 'IGCSE', filled: true }, { label: 'AS', filled: false }, { label: 'A-Level', filled: false }], order: 6 },
    { name: 'G.C. School of Careers', location: 'Nicosia', examBoards: 'Edexcel / Pearson', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }], order: 7 },
    { name: 'The International School of Limassol', location: 'Limassol', examBoards: 'IB Diploma', levels: [{ label: 'IB MYP', filled: true }, { label: 'IB DP', filled: false }], order: 8 },
    { name: 'The Junior & Senior School', location: 'Nicosia', examBoards: 'IGCSE · A-Level · IB (2025)', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }, { label: 'IB DP', filled: false }], order: 9 },
    { name: 'Heritage Private School', location: 'Limassol', examBoards: 'Cambridge · Pearson', levels: [{ label: 'IGCSE', filled: true }, { label: 'AS', filled: false }, { label: 'A-Level', filled: false }], order: 10 },
    { name: 'Forum', location: 'Larnaca', examBoards: 'IGCSE · A-Level', levels: [{ label: 'IGCSE', filled: true }, { label: 'A-Level', filled: false }], order: 11 },
  ]);

  // ── Subjects ──
  await seedIfEmpty('subjects', [
    {
      name: 'Biology', slug: 'biology', code: 'BIO', color: '#ffb3c6',
      tagline: 'From cells to ecosystems — understand the science of life.',
      levels: [
        { name: 'IGCSE', examBoards: [{ board: 'Cambridge' }, { board: 'Edexcel' }], topics: [{ topic: 'Cell biology & organisation' }, { topic: 'Transport in plants and animals' }, { topic: 'Genetics & inheritance' }, { topic: 'Natural selection & evolution' }, { topic: 'Ecology & ecosystems' }, { topic: 'Human physiology & coordination' }] },
        { name: 'A-Level', examBoards: [{ board: 'Cambridge' }, { board: 'Edexcel' }], topics: [{ topic: 'Biological molecules & enzymes' }, { topic: 'Cell division & cell cycle' }, { topic: 'Gas exchange & transport' }, { topic: 'Genetics & gene expression' }, { topic: 'Energy & respiration' }, { topic: 'Ecology & sustainability' }] },
        { name: 'IB HL/SL', examBoards: [{ board: 'IB' }], topics: [{ topic: 'Cell biology' }, { topic: 'Molecular biology' }, { topic: 'Genetics' }, { topic: 'Ecology' }, { topic: 'Evolution & biodiversity' }, { topic: 'Human physiology' }, { topic: 'Internal Assessment support' }] },
      ],
      whyStudy: [{ reason: 'Essential for medicine, dentistry, veterinary science, and biomedical courses' }, { reason: 'Develops analytical and data interpretation skills' }, { reason: 'Strong practical component — learn to design and evaluate experiments' }, { reason: 'High demand subject with clear career pathways' }],
      order: 1,
    },
    {
      name: 'Chemistry', slug: 'chemistry', code: 'CHE', color: '#fff33b',
      tagline: 'Master reactions, structures, and calculations.',
      levels: [
        { name: 'IGCSE', examBoards: [{ board: 'Cambridge' }, { board: 'Edexcel' }], topics: [{ topic: 'Atomic structure & the periodic table' }, { topic: 'Bonding & structure' }, { topic: 'Stoichiometry & moles' }, { topic: 'Electrochemistry' }, { topic: 'Chemical energetics' }, { topic: 'Organic chemistry basics' }] },
        { name: 'A-Level', examBoards: [{ board: 'Cambridge' }, { board: 'Edexcel' }], topics: [{ topic: 'Advanced organic chemistry' }, { topic: 'Reaction kinetics' }, { topic: 'Chemical equilibria' }, { topic: 'Electrochemistry & redox' }, { topic: 'Transition metals' }, { topic: 'Spectroscopy & analysis' }] },
        { name: 'IB HL/SL', examBoards: [{ board: 'IB' }], topics: [{ topic: 'Stoichiometric relationships' }, { topic: 'Atomic structure' }, { topic: 'Periodicity' }, { topic: 'Bonding' }, { topic: 'Energetics & thermochemistry' }, { topic: 'Chemical kinetics' }, { topic: 'Internal Assessment support' }] },
      ],
      whyStudy: [{ reason: 'Required for medicine, pharmacy, chemical engineering, and materials science' }, { reason: 'Develops quantitative and problem-solving skills' }, { reason: 'Practical skills in experimental design and data analysis' }, { reason: 'Strong foundation for understanding how the physical world works' }],
      order: 2,
    },
    {
      name: 'Physics', slug: 'physics', code: 'PHY', color: '#b8ff6b',
      tagline: 'Forces, energy, waves — understand how the universe works.',
      levels: [
        { name: 'IGCSE', examBoards: [{ board: 'Cambridge' }, { board: 'Edexcel' }], topics: [{ topic: 'Forces & motion' }, { topic: 'Energy & thermal physics' }, { topic: 'Waves & light' }, { topic: 'Electricity & magnetism' }, { topic: 'Nuclear physics' }, { topic: 'Space physics' }] },
        { name: 'A-Level', examBoards: [{ board: 'Cambridge' }, { board: 'Edexcel' }], topics: [{ topic: 'Mechanics & kinematics' }, { topic: 'Electric fields & capacitance' }, { topic: 'Gravitational fields' }, { topic: 'Oscillations & waves' }, { topic: 'Quantum physics' }, { topic: 'Nuclear physics & radioactivity' }] },
        { name: 'IB HL/SL', examBoards: [{ board: 'IB' }], topics: [{ topic: 'Measurements & uncertainties' }, { topic: 'Mechanics' }, { topic: 'Thermal physics' }, { topic: 'Waves' }, { topic: 'Electricity & magnetism' }, { topic: 'Atomic & nuclear physics' }, { topic: 'Internal Assessment support' }] },
      ],
      whyStudy: [{ reason: 'Essential for engineering, computer science, architecture, and physics degrees' }, { reason: 'Develops mathematical reasoning and analytical thinking' }, { reason: 'Highly valued by universities for demonstrating rigour' }, { reason: 'Opens doors to a wide range of STEM careers' }],
      order: 3,
    },
  ]);

  // ── Courses ──
  await seedIfEmpty('courses', [
    { slug: 'easter-biology', name: 'Easter Revision — Biology', description: '4-day intensive covering highest-value topics before May/June exams. Past paper practice and exam technique.', dates: 'Mar – Apr', subject: 'Biology', level: 'IGCSE + A-Level', season: 'Easter', examBoard: 'Cambridge', classSize: 'Max 8', duration: '4 days', schedule: '10:00 – 14:00 daily', color: '#ffb3c6', status: 'enrolling', price: '€160', priceNote: 'per student', topics: [{ topic: 'Cell biology & transport' }, { topic: 'Genetics & inheritance' }, { topic: 'Human physiology' }, { topic: 'Ecology & ecosystems' }, { topic: 'Biochemistry & enzymes' }], whatYouGet: [{ item: '4 full days of focused revision' }, { item: 'Printed topic summaries & revision notes' }, { item: 'Past paper booklet with mark schemes' }, { item: 'Timed exam practice under real conditions' }, { item: 'Individual feedback on exam technique' }], order: 1 },
    { slug: 'easter-chemistry', name: 'Easter Revision — Chemistry', description: 'Organic chemistry, quantitative analysis, and exam-style calculations. Covers Cambridge and Edexcel syllabi.', dates: 'Mar – Apr', subject: 'Chemistry', level: 'IGCSE + A-Level', season: 'Easter', examBoard: 'Cambridge', classSize: 'Max 8', duration: '4 days', schedule: '10:00 – 14:00 daily', color: '#fff33b', status: 'enrolling', price: '€160', priceNote: 'per student', topics: [{ topic: 'Atomic structure & bonding' }, { topic: 'Organic chemistry pathways' }, { topic: 'Stoichiometry & moles' }, { topic: 'Rates of reaction & equilibria' }, { topic: 'Electrochemistry & redox' }], whatYouGet: [{ item: '4 full days of focused revision' }, { item: 'Organic chemistry reaction maps' }, { item: 'Calculation drills with worked solutions' }, { item: 'Past paper booklet with mark schemes' }, { item: 'Individual feedback on exam technique' }], order: 2 },
    { slug: 'easter-physics', name: 'Easter Revision — Physics', description: 'Mechanics, electricity, waves. Includes practical paper preparation and data analysis techniques.', dates: 'Mar – Apr', subject: 'Physics', level: 'IGCSE + A-Level', season: 'Easter', examBoard: 'Cambridge', classSize: 'Max 8', duration: '4 days', schedule: '10:00 – 14:00 daily', color: '#b8ff6b', status: 'enrolling', price: '€160', priceNote: 'per student', topics: [{ topic: 'Forces & motion' }, { topic: 'Electricity & circuits' }, { topic: 'Waves & optics' }, { topic: 'Energy & thermal physics' }, { topic: 'Practical skills & data analysis' }], whatYouGet: [{ item: '4 full days of focused revision' }, { item: 'Formula sheets & problem-solving guides' }, { item: 'Practical paper preparation' }, { item: 'Past paper booklet with mark schemes' }, { item: 'Individual feedback on exam technique' }], order: 3 },
    { slug: 'summer-intensive', name: 'Summer Science Intensive', description: '3-week programme covering all three sciences. Ideal for students moving from IGCSE to A-Level or catching up.', dates: 'Jul', subject: 'All Sciences', level: 'IGCSE', season: 'Summer', examBoard: 'All Boards', classSize: 'Max 10', duration: '3 weeks', schedule: 'Mon, Wed, Fri — 10:00 – 12:00', color: '#b8ff6b', status: 'coming-soon', price: '€280', priceNote: 'per student', topics: [{ topic: 'Biology: cell biology, genetics, ecology' }, { topic: 'Chemistry: atomic structure, bonding, reactions' }, { topic: 'Physics: forces, energy, electricity' }, { topic: 'Cross-subject: scientific method & data skills' }], whatYouGet: [{ item: '9 sessions across 3 weeks' }, { item: 'Comprehensive revision notes for all three sciences' }, { item: 'End-of-course assessment with feedback' }, { item: 'A-Level bridging material for continuing students' }], order: 4 },
    { slug: 'ucat-preparation', name: 'UCAT Preparation', description: 'All four UCAT sections — Verbal Reasoning, Decision Making, Quantitative Reasoning, and Situational Judgement.', dates: 'Jun – Sep', subject: 'Medical Entry', level: 'University Entry', season: 'Summer', examBoard: 'UCAT', classSize: 'Max 6', duration: '1-day workshop + 10 weekly sessions', schedule: 'Workshop: Saturday 09:00 – 16:00 | Weekly: Thursday 17:00 – 18:30', color: '#a8e8ff', status: 'coming-soon', price: '€350', priceNote: 'includes workshop + 10 sessions', topics: [{ topic: 'Verbal Reasoning strategies' }, { topic: 'Decision Making logic' }, { topic: 'Quantitative Reasoning speed drills' }, { topic: 'Situational Judgement scenarios' }, { topic: 'Full mock exams with timing' }], whatYouGet: [{ item: 'Full-day intensive workshop' }, { item: '10 weekly practice sessions' }, { item: 'Access to 3,000+ practice questions' }, { item: '3 full-length timed mock exams' }, { item: 'Personal score tracking & improvement plan' }], order: 5 },
    { slug: 'mock-exam-prep', name: 'Mock Exam Preparation', description: '6-week programme with full mock papers under timed conditions and detailed feedback for January mocks.', dates: 'Nov – Dec', subject: 'All Sciences', level: 'IGCSE + A-Level', season: 'Autumn', examBoard: 'All Boards', classSize: 'Max 8', duration: '6 weeks', schedule: 'Tue & Thu — 17:00 – 18:30', color: '#ffb3c6', status: 'coming-soon', price: '€240', priceNote: 'per student', topics: [{ topic: 'Full syllabus coverage across Biology, Chemistry, Physics' }, { topic: 'Timed mock papers each week' }, { topic: 'Mark scheme analysis' }, { topic: 'Common mistakes & how to avoid them' }, { topic: 'Exam technique under pressure' }], whatYouGet: [{ item: '12 sessions over 6 weeks' }, { item: '6 full-length mock papers (2 per subject)' }, { item: 'Detailed written feedback on every paper' }, { item: 'Personalised revision priority list' }, { item: 'Final progress report' }], order: 6 },
  ]);

  // ── FAQs ──
  await seedIfEmpty('faqs', [
    { question: 'What exam boards do you cover?', answer: 'We cover Cambridge International (CIE), Pearson Edexcel, and IB Diploma Programme. Lessons are tailored to the specific syllabus and exam format of your board — including past paper practice with real mark schemes.', order: 1 },
    { question: 'Do you offer online lessons?', answer: 'Yes. We offer both in-person lessons in Larnaca and online sessions via Zoom for students anywhere in Cyprus and across Europe. Online students get the same structured approach — screen sharing, digital whiteboards, and recorded sessions for review.', order: 2 },
    { question: 'How are group revision courses structured?', answer: 'Group courses run over 4–8 weeks with sessions 2–3 times per week. Classes are capped at 8–10 students to ensure everyone gets individual attention. Each session covers specific syllabus topics with exam-style questions and timed practice.', order: 3 },
    { question: 'What subjects do you teach?', answer: 'We specialise in the three core sciences: Biology, Chemistry, and Physics. We cover these at IGCSE, AS, A-Level, and IB Higher/Standard Level. This focused approach means deeper expertise and better results.', order: 4 },
    { question: 'How do I prepare for the UCAT exam?', answer: 'Our UCAT preparation covers all four sections — Verbal Reasoning, Decision Making, Quantitative Reasoning, and Situational Judgement. We offer intensive one-day workshops and ongoing weekly sessions from June through September, timed to the UCAT testing window.', order: 5 },
    { question: 'Do you help with IB Internal Assessments?', answer: 'Yes. IB Internal Assessments carry significant weight in your final grade. We help with topic selection, experimental design, data analysis, and report writing — all aligned with IB assessment criteria to maximise your marks.', order: 6 },
    { question: 'When should I start revision?', answer: 'For May/June exams, serious revision should begin 8–10 weeks ahead — around late February or early March. We run Easter intensive courses specifically for this window. For mock exams in January, we recommend starting in November.', order: 7 },
    { question: 'Which schools do your students attend?', answer: "Our students come from American Academy Larnaca, Pascal English School, Med High, The English School, Forum, and other private schools across Cyprus. Each student's lessons follow their own school's curriculum and exam board.", order: 8 },
  ]);

  // ── University Exams ──
  await seedIfEmpty('university-exams', [
    { slug: 'ucat', name: 'University Clinical Aptitude Test', shortName: 'UCAT', region: 'United Kingdom', description: 'Required by all UK medical and dental schools. Quantitative reasoning, decision making, verbal reasoning, and situational judgement.', color: '#a8e8ff', forWho: 'Students applying to UK medical or dental schools', sections: [{ name: 'Verbal Reasoning', description: 'Assess ability to critically evaluate written information. 11 passages, 44 questions in 21 minutes.' }, { name: 'Decision Making', description: 'Evaluate responses to complex situations. 29 questions in 31 minutes.' }, { name: 'Quantitative Reasoning', description: 'Problem-solving with numerical data. 36 questions in 25 minutes.' }, { name: 'Situational Judgement', description: 'Assess capacity to understand real-world ethical scenarios. 69 questions in 26 minutes.' }], whatWeOffer: [{ item: 'Full-day intensive workshop' }, { item: '10 weekly practice sessions' }, { item: 'Access to 3,000+ practice questions' }, { item: '3 full-length timed mock exams' }, { item: 'Personal score tracking and improvement plan' }], timeline: 'Jun – Sep (testing window: Jul – Oct)', order: 1 },
    { slug: 'bmat', name: 'BioMedical Admissions Test', shortName: 'BMAT', region: 'United Kingdom', description: 'Required by select UK universities including Oxford, Cambridge, UCL, and Imperial for medicine.', color: '#ffb3c6', forWho: 'Students applying to Oxford, Cambridge, UCL, or Imperial for medicine', sections: [{ name: 'Section 1: Thinking Skills', description: 'Problem-solving and critical thinking. 32 multiple-choice questions in 60 minutes.' }, { name: 'Section 2: Scientific Knowledge', description: 'Biology, Chemistry, Physics, and Mathematics at GCSE level. 27 questions in 30 minutes.' }, { name: 'Section 3: Writing Task', description: 'Short essay from a choice of prompts. 1 essay in 30 minutes.' }], whatWeOffer: [{ item: 'Comprehensive review of GCSE-level science for Section 2' }, { item: 'Critical thinking and logic drills for Section 1' }, { item: 'Essay writing workshops with feedback' }, { item: 'Full mock BMAT exams under timed conditions' }], timeline: 'Sep – Oct (exam in early November)', order: 2 },
    { slug: 'sat', name: 'SAT / AP Sciences', shortName: 'SAT / AP', region: 'United States', description: 'SAT preparation for science-focused students. AP Biology, Chemistry, and Physics support.', color: '#fff33b', forWho: 'Students applying to US universities', sections: [{ name: 'SAT Math', description: 'Algebra, geometry, data analysis, and advanced math.' }, { name: 'AP Biology', description: 'College-level biology covering evolution, genetics, ecology, and cell biology.' }, { name: 'AP Chemistry', description: 'College-level chemistry including atomic theory, bonding, reactions, kinetics.' }, { name: 'AP Physics', description: 'College-level physics covering mechanics, electricity, magnetism, and waves.' }], whatWeOffer: [{ item: 'SAT Math preparation with practice tests' }, { item: 'AP Biology, Chemistry, and Physics tuition' }, { item: 'Past paper practice with College Board materials' }, { item: 'Score improvement strategies' }], timeline: 'Year-round (SAT offered 7 times per year)', order: 3 },
    { slug: 'netherlands', name: 'Netherlands — Medicine & Sciences', shortName: 'Netherlands', region: 'Netherlands', description: 'English-taught medicine, biomedical sciences, and STEM programmes.', color: '#b8ff6b', forWho: 'Students applying to Dutch universities for medicine, biomedical science, or STEM', sections: [{ name: 'A-Level / IB Subject Support', description: 'Achieve the specific science grades required — typically A*AA or IB 36+.' }, { name: 'Studielink Application', description: 'Navigate the Dutch centralised application system.' }, { name: 'Selection Day Preparation', description: 'Practice for MMI-style interviews and group assessments.' }], whatWeOffer: [{ item: 'Subject tuition to meet Dutch university science requirements' }, { item: 'Studielink application support' }, { item: 'Selection day preparation' }, { item: 'Motivation letter guidance' }], timeline: 'Year-round (Studielink deadline: 15 January)', order: 4 },
  ]);

  // ── Globals ──
  console.log('\n🌐 Globals:');

  await api('POST', '/globals/site-settings', {
    siteName: 'Theorium',
    tagline: 'Private Science Tutoring',
    navLinks: [
      { label: 'About', href: '/about' },
      { label: 'Subjects', href: '/subjects' },
      { label: 'Courses', href: '/courses' },
      { label: 'University', href: '/university' },
      { label: 'Resources', href: '/resources' },
    ],
    ctaLabel: 'Get in touch',
    ctaHref: '/contact',
    contact: {
      email: 'theodora@theorium.cy',
      whatsapp: '35799000000',
      viber: '35799000000',
      location: 'Larnaca, Cyprus',
      responseTime: 'Usually replies within 2 hours',
    },
    footer: {
      builderName: 'infront.cy',
      builderLink: 'https://infront.cy',
    },
  });
  console.log('  ✓ site-settings');

  await api('POST', '/globals/home-sections', {
    hero: {
      badge: 'In-Person in Larnaca · Online Europe-Wide',
      heading: 'SCIENCE.',
      headingHighlight: 'EVERY LEVEL.',
      subheading: 'One-on-one after-school lessons for students at American Academy, Pascal, MedHigh, The English School, and Forum. From IGCSE to university entrance — including medical school admissions.',
      stats: [{ text: '150+ Students' }, { text: 'IGCSE to A-Level' }, { text: 'Medical School Prep' }],
      ctaText: 'View Courses',
      ctaHref: '/courses',
    },
    why: {
      heading: 'Why Theorium.',
      description: 'Private science tuition built around the way exams actually work — not the way textbooks are written.',
      features: [
        { title: 'Curriculum-Aligned', description: "Every lesson follows the exact syllabus your school uses — Cambridge, Edexcel, or IB. No generic worksheets, no wasted time on topics you don't need." },
        { title: 'Small Groups, Big Results', description: 'Group revision classes are capped at 8–10 students. Everyone gets attention, everyone gets answers. One-on-one sessions are also available.' },
        { title: 'Exam-Focused Approach', description: 'Past papers, mark schemes, examiner reports — we teach how the exams work, not just the content. Students learn to maximise marks on every question.' },
        { title: 'In-Person & Online', description: 'Face-to-face lessons in Larnaca for local students. Online sessions via Zoom for students anywhere in Cyprus and across Europe.' },
      ],
    },
    howItWorks: {
      heading: 'How It Works.',
      steps: [
        { number: '01', title: 'Get in Touch', description: 'Send a message via WhatsApp, Viber, or the contact form. Tell us your school, year group, and which subjects you need help with.' },
        { number: '02', title: 'Tailored Plan', description: "We review your current level, upcoming exams, and target grades. You get a personalised study plan aligned to your school's syllabus and exam board." },
        { number: '03', title: 'Start Learning', description: 'Begin with one-on-one sessions or join a small group revision course. Track your progress with regular assessments and past paper practice.' },
      ],
    },
    examPeriods: [
      { name: 'Mock Exams', dates: 'Jan' },
      { name: 'IB Exams', dates: 'Apr – May' },
      { name: 'IGCSE / A-Level', dates: 'May – Jun' },
      { name: 'UCAT Window', dates: 'Jul – Oct' },
    ],
  });
  console.log('  ✓ home-sections');

  console.log('\n🎉 Seed complete!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
