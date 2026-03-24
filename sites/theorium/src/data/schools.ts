export type BadgeColor = 'yellow' | 'green' | 'blue' | 'orange' | 'purple' | 'default';

export interface QualBadge {
  label: string;
  color: BadgeColor;
}

export type SubjectColor = 'green' | 'blue' | 'orange';

export interface SubjectCell {
  name: string;
  accentColor: SubjectColor;
  topics: string;
}

export interface School {
  name: string;
  type: string;
  qualifications: QualBadge[];
  subjects: SubjectCell[];
}

export const schools: School[] = [
  {
    name: 'American Academy Larnaca',
    type: 'Private English School',
    qualifications: [
      { label: 'GCSE / IGCSE', color: 'yellow' },
      { label: 'A-Level / AS', color: 'green' },
      { label: 'School curriculum', color: 'default' },
    ],
    subjects: [
      {
        name: 'Biology',
        accentColor: 'green',
        topics: 'IGCSE Double & Triple Science · AS & A2 Biology · Cell biology, genetics, human physiology, ecology',
      },
      {
        name: 'Chemistry',
        accentColor: 'green',
        topics: 'IGCSE Double & Triple Science · AS & A2 Chemistry · Atomic structure, organic chemistry, quantitative analysis',
      },
      {
        name: 'Physics',
        accentColor: 'blue',
        topics: 'IGCSE Double & Triple Science · AS & A2 Physics · Forces, electricity, waves, nuclear physics',
      },
      {
        name: 'Mathematics',
        accentColor: 'orange',
        topics: 'Compulsory Years 1–5 · A-Level Maths optional · Algebra, calculus, statistics, pure & applied',
      },
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
      {
        name: 'Biology',
        accentColor: 'green',
        topics: 'IGCSE · GCE A-Level / IAL · IB SL & HL · Molecular biology, evolution, plant science',
      },
      {
        name: 'Chemistry',
        accentColor: 'green',
        topics: 'IGCSE · GCE A-Level / IAL · IB SL & HL · Physical, inorganic & organic chemistry',
      },
      {
        name: 'Physics',
        accentColor: 'blue',
        topics: 'IGCSE · GCE A-Level / IAL · IB SL & HL · Mechanics, fields, thermal physics',
      },
      {
        name: 'Mathematics',
        accentColor: 'orange',
        topics: '3 difficulty levels · A-Level Maths · IB Maths AA & AI SL/HL · Further Maths available',
      },
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
      {
        name: 'Biology',
        accentColor: 'green',
        topics: 'IGCSE · A-Level Biology · Edexcel & Cambridge boards',
      },
      {
        name: 'Chemistry',
        accentColor: 'green',
        topics: 'IGCSE · A-Level Chemistry · Edexcel & Cambridge boards · Practical focus',
      },
      {
        name: 'Physics',
        accentColor: 'blue',
        topics: 'IGCSE · A-Level Physics · Edexcel & Cambridge boards',
      },
      {
        name: 'Mathematics',
        accentColor: 'orange',
        topics: 'IGCSE · A-Level Maths · SAT Maths preparation · Edexcel board',
      },
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
      {
        name: 'Biology (Βιολογία)',
        accentColor: 'green',
        topics: 'Γυμνάσιο & Λύκειο curriculum · Pancyprian exam preparation · Sciences & Health Sciences direction',
      },
      {
        name: 'Chemistry (Χημεία)',
        accentColor: 'green',
        topics: 'Γυμνάσιο & Λύκειο curriculum · Pancyprian exam preparation · Sciences direction',
      },
      {
        name: 'Physics (Φυσική)',
        accentColor: 'blue',
        topics: 'Γυμνάσιο & Λύκειο curriculum · Pancyprian exam preparation · Sciences direction',
      },
      {
        name: 'Mathematics (Μαθηματικά)',
        accentColor: 'orange',
        topics: 'Γυμνάσιο & Λύκειο curriculum · Pancyprian Maths · Economic & Computer Studies direction',
      },
    ],
  },
];
