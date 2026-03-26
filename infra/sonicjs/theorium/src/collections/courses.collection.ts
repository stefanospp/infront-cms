import type { CollectionConfig } from '@sonicjs-cms/core';

const courses: CollectionConfig = {
  name: 'courses',
  displayName: 'Courses',
  description: 'Online revision courses via Zoom',
  icon: '🎓',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      subject: {
        type: 'select',
        title: 'Subject',
        required: true,
        enum: ['Biology', 'Chemistry', 'Physics', 'Mathematics'],
      },
      level: { type: 'string', title: 'Level' },
      description: { type: 'textarea', title: 'Description' },
      syllabus: {
        type: 'array',
        title: 'Syllabus Topics',
        helpText: 'Topics covered in this course',
        items: { type: 'string', title: 'Topic' },
      },
      schedule: { type: 'string', title: 'Schedule' },
      start_date: { type: 'string', title: 'Start Date' },
      duration: { type: 'string', title: 'Duration' },
      price: { type: 'string', title: 'Price' },
      zoom_url: { type: 'url', title: 'Zoom URL' },
      course_status: {
        type: 'select',
        title: 'Course Status',
        required: true,
        enum: ['upcoming', 'in-progress', 'full', 'completed'],
        default: 'upcoming',
      },
      max_students: { type: 'number', title: 'Max Students' },
      sort: { type: 'number', title: 'Sort Order' },
    },
    required: ['subject', 'course_status'],
  },
  listFields: ['title', 'subject', 'course_status'],
  searchFields: ['title', 'description'],
  defaultSort: 'created_at',
};

export default courses;
