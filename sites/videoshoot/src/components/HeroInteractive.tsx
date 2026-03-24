import { useState, useRef, useCallback, useEffect } from 'react';

interface ProjectItem {
  title: string;
  video: string;
  poster?: string;
}

interface Props {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  backgroundVideo: string;
  backgroundPoster?: string;
  projects: ProjectItem[];
}

export default function HeroInteractive({
  eyebrow,
  heading,
  subheading,
  ctaText,
  ctaHref,
  secondaryCtaText,
  secondaryCtaHref,
  backgroundVideo,
  backgroundPoster,
  projects,
}: Props) {
  const [activeVideo, setActiveVideo] = useState(backgroundVideo);
  const [activeIndex, setActiveIndex] = useState(-1);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Set src directly on mount and when activeVideo changes
  useEffect(() => {
    const v = mainVideoRef.current;
    if (v) {
      v.src = activeVideo;
      v.load();
      v.play().catch(() => {});
    }
  }, [activeVideo]);

  const handleProjectClick = useCallback((project: ProjectItem, index: number) => {
    setActiveVideo(project.video);
    setActiveIndex(index);
  }, []);

  const scrollCarousel = useCallback((direction: 1 | -1) => {
    if (!carouselRef.current) return;
    const child = carouselRef.current.firstElementChild as HTMLElement | null;
    const amount = child ? child.offsetWidth + 16 : carouselRef.current.offsetWidth * 0.6;
    carouselRef.current.scrollBy({ left: direction * amount, behavior: 'smooth' });
  }, []);

  return (
    <section className="relative overflow-hidden bg-neutral-950" style={{ minHeight: '100dvh' }}>
      {/* Background poster — shows while video buffers */}
      {backgroundPoster && (
        <img
          src={backgroundPoster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Background video — src set via useEffect, covers poster when playing */}
      <video
        ref={mainVideoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-end px-4 pb-16 pt-32 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:pb-20" style={{ minHeight: '100dvh' }}>
        {/* Left — text */}
        <div className="max-w-xl lg:max-w-lg">
          {eyebrow && (
            <p className="text-sm font-medium uppercase tracking-widest text-neutral-300">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            {heading}
          </h1>
          {subheading && (
            <p className="mt-6 text-base leading-relaxed text-neutral-300 sm:text-lg">
              {subheading}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {ctaText && ctaHref && (
              <a
                href={ctaHref}
                className="inline-flex items-center rounded-full border-2 border-white bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-neutral-900"
              >
                {ctaText}
              </a>
            )}
            {secondaryCtaText && secondaryCtaHref && (
              <a
                href={secondaryCtaHref}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors hover:text-neutral-300"
              >
                {secondaryCtaText}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Right — project video carousel */}
        {projects.length > 0 && (
          <div className="mt-10 lg:mt-0 lg:ml-12 lg:max-w-lg">
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {projects.map((project, index) => (
                <div key={index} className="w-48 flex-shrink-0 snap-start sm:w-56">
                  <ProjectThumbnail
                    project={project}
                    isActive={activeIndex === index}
                    onClick={() => handleProjectClick(project, index)}
                  />
                </div>
              ))}
            </div>

            {projects.length > 2 && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-500 text-white transition-colors hover:border-white"
                  aria-label="Previous project"
                  onClick={() => scrollCarousel(-1)}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-500 text-white transition-colors hover:border-white"
                  aria-label="Next project"
                  onClick={() => scrollCarousel(1)}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="ml-4 h-px flex-1 bg-neutral-600" />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** Thumbnail — video element IS the thumbnail. Plays on hover, click swaps hero. */
function ProjectThumbnail({
  project,
  isActive,
  onClick,
}: {
  project: ProjectItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current) {
      // Load on first hover, then play
      if (!videoRef.current.src) {
        videoRef.current.src = project.video;
        videoRef.current.load();
      }
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <button
      type="button"
      className="group relative block w-full overflow-hidden rounded-lg cursor-pointer outline-none"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="aspect-[3/4] relative bg-neutral-800">
        {/* Poster image — shows until video loads */}
        {project.poster && (
          <img
            src={project.poster}
            alt={project.title}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${isHovering ? 'opacity-0' : 'opacity-100'}`}
          />
        )}

        {/* Video — loads on hover, plays as preview */}
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Overlay — lighter on hover */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${isHovering ? 'bg-black/10' : 'bg-black/30'}`} />

        {/* Play button — hidden on hover */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovering ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <svg className="ml-1 h-5 w-5 text-neutral-900" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-4">
          <h3 className="text-sm font-semibold text-white">{project.title}</h3>
        </div>
      </div>
    </button>
  );
}
