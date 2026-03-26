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
        type: 'json', title: 'Form Fields',
        helpText: 'JSON array: [{"name":"email","label":"Email","type":"email","required":true,"placeholder":"you@example.com"}]',
      },
      notification_recipients: {
        type: 'json', title: 'Notification Recipients',
        helpText: 'JSON array of emails: ["hello@example.com"]',
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
