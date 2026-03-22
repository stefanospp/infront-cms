import { useState, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MediaLibraryProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (imagePath: string) => void;
}

interface MediaImage {
  name: string;
  path: string;
  size: number;
  modified?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MediaLibrary({
  slug,
  isOpen,
  onClose,
  onSelect,
}: MediaLibraryProps) {
  const [images, setImages] = useState<MediaImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load images
  useEffect(() => {
    if (!isOpen) return;

    async function loadImages() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/sites/${slug}/media`);
        if (!res.ok) throw new Error('Failed to load images');
        const data = await res.json();
        setImages(data.images ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    }

    loadImages();
  }, [slug, isOpen]);

  if (!isOpen) return null;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/sites/${slug}/media`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(data.error ?? 'Upload failed');
      }

      const data = await res.json();
      if (data.image) {
        setImages((prev) => [data.image, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(filename: string) {
    try {
      const res = await fetch(`/api/sites/${slug}/media`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.name !== filename));
        if (selectedImage === `/images/${filename}`) {
          setSelectedImage(null);
        }
      }
    } catch {
      setError('Failed to delete image');
    }
  }

  function handleSelectAndClose() {
    if (selectedImage && onSelect) {
      onSelect(selectedImage);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-3xl max-h-[85vh] rounded-xl bg-gray-900 shadow-2xl border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-100">Media Library</h2>
          <div className="flex items-center gap-3">
            {/* Upload button */}
            <label className="cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors">
              {isUploading ? 'Uploading...' : 'Upload Image'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            {/* Select button (when in picker mode) */}
            {onSelect && (
              <button
                onClick={handleSelectAndClose}
                disabled={!selectedImage}
                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Select
              </button>
            )}

            {/* Close */}
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

        {/* Error */}
        {error && (
          <div className="mx-5 mt-3 rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="h-12 w-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-3 text-sm text-gray-500">No images yet</p>
              <p className="mt-1 text-xs text-gray-600">Upload an image to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.name}
                  className={`group relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${
                    selectedImage === img.path
                      ? 'border-blue-500'
                      : 'border-transparent hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedImage(img.path)}
                >
                  <img
                    src={`/api/sites/${slug}/media-preview?file=${encodeURIComponent(img.name)}`}
                    alt={img.name}
                    className="h-full w-full object-cover bg-gray-800"
                    loading="lazy"
                  />

                  {/* Overlay with info */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate">{img.name}</p>
                    <p className="text-[10px] text-gray-300">{formatFileSize(img.size)}</p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(img.name);
                    }}
                    className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                    aria-label={`Delete ${img.name}`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  {/* Selected checkmark */}
                  {selectedImage === img.path && (
                    <div className="absolute top-1 left-1 rounded-full bg-blue-500 p-0.5">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
