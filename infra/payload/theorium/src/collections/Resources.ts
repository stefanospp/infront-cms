import type { CollectionConfig } from 'payload'
import { collectionRebuildHook } from '../hooks/triggerRebuild'

export const Resources: CollectionConfig = {
  slug: 'resources',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'subject', 'type', 'status', 'order'],
  },
  access: { read: () => true },
  hooks: { afterChange: [collectionRebuildHook] },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar' } },
    { name: 'description', type: 'textarea', required: true },
    {
      name: 'subject',
      type: 'select',
      required: true,
      options: [
        { label: 'Biology', value: 'Biology' },
        { label: 'Chemistry', value: 'Chemistry' },
        { label: 'Physics', value: 'Physics' },
      ],
    },
    {
      name: 'level',
      type: 'select',
      required: true,
      options: [
        { label: 'IGCSE', value: 'IGCSE' },
        { label: 'A-Level', value: 'A-Level' },
        { label: 'IB', value: 'IB' },
      ],
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Past Papers', value: 'Past Papers' },
        { label: 'Notes', value: 'Notes' },
        { label: 'Worksheets', value: 'Worksheets' },
        { label: 'Reference', value: 'Reference' },
        { label: 'Video', value: 'Video' },
        { label: 'External Link', value: 'External Link' },
      ],
    },
    {
      name: 'examBoard',
      type: 'select',
      required: true,
      options: [
        { label: 'Cambridge', value: 'Cambridge' },
        { label: 'Edexcel', value: 'Edexcel' },
        { label: 'IB', value: 'IB' },
        { label: 'All Boards', value: 'All Boards' },
      ],
    },
    { name: 'file', type: 'upload', relationTo: 'media', admin: { description: 'Upload the downloadable file' } },
    { name: 'fileSize', type: 'text', admin: { description: 'e.g. "24 MB" (auto-filled if file uploaded)' } },
    { name: 'url', type: 'text', admin: { description: 'External link URL (if not a file upload)' } },
    { name: 'color', type: 'text', defaultValue: '#fff33b' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'coming-soon',
      options: [
        { label: 'Available', value: 'available' },
        { label: 'Coming Soon', value: 'coming-soon' },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
