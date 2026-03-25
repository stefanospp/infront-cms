import { createSonicJSApp, registerCollections } from '@sonicjs-cms/core';
import type { CollectionConfig } from '@sonicjs-cms/core';

import siteContent from './collections/site-content.collection';
import medicalBlock from './collections/medical-block.collection';
import resources from './collections/resources.collection';
import courses from './collections/courses.collection';
import schools from './collections/schools.collection';
import examDestinations from './collections/exam-destinations.collection';
import tutoringTiers from './collections/tutoring-tiers.collection';
import tutoringSteps from './collections/tutoring-steps.collection';
import tutoringSubjects from './collections/tutoring-subjects.collection';

// Register all Theorium collections
const collections: CollectionConfig[] = [
  siteContent,
  medicalBlock,
  resources,
  courses,
  schools,
  examDestinations,
  tutoringTiers,
  tutoringSteps,
  tutoringSubjects,
];

registerCollections(collections);

// Create the app with collection auto-sync enabled
const app = createSonicJSApp({
  collections: {
    autoSync: true,
  },
  plugins: {
    autoLoad: false,
  },
});

export default app;
