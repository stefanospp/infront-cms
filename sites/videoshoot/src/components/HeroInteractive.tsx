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
    <section
      className="relative overflow-hidden bg-neutral-950"
      style={{ height: '100dvh', marginTop: '-72px', paddingTop: '0' }}
    >
      {/* Background poster — visible while video loads */}
      {backgroundPoster && (
        <img
          src={backgroundPoster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Background video */}
      <video
        ref={mainVideoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Gradient — bottom-up on mobile, left-right on desktop */}
      {/* Gradient — darker on mobile for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20 lg:bg-gradient-to-r lg:from-black/80 lg:via-black/40 lg:to-black/20" />

      {/* Content — pinned to bottom via absolute */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-6 sm:px-6 sm:pb-12 lg:mx-auto lg:flex lg:max-w-7xl lg:items-end lg:justify-between lg:px-8 lg:pb-20">

        {/* Text — centered on mobile */}
        <div className="text-center lg:max-w-lg lg:text-left">
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-400 sm:text-sm">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:mt-4 sm:text-4xl lg:text-6xl">
            {heading}
          </h1>
          {subheading && (
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-neutral-300 sm:mt-5 sm:max-w-md sm:text-base lg:mx-0 lg:text-lg">
              {subheading}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:mt-7 lg:justify-start">
            {ctaText && ctaHref && (
              <a
                href={ctaHref}
                className="inline-flex items-center rounded-full border-2 border-white px-5 py-2 text-xs font-semibold text-white transition-all duration-300 hover:bg-white hover:text-neutral-900 sm:px-6 sm:py-3 sm:text-sm"
              >
                {ctaText}
              </a>
            )}
            {secondaryCtaText && secondaryCtaHref && (
              <a
                href={secondaryCtaHref}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:text-white sm:px-6 sm:py-3 sm:text-sm"
              >
                {secondaryCtaText}
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Project carousel — compact strip on mobile, full cards on desktop */}
        {projects.length > 0 && (
          <div className="mt-5 sm:mt-8 lg:mt-0 lg:ml-12 lg:max-w-lg">
            {/* Mobile: compact horizontal strip */}
            <div
              className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory sm:gap-3 lg:hidden"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {projects.map((project, index) => (
                <button
                  key={index}
                  type="button"
                  className="relative w-36 flex-shrink-0 snap-start overflow-hidden rounded-lg outline-none sm:w-44"
                  onClick={() => handleProjectClick(project, index)}
                >
                  <div className="aspect-[3/4] relative bg-neutral-800">
                    {project.poster ? (
                      <img src={project.poster} alt={project.title} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-neutral-700" />
                    )}
                    <div className="absolute inset-0 bg-black/20 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 sm:h-10 sm:w-10">
                        <svg className="ml-0.5 h-4 w-4 text-neutral-900" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 px-1.5 py-1">
                      <p className="truncate text-[10px] font-medium text-white sm:text-xs">{project.title}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop: full-size card carousel */}
            <div
              ref={carouselRef}
              className="hidden gap-4 overflow-x-auto pb-4 snap-x snap-mandatory lg:flex"
              style={{ scrollbarWidth: 'none', scrollBehavior: 'smooth' }}
            >
              {projects.map((project, index) => (
                <div key={index} className="w-56 flex-shrink-0 snap-start">
                  <ProjectThumbnail
                    project={project}
                    isActive={activeIndex === index}
                    onClick={() => handleProjectClick(project, index)}
                  />
                </div>
              ))}
            </div>

            {/* Desktop nav arrows */}
            {projects.length > 2 && (
              <div className="mt-4 hidden items-center gap-3 lg:flex">
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

function ProjectThumbnail({ project, isActive, onClick }: { project: ProjectItem; isActive: boolean; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  return (
    <button
      type="button"
      className="group relative block w-full overflow-hidden rounded-lg cursor-pointer outline-none"
      onClick={onClick}
      onMouseEnter={() => {
        setIsHovering(true);
        if (videoRef.current) {
          if (!videoRef.current.src) { videoRef.current.src = project.video; videoRef.current.load(); }
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        videoRef.current?.pause();
      }}
    >
      <div className="aspect-[3/4] relative bg-neutral-800">
        {project.poster && (
          <img src={project.poster} alt={project.title} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${isHovering ? 'opacity-0' : 'opacity-100'}`} />
        )}
        <video ref={videoRef} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover" />
        <div className={`absolute inset-0 transition-opacity duration-300 ${isHovering ? 'bg-black/10' : 'bg-black/30'}`} />
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${isHovering ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <svg className="ml-1 h-5 w-5 text-neutral-900" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-4">
          <h3 className="text-sm font-semibold text-white">{project.title}</h3>
        </div>
      </div>
    </button>
  );
}
