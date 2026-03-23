import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { categories, articles } from '../data/help-content';
import type { HelpCategory, HelpArticle, HelpCategoryMeta } from '../data/help-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type View =
  | { kind: 'home' }
  | { kind: 'category'; categoryId: HelpCategory }
  | { kind: 'article'; articleId: string };

interface SearchResult {
  article: HelpArticle;
  score: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseHash(hash: string): View {
  const h = hash.replace(/^#/, '');
  if (h.startsWith('category/')) {
    const id = h.slice('category/'.length) as HelpCategory;
    if (categories.some((c) => c.id === id)) return { kind: 'category', categoryId: id };
  }
  if (h.startsWith('article/')) {
    const id = h.slice('article/'.length);
    if (articles.some((a) => a.id === id)) return { kind: 'article', articleId: id };
  }
  return { kind: 'home' };
}

function categoryForArticle(article: HelpArticle): HelpCategoryMeta | undefined {
  return categories.find((c) => c.id === article.category);
}

function articlesForCategory(categoryId: HelpCategory): HelpArticle[] {
  return articles.filter((a) => a.category === categoryId);
}

function extractHeadings(markdown: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const re = /^(#{2,4})\s+(.+)$/gm;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    const text = m[2]!.trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    headings.push({ id, text, level: m[1]!.length });
  }
  return headings;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function searchArticles(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];

  for (const article of articles) {
    let score = 0;
    const titleLow = article.title.toLowerCase();
    const descLow = article.description.toLowerCase();
    const tagsLow = article.tags.join(' ').toLowerCase();
    const bodyLow = article.body.toLowerCase();

    for (const word of words) {
      if (titleLow.includes(word)) score += 3;
      if (tagsLow.includes(word)) score += 2;
      if (descLow.includes(word)) score += 1.5;
      if (bodyLow.includes(word)) score += 1;
    }

    if (score > 0) results.push({ article, score });
  }

  return results.sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Markdown renderer (lightweight, no external deps)
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderMarkdown(md: string): string {
  let html = md;

  // Fenced code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
    const escaped = escapeHtml(code);
    const safeLang = lang.replace(/[^a-zA-Z0-9-]/g, '');
    const langClass = safeLang ? ` class="language-${safeLang}"` : '';
    if (safeLang === 'mermaid') {
      return `<pre class="mermaid">${escaped}</pre>`;
    }
    return `<pre><code${langClass}>${escaped}</code></pre>`;
  });

  // Inline code (escape content to prevent XSS)
  html = html.replace(/`([^`]+)`/g, (_match, code: string) => {
    return `<code>${escapeHtml(code)}</code>`;
  });

  // Tables (escape cell content)
  html = html.replace(
    /^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n)*)/gm,
    (_match, headerRow: string, bodyRows: string) => {
      const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
      const headerHtml = headers.map((h: string) => `<th>${escapeHtml(h)}</th>`).join('');
      const rows = bodyRows.trim().split('\n').filter(Boolean);
      const bodyHtml = rows
        .map((row: string) => {
          const cells = row.split('|').map((c: string) => c.trim()).filter(Boolean);
          return `<tr>${cells.map((c: string) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`;
        })
        .join('');
      return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
    },
  );

  // Headings with IDs (escape text content)
  html = html.replace(/^(#{1,4})\s+(.+)$/gm, (_match, hashes: string, text: string) => {
    const level = hashes.length;
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const cleanText = escapeHtml(text.replace(/\*\*/g, ''));
    return `<h${level} id="${id}">${cleanText}</h${level}>`;
  });

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links (sanitize href to prevent javascript: protocol XSS)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text: string, url: string) => {
    const safeUrl = /^(https?:\/\/|\/|#)/.test(url) ? url : '#';
    return `<a href="${safeUrl}">${text}</a>`;
  });

  // Unordered lists
  html = html.replace(/((?:^- .+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split('\n')
      .map((line) => `<li>${line.replace(/^- /, '')}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split('\n')
      .map((line) => `<li>${line.replace(/^\d+\.\s/, '')}</li>`)
      .join('');
    return `<ol>${items}</ol>`;
  });

  // Checklists
  html = html.replace(/- \[ \] (.+)/g, '<li class="checklist">&#9744; $1</li>');
  html = html.replace(/- \[x\] (.+)/g, '<li class="checklist">&#9745; $1</li>');

  // Paragraphs
  html = html
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<[a-z]/.test(trimmed)) return trimmed;
      return `<p>${trimmed}</p>`;
    })
    .join('\n');

  return html;
}

// ---------------------------------------------------------------------------
// Mermaid loader (dynamic import to avoid loading 500KB unless needed)
// ---------------------------------------------------------------------------

let mermaidLoaded = false;
let mermaidPromise: Promise<void> | null = null;

async function initMermaid() {
  if (mermaidLoaded) return;
  if (mermaidPromise) return mermaidPromise;

  mermaidPromise = (async () => {
    try {
      const mermaid = await import('mermaid');
      mermaid.default.initialize({
        startOnLoad: false,
        theme: 'neutral',
        fontFamily: 'Inter, system-ui, sans-serif',
      });
      mermaidLoaded = true;
    } catch {
      mermaidPromise = null;
      console.warn('Mermaid failed to load');
    }
  })();

  return mermaidPromise;
}

async function renderMermaidDiagrams() {
  const elements = document.querySelectorAll('pre.mermaid');
  if (elements.length === 0) return;

  await initMermaid();
  if (!mermaidLoaded) return;

  try {
    const mermaid = await import('mermaid');
    await mermaid.default.run({ nodes: elements as NodeListOf<HTMLElement> });
  } catch (err) {
    console.error('Mermaid diagram rendering failed:', err instanceof Error ? err.message : err);
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Breadcrumb({
  items,
}: {
  items: { label: string; hash?: string }[];
}) {
  return (
    <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && (
            <svg className="w-4 h-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {item.hash ? (
            <a href={item.hash} className="hover:text-neutral-700 transition-colors">
              {item.label}
            </a>
          ) : (
            <span className="text-neutral-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function CategoryBadge({ category }: { category: HelpCategoryMeta }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
      {category.label}
    </span>
  );
}

function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchArticles(query), [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" role="dialog" aria-modal="true" aria-label="Search help articles">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[60vh] flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200">
          <svg className="w-5 h-5 text-neutral-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles..."
            className="flex-1 text-sm outline-none text-neutral-900 placeholder:text-neutral-400"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-neutral-300 text-xs text-neutral-500 font-mono">
            Esc
          </kbd>
        </div>
        <div className="overflow-y-auto flex-1">
          {query && results.length === 0 && (
            <div className="p-8 text-center text-neutral-500 text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
          {results.slice(0, 15).map((r) => {
            const cat = categoryForArticle(r.article);
            return (
              <a
                key={r.article.id}
                href={`#article/${r.article.id}`}
                onClick={onClose}
                className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-neutral-900 truncate">
                      {r.article.title}
                    </span>
                    {cat && <CategoryBadge category={cat} />}
                  </div>
                  <p className="text-xs text-neutral-500 truncate">{r.article.description}</p>
                </div>
              </a>
            );
          })}
          {!query && (
            <div className="p-8 text-center text-neutral-400 text-sm">
              Type to search across all help articles
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

function HomeView() {
  const sorted = [...categories].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((cat) => {
          const count = articlesForCategory(cat.id).length;
          return (
            <a
              key={cat.id}
              href={`#category/${cat.id}`}
              className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md hover:border-primary-200 transition-all duration-200 group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-50 text-primary-600 shrink-0 group-hover:bg-primary-100 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                    {cat.label}
                  </h3>
                  <span className="text-xs text-neutral-400">{count} article{count !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">{cat.description}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function CategoryView({ categoryId }: { categoryId: HelpCategory }) {
  const cat = categories.find((c) => c.id === categoryId);
  const arts = articlesForCategory(categoryId);

  if (!cat) return null;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Help', hash: '#' }, { label: cat.label }]} />

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-1">{cat.label}</h2>
        <p className="text-sm text-neutral-500">{cat.description}</p>
      </div>

      <div className="space-y-3">
        {arts.map((article) => (
          <a
            key={article.id}
            href={`#article/${article.id}`}
            className="block bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md hover:border-primary-200 transition-all duration-200 group"
          >
            <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors mb-1">
              {article.title}
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed mb-2">{article.description}</p>
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {article.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-50 text-neutral-500 border border-neutral-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

function ArticleView({ articleId }: { articleId: string }) {
  const article = articles.find((a) => a.id === articleId);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    renderMermaidDiagrams();
  }, [articleId]);

  if (!article) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium">Article not found</p>
        <a href="#" className="text-sm text-red-600 underline hover:no-underline mt-2 inline-block">
          Back to Help
        </a>
      </div>
    );
  }

  const cat = categoryForArticle(article);
  const headings = extractHeadings(article.body);
  const renderedHtml = renderMarkdown(article.body);
  const relatedArts = (article.relatedArticles ?? [])
    .map((id) => articles.find((a) => a.id === id))
    .filter(Boolean) as HelpArticle[];

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Help', hash: '#' },
          ...(cat ? [{ label: cat.label, hash: `#category/${cat.id}` }] : []),
          { label: article.title },
        ]}
      />

      <div className="flex gap-8">
        {/* Table of contents (desktop only) */}
        {headings.length > 2 && (
          <aside className="hidden xl:block w-56 shrink-0">
            <div className="sticky top-24">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                On this page
              </h4>
              <nav className="space-y-1">
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="block text-xs text-neutral-500 hover:text-primary-600 transition-colors truncate"
                    style={{ paddingLeft: `${(h.level - 2) * 12}px` }}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* Article content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">{article.title}</h1>
            <p className="text-sm text-neutral-500 mb-6">{article.description}</p>

            <div
              ref={contentRef}
              className="help-prose"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>

          {/* Related articles */}
          {relatedArts.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">Related articles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedArts.map((ra) => (
                  <a
                    key={ra.id}
                    href={`#article/${ra.id}`}
                    className="bg-white rounded-lg border border-neutral-200 p-3 hover:border-primary-200 hover:shadow-sm transition-all text-sm group"
                  >
                    <span className="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">
                      {ra.title}
                    </span>
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">{ra.description}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function HelpManual() {
  const [view, setView] = useState<View>({ kind: 'home' });
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Parse initial hash + listen for changes
  useEffect(() => {
    setView(parseHash(window.location.hash));
    setIsMac(navigator.platform?.includes('Mac') ?? false);

    function onHash() {
      setView(parseHash(window.location.hash));
    }
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <div>
      {/* Search bar */}
      <div className="mb-6">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-neutral-200 text-sm text-neutral-400 hover:border-primary-300 hover:shadow-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search help articles...</span>
          <kbd className="hidden sm:inline-flex items-center ml-auto px-1.5 py-0.5 rounded border border-neutral-300 text-xs text-neutral-400 font-mono">
            {isMac ? '\u2318' : 'Ctrl'}K
          </kbd>
        </button>
      </div>

      {/* View content */}
      {view.kind === 'home' && <HomeView />}
      {view.kind === 'category' && <CategoryView categoryId={view.categoryId} />}
      {view.kind === 'article' && <ArticleView articleId={view.articleId} />}

      {/* Search modal */}
      <SearchModal open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
