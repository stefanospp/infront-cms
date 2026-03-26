// ─── Generic SonicJs content item ─────────────────────────────────────────────

export interface CmsItem<T = Record<string, unknown>> {
  id: string;
  title: string;
  slug: string;
  status: string;
  data: T;
  created_at: number;
  updated_at: number;
}

// ─── Collection data shapes (what lives in .data) ─────────────────────────────

export interface SiteSettingsData {
  tagline: string;
  url: string;
  locale: string;
  contact_email: string;
  contact_phone: string;
  contact_city: string;
  contact_country: string;
  nav_items: Array<{ label: string; href: string }>;
  nav_cta_label: string;
  nav_cta_href: string;
  footer_text: string;
  meta_default_title: string;
  meta_title_template: string;
  meta_default_description: string;
  meta_og_image: string;
  structured_data_type: string;
}

export interface HeroData {
  badge: string;
  heading: string;
  heading_highlight: string;
  subheading: string;
  cta_text: string;
  cta_href: string;
  whatsapp_url: string;
  viber_url: string;
  ticker_items: string[];
}

export interface SectionHeadingData {
  section: 'schools' | 'exams' | 'resources' | 'courses' | 'contact';
  badge: string;
  heading: string;
  subtitle: string;
  band_text: string;
  sort: number;
}

export interface PageContentData {
  page: 'resources' | 'courses' | 'tutoring';
  page_title: string;
  page_subtitle: string;
}

export interface ContactContentData {
  direct_heading: string;
  direct_description: string;
  location_note: string;
}

export interface ResourceData {
  subject: 'Biology' | 'Chemistry' | 'Physics' | 'Mathematics';
  exam_board: 'IGCSE' | 'A-Level' | 'IB' | 'Pancyprian' | 'SAT';
  resource_type: 'Revision Notes' | 'Past Papers' | 'Topic Summary' | 'Formula Sheet' | 'Checklist';
  description: string | null;
  drive_url: string;
  sort: number;
}

export interface CourseData {
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

export interface SchoolData {
  type: string;
  qualifications: QualBadge[];
  subjects: SubjectCell[];
  sort: number;
}

export type TagColor = 'green' | 'yellow' | 'blue' | 'orange' | 'purple';

export interface ExamDestinationData {
  flag: string;
  exam_name: string;
  tag_label: string;
  tag_color: TagColor;
  description: string;
  subjects: string[];
  sort: number;
}

export interface MedicalBlockData {
  description: string;
  subjects: string[];
}

export interface TutoringTierData {
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
  sort: number;
}

export interface TutoringStepData {
  emoji: string;
  description: string;
  page: 'tutoring' | 'courses';
  sort: number;
}

export interface TutoringSubjectData {
  accent_color: string;
  levels: string[];
  sort: number;
}

export interface PageBlockHero {
  blockType: 'hero';
  heading: string;
  subheading: string;
  cta_text: string;
  cta_href: string;
}

export interface PageBlockText {
  blockType: 'text';
  content: string;
}

export interface PageBlockFeatures {
  blockType: 'features';
  heading: string;
  items: Array<{ icon: string; title: string; description: string }>;
}

export interface PageBlockCta {
  blockType: 'cta';
  heading: string;
  text: string;
  button_text: string;
  button_href: string;
}

export interface PageBlockFaq {
  blockType: 'faq';
  heading: string;
  items: Array<{ question: string; answer: string }>;
}

export interface PageBlockImage {
  blockType: 'image';
  src: string;
  alt: string;
  caption: string;
}

export type PageBlock = PageBlockHero | PageBlockText | PageBlockFeatures | PageBlockCta | PageBlockFaq | PageBlockImage;

export interface PageData {
  nav_label: string;
  layout: 'full-width' | 'single-column' | 'with-sidebar';
  body: PageBlock[];
  meta_title: string;
  meta_description: string;
}
