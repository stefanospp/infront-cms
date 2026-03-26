import type { CollectionConfig } from '@sonicjs-cms/core';

const projects: CollectionConfig = {
  name: 'projects',
  displayName: 'Projects',
  description: 'Portfolio projects — videos, images, details. Title = project name, slug = URL path.',
  icon: '🎥',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      subtitle: { type: 'string', title: 'Subtitle' },
      image: { type: 'url', title: 'Poster Image URL' },
      video_url: { type: 'url', title: 'Video URL' },
      reel_url: { type: 'url', title: 'Instagram Reel URL' },
      sort_order: { type: 'number', title: 'Sort Order' },
      featured_in_hero: { type: 'boolean', title: 'Featured in Hero', default: false },
      hero_sort_order: { type: 'number', title: 'Hero Sort Order', helpText: 'Order in the hero carousel (only if featured)' },
      description: { type: 'quill', title: 'Description' },
      client: { type: 'string', title: 'Client Name' },
      year: { type: 'string', title: 'Year' },
      category: { type: 'string', title: 'Category' },
      gallery: {
        type: 'array', title: 'Gallery',
        helpText: 'Additional images/videos for this project',
        items: { type: 'url', title: 'URL' },
      },
    },
  },
  listFields: ['title', 'client', 'category'],
  searchFields: ['title', 'client', 'category'],
  defaultSort: 'created_at',
};

export default projects;
