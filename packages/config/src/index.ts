export type {
  NavItem,
  NavCTA,
  NavConfig,
  SocialLinks,
  FooterColumn,
  FooterConfig,
  AddressConfig,
  ContactConfig,
  SEOConfig,
  AnalyticsConfig,
  CMSConfig,
  ThemeConfig,
  SiteConfig,
  TemplateSectionDefinition,
  TemplatePageDefinition,
  TemplateColorScale,
  TemplateThemeTokens,
  TemplateDefinition,
} from './types.js';

export { templates, getTemplate, listTemplates } from './templates.js';

export type { SectionSchema, PageSchema } from './page-schema.js';

export type {
  PropDefinition,
  ComponentCategory,
  ComponentDefinition,
} from './component-registry.js';

export {
  componentRegistry,
  getComponent,
  listComponentsByCategory,
  listAstroComponents,
  listIslandComponents,
  listComponentsWithVariants,
  getComponentVariants,
} from './component-registry.js';
