import type { CollectionConfig } from '@sonicjs-cms/core';

const sectionHeadings: CollectionConfig = {
  name: 'section_headings',
  displayName: 'Section Headings',
  description: 'Homepage section headings — one item per section (schools, exams, resources, courses, contact).',
  icon: '📑',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      section: {
        type: 'select',
        title: 'Section',
        required: true,
        enum: ['schools', 'exams', 'resources', 'courses', 'contact'],
        enumLabels: ['Schools', 'Exams & University', 'Resources', 'Courses', 'Contact'],
      },
      badge: { type: 'string', title: 'Badge Text', helpText: 'Small label above the heading' },
      heading: { type: 'quill', title: 'Heading', helpText: 'Use <mark> for highlighted text, <br /> for line breaks' },
      subtitle: { type: 'textarea', title: 'Subtitle' },
      band_text: { type: 'string', title: 'Band Text', helpText: 'Optional dark band text (exams section only)' },
      sort: { type: 'number', title: 'Sort Order' },
    },
    required: ['section'],
  },
  listFields: ['title', 'section'],
  defaultSort: 'created_at',
};

export default sectionHeadings;
