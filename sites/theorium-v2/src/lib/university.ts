/**
 * University exam prep data — single source of truth.
 * When wired to Payload CMS, this becomes a collection.
 */

export interface UniversityExam {
  slug: string;
  name: string;
  shortName: string;
  region: string;
  description: string;
  fullDescription: string;
  color: string;
  forWho: string;
  sections: { name: string; description: string }[];
  whatWeOffer: string[];
  timeline: string;
}

export const universityExams: UniversityExam[] = [
  {
    slug: 'ucat',
    name: 'University Clinical Aptitude Test',
    shortName: 'UCAT',
    region: 'United Kingdom',
    description: 'Required by all UK medical and dental schools. Quantitative reasoning, decision making, verbal reasoning, and situational judgement.',
    fullDescription: 'The UCAT is a compulsory admissions test for the majority of UK medical and dental schools. It assesses cognitive abilities and professional behaviours that are important for success in clinical careers. Unlike A-Levels, the UCAT cannot be revised for in the traditional sense — it requires practice with the specific question formats, timing strategies, and mental stamina to perform under pressure.',
    color: '#a8e8ff',
    forWho: 'Students applying to UK medical or dental schools',
    sections: [
      { name: 'Verbal Reasoning', description: 'Assess ability to critically evaluate written information. 11 passages, 44 questions in 21 minutes.' },
      { name: 'Decision Making', description: 'Evaluate responses to complex situations. 29 questions in 31 minutes using charts, data, and logical puzzles.' },
      { name: 'Quantitative Reasoning', description: 'Problem-solving with numerical data. 36 questions in 25 minutes covering tables, charts, and calculations.' },
      { name: 'Situational Judgement', description: 'Assess capacity to understand real-world ethical scenarios. 69 questions in 26 minutes.' },
    ],
    whatWeOffer: [
      'Full-day intensive workshop covering all four sections',
      '10 weekly practice sessions throughout summer',
      'Access to 3,000+ practice questions',
      '3 full-length timed mock exams',
      'Personal score tracking and improvement plan',
      'Timing strategies specific to each section',
    ],
    timeline: 'Jun – Sep (testing window: Jul – Oct)',
  },
  {
    slug: 'bmat',
    name: 'BioMedical Admissions Test',
    shortName: 'BMAT',
    region: 'United Kingdom',
    description: 'Required by select UK universities including Oxford, Cambridge, UCL, and Imperial for medicine. Tests scientific knowledge and critical thinking.',
    fullDescription: 'The BMAT is a more academically rigorous admissions test used by a smaller number of highly competitive UK medical schools. Unlike the UCAT, the BMAT directly tests scientific and mathematical knowledge alongside critical thinking and essay writing. Strong GCSE and A-Level science knowledge forms the foundation, but the application of that knowledge under exam conditions requires targeted preparation.',
    color: '#ffb3c6',
    forWho: 'Students applying to Oxford, Cambridge, UCL, or Imperial for medicine',
    sections: [
      { name: 'Section 1: Thinking Skills', description: 'Problem-solving and critical thinking. 32 multiple-choice questions in 60 minutes.' },
      { name: 'Section 2: Scientific Knowledge', description: 'Biology, Chemistry, Physics, and Mathematics at GCSE level. 27 multiple-choice questions in 30 minutes.' },
      { name: 'Section 3: Writing Task', description: 'Short essay from a choice of prompts testing communication and argumentation. 1 essay in 30 minutes.' },
    ],
    whatWeOffer: [
      'Comprehensive review of GCSE-level science for Section 2',
      'Critical thinking and logic drills for Section 1',
      'Essay writing workshops with feedback',
      'Full mock BMAT exams under timed conditions',
      'Individual feedback and score analysis',
    ],
    timeline: 'Sep – Oct (exam in early November)',
  },
  {
    slug: 'sat',
    name: 'SAT / AP Sciences',
    shortName: 'SAT / AP',
    region: 'United States',
    description: 'SAT preparation for science-focused students. AP Biology, Chemistry, and Physics support for US university applications.',
    fullDescription: 'The SAT is the standard admissions test for US universities, and AP (Advanced Placement) courses in Biology, Chemistry, and Physics demonstrate college-level readiness. For students at international schools in Cyprus applying to American universities, strong SAT scores combined with AP exam results significantly strengthen applications.',
    color: '#fff33b',
    forWho: 'Students applying to US universities',
    sections: [
      { name: 'SAT Math', description: 'Algebra, geometry, data analysis, and advanced math. Focus on problem-solving speed and accuracy.' },
      { name: 'AP Biology', description: 'College-level biology covering evolution, genetics, ecology, and cell biology. Lab-based investigation skills.' },
      { name: 'AP Chemistry', description: 'College-level chemistry including atomic theory, bonding, reactions, kinetics, and thermodynamics.' },
      { name: 'AP Physics', description: 'College-level physics covering mechanics, electricity, magnetism, and waves.' },
    ],
    whatWeOffer: [
      'SAT Math preparation with practice tests',
      'AP Biology, Chemistry, and Physics tuition',
      'Past paper practice with College Board materials',
      'Score improvement strategies and test-day techniques',
      'Flexible scheduling around school commitments',
    ],
    timeline: 'Year-round (SAT offered 7 times per year)',
  },
  {
    slug: 'netherlands',
    name: 'Netherlands — Medicine & Sciences',
    shortName: 'Netherlands',
    region: 'Netherlands',
    description: 'English-taught medicine, biomedical sciences, and STEM programmes. Many require specific A-Level/IB science grades and may include a selection process or lottery.',
    fullDescription: 'The Netherlands is one of the most popular destinations for Cyprus students, with universities like Maastricht, Groningen, Amsterdam, Leiden, and Utrecht offering fully English-taught programmes. Medical programmes are highly competitive — some use a weighted lottery system (numerus fixus), while others have selection days. Entry typically requires strong grades in at least two sciences at A-Level or IB HL, plus Mathematics.',
    color: '#b8ff6b',
    forWho: 'Students applying to Dutch universities for medicine, biomedical science, or STEM',
    sections: [
      { name: 'A-Level / IB Subject Support', description: 'Achieve the specific science grades required — typically A*AA or IB 36+ with HL sciences.' },
      { name: 'Studielink Application', description: 'Navigate the Dutch centralised application system (Studielink) and university-specific portals.' },
      { name: 'Selection Day Preparation', description: 'Practice for MMI-style interviews, group assessments, and aptitude tests used by Dutch medical schools.' },
    ],
    whatWeOffer: [
      'Subject tuition to meet Dutch university science requirements',
      'Studielink application support',
      'Selection day preparation (interviews, group tasks)',
      'Motivation letter guidance',
      'Entry requirement mapping for specific programmes',
    ],
    timeline: 'Year-round (Studielink deadline: 15 January)',
  },
  {
    slug: 'ireland',
    name: 'Ireland — Medicine & Health Sciences',
    shortName: 'Ireland',
    region: 'Ireland',
    description: 'Irish universities offer direct-entry medicine programmes (5-6 years). HPAT-Ireland is required for most. Strong A-Level science grades essential.',
    fullDescription: 'Ireland is a popular choice for medical school due to direct-entry programmes (no graduate entry required) and English-language instruction. Universities including Trinity College Dublin, UCD, RCSI, and University of Galway all offer medicine. Most require the HPAT-Ireland aptitude test alongside strong A-Level or IB results in Chemistry and at least one other science. CAO (Central Applications Office) handles all applications.',
    color: '#b8ff6b',
    forWho: 'Students applying to Irish medical schools or health science programmes',
    sections: [
      { name: 'HPAT-Ireland Preparation', description: 'Aptitude test covering logical reasoning, interpersonal understanding, and non-verbal reasoning. 2.5 hours, 3 sections.' },
      { name: 'A-Level Science Support', description: 'Meet the high grades required — typically AAA with Chemistry mandatory for most medical programmes.' },
      { name: 'CAO Application Guidance', description: 'Navigate the Irish centralised application system and understand points calculation from A-Level grades.' },
    ],
    whatWeOffer: [
      'HPAT-Ireland practice and strategy',
      'A-Level Chemistry and Biology tuition',
      'CAO application and points system guidance',
      'Personal statement support',
      'Entry requirement analysis for specific universities',
    ],
    timeline: 'Year-round (HPAT: February, CAO deadline: 1 February)',
  },
  {
    slug: 'czech-republic',
    name: 'Czech Republic — Medicine in English',
    shortName: 'Czech Republic',
    region: 'Czech Republic',
    description: 'Czech universities offer English-taught medical programmes with their own entrance exams testing Biology, Chemistry, and sometimes Physics.',
    fullDescription: 'The Czech Republic has become a major destination for international medical students, with universities in Prague (Charles University), Brno (Masaryk University), Olomouc (Palacky University), and Hradec Králové all offering full English-taught medical programmes. Each university runs its own entrance exam — typically testing Biology and Chemistry knowledge at A-Level standard, with some including Physics. These are knowledge-based exams, not aptitude tests, so strong subject preparation is key.',
    color: '#a8e8ff',
    forWho: 'Students applying to Czech medical schools (English-taught programmes)',
    sections: [
      { name: 'Biology Entrance Prep', description: 'University-specific Biology syllabus covering human anatomy, physiology, genetics, molecular biology, and ecology.' },
      { name: 'Chemistry Entrance Prep', description: 'Organic and inorganic chemistry, biochemistry, and general chemistry at A-Level/first-year university standard.' },
      { name: 'Physics (where required)', description: 'Some programmes (e.g., Charles University) include Physics. Covers mechanics, optics, and electricity.' },
    ],
    whatWeOffer: [
      'Subject preparation aligned to specific university entrance exams',
      'Past paper practice from Charles, Masaryk, and Palacky universities',
      'Mock entrance exams under timed conditions',
      'Application guidance for Czech medical schools',
      'Flexible scheduling around school commitments',
    ],
    timeline: 'Year-round (entrance exams: May – June)',
  },
  {
    slug: 'germany',
    name: 'Germany — STEM & Medicine',
    shortName: 'Germany',
    region: 'Germany',
    description: 'German universities offer tuition-free STEM and medical programmes. Entry requires specific A-Level grades validated through uni-assist or direct application.',
    fullDescription: 'Germany offers tuition-free university education (only small semester fees) with many English-taught programmes in engineering, natural sciences, and increasingly in medicine. Medical programmes are taught in German but pre-clinical semesters at some universities accept English-track students. Entry via uni-assist requires authenticated A-Level or IB transcripts meeting specific grade thresholds. For medicine, the Abitur-equivalent grade (converted from A-Levels) determines eligibility.',
    color: '#fff33b',
    forWho: 'Students applying to German universities for STEM, engineering, or medicine',
    sections: [
      { name: 'A-Level Grade Optimisation', description: 'Achieve the grades needed for uni-assist conversion. Medical programmes typically require the equivalent of 1.0-1.3 Abitur (A*A*A at A-Level).' },
      { name: 'uni-assist Application', description: 'Navigate the centralised application evaluation system and understand grade conversion tables.' },
      { name: 'TestAS (if required)', description: 'Some programmes require TestAS — an aptitude test for international applicants covering core competencies and subject-specific modules.' },
    ],
    whatWeOffer: [
      'A-Level science tuition focused on achieving top grades',
      'uni-assist application support and grade conversion guidance',
      'TestAS preparation (where required)',
      'Programme-specific entry requirement analysis',
      'Motivation letter support for German applications',
    ],
    timeline: 'Year-round (winter semester: Jul deadline, summer semester: Jan deadline)',
  },
  {
    slug: 'uk-general',
    name: 'UK Universities — Science Degrees',
    shortName: 'UK General',
    region: 'United Kingdom',
    description: 'UCAS application support for science degrees at UK universities. Personal statement guidance, predicted grade strategy, and interview preparation.',
    fullDescription: 'Beyond medical school, UK universities offer world-class science degrees in fields like Biomedical Sciences, Pharmacology, Chemical Engineering, Physics, and Natural Sciences. The UCAS application process requires a strong personal statement, appropriate predicted grades, and for competitive programmes, may include interviews or admissions tests. We support students through the entire process — from choosing the right universities to submitting a compelling application.',
    color: '#ffb3c6',
    forWho: 'Students applying to UK universities for any science-related degree',
    sections: [
      { name: 'UCAS Application Support', description: 'Guidance on choosing universities, understanding entry requirements, and managing the UCAS timeline.' },
      { name: 'Personal Statement', description: 'Structured support to write a compelling personal statement that demonstrates genuine interest and academic readiness.' },
      { name: 'A-Level Grade Achievement', description: 'Targeted tuition to meet or exceed predicted grades and conditional offers.' },
    ],
    whatWeOffer: [
      'A-Level science tuition aligned to university entry requirements',
      'UCAS personal statement drafting and review',
      'University shortlisting based on grades and preferences',
      'Interview preparation for competitive programmes',
      'Guidance on super-curricular activities and work experience',
    ],
    timeline: 'Year-round (UCAS deadline: 15 January, Oxbridge/Medicine: 15 October)',
  },
];

export function getExamBySlug(slug: string): UniversityExam | undefined {
  return universityExams.find((e) => e.slug === slug);
}
