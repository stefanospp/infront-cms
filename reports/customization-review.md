# Site Customization & Flexibility Review

**Date:** 2026-03-23
**Reviewer:** Claude Opus 4.6 (Customization & Flexibility)
**Scope:** Customization capabilities, visual editor, wizard, and theming system at `/Users/stefanospetrou/Desktop/Apps/infront-cms`

---

## Executive Summary

**Overall Flexibility: GOOD with key gaps**

The platform offers a strong customization spectrum from simple config changes to full component overrides. The 5-step creation wizard is comprehensive, covering identity, template selection, theme customization (colors, fonts, layouts), configuration, and deployment. However, there is a critical gap: once a site is created, theme changes (colors and fonts) require manual code editing. The wizard's color picker and font selector are creation-only with no post-creation equivalent.

The review uncovered **1 Critical**, **3 High**, and **3 Medium** severity issues.

---

## Critical Issues

### CUS-C1: No Post-Creation Theme Editing in UI

**File:** `sites/admin/src/islands/SiteWizard.tsx` (Step 3)
**File:** `sites/admin/src/islands/SiteDetail.tsx`

**Description:** The wizard (Step 3 of `sites/admin/src/islands/SiteWizard.tsx`) provides color pickers, font selectors, and layout toggles for initial site creation. After creation, none of these controls exist anywhere in the admin UI. Changing colors or fonts requires manually editing `sites/<slug>/src/styles/global.css` and modifying the `@theme` block -- a task that requires knowledge of CSS custom properties and Tailwind v4 token naming.

**Impact:** Non-technical users cannot update brand colors or fonts without developer assistance. This is the most common post-launch change request and the single biggest gap for self-service site management.

**Recommended Fix:** Port the wizard's theme customization controls (HSL-based color scale generator, font suggestion list, layout toggles) to a "Theme Settings" panel accessible from the site management page. Apply changes by programmatically updating the `@theme` block in `global.css` and triggering a redeploy.

---

## High Issues

### CUS-H1: Visual Editor Exists but Is Not Discoverable

**File:** `sites/admin/src/islands/SiteDetail.tsx`

**Description:** A full page editor exists at `/sites/<slug>/editor` that supports adding, reordering, and deleting sections, editing component props, live preview via the dev server, and one-click publish. However, it is not prominently linked from the site management page at `/sites/<slug>`. Users must know the URL to find it.

**Impact:** The platform's most powerful customization tool goes unused because users do not know it exists.

**Recommended Fix:** Add a prominent "Edit Site" button to the site management page (`SiteDetail.tsx`) that links to `/sites/<slug>/editor`. Consider making it the primary action on the page.

---

### CUS-H2: Static Site Content Requires Code Editing

**Description:** For non-CMS tier sites (the majority), changing text content such as headings, paragraphs, testimonials, and team member details requires editing `.astro` files directly. The visual editor helps with component props but is not suited for free-form content editing within component slots.

**Impact:** Simple text changes require developer intervention or comfort with code editing. This limits the autonomy of non-technical site owners.

**Recommended Fix:** Add inline text editing capability to the visual editor preview. Clicking on a heading or paragraph in the preview should allow direct editing, with changes written back to the `.astro` source files.

---

### CUS-H3: No Color or Font Picker Post-Creation

**File:** `sites/admin/src/islands/SiteWizard.tsx` (Step 3)

**Description:** The wizard's Step 3 includes an HSL-based color scale generator that produces all 50-950 shades from a single base color, and a curated font suggestion list with live preview. These tools are only available during site creation. After the site exists, there is no equivalent UI anywhere.

**Impact:** Rebranding or color refinement after launch requires manual CSS editing. The tooling exists but is locked behind the creation flow.

**Recommended Fix:** Extract the color picker and font selector into standalone components. Embed them in a new "Theme Settings" panel on the site management page.

---

## Medium Issues

### CUS-M1: Visual Editor Cannot Modify CSS Theme Tokens

**Description:** The visual editor at `/sites/<slug>/editor` supports component structure manipulation (add, remove, reorder sections) and component prop editing, but it cannot modify the `@theme` block in `global.css`. Theme-level changes like colors, fonts, spacing, and border radius are outside its scope.

**Impact:** Even users who discover the visual editor still need to edit code for theme-level changes.

**Recommended Fix:** Add a "Theme" tab to the visual editor sidebar that exposes the key `@theme` tokens (primary color, secondary color, accent color, heading font, body font, border style) as editable fields with live preview.

---

### CUS-M2: No Template Tradeoff Explanations

**File:** `sites/admin/src/islands/TemplateGallery.tsx`

**Description:** When selecting between the 5 templates (business-starter, restaurant, portfolio, saas, professional), there is no guidance on which suits different business types, what components each includes, or how they differ structurally.

**Impact:** Users make uninformed template choices, leading to more post-creation customization work or site recreation.

**Recommended Fix:** Add a brief description to each template card explaining its target audience, included components, and page structure. Consider a "Which template is right for you?" comparison table.

---

### CUS-M3: No Template Switching After Creation

**Description:** Once a template is selected during site creation, switching to a different template requires recreating the site entirely. There is no migration path between templates.

**Impact:** If a client's needs change or the wrong template was chosen, significant rework is needed.

**Recommended Fix:** Build a template migration tool that regenerates page files from a new template while preserving custom content, overrides, and configuration. This is a complex feature but would significantly reduce rework.

---

## Positive Findings

1. **Component override system is excellent** -- creating a file at `sites/<slug>/src/components/Hero.astro` auto-overrides the shared version via Vite plugin with zero configuration needed; already used in production by Atelier Kosta
2. **Visual editor is capable** -- supports 16 component categories, section reordering, prop editing, live preview, auto-save every 1.5 seconds, and one-click publish
3. **Wizard is comprehensive** -- 5-step flow covering identity, template, theme (colors, fonts, layouts), configuration (contact, nav, SEO, analytics), and creation with auto-deploy
4. **CMS content editing is smooth** -- Directus provides WYSIWYG editing, image gallery, drag-sort, publishing workflow, and user roles for CMS-tier clients
5. **Site configuration covers extensive ground** -- `site.config.ts` controls nav style (sticky/fixed/static), footer style (simple/multi-column/minimal), hero default, border style, SEO defaults, analytics provider, and contact information
6. **Clear customization spectrum** -- Simple (site.config.ts) to Medium (visual editor) to Advanced (component overrides) to Full custom (code editing)

---

## Recommendations (Prioritized)

| Priority | Action | Issue |
|----------|--------|-------|
| Immediate | Add prominent "Edit Site" button on site management page linking to visual editor | CUS-H1 |
| Short-term | Port wizard theme customization (color picker, font selector) to site management page | CUS-C1, CUS-H3 |
| Short-term | Add template comparison and recommendation guide to wizard Step 2 | CUS-M2 |
| Medium-term | Add inline text editing in visual editor preview for headings and paragraphs | CUS-H2 |
| Medium-term | Add Theme tab to visual editor for modifying CSS tokens with live preview | CUS-M1 |
| Long-term | Support template switching by regenerating pages while preserving custom content | CUS-M3 |
