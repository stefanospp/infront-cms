import type { CollectionConfig } from '@sonicjs-cms/core';

const pageContent: CollectionConfig = {
  name: 'page_content',
  displayName: 'Page Content',
  description: 'Inner page hero text — one item per page (resources, courses, tutoring).',
  icon: '📄',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      page: {
        type: 'select',
        title: 'Page',
        required: true,
        enum: ['resources', 'courses', 'tutoring'],
        enumLabels: ['Resources', 'Courses', 'Tutoring'],
      },
      page_title: { type: 'quill', title: 'Page Title', helpText: 'Use <mark> for highlighted text' },
      page_subtitle: { type: 'textarea', title: 'Page Subtitle' },
    },
    required: ['page'],
  },
  listFields: ['title', 'page'],
};

export default pageContent;
