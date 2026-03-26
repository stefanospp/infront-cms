import type { CollectionConfig } from '@sonicjs-cms/core';

const testimonials: CollectionConfig = {
  name: 'testimonials',
  displayName: 'Testimonials',
  description: 'Client testimonials — name, role, quote, video.',
  icon: '💬',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Client Name', required: true },
      role: { type: 'string', title: 'Role / Company' },
      quote: { type: 'textarea', title: 'Quote' },
      video_url: { type: 'url', title: 'Video Testimonial URL' },
      image: { type: 'url', title: 'Client Photo URL' },
      sort_order: { type: 'number', title: 'Sort Order' },
    },
    required: ['name'],
  },
  listFields: ['title', 'name', 'role'],
  defaultSort: 'created_at',
};

export default testimonials;
