// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface SiteContent {
  hero_badge: string;
  hero_heading: string;
  hero_heading_highlight: string;
  hero_subheading: string;
  hero_cta_primary_text: string;
  hero_cta_primary_href: string;
  hero_whatsapp_url: string;
  hero_viber_url: string;
  ticker_items: string[];
  schools_badge: string;
  schools_heading: string;
  schools_subtitle: string;
  exams_badge: string;
  exams_heading: string;
  exams_subtitle: string;
  exams_band_text: string;
  resources_badge: string;
  resources_heading: string;
  resources_subtitle: string;
  courses_badge: string;
  courses_heading: string;
  courses_subtitle: string;
  contact_badge: string;
  contact_heading: string;
  contact_direct_heading: string;
  contact_direct_description: string;
  contact_location_note: string;
  resources_page_title: string;
  resources_page_subtitle: string;
  courses_page_title: string;
  courses_page_subtitle: string;
  tutoring_page_title: string;
  tutoring_page_subtitle: string;
}

export type BadgeColor = 'yellow' | 'green' | 'blue' | 'orange' | 'purple' | 'default';
export type SubjectColor = 'green' | 'blue' | 'orange';

export interface QualBadge {
  label: string;
  color: BadgeColor;
}

export interface SubjectCell {
  name: string;
  accentColor: SubjectColor;
  topics: string;
}

export interface School {
  id?: string;
  status?: string;
  sort?: number;
  name: string;
  type: string;
  qualifications: QualBadge[];
  subjects: SubjectCell[];
}

export type TagColor = 'green' | 'yellow' | 'blue' | 'orange' | 'purple';

export interface ExamDestination {
  id?: string;
  status?: string;
  sort?: number;
  destination: string;
  flag: string;
  exam_name: string;
  tag_label: string;
  tag_color: TagColor;
  description: string;
  subjects: string[];
}

export interface MedicalBlockData {
  title: string;
  description: string;
  subjects: string[];
}

export interface TutoringTier {
  id?: string;
  status?: string;
  sort?: number;
  name: string;
  emoji: string;
  size_label: string | null;
  description: string;
  benefits: string[];
  best_for: string;
  price: string;
  price_unit: string;
  accent_color: string;
  cta_text: string;
  cta_url: string;
}

export interface TutoringStep {
  id?: string;
  status?: string;
  sort?: number;
  emoji: string;
  title: string;
  description: string;
  page: 'tutoring' | 'courses';
}

export interface TutoringSubject {
  id?: string;
  status?: string;
  sort?: number;
  name: string;
  accent_color: string;
  levels: string[];
}
