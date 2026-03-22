# Visual Editor

## Overview

The visual editor is a Shopify-style three-panel interface for editing site pages. It runs at `/sites/[slug]/editor` in the admin dashboard.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Toolbar: Back | slug / page | Status | Settings | Media    │
│           Full Preview | Save | Publish                      │
├──────────┬────────────────────────────────┬──────────────────┤
│          │                                │                  │
│  Pages   │                                │   Properties     │
│  ────    │     Live Preview               │   ──────────     │
│  404     │     (iframe → dev server)      │   Component:     │
│  About   │                                │   Hero           │
│  Contact │     Shows actual site          │                  │
│  Home ◄  │     with HMR updates           │   Variant:       │
│          │                                │   [centered]     │
│  Sections│                                │   [split] ✓      │
│  ────    │                                │   [fullscreen]   │
│  Hero ◄  │                                │                  │
│  CardGrid│                                │   Props:         │
│  CTA     │                                │   Heading: [___] │
│          │                                │   Subhead: [___] │
│  [+Add]  │                                │   CTA: [______]  │
└──────────┴────────────────────────────────┴──────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `sites/admin/src/pages/sites/[slug]/editor.astro` | Editor page route (SSR) |
| `sites/admin/src/islands/SiteEditor.tsx` | Main editor orchestrator (React) |
| `sites/admin/src/islands/editor/EditorToolbar.tsx` | Top toolbar with save/publish/settings/media/preview |
| `sites/admin/src/islands/editor/EditorSidebar.tsx` | Left panel: page list + section tree + add section modal |
| `sites/admin/src/islands/editor/EditorPreview.tsx` | Center panel: iframe with dev server, device toggles, bridge |
| `sites/admin/src/islands/editor/EditorProperties.tsx` | Right panel: variant picker, section wrapper, prop editors |
| `sites/admin/src/islands/editor/EditorConfig.tsx` | Site config editor modal (tabbed: general/contact/SEO/nav/theme) |
| `sites/admin/src/islands/editor/MediaLibrary.tsx` | Media library modal (upload/browse/select images) |
| `sites/admin/src/islands/editor/registry.ts` | Re-exports from @agency/config + editor helpers |

## Features

### Page Navigation
- Left sidebar lists all `.astro` pages detected in the site
- Clicking a page switches the preview iframe and loads that page's sections
- Pages with icons for common types (home, about, contact, services)

### Section Management
- Sections listed with component name and variant badge
- Move up/down buttons to reorder
- Remove button to delete
- "Add Section" opens a modal with all 22 components grouped by category
- Search/filter in the add modal

### Properties Panel
- **Variant picker**: Visual buttons for each variant (e.g., centered, split, fullscreen)
- **Section wrapper**: Heading, subheading, background (light/dark/primary)
- **Property editors**: Text inputs, URL inputs, number inputs, select dropdowns, boolean toggles, image pickers, array editors (add/remove items)

### Live Preview
- Spins up an Astro dev server per site on ports 4400-4500
- Embeds in an iframe with Desktop/Tablet/Mobile device toggles
- Auto-refreshes via HMR when files change after save
- Refresh button for manual reload

### Full Page Preview
- Toggle button in toolbar hides sidebar + properties panel
- Preview expands to full width
- Button shows "Full Page Preview" / "Exit Preview" with active state

### Auto-Save
- 1.5-second debounced auto-save after any edit
- Writes to both schema JSON and compiled `.astro` file
- HMR picks up file changes and updates the preview

### Inline Editing Bridge
- Vite plugin (`editorBridgePlugin`) injects a bridge script in dev mode
- Bridge script adds hover overlays and click handlers to sections
- Clicking in the iframe selects the section in the sidebar
- Double-click enables contenteditable for inline text editing
- Communication via `postMessage` between iframe and editor

### Save Flow

```
User edits prop → React state updates → hasUnsavedChanges = true
       │
       ▼ (1.5s debounce)
Auto-save: PUT /api/sites/{slug}/pages/{page}
       │
       ▼
API validates with zod → savePageSchema()
       │
       ├── Writes schema JSON to sites/{slug}/src/schemas/{page}.json
       └── Compiles to .astro file at sites/{slug}/src/pages/{page}.astro
                │
                ▼
        Astro dev server HMR detects file change → preview updates
```

## Page Schema Format

```json
{
  "page": "index",
  "title": "Home",
  "layout": "FullWidth",
  "seo": {
    "title": "Home",
    "description": "Welcome to our site"
  },
  "sections": [
    {
      "id": "hero-1",
      "component": "Hero",
      "variant": "split",
      "heading": "Section Heading",
      "subheading": "Section Subheading",
      "background": "light",
      "props": {
        "heading": "Welcome",
        "subheading": "We build websites",
        "ctaText": "Get Started",
        "ctaHref": "/contact"
      }
    }
  ]
}
```

## Schema Compiler

The compiler (`packages/utils/src/schema-compiler.ts`) converts a `PageSchema` into a valid `.astro` file:

- Generates import statements (layout, components, config)
- Adds `data-section-id` and `data-component` attributes for the editor bridge
- Handles Section wrappers (heading/subheading/background)
- Preserves config expressions like `{config.theme.heroDefault}` as Astro expressions
- Supports React islands with `client:visible` directives

## Schema Parser

The parser (`packages/utils/src/schema-parser.ts`) reverse-engineers `.astro` files into `PageSchema`:

- Extracts layout, title, description from frontmatter
- Parses component tags with their props
- Detects Section wrappers and extracts heading/subheading/background
- Strips editor bridge attributes (`data-section-id`, `data-component`)
- Handles `<div>` wrappers added by the compiler
- Used as fallback when no schema JSON exists
