import { useState, useEffect, useRef, useCallback } from 'react';
import type { PageSchema, SectionSchema } from './editor/registry';
import EditorToolbar from './editor/EditorToolbar';
import EditorSidebar from './editor/EditorSidebar';
import EditorPreview from './editor/EditorPreview';
import EditorProperties from './editor/EditorProperties';
import EditorConfig from './editor/EditorConfig';
import MediaLibrary from './editor/MediaLibrary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DevServerStatus = 'starting' | 'running' | 'stopped' | 'error';

interface DevServerResponse {
  status: DevServerStatus;
  port?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SiteEditor({ slug }: { slug: string }) {
  // State
  const [currentPage, setCurrentPage] = useState('index');
  const [pages, setPages] = useState<PageSchema[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [devServerPort, setDevServerPort] = useState<number | null>(null);
  const [devServerStatus, setDevServerStatus] = useState<DevServerStatus>('stopped');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [isFullPreview, setIsFullPreview] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Current page schema
  const currentPageSchema = pages.find((p) => p.page === currentPage);
  const sections = currentPageSchema?.sections ?? [];
  const selectedSection = sections.find((s) => s.id === selectedSectionId) ?? null;

  // ---- Helpers ----

  const updateCurrentPageSections = useCallback(
    (updater: (sections: SectionSchema[]) => SectionSchema[]) => {
      setPages((prev) =>
        prev.map((p) =>
          p.page === currentPage ? { ...p, sections: updater(p.sections) } : p,
        ),
      );
      setHasUnsavedChanges(true);
    },
    [currentPage],
  );

  // ---- Load pages ----

  useEffect(() => {
    let cancelled = false;

    async function loadPages() {
      try {
        const res = await fetch(`/api/sites/${slug}/pages`);
        if (!res.ok) throw new Error('Failed to load pages');
        const data = await res.json();
        const pageList: PageSchema[] = data.pages ?? data;
        if (!cancelled) {
          setPages(pageList);
          setLoadState('loaded');
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Unknown error');
          setLoadState('error');
        }
      }
    }

    loadPages();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ---- Start dev server ----

  useEffect(() => {
    let cancelled = false;

    async function startDevServer() {
      setDevServerStatus('starting');

      try {
        const res = await fetch(`/api/sites/${slug}/dev-server`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' }),
        });

        if (!res.ok) {
          if (!cancelled) setDevServerStatus('error');
          return;
        }

        const data = await res.json();
        const server = data.server as DevServerResponse | undefined;

        if (server?.status === 'running' && server.port) {
          if (!cancelled) {
            setDevServerPort(server.port);
            setDevServerStatus('running');
          }
          return;
        }

        // Poll until running
        pollRef.current = setInterval(async () => {
          try {
            const pollRes = await fetch(`/api/sites/${slug}/dev-server`);
            if (!pollRes.ok) return;
            const pollData = await pollRes.json();
            const pollServer = pollData.server as DevServerResponse | undefined;

            if (pollServer?.status === 'running' && pollServer.port) {
              if (!cancelled) {
                setDevServerPort(pollServer.port);
                setDevServerStatus('running');
              }
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = null;
            } else if (pollServer?.status === 'error') {
              if (!cancelled) setDevServerStatus('error');
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = null;
            }
          } catch (err) {
            console.error('Dev server poll error:', err instanceof Error ? err.message : err);
          }
        }, 2000);
      } catch (err) {
        console.error('Failed to start dev server:', err instanceof Error ? err.message : err);
        if (!cancelled) setDevServerStatus('error');
      }
    }

    startDevServer();

    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [slug]);

  // ---- Cleanup dev server on unmount ----

  useEffect(() => {
    return () => {
      // Fire and forget: stop the dev server when leaving the editor
      fetch(`/api/sites/${slug}/dev-server`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      }).catch(() => {
        // silent
      });
    };
  }, [slug]);

  // ---- Page selection ----

  function handlePageSelect(pageSlug: string) {
    setCurrentPage(pageSlug);
    setSelectedSectionId(null);
  }

  // ---- Section operations ----

  function handleSectionSelect(id: string) {
    setSelectedSectionId(id);
  }

  function handlePreviewSectionSelect(id: string) {
    setSelectedSectionId(id);
  }

  function handlePreviewPropUpdate(sectionId: string, propPath: string, value: string) {
    updateCurrentPageSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, props: { ...s.props, [propPath]: value } } : s,
      ),
    );
  }

  function handleSectionRemove(id: string) {
    updateCurrentPageSections((prev) => prev.filter((s) => s.id !== id));
    if (selectedSectionId === id) {
      setSelectedSectionId(null);
    }
  }

  function handleSectionMove(id: string, direction: 'up' | 'down') {
    updateCurrentPageSections((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const updated = [...prev];
      const item = updated[index];
      const swap = updated[newIndex];
      if (!item || !swap) return prev;

      updated[index] = swap;
      updated[newIndex] = item;
      return updated;
    });
  }

  function handleSectionAdd(section: SectionSchema) {
    updateCurrentPageSections((prev) => [...prev, section]);
    setSelectedSectionId(section.id);
  }

  function handleSectionUpdate(updated: SectionSchema) {
    updateCurrentPageSections((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );
  }

  // ---- Auto-save on change (debounced) ----

  useEffect(() => {
    if (!hasUnsavedChanges || isSaving) return;

    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      handleSave();
    }, 1500);

    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [hasUnsavedChanges, pages, currentPage]);

  // ---- Save ----

  async function handleSave() {
    if (!currentPageSchema) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/sites/${slug}/pages/${currentPage}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPageSchema),
      });

      if (res.ok) {
        setHasUnsavedChanges(false);
      } else {
        const data = await res.json().catch(() => ({ error: 'Save failed' }));
        alert(data.error ?? 'Failed to save page');
      }
    } catch (err) {
      console.error('Failed to save page:', err instanceof Error ? err.message : err);
      alert('Network error — could not save');
    } finally {
      setIsSaving(false);
    }
  }

  // ---- Publish ----

  async function handlePublish() {
    try {
      const res = await fetch(`/api/sites/${slug}/redeploy`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Publish failed' }));
        alert(data.error ?? 'Failed to publish');
      }
    } catch (err) {
      console.error('Failed to publish site:', err instanceof Error ? err.message : err);
      alert('Network error — could not publish');
    }
  }

  // ---- Render: Loading ----

  if (loadState === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500" />
          <p className="mt-3 text-sm text-gray-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  // ---- Render: Error ----

  if (loadState === 'error') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <svg className="mx-auto h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="mt-3 text-sm text-red-400">
            {loadError ?? 'Failed to load editor'}
          </p>
          <a
            href={`/sites/${slug}`}
            className="mt-4 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            Back to Site Details
          </a>
        </div>
      </div>
    );
  }

  // ---- Render: Editor ----

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-gray-100">
      {/* Top toolbar */}
      <EditorToolbar
        slug={slug}
        currentPage={currentPage}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onPublish={handlePublish}
        onOpenConfig={() => setShowConfig(true)}
        onOpenMedia={() => setShowMedia(true)}
        isFullPreview={isFullPreview}
        onTogglePreview={() => setIsFullPreview((p) => !p)}
      />

      {/* Site config editor modal */}
      <EditorConfig
        slug={slug}
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
      />

      {/* Media library modal */}
      <MediaLibrary
        slug={slug}
        isOpen={showMedia}
        onClose={() => setShowMedia(false)}
      />

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: pages + sections */}
        {!isFullPreview && (
          <EditorSidebar
            pages={pages}
            currentPage={currentPage}
            sections={sections}
            selectedSectionId={selectedSectionId}
            onPageSelect={handlePageSelect}
            onSectionSelect={handleSectionSelect}
            onSectionRemove={handleSectionRemove}
            onSectionMove={handleSectionMove}
            onSectionAdd={handleSectionAdd}
          />
        )}

        {/* Center: preview iframe */}
        <EditorPreview
          slug={slug}
          currentPage={currentPage}
          devServerPort={devServerPort}
          devServerStatus={devServerStatus}
          selectedSectionId={selectedSectionId}
          onSectionSelect={handlePreviewSectionSelect}
          onPropUpdate={handlePreviewPropUpdate}
        />

        {/* Right panel: properties */}
        {!isFullPreview && (
          <EditorProperties
            section={selectedSection}
            onUpdate={handleSectionUpdate}
          />
        )}
      </div>
    </div>
  );
}
