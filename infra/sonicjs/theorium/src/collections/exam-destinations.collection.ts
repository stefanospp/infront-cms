import type { CollectionConfig } from '@sonicjs-cms/core';

const examDestinations: CollectionConfig = {
  name: 'exam_destinations',
  displayName: 'Exam Destinations',
  description: 'University entrance exam destinations. Title = country/destination name.',
  icon: '✈️',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      flag: { type: 'string', title: 'Flag Emoji' },
      exam_name: { type: 'string', title: 'Exam Name', required: true },
      tag_label: { type: 'string', title: 'Tag Label' },
      tag_color: {
        type: 'select',
        title: 'Tag Color',
        enum: ['green', 'yellow', 'blue', 'orange', 'purple'],
      },
      description: { type: 'textarea', title: 'Description' },
      subjects: {
        type: 'array',
        title: 'Subjects',
        helpText: 'Subjects covered for this exam destination',
        items: { type: 'string', title: 'Subject' },
      },
      sort: { type: 'number', title: 'Sort Order' },
    },
    required: ['exam_name'],
  },
  listFields: ['title', 'exam_name', 'tag_label'],
  defaultSort: 'created_at',
};

export default examDestinations;
