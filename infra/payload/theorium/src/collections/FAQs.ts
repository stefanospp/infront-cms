import type { CollectionConfig } from 'payload'
import { collectionRebuildHook } from '../hooks/triggerRebuild'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'order'],
  },
  access: { read: () => true },
  hooks: { afterChange: [collectionRebuildHook] },
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'textarea', required: true },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
