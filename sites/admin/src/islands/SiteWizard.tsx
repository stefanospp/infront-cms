import { useState, useEffect, useCallback } from 'react';
import type {
  TemplateColorScale,
  TemplateThemeTokens,
  ThemeConfig,
  NavConfig,
  FooterConfig,
  ContactConfig,
  SEOConfig,
  TemplateDefinition,
} from '@agency/config';

interface GeneratorResult {
  success: boolean;
  sitePath: string;
  checklist: string[];
  error?: string;
  stagingUrl?: string;
  deployStatus?: 'pending' | 'building' | 'deploying' | 'live' | 'failed';
}

interface DeployStatusResponse {
  status: 'pending' | 'building' | 'deploying' | 'live' | 'failed';
  error?: string;
  buildLog?: string;
}

interface FormData {
  // Step 1
  name: string;
  slug: string;
  domain: string;
  tagline: string;
  tier: 'static' | 'cms' | 'interactive';
  // Step 2
  templateId: string;
  // Step 3
  theme: ThemeConfig;
  tokens: TemplateThemeTokens;
  // Step 4
  contact: ContactConfig;
  nav: NavConfig;
  seo: SEOConfig;
  footer: FooterConfig;
  analytics: { provider: 'plausible' | 'fathom' | 'google' | 'none'; siteId: string };
}

interface SiteWizardProps {
  initialTemplateId?: string;
}

// ---------------------------------------------------------------------------
// Color scale generator
// ---------------------------------------------------------------------------

function hexToHsl(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 50];

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateColorScale(hex: string): TemplateColorScale {
  const [h, s] = hexToHsl(hex);

  return {
    50:  hslToHex(h, Math.min(s + 5, 100), 97),
    100: hslToHex(h, Math.min(s + 5, 100), 93),
    200: hslToHex(h, Math.min(s + 3, 100), 86),
    300: hslToHex(h, s, 76),
    400: hslToHex(h, Math.max(s - 3, 0), 64),
    500: hslToHex(h, Math.max(s - 5, 0), 53),
    600: hslToHex(h, s, 45),
    700: hslToHex(h, Math.min(s + 5, 100), 38),
    800: hslToHex(h, Math.min(s + 5, 100), 31),
    900: hslToHex(h, Math.min(s + 3, 100), 25),
    950: hslToHex(h, Math.min(s + 8, 100), 15),
  };
}

// ---------------------------------------------------------------------------
// Default form data
// ---------------------------------------------------------------------------

const defaultNeutralScale: TemplateColorScale = {
  50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4',
  400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040',
  800: '#262626', 900: '#171717', 950: '#0a0a0a',
};

const defaultFormData: FormData = {
  name: '',
  slug: '',
  domain: '',
  tagline: '',
  tier: 'static',
  templateId: '',
  theme: { navStyle: 'sticky', footerStyle: 'multi-column', heroDefault: 'centered', borderStyle: 'rounded' },
  tokens: {
    colors: {
      primary: generateColorScale('#2563eb'),
      secondary: generateColorScale('#7c3aed'),
      accent: generateColorScale('#ea580c'),
      neutral: defaultNeutralScale,
    },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  contact: {
    email: '',
    phone: '',
    address: { street: '', city: '', postcode: '', country: 'GB' },
  },
  nav: {
    items: [
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/#services' },
      { label: 'Contact', href: '/contact' },
    ],
    cta: { label: 'Get in Touch', href: '/contact' },
  },
  seo: {
    defaultTitle: '',
    titleTemplate: '%s | Site Name',
    defaultDescription: '',
    defaultOgImage: '/og-default.jpg',
  },
  footer: {
    columns: [
      { title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }] },
      { title: 'Legal', links: [{ label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }] },
    ],
    legalLinks: [{ label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }],
  },
  analytics: { provider: 'none', siteId: '' },
};

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = [
  'Client Details',
  'Choose Template',
  'Theme',
  'Configuration',
  'Review & Create',
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <nav className="mb-8">
      <ol className="flex items-center justify-between">
        {STEPS.map((label, i) => {
          const step = i + 1;
          const isActive = step === currentStep;
          const isComplete = step < currentStep;

          return (
            <li key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                    isActive
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : isComplete
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-neutral-300 text-neutral-400 bg-white'
                  }`}
                >
                  {isComplete ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium hidden sm:block ${
                    isActive ? 'text-primary-600' : isComplete ? 'text-neutral-700' : 'text-neutral-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-1rem] sm:mt-0 ${
                    isComplete ? 'bg-primary-600' : 'bg-neutral-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Shared UI
// ---------------------------------------------------------------------------

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-700 mb-1.5">
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`block w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors ${props.className ?? ''}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  const { children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`block w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors ${rest.className ?? ''}`}
    >
      {children}
    </select>
  );
}

function RadioGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`inline-flex items-center px-3.5 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
            value === opt.value
              ? 'border-primary-600 bg-primary-50 text-primary-700'
              : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Client Details
// ---------------------------------------------------------------------------

function Step1({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-/, '');
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="name">Client / Site Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Acme Corp"
          required
        />
      </div>

      <div>
        <Label htmlFor="slug">Site Slug</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
            }))
          }
          placeholder="acme-corp"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Used for the directory name and package name. Lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      <div>
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          value={formData.tagline}
          onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
          placeholder="Modern solutions for your business"
        />
      </div>

      <div>
        <Label htmlFor="domain">Domain</Label>
        <Input
          id="domain"
          value={formData.domain}
          onChange={(e) => setFormData((prev) => ({ ...prev, domain: e.target.value }))}
          placeholder="acmecorp.co.uk"
          required
        />
      </div>

      <div>
        <Label htmlFor="tier">Site Tier</Label>
        <Select
          id="tier"
          value={formData.tier}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              tier: e.target.value as FormData['tier'],
            }))
          }
        >
          <option value="static">Static -- HTML/CSS only, no CMS</option>
          <option value="cms">CMS -- Directus-powered content management</option>
          <option value="interactive">Interactive -- CMS + dynamic features</option>
        </Select>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Choose Template
// ---------------------------------------------------------------------------

function Step2({
  formData,
  setFormData,
  templates,
  loading,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  templates: TemplateDefinition[];
  loading: boolean;
}) {
  const selectTemplate = (t: TemplateDefinition) => {
    setFormData((prev) => ({
      ...prev,
      templateId: t.id,
      theme: { ...t.defaultTheme },
      tokens: JSON.parse(JSON.stringify(t.defaultTokens)),
      nav: JSON.parse(JSON.stringify(t.defaultNav)),
      footer: JSON.parse(JSON.stringify(t.defaultFooter)),
      seo: {
        defaultTitle: prev.name
          ? `${prev.name} -- ${prev.tagline || 'Official Website'}`
          : t.defaultSeo.titleTemplate?.replace('%s | ', '') || '',
        titleTemplate: t.defaultSeo.titleTemplate || `%s | ${prev.name || 'Site'}`,
        defaultDescription:
          t.defaultSeo.defaultDescription || prev.tagline || '',
        defaultOgImage: t.defaultSeo.defaultOgImage || '/og-default.jpg',
      },
    }));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-neutral-200 p-5 animate-pulse">
            <div className="h-32 bg-neutral-200 rounded-lg mb-4" />
            <div className="h-4 bg-neutral-200 rounded w-2/3 mb-2" />
            <div className="h-3 bg-neutral-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map((t) => {
        const isSelected = formData.templateId === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTemplate(t)}
            className={`text-left rounded-xl border-2 p-5 transition-all ${
              isSelected
                ? 'border-primary-600 bg-primary-50 shadow-sm'
                : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
            }`}
          >
            <div
              className={`h-32 rounded-lg mb-4 flex items-center justify-center ${
                isSelected ? 'bg-primary-600' : 'bg-neutral-600'
              }`}
            >
              <span className="text-white font-medium">{t.name}</span>
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">{t.name}</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">{t.description}</p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
              {t.category}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Theme Customization
// ---------------------------------------------------------------------------

const FONT_SUGGESTIONS = ['Inter', 'Playfair Display', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Merriweather', 'Source Sans 3', 'DM Sans'];

function Step3({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  const updateColor = (group: 'primary' | 'secondary' | 'accent', hex: string) => {
    const scale = generateColorScale(hex);
    setFormData((prev) => ({
      ...prev,
      tokens: {
        ...prev.tokens,
        colors: { ...prev.tokens.colors, [group]: scale },
      },
    }));
  };

  return (
    <div className="space-y-8">
      {/* Colors */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Brand Colours</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['primary', 'secondary', 'accent'] as const).map((group) => (
            <div key={group}>
              <Label htmlFor={`color-${group}`}>
                {group.charAt(0).toUpperCase() + group.slice(1)}
              </Label>
              <div className="flex items-center gap-3">
                <input
                  id={`color-${group}`}
                  type="color"
                  value={formData.tokens.colors[group][600]}
                  onChange={(e) => updateColor(group, e.target.value)}
                  className="w-10 h-10 rounded-lg border border-neutral-300 cursor-pointer p-0.5"
                />
                <Input
                  value={formData.tokens.colors[group][600]}
                  onChange={(e) => {
                    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                      updateColor(group, e.target.value);
                    }
                  }}
                  className="flex-1 font-mono text-xs"
                  placeholder="#2563eb"
                />
              </div>
              {/* Preview scale */}
              <div className="flex gap-0.5 mt-2 rounded overflow-hidden">
                {Object.entries(formData.tokens.colors[group]).map(([step, color]) => (
                  <div
                    key={step}
                    className="h-5 flex-1"
                    style={{ backgroundColor: color }}
                    title={`${step}: ${color}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Typography</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="font-heading">Heading Font</Label>
            <Input
              id="font-heading"
              value={formData.tokens.fonts.heading}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  tokens: { ...prev.tokens, fonts: { ...prev.tokens.fonts, heading: e.target.value } },
                }))
              }
              list="font-suggestions"
              placeholder="Inter"
            />
          </div>
          <div>
            <Label htmlFor="font-body">Body Font</Label>
            <Input
              id="font-body"
              value={formData.tokens.fonts.body}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  tokens: { ...prev.tokens, fonts: { ...prev.tokens.fonts, body: e.target.value } },
                }))
              }
              list="font-suggestions"
              placeholder="Inter"
            />
          </div>
        </div>
        <datalist id="font-suggestions">
          {FONT_SUGGESTIONS.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
      </div>

      {/* Theme toggles */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold text-neutral-900">Layout Options</h3>

        <div>
          <Label>Navigation Style</Label>
          <RadioGroup
            name="navStyle"
            options={[
              { label: 'Sticky', value: 'sticky' },
              { label: 'Fixed', value: 'fixed' },
              { label: 'Static', value: 'static' },
            ]}
            value={formData.theme.navStyle}
            onChange={(v) =>
              setFormData((prev) => ({
                ...prev,
                theme: { ...prev.theme, navStyle: v as ThemeConfig['navStyle'] },
              }))
            }
          />
        </div>

        <div>
          <Label>Footer Style</Label>
          <RadioGroup
            name="footerStyle"
            options={[
              { label: 'Simple', value: 'simple' },
              { label: 'Multi-column', value: 'multi-column' },
              { label: 'Minimal', value: 'minimal' },
            ]}
            value={formData.theme.footerStyle}
            onChange={(v) =>
              setFormData((prev) => ({
                ...prev,
                theme: { ...prev.theme, footerStyle: v as ThemeConfig['footerStyle'] },
              }))
            }
          />
        </div>

        <div>
          <Label>Hero Default</Label>
          <RadioGroup
            name="heroDefault"
            options={[
              { label: 'Centered', value: 'centered' },
              { label: 'Split', value: 'split' },
              { label: 'Fullscreen', value: 'fullscreen' },
              { label: 'Minimal', value: 'minimal' },
            ]}
            value={formData.theme.heroDefault}
            onChange={(v) =>
              setFormData((prev) => ({
                ...prev,
                theme: { ...prev.theme, heroDefault: v as ThemeConfig['heroDefault'] },
              }))
            }
          />
        </div>

        <div>
          <Label>Border Style</Label>
          <RadioGroup
            name="borderStyle"
            options={[
              { label: 'Sharp', value: 'sharp' },
              { label: 'Rounded', value: 'rounded' },
              { label: 'Pill', value: 'pill' },
            ]}
            value={formData.theme.borderStyle}
            onChange={(v) =>
              setFormData((prev) => ({
                ...prev,
                theme: { ...prev.theme, borderStyle: v as ThemeConfig['borderStyle'] },
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Site Configuration
// ---------------------------------------------------------------------------

function Step4({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  const addNavItem = () => {
    setFormData((prev) => ({
      ...prev,
      nav: { ...prev.nav, items: [...prev.nav.items, { label: '', href: '/' }] },
    }));
  };

  const removeNavItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      nav: { ...prev.nav, items: prev.nav.items.filter((_, i) => i !== index) },
    }));
  };

  const updateNavItem = (index: number, field: 'label' | 'href', value: string) => {
    setFormData((prev) => ({
      ...prev,
      nav: {
        ...prev.nav,
        items: prev.nav.items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      },
    }));
  };

  return (
    <div className="space-y-8">
      {/* Contact */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={formData.contact.email}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, email: e.target.value },
                }))
              }
              placeholder="info@example.com"
            />
          </div>
          <div>
            <Label htmlFor="contact-phone">Phone</Label>
            <Input
              id="contact-phone"
              value={formData.contact.phone ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, phone: e.target.value },
                }))
              }
              placeholder="+44 20 7946 0000"
            />
          </div>
          <div>
            <Label htmlFor="contact-street">Street</Label>
            <Input
              id="contact-street"
              value={formData.contact.address?.street ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contact: {
                    ...prev.contact,
                    address: { ...prev.contact.address!, street: e.target.value },
                  },
                }))
              }
              placeholder="123 Main Street"
            />
          </div>
          <div>
            <Label htmlFor="contact-city">City</Label>
            <Input
              id="contact-city"
              value={formData.contact.address?.city ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contact: {
                    ...prev.contact,
                    address: { ...prev.contact.address!, city: e.target.value },
                  },
                }))
              }
              placeholder="London"
            />
          </div>
          <div>
            <Label htmlFor="contact-postcode">Postcode</Label>
            <Input
              id="contact-postcode"
              value={formData.contact.address?.postcode ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contact: {
                    ...prev.contact,
                    address: { ...prev.contact.address!, postcode: e.target.value },
                  },
                }))
              }
              placeholder="EC1A 1BB"
            />
          </div>
          <div>
            <Label htmlFor="contact-country">Country</Label>
            <Input
              id="contact-country"
              value={formData.contact.address?.country ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contact: {
                    ...prev.contact,
                    address: { ...prev.contact.address!, country: e.target.value },
                  },
                }))
              }
              placeholder="GB"
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Navigation Items</h3>
        <div className="space-y-2">
          {formData.nav.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={item.label}
                onChange={(e) => updateNavItem(i, 'label', e.target.value)}
                placeholder="Label"
                className="flex-1"
              />
              <Input
                value={item.href}
                onChange={(e) => updateNavItem(i, 'href', e.target.value)}
                placeholder="/path"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removeNavItem(i)}
                className="p-2 text-neutral-400 hover:text-red-500 transition-colors shrink-0"
                aria-label="Remove item"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addNavItem}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add item
        </button>

        {/* CTA */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cta-label">CTA Label</Label>
            <Input
              id="cta-label"
              value={formData.nav.cta?.label ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  nav: {
                    ...prev.nav,
                    cta: { label: e.target.value, href: prev.nav.cta?.href ?? '/contact' },
                  },
                }))
              }
              placeholder="Get in Touch"
            />
          </div>
          <div>
            <Label htmlFor="cta-href">CTA Link</Label>
            <Input
              id="cta-href"
              value={formData.nav.cta?.href ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  nav: {
                    ...prev.nav,
                    cta: { label: prev.nav.cta?.label ?? 'Get in Touch', href: e.target.value },
                  },
                }))
              }
              placeholder="/contact"
            />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">SEO Defaults</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="seo-title">Default Title</Label>
            <Input
              id="seo-title"
              value={formData.seo.defaultTitle}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  seo: { ...prev.seo, defaultTitle: e.target.value },
                }))
              }
              placeholder="Acme Corp -- Modern Solutions"
            />
          </div>
          <div>
            <Label htmlFor="seo-template">Title Template</Label>
            <Input
              id="seo-template"
              value={formData.seo.titleTemplate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  seo: { ...prev.seo, titleTemplate: e.target.value },
                }))
              }
              placeholder="%s | Acme Corp"
            />
            <p className="mt-1 text-xs text-neutral-500">Use %s as a placeholder for the page title.</p>
          </div>
          <div>
            <Label htmlFor="seo-desc">Default Description</Label>
            <Input
              id="seo-desc"
              value={formData.seo.defaultDescription}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  seo: { ...prev.seo, defaultDescription: e.target.value },
                }))
              }
              placeholder="A professional website for your business."
            />
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Analytics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="analytics-provider">Provider</Label>
            <Select
              id="analytics-provider"
              value={formData.analytics.provider}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  analytics: {
                    ...prev.analytics,
                    provider: e.target.value as FormData['analytics']['provider'],
                  },
                }))
              }
            >
              <option value="none">None</option>
              <option value="plausible">Plausible</option>
              <option value="fathom">Fathom</option>
              <option value="google">Google Analytics</option>
            </Select>
          </div>
          {formData.analytics.provider !== 'none' && (
            <div>
              <Label htmlFor="analytics-id">Site ID</Label>
              <Input
                id="analytics-id"
                value={formData.analytics.siteId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    analytics: { ...prev.analytics, siteId: e.target.value },
                  }))
                }
                placeholder="your-site-id"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Review & Create
// ---------------------------------------------------------------------------

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-5">
      <h4 className="text-sm font-semibold text-neutral-900 mb-3">{title}</h4>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-900 font-medium text-right max-w-[60%] break-words">
        {value}
      </span>
    </div>
  );
}

function Step5({
  formData,
  templates,
}: {
  formData: FormData;
  templates: TemplateDefinition[];
}) {
  const template = templates.find((t) => t.id === formData.templateId);

  return (
    <div className="space-y-4">
      <SummarySection title="Client Details">
        <SummaryRow label="Name" value={formData.name} />
        <SummaryRow label="Slug" value={formData.slug} />
        <SummaryRow label="Domain" value={formData.domain} />
        <SummaryRow label="Tagline" value={formData.tagline} />
        <SummaryRow label="Tier" value={formData.tier} />
      </SummarySection>

      <SummarySection title="Template">
        <SummaryRow label="Template" value={template?.name ?? formData.templateId} />
      </SummarySection>

      <SummarySection title="Theme">
        <SummaryRow label="Nav Style" value={formData.theme.navStyle} />
        <SummaryRow label="Footer Style" value={formData.theme.footerStyle} />
        <SummaryRow label="Hero Default" value={formData.theme.heroDefault} />
        <SummaryRow label="Border Style" value={formData.theme.borderStyle} />
        <SummaryRow label="Heading Font" value={formData.tokens.fonts.heading} />
        <SummaryRow label="Body Font" value={formData.tokens.fonts.body} />
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-neutral-500">Colours:</span>
          <div className="flex gap-1">
            {(['primary', 'secondary', 'accent'] as const).map((g) => (
              <div
                key={g}
                className="w-6 h-6 rounded-md border border-neutral-200"
                style={{ backgroundColor: formData.tokens.colors[g][600] }}
                title={`${g}: ${formData.tokens.colors[g][600]}`}
              />
            ))}
          </div>
        </div>
      </SummarySection>

      <SummarySection title="Contact">
        <SummaryRow label="Email" value={formData.contact.email} />
        {formData.contact.phone && <SummaryRow label="Phone" value={formData.contact.phone} />}
        {formData.contact.address?.city && (
          <SummaryRow
            label="Address"
            value={[
              formData.contact.address.street,
              formData.contact.address.city,
              formData.contact.address.postcode,
              formData.contact.address.country,
            ]
              .filter(Boolean)
              .join(', ')}
          />
        )}
      </SummarySection>

      <SummarySection title="Navigation">
        {formData.nav.items.map((item, i) => (
          <SummaryRow key={i} label={item.label} value={item.href} />
        ))}
        {formData.nav.cta && (
          <SummaryRow label={`CTA: ${formData.nav.cta.label}`} value={formData.nav.cta.href} />
        )}
      </SummarySection>

      <SummarySection title="SEO">
        <SummaryRow label="Title" value={formData.seo.defaultTitle} />
        <SummaryRow label="Template" value={formData.seo.titleTemplate} />
        <SummaryRow label="Description" value={formData.seo.defaultDescription} />
      </SummarySection>

      {formData.analytics.provider !== 'none' && (
        <SummarySection title="Analytics">
          <SummaryRow label="Provider" value={formData.analytics.provider} />
          <SummaryRow label="Site ID" value={formData.analytics.siteId} />
        </SummarySection>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wizard
// ---------------------------------------------------------------------------

export default function SiteWizard({ initialTemplateId }: SiteWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(() => ({
    ...defaultFormData,
    templateId: initialTemplateId ?? '',
  }));
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratorResult | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/templates');
        if (!res.ok) throw new Error('Failed to fetch templates');
        const data: TemplateDefinition[] = await res.json();
        setTemplates(data);

        // If initialTemplateId is set, pre-populate from that template
        if (initialTemplateId) {
          const t = data.find((d) => d.id === initialTemplateId);
          if (t) {
            setFormData((prev) => ({
              ...prev,
              templateId: t.id,
              theme: { ...t.defaultTheme },
              tokens: JSON.parse(JSON.stringify(t.defaultTokens)),
              nav: JSON.parse(JSON.stringify(t.defaultNav)),
              footer: JSON.parse(JSON.stringify(t.defaultFooter)),
              seo: {
                defaultTitle: t.defaultSeo.titleTemplate?.replace('%s | ', '') || '',
                titleTemplate: t.defaultSeo.titleTemplate || '%s | Site',
                defaultDescription: t.defaultSeo.defaultDescription || '',
                defaultOgImage: t.defaultSeo.defaultOgImage || '/og-default.jpg',
              },
            }));
          }
        }
      } catch (err) {
        console.error('Failed to prefetch templates:', err instanceof Error ? err.message : err);
      } finally {
        setTemplatesLoading(false);
      }
    }

    fetchTemplates();
  }, [initialTemplateId]);

  const canGoNext = useCallback((): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.name && formData.slug && formData.domain);
      case 2:
        return !!formData.templateId;
      case 3:
        return true;
      case 4:
        return !!(formData.contact.email && formData.seo.defaultTitle);
      case 5:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const goNext = () => {
    if (currentStep < 5 && canGoNext()) {
      setCurrentStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Clean up contact — strip empty address
      const contact = { ...formData.contact };
      if (contact.address && !contact.address.street && !contact.address.city && !contact.address.postcode) {
        delete (contact as Record<string, unknown>).address;
      }
      if (!contact.email) {
        contact.email = `info@${formData.domain}`;
      }

      // Fill in SEO defaults from site name
      const seo = { ...formData.seo };
      if (!seo.defaultTitle) seo.defaultTitle = formData.name;
      if (!seo.titleTemplate) seo.titleTemplate = `%s | ${formData.name}`;
      if (!seo.defaultDescription) seo.defaultDescription = `Welcome to ${formData.name}`;

      // Assemble the payload
      const payload: Record<string, unknown> = {
        slug: formData.slug,
        name: formData.name,
        tagline: formData.tagline || formData.name,
        domain: formData.domain,
        tier: formData.tier,
        templateId: formData.templateId,
        theme: formData.theme,
        tokens: formData.tokens,
        contact,
        seo,
        nav: formData.nav,
        footer: formData.footer,
      };

      if (formData.analytics.provider !== 'none' && formData.analytics.siteId) {
        payload.analytics = {
          provider: formData.analytics.provider,
          siteId: formData.analytics.siteId,
        };
      }

      const res = await fetch('/api/sites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: GeneratorResult = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Site creation failed. Please try again.');
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Deploy progress polling
  const [deployStatus, setDeployStatus] = useState<DeployStatusResponse | null>(null);

  useEffect(() => {
    if (!result?.success) return;

    // Seed initial status from the creation response
    setDeployStatus({ status: result.deployStatus ?? 'building' });

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sites/${formData.slug}/deploy-status`);
        if (!res.ok) return;
        const data: DeployStatusResponse = await res.json();
        setDeployStatus(data);
        if (data.status === 'live' || data.status === 'failed') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Deploy status poll error:', err instanceof Error ? err.message : err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [result?.success, formData.slug]);

  const handleRetryDeploy = async () => {
    setDeployStatus({ status: 'building' });
    try {
      await fetch(`/api/sites/${formData.slug}/redeploy`, { method: 'POST' });
    } catch {
      setDeployStatus({ status: 'failed', error: 'Failed to trigger redeploy.' });
    }
  };

  // Success state — deploy progress
  if (result?.success) {
    const status = deployStatus?.status ?? 'building';
    const isBuildDone = status === 'deploying' || status === 'live';
    const isDeployDone = status === 'live';
    const isFailed = status === 'failed';

    const CheckIcon = () => (
      <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    );

    const Spinner = () => (
      <div className="w-5 h-5 shrink-0 rounded-full border-2 border-neutral-300 border-t-primary-600 animate-spin" />
    );

    const Waiting = () => (
      <div className="w-5 h-5 shrink-0 rounded-full border-2 border-neutral-200" />
    );

    const steps = [
      { label: 'Site files generated', done: true, active: false },
      { label: 'Building site...', done: isBuildDone || isDeployDone, active: status === 'building' },
      { label: 'Deploying to Cloudflare...', done: isDeployDone, active: status === 'deploying' },
      { label: 'Setting up staging URL...', done: isDeployDone, active: status === 'deploying' },
    ];

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-neutral-200 p-8">
          {/* Progress steps */}
          <div className="space-y-4 mb-8">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {step.done ? <CheckIcon /> : step.active && !isFailed ? <Spinner /> : <Waiting />}
                <span className={`text-sm ${step.done ? 'text-green-700 font-medium' : step.active && !isFailed ? 'text-neutral-900 font-medium' : 'text-neutral-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Live state */}
          {isDeployDone && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Your site is live!</h2>
              <p className="text-neutral-600 mb-6">
                <a
                  href={`https://${formData.slug}.infront.cy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 font-medium underline"
                >
                  https://{formData.slug}.infront.cy
                </a>
              </p>
              <div className="flex items-center justify-center gap-3">
                <a
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Go to Dashboard
                </a>
                <a
                  href={`/sites/${formData.slug}`}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Manage Site
                </a>
              </div>
            </div>
          )}

          {/* Failed state */}
          {isFailed && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Deploy Failed</h2>
              <p className="text-sm text-red-600 mb-6">
                {deployStatus?.error ?? 'An unexpected error occurred during deployment.'}
              </p>
              <button
                type="button"
                onClick={handleRetryDeploy}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Retry Deploy
              </button>
            </div>
          )}

          {/* Build log */}
          {deployStatus?.buildLog && (
            <details className={`mt-4 ${isFailed ? '' : 'mt-2'}`}>
              <summary className="text-xs text-neutral-400 cursor-pointer hover:text-neutral-600">
                {isFailed ? 'Show build log' : 'Build log'}
              </summary>
              <pre className="mt-2 p-3 bg-neutral-900 text-neutral-200 text-xs rounded-lg overflow-x-auto max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
                {deployStatus.buildLog}
              </pre>
            </details>
          )}

          {/* In-progress message */}
          {!isDeployDone && !isFailed && (
            <p className="text-center text-sm text-neutral-500">
              This usually takes 30-60 seconds. You can safely leave this page.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <StepIndicator currentStep={currentStep} />

      <div className="bg-white rounded-xl border border-neutral-200 p-6 lg:p-8">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">
          {STEPS[currentStep - 1]}
        </h2>

        {/* Step content */}
        {currentStep === 1 && <Step1 formData={formData} setFormData={setFormData} />}
        {currentStep === 2 && (
          <Step2
            formData={formData}
            setFormData={setFormData}
            templates={templates}
            loading={templatesLoading}
          />
        )}
        {currentStep === 3 && <Step3 formData={formData} setFormData={setFormData} />}
        {currentStep === 4 && <Step4 formData={formData} setFormData={setFormData} />}
        {currentStep === 5 && <Step5 formData={formData} templates={templates} />}

        {/* Error */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-neutral-100 pt-6">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
          </div>

          <div>
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Site'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
