export type HelpCategory =
  | 'getting-started'
  | 'architecture'
  | 'admin-ui'
  | 'site-creation'
  | 'shared-packages'
  | 'components'
  | 'deployment'
  | 'infrastructure'
  | 'testing'
  | 'configuration'
  | 'api-reference'
  | 'developer-workflows'
  | 'security-accessibility'
  | 'troubleshooting';

export interface HelpCategoryMeta {
  id: HelpCategory;
  label: string;
  description: string;
  icon: string;
  order: number;
}

export interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: HelpCategory;
  tags: string[];
  body: string;
  relatedArticles?: string[];
}
