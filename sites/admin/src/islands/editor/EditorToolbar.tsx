import { useState } from 'react';

interface EditorToolbarProps {
  slug: string;
  currentPage: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onPublish: () => void;
}

export default function EditorToolbar({
  slug,
  currentPage,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onPublish,
}: EditorToolbarProps) {
  const [isPublishing, setIsPublishing] = useState(false);

  async function handlePublish() {
    setIsPublishing(true);
    try {
      onPublish();
    } finally {
      // Parent controls the actual publish flow; reset after a delay
      setTimeout(() => setIsPublishing(false), 3000);
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
