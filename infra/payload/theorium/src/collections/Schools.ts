import type { CollectionConfig } from 'payload'
import { collectionRebuildHook } from '../hooks/triggerRebuild'

export const Schools: CollectionConfig = {
  slug: 'schools',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'location', 'examBoards', 'order'],
  },
  access: { read: () => true },
  hooks: { afterChange: [collectionRebuildHook] },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'location',
      type: 'select',
      required: true,
      options: [
        { label: 'Larnaca', value: 'Larnaca' },
        { label: 'Nicosia', value: 'Nicosia' },
        { label: 'Limassol', value: 'Limassol' },
      ],
    },
    { name: 'examBoards', type: 'text', required: true, admin: { description: 'e.g. "Cambridge · Edexcel · IB"' } },
    {
      name: 'levels',
      type: 'array',
      admin: { description: 'Qualification levels offered' },
      fields: [
        { name: 'label', type: 'text', required: true, admin: { description: 'e.g. IGCSE, A-Level, IB HL/SL' } },
        { name: 'filled', type: 'checkbox', defaultValue: false, admin: { description: 'Primary/filled badge style' } },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
