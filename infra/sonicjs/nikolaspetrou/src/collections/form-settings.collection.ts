import type { CollectionConfig } from '@sonicjs-cms/core';

const formSettings: CollectionConfig = {
  name: 'form_settings',
  displayName: 'Form Settings',
  description: 'Contact form configuration — fields, recipients, messages. One item per form.',
  icon: '📝',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      form_name: { type: 'string', title: 'Form Name', required: true, helpText: 'Internal name (e.g. "contact")' },
      fields: {
        type: 'array', title: 'Form Fields',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Field Name', required: true },
            label: { type: 'string', title: 'Label', required: true },
            type: { type: 'select', title: 'Type', enum: ['text', 'email', 'tel', 'textarea', 'select'], default: 'text' },
            required: { type: 'boolean', title: 'Required', default: false },
            placeholder: { type: 'string', title: 'Placeholder' },
          },
        },
      },
      notification_recipients: {
        type: 'array', title: 'Notification Recipients',
        helpText: 'Email addresses that receive form submission notifications',
        items: { type: 'email', title: 'Email' },
      },
      success_message: { type: 'string', title: 'Success Message' },
      error_message: { type: 'string', title: 'Error Message' },
      submit_button_text: { type: 'string', title: 'Submit Button Text', default: 'Send message' },
      enable_turnstile: { type: 'boolean', title: 'Enable Turnstile Bot Protection', default: false },
    },
    required: ['form_name'],
  },
  listFields: ['title', 'form_name'],
};

export default formSettings;
