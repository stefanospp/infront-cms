import type { CollectionConfig } from '@sonicjs-cms/core';

const siteContent: CollectionConfig = {
  name: 'site_content',
  displayName: 'Site Content',
  description: 'Site-wide text content — hero, section headings, page text. Only one item should exist (singleton).',
  icon: '🎯',
  managed: true,
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      // Hero section
      hero_badge: { type: 'string', title: 'Hero Badge' },
      hero_heading: { type: 'string', title: 'Hero Heading' },
      hero_heading_highlight: { type: 'string', title: 'Hero Heading Highlight' },
      hero_subheading: { type: 'textarea', title: 'Hero Subheading', description: 'HTML allowed — use <strong> for bold school names' },
      hero_cta_primary_text: { type: 'string', title: 'CTA Primary Text' },
      hero_cta_primary_href: { type: 'string', title: 'CTA Primary Href' },
      hero_whatsapp_url: { type: 'string', title: 'WhatsApp URL' },
      hero_viber_url: { type: 'string', title: 'Viber URL' },
      ticker_items: { type: 'json', title: 'Ticker Items', description: 'JSON array of strings shown in the scrolling ticker' },
      // Section headings
      schools_badge: { type: 'string', title: 'Schools Badge' },
      schools_heading: { type: 'string', title: 'Schools Heading', description: 'Use <mark> for highlighted text' },
      schools_subtitle: { type: 'textarea', title: 'Schools Subtitle' },
      exams_badge: { type: 'string', title: 'Exams Badge' },
      exams_heading: { type: 'string', title: 'Exams Heading', description: 'Use <mark> for highlighted text, <br /> for line breaks' },
      exams_subtitle: { type: 'textarea', title: 'Exams Subtitle' },
      exams_band_text: { type: 'string', title: 'Exams Band Text' },
      resources_badge: { type: 'string', title: 'Resources Badge' },
      resources_heading: { type: 'string', title: 'Resources Heading' },
      resources_subtitle: { type: 'textarea', title: 'Resources Subtitle' },
      courses_badge: { type: 'string', title: 'Courses Badge' },
      courses_heading: { type: 'string', title: 'Courses Heading' },
      courses_subtitle: { type: 'textarea', title: 'Courses Subtitle' },
      // Contact
      contact_badge: { type: 'string', title: 'Contact Badge' },
      contact_heading: { type: 'string', title: 'Contact Heading' },
      contact_direct_heading: { type: 'string', title: 'Contact Direct Heading' },
      contact_direct_description: { type: 'textarea', title: 'Contact Direct Description' },
      contact_location_note: { type: 'string', title: 'Contact Location Note' },
      // Page titles
      resources_page_title: { type: 'string', title: 'Resources Page Title' },
      resources_page_subtitle: { type: 'textarea', title: 'Resources Page Subtitle' },
      courses_page_title: { type: 'string', title: 'Courses Page Title' },
      courses_page_subtitle: { type: 'textarea', title: 'Courses Page Subtitle' },
      tutoring_page_title: { type: 'string', title: 'Tutoring Page Title' },
      tutoring_page_subtitle: { type: 'textarea', title: 'Tutoring Page Subtitle' },
    },
  },
  listFields: ['hero_heading'],
};

export default siteContent;
