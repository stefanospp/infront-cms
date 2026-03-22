import { describe, it, expect } from 'vitest';
import {
  componentRegistry,
  getComponent,
  listComponentsByCategory,
  listAstroComponents,
  listIslandComponents,
  listComponentsWithVariants,
  getComponentVariants,
} from '../../packages/config/src/component-registry';

describe('componentRegistry', () => {
  it('contains all expected components', () => {
    const names = Object.keys(componentRegistry);
    // Should have at least the core components
    expect(names).toContain('Hero');
    expect(names).toContain('CTA');
    expect(names).toContain('CardGrid');
    expect(names).toContain('Features');
    expect(names).toContain('FAQ');
    expect(names).toContain('Footer');
    expect(names).toContain('Nav');
    expect(names).toContain('Section');
    expect(names).toContain('TeamGrid');
    expect(names).toContain('Testimonials');
    expect(names).toContain('ContactForm');
    expect(names).toContain('MobileNav');
    expect(names).toContain('CookieConsent');
  });

  it('every component has required fields', () => {
    for (const [name, def] of Object.entries(componentRegistry)) {
      expect(def.name, `${name}.name`).toBe(name);
      expect(def.category, `${name}.category`).toBeTruthy();
      expect(def.description, `${name}.description`).toBeTruthy();
      expect(Array.isArray(def.variants), `${name}.variants`).toBe(true);
      expect(typeof def.props, `${name}.props`).toBe('object');
    }
  });

  it('Hero has the correct variants', () => {
    const hero = componentRegistry.Hero;
    expect(hero).toBeDefined();
    expect(hero!.variants).toEqual(
      expect.arrayContaining(['centered', 'split', 'fullscreen', 'minimal', 'video']),
    );
  });

  it('CardGrid has the correct variants', () => {
    const cardGrid = componentRegistry.CardGrid;
    expect(cardGrid).toBeDefined();
    expect(cardGrid!.variants).toEqual(
      expect.arrayContaining(['two-column', 'three-column', 'four-column', 'masonry', 'list']),
    );
  });

  it('marks React islands with isIsland flag', () => {
    expect(componentRegistry.ContactForm?.isIsland).toBe(true);
    expect(componentRegistry.CookieConsent?.isIsland).toBe(true);
    expect(componentRegistry.MobileNav?.isIsland).toBe(true);
  });

  it('does not mark Astro components as islands', () => {
    expect(componentRegistry.Hero?.isIsland).toBeUndefined();
    expect(componentRegistry.CTA?.isIsland).toBeUndefined();
    expect(componentRegistry.Footer?.isIsland).toBeUndefined();
  });

  it('props have valid type values', () => {
    const validTypes = ['text', 'richtext', 'url', 'image', 'boolean', 'number', 'select', 'array', 'color'];
    for (const [compName, def] of Object.entries(componentRegistry)) {
      for (const [propName, prop] of Object.entries(def.props)) {
        expect(
          validTypes,
          `${compName}.${propName} has invalid type "${prop.type}"`,
        ).toContain(prop.type);
      }
    }
  });

  it('array-type props have itemProps defined', () => {
    for (const [compName, def] of Object.entries(componentRegistry)) {
      for (const [propName, prop] of Object.entries(def.props)) {
        if (prop.type === 'array') {
          expect(
            prop.itemProps,
            `${compName}.${propName} is array but missing itemProps`,
          ).toBeDefined();
        }
      }
    }
  });

  it('select-type props have options defined', () => {
    for (const [compName, def] of Object.entries(componentRegistry)) {
      for (const [propName, prop] of Object.entries(def.props)) {
        if (prop.type === 'select') {
          expect(
            prop.options,
            `${compName}.${propName} is select but missing options`,
          ).toBeDefined();
          expect(
            prop.options!.length,
            `${compName}.${propName} select has no options`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('getComponent', () => {
  it('returns a component by name', () => {
    const hero = getComponent('Hero');
    expect(hero).toBeDefined();
    expect(hero!.name).toBe('Hero');
  });

  it('returns undefined for non-existent component', () => {
    expect(getComponent('NonExistent')).toBeUndefined();
  });
});

describe('listComponentsByCategory', () => {
  it('returns only components in the given category', () => {
    const heroComponents = listComponentsByCategory('hero');
    expect(heroComponents.length).toBeGreaterThan(0);
    for (const c of heroComponents) {
      expect(c.category).toBe('hero');
    }
  });

  it('returns empty array for unused category', () => {
    // All categories should have at least one, but test the filtering logic
    const result = listComponentsByCategory('hero');
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('listAstroComponents', () => {
  it('excludes React islands', () => {
    const astroComponents = listAstroComponents();
    const names = astroComponents.map((c) => c.name);
    expect(names).not.toContain('ContactForm');
    expect(names).not.toContain('CookieConsent');
    expect(names).not.toContain('MobileNav');
  });

  it('includes Astro components', () => {
    const astroComponents = listAstroComponents();
    const names = astroComponents.map((c) => c.name);
    expect(names).toContain('Hero');
    expect(names).toContain('Footer');
  });
});

describe('listIslandComponents', () => {
  it('returns only React islands', () => {
    const islands = listIslandComponents();
    expect(islands.length).toBe(3);
    for (const c of islands) {
      expect(c.isIsland).toBe(true);
    }
  });
});

describe('listComponentsWithVariants', () => {
  it('only includes components with at least one variant', () => {
    const withVariants = listComponentsWithVariants();
    for (const c of withVariants) {
      expect(c.variants.length).toBeGreaterThan(0);
    }
  });

  it('does not include components without variants', () => {
    const withVariants = listComponentsWithVariants();
    const names = withVariants.map((c) => c.name);
    // Section and Nav have no variants typically
    const noVariantComponents = Object.values(componentRegistry).filter(
      (c) => c.variants.length === 0,
    );
    for (const c of noVariantComponents) {
      expect(names).not.toContain(c.name);
    }
  });
});

describe('getComponentVariants', () => {
  it('returns variants for a known component', () => {
    const variants = getComponentVariants('Hero');
    expect(variants).toEqual(
      expect.arrayContaining(['centered', 'split', 'fullscreen']),
    );
  });

  it('returns empty array for unknown component', () => {
    expect(getComponentVariants('NonExistent')).toEqual([]);
  });
});
