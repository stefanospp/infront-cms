import { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditorConfigProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SiteConfig {
  name: string;
  tagline: string;
  url: string;
  locale: string;
  contact: {
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      postcode: string;
      country: string;
      region?: string;
    };
  };
  seo: {
    defaultTitle: string;
    titleTemplate: string;
    defaultDescription: string;
    defaultOgImage: string;
  };
  nav: {
    items: Array<{ label: string; href: string }>;
    cta?: { label: string; href: string };
  };
  theme: {
    navStyle: 'sticky' | 'fixed' | 'static';
    footerStyle: 'simple' | 'multi-column' | 'minimal';
    heroDefault: 'centered' | 'split' | 'fullscreen' | 'minimal';
    borderStyle: 'sharp' | 'rounded' | 'pill';
  };
  [key: string]: unknown;
}

type ConfigTab = 'general' | 'contact' | 'seo' | 'nav' | 'theme';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const tabs: { id: ConfigTab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'contact', label: 'Contact' },
  { id: 'seo', label: 'SEO' },
  { id: 'nav', label: 'Navigation' },
  { id: 'theme', label: 'Theme' },
];

// ---------------------------------------------------------------------------
// Reusable input components
// ---------------------------------------------------------------------------

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab panels
// ---------------------------------------------------------------------------

function GeneralTab({
  config,
  update,
}: {
  config: SiteConfig;
  update: (path: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <Input label="Site Name" value={config.name} onChange={(v) => update('name', v)} />
      <Input label="Tagline" value={config.tagline} onChange={(v) => update('tagline', v)} />
      <Input label="Site URL" value={config.url} onChange={(v) => update('url', v)} type="url" />
      <Input label="Locale" value={config.locale} onChange={(v) => update('locale', v)} placeholder="en-US" />
    </div>
  );
}

function ContactTab({
  config,
  update,
}: {
  config: SiteConfig;
  update: (path: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <Input label="Email" value={config.contact.email} onChange={(v) => update('contact.email', v)} type="email" />
      <Input label="Phone" value={config.contact.phone ?? ''} onChange={(v) => update('contact.phone', v)} />

      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Address</h4>
        <div className="space-y-3">
          <Input label="Street" value={config.contact.address?.street ?? ''} onChange={(v) => update('contact.address.street', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={config.contact.address?.city ?? ''} onChange={(v) => update('contact.address.city', v)} />
            <Input label="Postcode" value={config.contact.address?.postcode ?? ''} onChange={(v) => update('contact.address.postcode', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Country" value={config.contact.address?.country ?? ''} onChange={(v) => update('contact.address.country', v)} />
            <Input label="Region" value={config.contact.address?.region ?? ''} onChange={(v) => update('contact.address.region', v)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SEOTab({
  config,
  update,
}: {
  config: SiteConfig;
  update: (path: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <Input label="Default Title" value={config.seo.defaultTitle} onChange={(v) => update('seo.defaultTitle', v)} />
      <Input label="Title Template" value={config.seo.titleTemplate} onChange={(v) => update('seo.titleTemplate', v)} placeholder="%s | Site Name" />
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Default Description</label>
        <textarea
          value={config.seo.defaultDescription}
          onChange={(e) => update('seo.defaultDescription', e.target.value)}
          rows={3}
          className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y transition-colors"
        />
      </div>
      <Input label="Default OG Image" value={config.seo.defaultOgImage} onChange={(v) => update('seo.defaultOgImage', v)} />
    </div>
  );
}

function NavTab({
  config,
  update,
}: {
  config: SiteConfig;
  update: (path: string, value: unknown) => void;
}) {
  function addNavItem() {
    const items = [...config.nav.items, { label: 'New Page', href: '/new' }];
    update('nav.items', items);
  }

  function removeNavItem(index: number) {
    const items = config.nav.items.filter((_, i) => i !== index);
    update('nav.items', items);
  }

  function updateNavItem(index: number, field: string, value: string) {
    const items = config.nav.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    update('nav.items', items);
  }

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Nav Items</h4>
      <div className="space-y-2">
        {config.nav.items.map((item, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                value={item.label}
                onChange={(e) => updateNavItem(index, 'label', e.target.value)}
                placeholder="Label"
                className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              />
              <input
                value={item.href}
                onChange={(e) => updateNavItem(index, 'href', e.target.value)}
                placeholder="/path"
                className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>
            <button
              onClick={() => removeNavItem(index)}
              className="mt-1 p-1 text-gray-500 hover:text-red-400 transition-colors"
              aria-label="Remove nav item"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addNavItem}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Nav Item
      </button>

      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">CTA Button</h4>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Label"
            value={config.nav.cta?.label ?? ''}
            onChange={(v) => update('nav.cta', { ...config.nav.cta, label: v, href: config.nav.cta?.href ?? '' })}
          />
          <Input
            label="Link"
            value={config.nav.cta?.href ?? ''}
            onChange={(v) => update('nav.cta', { ...config.nav.cta, href: v, label: config.nav.cta?.label ?? '' })}
          />
        </div>
      </div>
    </div>
  );
}

function ThemeTab({
  config,
  update,
}: {
  config: SiteConfig;
  update: (path: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <Select
        label="Navigation Style"
        value={config.theme.navStyle}
        onChange={(v) => update('theme.navStyle', v)}
        options={[
          { value: 'sticky', label: 'Sticky' },
          { value: 'fixed', label: 'Fixed' },
          { value: 'static', label: 'Static' },
        ]}
      />
      <Select
        label="Footer Style"
        value={config.theme.footerStyle}
        onChange={(v) => update('theme.footerStyle', v)}
        options={[
          { value: 'simple', label: 'Simple' },
          { value: 'multi-column', label: 'Multi-Column' },
          { value: 'minimal', label: 'Minimal' },
        ]}
      />
      <Select
        label="Default Hero"
        value={config.theme.heroDefault}
        onChange={(v) => update('theme.heroDefault', v)}
        options={[
          { value: 'centered', label: 'Centered' },
          { value: 'split', label: 'Split' },
          { value: 'fullscreen', label: 'Fullscreen' },
          { value: 'minimal', label: 'Minimal' },
        ]}
      />
      <Select
        label="Border Style"
        value={config.theme.borderStyle}
        onChange={(v) => update('theme.borderStyle', v)}
        options={[
          { value: 'sharp', label: 'Sharp' },
          { value: 'rounded', label: 'Rounded' },
          { value: 'pill', label: 'Pill' },
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function EditorConfig({ slug, isOpen, onClose }: EditorConfigProps) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [activeTab, setActiveTab] = useState<ConfigTab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load config
  useEffect(() => {
    if (!isOpen) return;

    async function load() {
      try {
        const res = await fetch(`/api/sites/${slug}/config`);
        if (!res.ok) throw new Error('Failed to load config');
        const data = await res.json();
        setConfig(data.config);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    }

    load();
  }, [slug, isOpen]);

  if (!isOpen) return null;

  // Deep update helper using dot-notation paths
  function updateConfig(dotPath: string, value: unknown) {
    if (!config) return;

    const keys = dotPath.split('.');
    const updated = structuredClone(config);
    let current: Record<string, unknown> = updated;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]!;
      if (current[key] === undefined || current[key] === null) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    const lastKey = keys[keys.length - 1]!;
    current[lastKey] = value;

    setConfig(updated);
    setHasChanges(true);
  }

  async function handleSave() {
    if (!config) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/sites/${slug}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setHasChanges(false);
      } else {
        const data = await res.json().catch(() => ({ error: 'Save failed' }));
        setError(data.error ?? 'Failed to save');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-2xl max-h-[85vh] rounded-xl bg-gray-900 shadow-2xl border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-100">Site Configuration</h2>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-xs text-orange-400">Unsaved changes</span>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs + Content */}
        {error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : !config ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500" />
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Tab sidebar */}
            <div className="w-40 border-r border-gray-700 p-2 space-y-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                    tab.id === activeTab
                      ? 'bg-gray-700 text-gray-100 font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === 'general' && <GeneralTab config={config} update={updateConfig} />}
              {activeTab === 'contact' && <ContactTab config={config} update={updateConfig} />}
              {activeTab === 'seo' && <SEOTab config={config} update={updateConfig} />}
              {activeTab === 'nav' && <NavTab config={config} update={updateConfig} />}
              {activeTab === 'theme' && <ThemeTab config={config} update={updateConfig} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
