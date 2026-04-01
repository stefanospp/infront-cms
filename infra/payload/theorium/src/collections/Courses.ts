import type { CollectionConfig } from 'payload'
import { collectionRebuildHook } from '../hooks/triggerRebuild'

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'subject', 'season', 'status', 'order'],
  },
  access: { read: () => true },
  hooks: { afterChange: [collectionRebuildHook] },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar' } },
    { name: 'description', type: 'textarea', required: true, admin: { description: 'Short description for listing cards (1-2 sentences)' } },
    { name: 'fullDescription', type: 'richText', admin: { description: 'Detailed description for the course detail page' } },
    { name: 'dates', type: 'text', required: true, admin: { description: 'e.g. "Mar – Apr", "Jul", "Nov – Dec"' } },
    {
      name: 'subject',
      type: 'select',
      required: true,
      options: [
        { label: 'Biology', value: 'Biology' },
        { label: 'Chemistry', value: 'Chemistry' },
        { label: 'Physics', value: 'Physics' },
        { label: 'All Sciences', value: 'All Sciences' },
        { label: 'Medical Entry', value: 'Medical Entry' },
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
        { label: 'IGCSE + A-Level', value: 'IGCSE + A-Level' },
        { label: 'University Entry', value: 'University Entry' },
      ],
    },
    {
      name: 'season',
      type: 'select',
      required: true,
      options: [
        { label: 'Easter', value: 'Easter' },
        { label: 'Summer', value: 'Summer' },
        { label: 'Autumn', value: 'Autumn' },
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
        { label: 'UCAT', value: 'UCAT' },
      ],
    },
    { name: 'schools', type: 'relationship', relationTo: 'schools', hasMany: true },
    { name: 'classSize', type: 'text', admin: { description: 'e.g. "Max 8"' } },
    { name: 'duration', type: 'text', admin: { description: 'e.g. "4 days", "3 weeks"' } },
    { name: 'schedule', type: 'text', admin: { description: 'e.g. "10:00 – 14:00 daily"' } },
    { name: 'color', type: 'text', defaultValue: '#fff33b', admin: { description: 'Hex color for card badge' } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'coming-soon',
      options: [
        { label: 'Enrolling', value: 'enrolling' },
        { label: 'Coming Soon', value: 'coming-soon' },
      ],
    },
    { name: 'price', type: 'text', admin: { description: 'e.g. "€160" (leave empty to hide)' } },
    { name: 'priceNote', type: 'text', admin: { description: 'e.g. "per student"' } },
    {
      name: 'topics',
      type: 'array',
      admin: { description: 'Topics covered in this course' },
      fields: [{ name: 'topic', type: 'text', required: true }],
    },
    {
      name: 'whatYouGet',
      type: 'array',
      admin: { description: 'What students receive/inclusions' },
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
