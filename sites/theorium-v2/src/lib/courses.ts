/**
 * Shared course data — single source of truth for listings and detail pages.
 * When wired to Payload CMS, this will be replaced by fetch calls.
 */

export interface Course {
  slug: string;
  name: string;
  description: string;
  fullDescription: string;
  dates: string;
  subject: string;
  level: string;
  season: string;
  examBoard: string;
  schools: string[];
  classSize: string;
  duration: string;
  schedule: string;
  color: string;
  status: 'enrolling' | 'coming-soon';
  price?: string;
  priceNote?: string;
  topics: string[];
  whatYouGet: string[];
}

export interface ExamPeriod {
  name: string;
  dates: string;
}

const allSchools = ['American Academy', 'Pascal', 'Med High', 'The English School', 'Forum'];

export const courses: Course[] = [
  {
    slug: 'easter-biology',
    name: 'Easter Revision — Biology',
    description: '4-day intensive covering highest-value topics before May/June exams. Past paper practice and exam technique.',
    fullDescription: 'This 4-day intensive course is designed for students preparing for their May/June Biology exams at IGCSE and A-Level. Each session focuses on the highest-value topics — the ones that appear most frequently and carry the most marks. You will work through real past papers, analyse mark schemes, and develop exam technique that turns knowledge into marks.',
    dates: 'Mar – Apr',
    subject: 'Biology',
    level: 'IGCSE + A-Level',
    season: 'Easter',
    examBoard: 'Cambridge',
    schools: allSchools,
    classSize: 'Max 8',
    duration: '4 days',
    schedule: '10:00 – 14:00 daily',
    color: '#ffb3c6',
    status: 'enrolling',
    price: '€160',
    priceNote: 'per student',
    topics: ['Cell biology & transport', 'Genetics & inheritance', 'Human physiology', 'Ecology & ecosystems', 'Biochemistry & enzymes'],
    whatYouGet: ['4 full days of focused revision', 'Printed topic summaries & revision notes', 'Past paper booklet with mark schemes', 'Timed exam practice under real conditions', 'Individual feedback on exam technique'],
  },
  {
    slug: 'easter-chemistry',
    name: 'Easter Revision — Chemistry',
    description: 'Organic chemistry, quantitative analysis, and exam-style calculations. Covers Cambridge and Edexcel syllabi.',
    fullDescription: 'A 4-day intensive revision course covering the most challenging and highest-weighted Chemistry topics for IGCSE and A-Level. Special emphasis on organic chemistry reaction pathways, stoichiometric calculations, and interpreting data from experimental results. Suitable for students on both Cambridge and Edexcel exam boards.',
    dates: 'Mar – Apr',
    subject: 'Chemistry',
    level: 'IGCSE + A-Level',
    season: 'Easter',
    examBoard: 'Cambridge',
    schools: allSchools,
    classSize: 'Max 8',
    duration: '4 days',
    schedule: '10:00 – 14:00 daily',
    color: '#fff33b',
    status: 'enrolling',
    price: '€160',
    priceNote: 'per student',
    topics: ['Atomic structure & bonding', 'Organic chemistry pathways', 'Stoichiometry & moles', 'Rates of reaction & equilibria', 'Electrochemistry & redox'],
    whatYouGet: ['4 full days of focused revision', 'Organic chemistry reaction maps', 'Calculation drills with worked solutions', 'Past paper booklet with mark schemes', 'Individual feedback on exam technique'],
  },
  {
    slug: 'easter-physics',
    name: 'Easter Revision — Physics',
    description: 'Mechanics, electricity, waves. Includes practical paper preparation and data analysis techniques.',
    fullDescription: 'This 4-day intensive course covers the core Physics topics that students find most challenging — mechanics and forces, electrical circuits, and wave behaviour. Includes dedicated time for practical paper preparation, teaching you how to analyse experimental data, handle uncertainties, and present results clearly.',
    dates: 'Mar – Apr',
    subject: 'Physics',
    level: 'IGCSE + A-Level',
    season: 'Easter',
    examBoard: 'Cambridge',
    schools: allSchools,
    classSize: 'Max 8',
    duration: '4 days',
    schedule: '10:00 – 14:00 daily',
    color: '#b8ff6b',
    status: 'enrolling',
    price: '€160',
    priceNote: 'per student',
    topics: ['Forces & motion', 'Electricity & circuits', 'Waves & optics', 'Energy & thermal physics', 'Practical skills & data analysis'],
    whatYouGet: ['4 full days of focused revision', 'Formula sheets & problem-solving guides', 'Practical paper preparation', 'Past paper booklet with mark schemes', 'Individual feedback on exam technique'],
  },
  {
    slug: 'summer-intensive',
    name: 'Summer Science Intensive',
    description: '3-week programme covering all three sciences. Ideal for students moving from IGCSE to A-Level or catching up.',
    fullDescription: 'A comprehensive 3-week summer programme covering Biology, Chemistry, and Physics. This course is ideal for students who have just completed their IGCSEs and want a head start on A-Level content, or students who need to strengthen their foundations before the next academic year. Sessions run three times per week with a mix of theory, problem-solving, and exam practice.',
    dates: 'Jul',
    subject: 'All Sciences',
    level: 'IGCSE',
    season: 'Summer',
    examBoard: 'All Boards',
    schools: allSchools,
    classSize: 'Max 10',
    duration: '3 weeks',
    schedule: 'Mon, Wed, Fri — 10:00 – 12:00',
    color: '#b8ff6b',
    status: 'coming-soon',
    price: '€280',
    priceNote: 'per student',
    topics: ['Biology: cell biology, genetics, ecology', 'Chemistry: atomic structure, bonding, reactions', 'Physics: forces, energy, electricity', 'Cross-subject: scientific method & data skills'],
    whatYouGet: ['9 sessions across 3 weeks', 'Comprehensive revision notes for all three sciences', 'End-of-course assessment with feedback', 'A-Level bridging material for continuing students'],
  },
  {
    slug: 'ucat-preparation',
    name: 'UCAT Preparation',
    description: 'All four UCAT sections — Verbal Reasoning, Decision Making, Quantitative Reasoning, and Situational Judgement.',
    fullDescription: 'Comprehensive preparation for the University Clinical Aptitude Test (UCAT), required by all UK medical and dental schools. This course covers all four sections with a focus on timing strategy, question-type recognition, and consistent performance under pressure. Starts with a full-day intensive workshop followed by weekly practice sessions throughout the summer.',
    dates: 'Jun – Sep',
    subject: 'Medical Entry',
    level: 'University Entry',
    season: 'Summer',
    examBoard: 'UCAT',
    schools: allSchools,
    classSize: 'Max 6',
    duration: '1-day workshop + 10 weekly sessions',
    schedule: 'Workshop: Saturday 09:00 – 16:00 | Weekly: Thursday 17:00 – 18:30',
    color: '#a8e8ff',
    status: 'coming-soon',
    price: '€350',
    priceNote: 'includes workshop + 10 sessions',
    topics: ['Verbal Reasoning strategies', 'Decision Making logic', 'Quantitative Reasoning speed drills', 'Situational Judgement scenarios', 'Full mock exams with timing'],
    whatYouGet: ['Full-day intensive workshop', '10 weekly practice sessions', 'Access to 3,000+ practice questions', '3 full-length timed mock exams', 'Personal score tracking & improvement plan'],
  },
  {
    slug: 'mock-exam-prep',
    name: 'Mock Exam Preparation',
    description: '6-week programme with full mock papers under timed conditions and detailed feedback for January mocks.',
    fullDescription: 'A structured 6-week programme designed to prepare students for their January mock exams. Each week focuses on a different subject area, with full-length mock papers completed under timed exam conditions. Every paper is marked with detailed, personalised feedback highlighting exactly where marks are being lost and how to improve.',
    dates: 'Nov – Dec',
    subject: 'All Sciences',
    level: 'IGCSE + A-Level',
    season: 'Autumn',
    examBoard: 'All Boards',
    schools: allSchools,
    classSize: 'Max 8',
    duration: '6 weeks',
    schedule: 'Tue & Thu — 17:00 – 18:30',
    color: '#ffb3c6',
    status: 'coming-soon',
    price: '€240',
    priceNote: 'per student',
    topics: ['Full syllabus coverage across Biology, Chemistry, Physics', 'Timed mock papers each week', 'Mark scheme analysis', 'Common mistakes & how to avoid them', 'Exam technique under pressure'],
    whatYouGet: ['12 sessions over 6 weeks', '6 full-length mock papers (2 per subject)', 'Detailed written feedback on every paper', 'Personalised revision priority list', 'Final progress report'],
  },
  {
    slug: 'ib-biology-ia',
    name: 'IB Biology — IA Workshop',
    description: 'Guidance on Internal Assessment: topic selection, experimental design, data analysis, and report writing.',
    fullDescription: 'The IB Biology Internal Assessment is worth 20% of your final grade. This workshop guides you through every stage — from choosing a viable research question to designing a rigorous experiment, collecting and processing data, and writing a report that meets all IB assessment criteria. Small group format ensures each student receives individual guidance on their own IA.',
    dates: 'Oct – Nov',
    subject: 'Biology',
    level: 'IB',
    season: 'Autumn',
    examBoard: 'IB',
    schools: ['Pascal'],
    classSize: 'Max 6',
    duration: '4 sessions',
    schedule: 'Saturdays — 10:00 – 12:00',
    color: '#a8e8ff',
    status: 'coming-soon',
    price: '€120',
    priceNote: '4 sessions',
    topics: ['Choosing a research question', 'Experimental design & variables', 'Data collection & processing', 'Statistical analysis', 'Report structure & IB criteria'],
    whatYouGet: ['4 focused workshop sessions', 'IA planning template', 'Exemplar IAs with examiner commentary', 'Individual feedback on your draft', 'Checklist aligned to IB marking criteria'],
  },
  {
    slug: 'ib-chemistry-ia',
    name: 'IB Chemistry — IA Workshop',
    description: 'Internal Assessment support: experimental planning, error analysis, and evaluation aligned to IB criteria.',
    fullDescription: 'Dedicated support for the IB Chemistry Internal Assessment. This workshop covers experimental planning, error analysis, data processing, and evaluation — all aligned to the IB assessment criteria. Each student works on their own IA with guided support, ensuring the final report meets the standard required for top marks.',
    dates: 'Oct – Nov',
    subject: 'Chemistry',
    level: 'IB',
    season: 'Autumn',
    examBoard: 'IB',
    schools: ['Pascal'],
    classSize: 'Max 6',
    duration: '4 sessions',
    schedule: 'Saturdays — 12:30 – 14:30',
    color: '#fff33b',
    status: 'coming-soon',
    price: '€120',
    priceNote: '4 sessions',
    topics: ['Research question formulation', 'Experimental methodology', 'Error analysis & uncertainties', 'Data processing & presentation', 'Evaluation & improvements'],
    whatYouGet: ['4 focused workshop sessions', 'IA planning template', 'Exemplar IAs with examiner commentary', 'Individual feedback on your draft', 'Checklist aligned to IB marking criteria'],
  },
  {
    slug: 'edexcel-biology',
    name: 'Edexcel A-Level Biology Revision',
    description: 'Targeted revision for Edexcel A-Level Biology — Topics 5–8 including energy, ecosystems, and gene expression.',
    fullDescription: 'Targeted revision for students taking Edexcel A-Level Biology, focusing on the A2 content in Topics 5–8 that students find most challenging. Covers cellular respiration and photosynthesis, genetics and gene expression, ecosystems and sustainability, and the synoptic skills needed for Paper 3.',
    dates: 'Mar – Apr',
    subject: 'Biology',
    level: 'A-Level',
    season: 'Easter',
    examBoard: 'Edexcel',
    schools: ['Pascal', 'Med High'],
    classSize: 'Max 8',
    duration: '4 days',
    schedule: '14:30 – 18:00 daily',
    color: '#ffb3c6',
    status: 'coming-soon',
    price: '€160',
    priceNote: 'per student',
    topics: ['Cellular respiration & photosynthesis', 'Gene expression & epigenetics', 'Ecosystems & sustainability', 'Synoptic skills for Paper 3', 'Mathematical skills in biology'],
    whatYouGet: ['4 full days of targeted A2 revision', 'Edexcel-specific revision notes', 'Past paper practice for Papers 1, 2, and 3', 'Worked solutions for calculation questions', 'Individual feedback on extended response answers'],
  },
];

export const examPeriods: ExamPeriod[] = [
  { name: 'Mock Exams', dates: 'Jan' },
  { name: 'IB Exams', dates: 'Apr – May' },
  { name: 'IGCSE / A-Level', dates: 'May – Jun' },
  { name: 'UCAT Window', dates: 'Jul – Oct' },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function getRelatedCourses(course: Course, limit = 3): Course[] {
  return courses
    .filter((c) => c.slug !== course.slug && (c.subject === course.subject || c.season === course.season))
    .slice(0, limit);
}
