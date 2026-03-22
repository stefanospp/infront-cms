# Component Registry

## Overview

The component registry (`packages/config/src/component-registry.ts`) catalogs all 22 shared UI components with their props, variants, and metadata. It drives the visual editor's section picker, property panel, and inline editing.

## Components

### Astro Components (19)

| Component | Category | Variants | Key Props |
|-----------|----------|----------|-----------|
| **Hero** | hero | centered, split, fullscreen, minimal, video | heading, subheading, ctaText, ctaHref, backgroundImage, backgroundVideo |
| **CTA** | cta | default, split, minimal | heading, description, buttonText, buttonHref, image |
| **CardGrid** | content | two-column, three-column, four-column, masonry, list | cards[] (title, description, image, href) |
| **Features** | content | grid, alternating, icon-list | features[] (title, description, icon, image) |
| **Testimonials** | testimonial | default, carousel, featured | testimonials[] (quote, author, role, image) |
| **TeamGrid** | team | default, compact, detailed | members[] (name, role, bio, photo, email) |
| **FAQ** | faq | default, two-column | items[] (question, answer) |
| **Gallery** | media | grid, masonry | items[] (image, title, description, href) |
| **StatsCounter** | stats | inline, grid | stats[] (value, label, prefix, suffix) |
| **Timeline** | timeline | vertical, alternating | events[] (year, title, description) |
| **LogoCloud** | logo | grid, scrolling | logos[] (name, image, href), heading |
| **PricingTable** | pricing | two-column, three-column | plans[] (name, price, period, features[], ctaText, ctaHref, highlighted) |
| **Section** | layout | light, dark, primary | heading, subheading, background, id |
| **Nav** | navigation | — | config (site config) |
| **Footer** | footer | simple, multi-column, minimal | config (site config) |
| **ContactSection** | form | — | config (site config) |
| **Map** | media | — | address |
| **OpeningHours** | content | — | hours[] (day, hours) |
| **SEOHead** | layout | — | title, description, ogImage, canonicalUrl, noIndex |

### React Islands (3)

| Component | Category | Props |
|-----------|----------|-------|
| **ContactForm** | form | action, successMessage |
| **CookieConsent** | interactive | analyticsProvider, siteId |
| **MobileNav** | navigation | items[], cta |

Islands use `client:visible` by default (or `client:idle`/`client:load`).

## Categories

| Category | Components |
|----------|-----------|
| hero | Hero |
| content | CardGrid, Features, OpeningHours |
| cta | CTA |
| navigation | Nav, MobileNav |
| form | ContactSection, ContactForm |
| media | Gallery, Map |
| testimonial | Testimonials |
| team | TeamGrid |
| faq | FAQ |
| pricing | PricingTable |
| stats | StatsCounter |
| timeline | Timeline |
| logo | LogoCloud |
| footer | Footer |
| layout | Section, SEOHead |
| interactive | CookieConsent |

## Prop Types

| Type | Editor Input | Description |
|------|-------------|-------------|
| `text` | Text input | Plain text string |
| `richtext` | Textarea | Multi-line text |
| `url` | URL input | URL string |
| `image` | Image picker | Image path |
| `boolean` | Toggle switch | True/false |
| `number` | Number input | Numeric value |
| `select` | Dropdown | One of predefined options |
| `array` | Item list with add/remove | Array of objects with nested props |
| `color` | Color picker | Color hex value |

## Helper Functions

```typescript
import {
  componentRegistry,          // Record<string, ComponentDefinition>
  getComponent,               // (name: string) => ComponentDefinition | undefined
  listComponentsByCategory,   // (category: string) => ComponentDefinition[]
  listAstroComponents,        // () => ComponentDefinition[]
  listIslandComponents,       // () => ComponentDefinition[]
  listComponentsWithVariants, // () => ComponentDefinition[]
  getComponentVariants,       // (name: string) => string[]
} from '@agency/config';
```

## Component Override System

Sites can override any shared component by creating a file with the same name in `sites/{slug}/src/components/`. The Vite plugin `componentOverridePlugin` intercepts `@agency/ui/components/*` imports and checks for local overrides first.

```
sites/my-site/src/components/Hero.astro  ← overrides @agency/ui/components/Hero.astro
```

Override rules:
- Must accept the same props interface
- Should use Tailwind tokens for theming
- Not managed by the visual editor (maintained manually)
- Visible on the site management page in admin
