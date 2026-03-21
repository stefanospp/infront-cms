import { useState, useEffect } from 'react';

interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  screenshot: string;
  category: string;
  features?: string[];
  pages?: { slug: string }[];
}

const categoryColors: Record<string, string> = {
  business: 'bg-blue-100 text-blue-700',
  hospitality: 'bg-red-100 text-red-700',
  creative: 'bg-purple-100 text-purple-700',
  technology: 'bg-cyan-100 text-cyan-700',
  services: 'bg-amber-100 text-amber-700',
  ecommerce: 'bg-green-100 text-green-700',
  blog: 'bg-orange-100 text-orange-700',
};

const categoryBgColors: Record<string, string> = {
  business: 'bg-blue-600',
  hospitality: 'bg-red-600',
  creative: 'bg-purple-600',
  technology: 'bg-cyan-600',
  services: 'bg-amber-600',
  ecommerce: 'bg-green-600',
  blog: 'bg-orange-600',
};

export default function TemplateGallery() {
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/templates');
        if (!res.ok) throw new Error('Failed to fetch templates');
        const data = await res.json();
        setTemplates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-neutral-200 overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-neutral-200" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-neutral-200 rounded w-2/3" />
              <div className="h-4 bg-neutral-100 rounded w-full" />
              <div className="h-4 bg-neutral-100 rounded w-4/5" />
              <div className="h-9 bg-neutral-200 rounded w-32 mt-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-red-600 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-12 text-center">
        <p className="text-neutral-500 text-lg">No templates available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <div
          key={template.id}
          className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col"
        >
          {/* Screenshot placeholder */}
          <div
            className={`h-48 flex items-center justify-center ${categoryBgColors[template.category] || 'bg-neutral-600'}`}
          >
            <span className="text-white/90 text-lg font-semibold tracking-wide">
              {template.name}
            </span>
          </div>

          {/* Card body */}
          <div className="p-5 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-lg font-semibold text-neutral-900">
                {template.name}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                {template.pages && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                    {template.pages.length} pages
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    categoryColors[template.category] || 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {template.category}
                </span>
              </div>
            </div>

            <p className="text-sm text-neutral-600 leading-relaxed mb-3 flex-1">
              {template.description}
            </p>

            {template.features && template.features.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {template.features.map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-50 text-neutral-600 border border-neutral-200"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            )}

            <a
              href={`/sites/new?template=${template.id}`}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors w-full"
            >
              Use Template
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
