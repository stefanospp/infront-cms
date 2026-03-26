import type { CollectionConfig } from '@sonicjs-cms/core';

const contactContent: CollectionConfig = {
  name: 'contact_content',
  displayName: 'Contact Content',
  description: 'Contact section text — direct message heading, description, and location note. One item only.',
  icon: '📞',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      direct_heading: { type: 'string', title: 'Direct Message Heading' },
      direct_description: { type: 'textarea', title: 'Direct Message Description' },
      location_note: { type: 'string', title: 'Location Note', helpText: 'e.g. In-person lessons · address shared on contact' },
    },
  },
  listFields: ['title', 'direct_heading'],
};

export default contactContent;
