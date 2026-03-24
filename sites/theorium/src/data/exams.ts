export type TagColor = 'green' | 'yellow' | 'blue' | 'orange' | 'purple';

export interface ExamCard {
  destination: string;
  flag: string;
  examName: string;
  tag: { label: string; color: TagColor };
  description: string;
  subjects: string[];
}

export interface MedicalBlockData {
  title: string;
  description: string;
  subjects: string[];
}

export const examCards: ExamCard[] = [
  {
    destination: 'United Kingdom',
    flag: '🇬🇧',
    examName: 'UCAT',
    tag: { label: 'Medicine & Dentistry', color: 'green' },
    description:
      'UCAT is required by all 36 UK medical and dental schools. Tests verbal reasoning, decision-making, quantitative reasoning, and situational judgement. The BMAT was discontinued in 2024 — UCAT is now the sole UK undergraduate medical admissions test.',
    subjects: [
      'Quantitative Reasoning',
      'Decision Making',
      'Verbal Reasoning',
      'Situational Judgement',
    ],
  },
  {
    destination: 'United States',
    flag: '🇺🇸',
    examName: 'SAT / AP',
    tag: { label: 'All programmes', color: 'yellow' },
    description:
      'SAT preparation with focus on the Math section. AP subject preparation in Biology, Chemistry, Physics, and Calculus for students targeting US university entry from Cyprus.',
    subjects: [
      'SAT Math',
      'AP Biology',
      'AP Chemistry',
      'AP Physics',
      'AP Calculus',
    ],
  },
  {
    destination: 'Netherlands & Germany',
    flag: '🇳🇱 🇩🇪',
    examName: 'Science Foundations',
    tag: { label: 'Medicine & Sciences', color: 'blue' },
    description:
      'Dutch and German universities require strong A-Level or IB science and maths results. Preparation focused on subject-level depth for medicine, biomedical sciences, pharmacy, and engineering programmes.',
    subjects: [
      'A-Level Biology',
      'A-Level Chemistry',
      'A-Level Maths',
      'IB HL Sciences',
    ],
  },
];

export const medicalBlock: MedicalBlockData = {
  title: 'Medical School Applications',
  description:
    'For students targeting Medicine, Dentistry, Pharmacy, Veterinary Science, or Biomedical Sciences at UK, Dutch, German, or Cypriot universities. A-Level Biology and Chemistry are compulsory entry requirements for virtually every medical programme. Subject-level tuition ensures the scientific depth these programmes demand.',
  subjects: [
    'A-Level Biology (required)',
    'A-Level Chemistry (required)',
    'UCAT prep',
    'IB HL Biology',
    'IB HL Chemistry',
    'Biochemistry foundations',
    'Human physiology',
    'Pancyprian Sciences (Επιστήμες Υγείας direction)',
  ],
};
