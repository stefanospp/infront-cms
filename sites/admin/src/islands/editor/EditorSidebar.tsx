import { useState } from 'react';
import type { PageSchema, SectionSchema, ComponentDefinition } from './registry';
import {
  componentRegistry,
  componentCategories,
  getComponent,
  generateSectionId,
} from './registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditorSidebarProps {
  pages: PageSchema[];
  currentPage: string;
  sections: SectionSchema[];
  selectedSectionId: string | null;
  onPageSelect: (slug: string) => void;
  onSectionSelect: (id: string) => void;
  onSectionRemove: (id: string) => void;
  onSectionMove: (id: string, direction: 'up' | 'down') => void;
  onSectionAdd: (section: SectionSchema) => void;
}

// ---------------------------------------------------------------------------
// Page icon helper
// ---------------------------------------------------------------------------

const pageIcons: Record<string, string> = {
  index: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1',
  about: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  contact: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  services: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
};

function getPageIcon(slug: string): string {
  return (
    pageIcons[slug] ??
    'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  );
}

// ---------------------------------------------------------------------------
// Add Section Modal
// ---------------------------------------------------------------------------

function AddSectionModal({
  onAdd,
  onClose,
}: {
  onAdd: (componentName: string, component: ComponentDefinition, variant: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const allComponents = Object.entries(componentRegistry).map(([id, def]) => ({
    id,
    ...def,
  }));

  const filtered = search.trim()
    ? allComponents.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.category.toLowerCase().includes(search.toLowerCase()),
      )
    : allComponents;

  const grouped = componentCategories
    .map((cat) => ({
      ...cat,
      components: filtered.filter((c) => c.category === cat.id),
    }))
    .filter((g) => g.components.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl bg-gray-800 shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-100">Add Section</h3>
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

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-700">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components..."
            className="w-full rounded-md bg-gray-900 border border-gray-600 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Component list */}
        <div className="max-h-80 overflow-y-auto px-4 py-3 space-y-4">
          {grouped.map((group) => (
            <div key={group.id}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {group.label}
              </h4>
              <div className="space-y-1">
                {group.components.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => onAdd(comp.id, comp, comp.variants[0] ?? '')}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-100">{comp.name}</p>
                      <p className="text-xs text-gray-400 line-clamp-1">{comp.description}</p>
                      {comp.variants.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {comp.variants.map((v) => (
                            <span
                              key={v}
                              className="inline-flex rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-300"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <svg className="mt-1 h-4 w-4 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {grouped.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">No components match your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function EditorSidebar({
  pages,
  currentPage,
  sections,
  selectedSectionId,
  onPageSelect,
  onSectionSelect,
  onSectionRemove,
  onSectionMove,
  onSectionAdd,
}: EditorSidebarProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  function handleAddComponent(componentName: string, component: ComponentDefinition, variant: string) {
    const defaultProps: Record<string, unknown> = {};
    for (const [propName, prop] of Object.entries(component.props)) {
      if (prop.type === 'array') {
        defaultProps[propName] = [];
      } else if (prop.type === 'boolean') {
        defaultProps[propName] = false;
      } else if (prop.type === 'number') {
        defaultProps[propName] = 0;
      } else {
        defaultProps[propName] = '';
      }
    }

    const section: SectionSchema = {
      id: generateSectionId(),
      component: componentName,
      variant,
      props: defaultProps,
    };

    onSectionAdd(section);
    setShowAddModal(false);
  }

  return (
    <div className="flex h-full w-[280px] flex-col border-r border-gray-700 bg-gray-900">
      {/* Pages section */}
      <div className="border-b border-gray-700 p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Pages
        </h3>
        <nav className="space-y-0.5">
          {pages.map((page) => (
            <button
              key={page.page}
              onClick={() => onPageSelect(page.page)}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                page.page === currentPage
                  ? 'bg-gray-700 text-gray-100 font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getPageIcon(page.page)} />
              </svg>
              <span className="truncate">
                {page.page === 'index' ? 'Home' : page.title || page.page}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Sections list */}
      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Sections
        </h3>

        {sections.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-600">
            No sections yet. Add one below.
          </p>
        ) : (
          <div className="space-y-1">
            {sections.map((section, index) => {
              const compDef = getComponent(section.component);
              return (
                <div
                  key={section.id}
                  className={`group flex items-center gap-1 rounded-md border transition-colors ${
                    section.id === selectedSectionId
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-transparent hover:bg-gray-800'
                  }`}
                >
                  {/* Section info (clickable) */}
                  <button
                    onClick={() => onSectionSelect(section.id)}
                    className="flex flex-1 items-center gap-2 px-2.5 py-2 text-left min-w-0"
                  >
                    <span className="text-sm font-medium text-gray-200 truncate">
                      {compDef?.name ?? section.component}
                    </span>
                    {section.variant && (
                      <span className="flex-shrink-0 rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400">
                        {section.variant}
                      </span>
                    )}
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Move up */}
                    <button
                      onClick={() => onSectionMove(section.id, 'up')}
                      disabled={index === 0}
                      className="rounded p-1 text-gray-500 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>

                    {/* Move down */}
                    <button
                      onClick={() => onSectionMove(section.id, 'down')}
                      disabled={index === sections.length - 1}
                      className="rounded p-1 text-gray-500 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => onSectionRemove(section.id)}
                      className="rounded p-1 text-gray-500 hover:text-red-400"
                      aria-label="Remove section"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add section button */}
      <div className="border-t border-gray-700 p-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-800 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-gray-100 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Section
        </button>
      </div>

      {/* Add section modal */}
      {showAddModal && (
        <AddSectionModal
          onAdd={handleAddComponent}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
