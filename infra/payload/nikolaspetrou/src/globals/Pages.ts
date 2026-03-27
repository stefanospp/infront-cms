import type { GlobalConfig } from 'payload'

export const Pages: GlobalConfig = {
  slug: 'pages',
  access: {
    read: () => true,
  },
  fields: [
    // ── About Page ──
    {
      type: 'group',
      name: 'about',
      fields: [
        { name: 'video_url', type: 'text', admin: { description: 'Full-screen background video' } },
        { name: 'directorName', type: 'text', defaultValue: 'Nikolas Petrou' },
        { name: 'location', type: 'text', defaultValue: 'Cyprus' },
        {
          name: 'specialisations',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        { name: 'bio', type: 'textarea', admin: { description: 'First paragraph' } },
        { name: 'bio2', type: 'textarea', admin: { description: 'Second paragraph' } },
        {
          name: 'stats',
          type: 'array',
          fields: [
            { name: 'value', type: 'text', required: true },
            { name: 'label', type: 'text', required: true },
          ],
        },
        {
          name: 'process',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'text', required: true },
          ],
        },
        {
          name: 'equipment',
          type: 'array',
          fields: [{ name: 'name', type: 'text', required: true }],
        },
      ],
    },

    // ── Contact Page ──
    {
      type: 'group',
      name: 'contact',
      fields: [
        { name: 'heading', type: 'text', defaultValue: "Let's Talk" },
        { name: 'subtext', type: 'textarea', defaultValue: "Have a project in mind? I'd love to hear about it. Drop me a message and I'll get back to you within 24 hours." },
        { name: 'email', type: 'email', defaultValue: 'hello@nikolaspetrou.com' },
        { name: 'location', type: 'text', defaultValue: 'Cyprus' },
        {
          name: 'socialLinks',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
        {
          name: 'projectTypes',
          type: 'array',
          admin: { description: 'Options in the project type dropdown' },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'value', type: 'text', required: true },
          ],
        },
        {
          name: 'budgetRanges',
          type: 'array',
          admin: { description: 'Options in the budget dropdown' },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'value', type: 'text', required: true },
          ],
        },
      ],
    },

    // ── Legal Pages ──
    {
      type: 'group',
      name: 'legal',
      fields: [
        { name: 'lastUpdated', type: 'date' },
        {
          name: 'privacySections',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'body', type: 'textarea', required: true },
          ],
        },
        {
          name: 'termsSections',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'body', type: 'textarea', required: true },
          ],
        },
      ],
    },
  ],
}
