import { useState, useRef, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditorPreviewProps {
  currentPage: string;
  devServerPort: number | null;
  devServerStatus: 'starting' | 'running' | 'stopped' | 'error';
  selectedSectionId: string | null;
  onSectionSelect?: (sectionId: string) => void;
  onPropUpdate?: (sectionId: string, propPath: string, value: string) => void;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const deviceWidths: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

const deviceLabels: Record<DeviceMode, string> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditorPreview({
  currentPage,
  devServerPort,
  devServerStatus,
  selectedSectionId,
  onSectionSelect,
  onPropUpdate,
}: EditorPreviewProps) {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [bridgeReady, setBridgeReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const pagePath = currentPage === 'index' ? '/' : `/${currentPage}`;
  const iframeSrc =
    devServerPort !== null ? `http://localhost:${devServerPort}${pagePath}` : '';

  const handleRefresh = useCallback(() => {
    setBridgeReady(false);
    if (iframeRef.current) {
      iframeRef.current.src = iframeSrc;
    }
  }, [iframeSrc]);

  // Listen for postMessage from the editor bridge in the iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const msg = e.data;
      if (!msg || typeof msg.type !== 'string') return;

      switch (msg.type) {
        case 'editor-bridge:ready':
          setBridgeReady(true);
          break;
        case 'editor-bridge:section-select':
          if (msg.sectionId && onSectionSelect) {
            onSectionSelect(msg.sectionId);
          }
          break;
        case 'editor-bridge:prop-update':
          if (msg.sectionId && msg.propPath && onPropUpdate) {
            onPropUpdate(msg.sectionId, msg.propPath, msg.value);
          }
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSectionSelect, onPropUpdate]);

  // Highlight the selected section in the iframe when selection changes
  useEffect(() => {
    if (bridgeReady && selectedSectionId && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'editor-bridge:highlight-section', sectionId: selectedSectionId },
        '*',
      );
    }
  }, [bridgeReady, selectedSectionId]);

  // Loading state
  if (devServerStatus === 'starting') {
    return (
      <div className="flex flex-1 flex-col bg-gray-950">
        <PreviewToolbar
          pagePath={pagePath}
          device={device}
          onDeviceChange={setDevice}
          onRefresh={handleRefresh}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500" />
            <p className="mt-3 text-sm text-gray-400">Starting dev server...</p>
            <p className="mt-1 text-xs text-gray-600">This may take a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (devServerStatus === 'error') {
    return (
      <div className="flex flex-1 flex-col bg-gray-950">
        <PreviewToolbar
          pagePath={pagePath}
          device={device}
          onDeviceChange={setDevice}
          onRefresh={handleRefresh}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="mt-3 text-sm text-red-400">Dev server failed to start</p>
            <p className="mt-1 text-xs text-gray-500">Check the terminal for error details</p>
          </div>
        </div>
      </div>
    );
  }

  // Stopped state
  if (devServerStatus === 'stopped' || devServerPort === null) {
    return (
      <div className="flex flex-1 flex-col bg-gray-950">
        <PreviewToolbar
          pagePath={pagePath}
          device={device}
          onDeviceChange={setDevice}
          onRefresh={handleRefresh}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-10 w-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <p className="mt-3 text-sm text-gray-400">Preview not available</p>
            <p className="mt-1 text-xs text-gray-600">Dev server is not running</p>
          </div>
        </div>
      </div>
    );
  }

  // Running — show iframe
  return (
    <div className="flex flex-1 flex-col bg-gray-950">
      <PreviewToolbar
        pagePath={pagePath}
        device={device}
        onDeviceChange={setDevice}
        onRefresh={handleRefresh}
      />
      <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
        <div
          className="h-full bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
          style={{ width: deviceWidths[device], maxWidth: '100%' }}
        >
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className="h-full w-full border-0"
            title="Site preview"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview Toolbar (sub-component)
// ---------------------------------------------------------------------------

function PreviewToolbar({
  pagePath,
  device,
  onDeviceChange,
  onRefresh,
}: {
  pagePath: string;
  device: DeviceMode;
  onDeviceChange: (d: DeviceMode) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex h-10 items-center justify-between border-b border-gray-800 bg-gray-900 px-4">
      {/* Page path */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span className="font-mono">{pagePath}</span>
      </div>

      {/* Device toggles + refresh */}
      <div className="flex items-center gap-2">
        {/* Device toggles */}
        <div className="flex rounded-md bg-gray-800 p-0.5">
          {(Object.keys(deviceWidths) as DeviceMode[]).map((d) => (
            <button
              key={d}
              onClick={() => onDeviceChange(d)}
              className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                d === device
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              title={deviceLabels[d]}
            >
              {d === 'desktop' && (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
              {d === 'tablet' && (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
              {d === 'mobile' && (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
          title="Refresh preview"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
