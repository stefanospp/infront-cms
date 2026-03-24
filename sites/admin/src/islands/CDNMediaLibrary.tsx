import { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CdnFile {
  id: number;
  clientId: number;
  name: string;
  key: string;
  filename: string;
  mimeType: string | null;
  filesize: string;
  folder: string;
  isPublic: boolean;
  cdnUrl: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

interface FileStats {
  totalFiles: number;
  totalSize: number;
  publicFiles: number;
  privateFiles: number;
  storageQuota: number;
  storageUsed: number;
}

type LoadState = 'loading' | 'loaded' | 'error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const PLATFORM_API = 'https://api-v2.infront.cy';

async function cdnApi<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${PLATFORM_API}/api/cdn-files/${path}`, {
    ...opts,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function Spinner({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-600" />
      <p className="mt-3 text-sm text-neutral-500">{label}</p>
    </div>
  );
}

function StorageCard({ stats }: { stats: FileStats }) {
  const pct = stats.storageQuota > 0
    ? Math.min(100, (stats.totalSize / stats.storageQuota) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
      <h3 className="text-sm font-semibold text-neutral-700 mb-3">Storage</h3>
      <p className="text-2xl font-bold text-neutral-900">
        {formatBytes(stats.totalSize)}
        <span className="text-sm font-normal text-neutral-500 ml-1">
          / {formatBytes(stats.storageQuota)}
        </span>
      </p>
      <div className="mt-2 h-2 rounded-full bg-neutral-100">
        <div
          className={`h-2 rounded-full transition-all ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex gap-4 text-xs text-neutral-500">
        <span>{stats.totalFiles} files</span>
        <span>{stats.publicFiles} public</span>
        <span>{stats.privateFiles} private</span>
      </div>
    </div>
  );
}

function FileCard({
  file,
  onToggle,
  onDelete,
}: {
  file: CdnFile;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isImage = file.mimeType?.startsWith('image/');
  const isVideo = file.mimeType?.startsWith('video/');

  function copyUrl() {
    if (file.cdnUrl) {
      navigator.clipboard.writeText(file.cdnUrl);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden group">
      {/* Preview */}
      <div className="h-32 bg-neutral-50 flex items-center justify-center overflow-hidden relative">
        {isImage && file.cdnUrl ? (
          <img src={file.cdnUrl} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
        ) : isVideo && file.cdnUrl ? (
          <video src={file.cdnUrl} className="h-full w-full object-cover" preload="metadata" muted />
        ) : (
          <svg className="w-8 h-8 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
        <span className={`absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${file.isPublic ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
          {file.isPublic ? 'Public' : 'Private'}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-neutral-900 truncate" title={file.name}>{file.name}</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          {formatBytes(Number(file.filesize))} &middot; Client #{file.clientId}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <button onClick={onToggle} className="rounded px-2 py-1 text-xs text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors">
            {file.isPublic ? 'Make Private' : 'Make Public'}
          </button>
          {file.isPublic && file.cdnUrl && (
            <button onClick={copyUrl} className="rounded px-2 py-1 text-xs text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors" title="Copy CDN URL">
              Copy URL
            </button>
          )}
          <button onClick={onDelete} className="ml-auto rounded px-2 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CDNMediaLibrary() {
  const [state, setState] = useState<LoadState>('loading');
  const [files, setFiles] = useState<CdnFile[]>([]);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [search, setSearch] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [uploadPublic, setUploadPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (clientId) params.set('clientId', clientId);
      if (search) params.set('search', search);
      if (filter === 'public') params.set('isPublic', 'true');
      if (filter === 'private') params.set('isPublic', 'false');

      const [filesRes, statsRes] = await Promise.all([
        cdnApi<{ data: CdnFile[] }>(`?${params}`),
        clientId
          ? cdnApi<{ data: FileStats }>(`stats?clientId=${clientId}`)
          : Promise.resolve({ data: null }),
      ]);

      setFiles(filesRes.data);
      setStats(statsRes.data);
      setState('loaded');
    } catch (err) {
      console.error('Failed to load CDN files:', err);
      setState('error');
    }
  }, [clientId, search, filter]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  async function handleUpload(fileList: FileList) {
    if (!clientId) {
      alert('Select a client first');
      return;
    }
    setUploading(true);

    for (const file of Array.from(fileList)) {
      try {
        // 1. Get presigned URL
        const { data } = await cdnApi<{ data: { uploadUrl: string; key: string; folder: string; isPublic: boolean } }>(
          'upload-url',
          {
            method: 'POST',
            body: JSON.stringify({
              clientId: Number(clientId),
              filename: file.name,
              mimeType: file.type,
              filesize: file.size,
              isPublic: uploadPublic,
            }),
          },
        );

        // 2. Upload directly to R2
        await fetch(data.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        // 3. Confirm
        await cdnApi('confirm', {
          method: 'POST',
          body: JSON.stringify({
            clientId: Number(clientId),
            name: file.name.replace(/\.[^.]+$/, ''),
            filename: file.name,
            key: data.key,
            mimeType: file.type,
            filesize: file.size,
            folder: data.folder,
            isPublic: data.isPublic,
          }),
        });
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
      }
    }

    setUploading(false);
    fetchFiles();
  }

  async function togglePublic(id: number) {
    await cdnApi(`${id}/toggle-public`, { method: 'POST' });
    fetchFiles();
  }

  async function deleteFile(id: number) {
    if (!confirm('Delete this file permanently?')) return;
    await cdnApi(`${id}`, { method: 'DELETE' });
    fetchFiles();
  }

  if (state === 'loading') return <Spinner label="Loading CDN files..." />;
  if (state === 'error') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
        <p className="text-red-600 font-medium">Failed to load CDN files</p>
        <p className="text-sm text-neutral-500 mt-1">Check that PLATFORM_API_URL is configured.</p>
        <button onClick={fetchFiles} className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
        <div className="flex flex-wrap items-end gap-4">
          {/* Client ID input */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Client ID</label>
            <input
              type="number"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="e.g. 1"
              className="w-28 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-neutral-600 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Filter */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Visibility</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Upload row */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-4">
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={uploadPublic}
              onChange={(e) => setUploadPublic(e.target.checked)}
              className="rounded border-neutral-300"
            />
            Upload as public
          </label>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={!clientId || uploading}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,video/mp4,video/webm,application/pdf"
            onChange={(e) => {
              if (e.target.files?.length) {
                handleUpload(e.target.files);
                e.target.value = '';
              }
            }}
          />
          {!clientId && (
            <span className="text-xs text-neutral-400">Enter a Client ID to upload</span>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && <StorageCard stats={stats} />}

      {/* File grid */}
      {files.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center text-neutral-500 text-sm">
          {clientId ? 'No files found for this client.' : 'Enter a Client ID to view files.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onToggle={() => togglePublic(file.id)}
              onDelete={() => deleteFile(file.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
