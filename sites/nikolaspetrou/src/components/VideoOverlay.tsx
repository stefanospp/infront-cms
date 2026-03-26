import { useState, useRef, useEffect, useCallback } from 'react';

function getInstagramEmbedUrl(src: string): string | null {
  const match = src.match(/instagram\.com\/(?:.*\/)?reel\/([^/]+)/);
  if (match?.[1]) {
    return `https://www.instagram.com/reel/${match[1]}/embed/`;
  }
  return null;
}

export default function VideoOverlay() {
  const [src, setSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const close = useCallback(() => {
    setSrc(null);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
    }
  }, []);

  useEffect(() => {
    function handleOpen(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setSrc(detail);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }

    window.addEventListener('open-video-overlay', handleOpen);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('open-video-overlay', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [close]);

  // Auto-play when video source changes (mp4 only)
  useEffect(() => {
    if (src && videoRef.current && !getInstagramEmbedUrl(src)) {
      videoRef.current.src = src;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [src]);

  // Lock body scroll when open
  useEffect(() => {
    if (src) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [src]);

  if (!src) return null;

  const igEmbedUrl = getInstagramEmbedUrl(src);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={close}
        className="absolute top-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:top-6 sm:right-6"
        aria-label="Close video"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {igEmbedUrl ? (
        /* Instagram Reel embed */
        <div className="w-full max-w-[420px] mx-4">
          <div className="relative w-full" style={{ paddingBottom: '177%' }}>
            <iframe
              src={igEmbedUrl}
              className="absolute inset-0 h-full w-full rounded-xl"
              frameBorder="0"
              scrolling="no"
              allowTransparency
              allow="autoplay; encrypted-media"
              title="Instagram Reel"
            />
          </div>
        </div>
      ) : (
        /* Regular video */
        <video
          ref={videoRef}
          controls
          autoPlay
          playsInline
          className="max-h-[75vh] max-w-[92vw] rounded-lg sm:max-h-[85vh] sm:max-w-[90vw]"
        />
      )}
    </div>
  );
}
