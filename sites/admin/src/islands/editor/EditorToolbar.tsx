import { useState } from 'react';

interface EditorToolbarProps {
  slug: string;
  currentPage: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onPublish: () => void;
  onOpenConfig?: () => void;
  onOpenMedia?: () => void;
  isFullPreview?: boolean;
  onTogglePreview?: () => void;
}

export default function EditorToolbar({
  slug,
  currentPage,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onPublish,
  onOpenConfig,
  onOpenMedia,
  isFullPreview,
  onTogglePreview,
}: EditorToolbarProps) {
  const [isPublishing, setIsPublishing] = useState(false);

  async function handlePublish() {
    setIsPublishing(true);
    try {
      await onPublish();
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="flex h-12 items-center justify-between border-b border-gray-700 bg-gray-900 px-4">
      {/* Left: Back link + site info */}
      <div className="flex items-center gap-4">
        <a
          href={`/sites/${slug}`}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Admin
        </a>
        <div className="h-5 w-px bg-gray-700" />
        <span className="text-sm font-medium text-gray-100">{slug}</span>
        <span className="text-sm text-gray-500">/</span>
        <span className="text-sm text-gray-300">
          {currentPage === 'index' ? 'Home' : currentPage}
        </span>
      </div>

      {/* Right: Status + actions */}
      <div className="flex items-center gap-3">
        {/* Save status */}
        <span className="text-xs text-gray-400">
          {isSaving
            ? 'Saving...'
            : hasUnsavedChanges
              ? 'Unsaved changes'
              : 'All changes saved'}
        </span>

        {/* Status dot */}
        <span
          className={`h-2 w-2 rounded-full ${
            isSaving
              ? 'bg-yellow-400 animate-pulse'
              : hasUnsavedChanges
                ? 'bg-orange-400'
                : 'bg-green-400'
          }`}
        />

        {/* Settings button */}
        {onOpenConfig && (
          <button
            onClick={onOpenConfig}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
            title="Site Settings"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {/* Media button */}
        {onOpenMedia && (
          <button
            onClick={onOpenMedia}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
            title="Media Library"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        )}

        {/* Full preview toggle */}
        {onTogglePreview && (
          <button
            onClick={onTogglePreview}
            className={`rounded-md p-1.5 transition-colors ${
              isFullPreview
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
            title={isFullPreview ? 'Exit Preview' : 'Full Page Preview'}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isFullPreview ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              )}
            </svg>
          </button>
        )}

        {/* Save button */}
        <button
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving}
          className="inline-flex items-center gap-1.5 rounded-md bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-100 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving && (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
          )}
          Save
        </button>

        {/* Publish button */}
        <button
          onClick={handlePublish}
          disabled={isPublishing || hasUnsavedChanges}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isPublishing && (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          Publish
        </button>
      </div>
    </div>
  );
}
