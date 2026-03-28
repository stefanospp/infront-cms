import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    crop: false,
    focalPoint: false,
    mimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  access: { read: () => true },
  fields: [
    { name: 'alt', type: 'text' },
  ],
}
