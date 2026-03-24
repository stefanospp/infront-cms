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
  // Start with first project video (not the generic background)
  const allVideos = projects.length > 0
    ? projects.map(p => p.video)
    : [backgroundVideo];

  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  // Set hero height to exact viewport
  useEffect(() => {
    const setHeight = () => {
      if (!sectionRef.current) return;
      const nav = document.getElementById('site-nav');
      const navHeight = nav ? nav.offsetHeight : 0;
      sectionRef.current.style.height = (window.innerHeight + navHeight) + 'px';
      sectionRef.current.style.marginTop = `-${navHeight}px`;
    };
    setHeight();
    window.addEventListener('resize', setHeight);
    window.addEventListener('orientationchange', setHeight);
    return () => {
      window.removeEventListener('resize', setHeight);
      window.removeEventListener('orientationchange', setHeight);
    };
  }, []);

  // Load and play the active video
  useEffect(() => {
    const v = mainVideoRef.current;
    if (v) {
      v.src = allVideos[activeIndex] || backgroundVideo;
      v.load();
      v.play().catch(() => {});
    }
  }, [activeIndex, allVideos, backgroundVideo]);

  // Track video progress and auto-advance
  useEffect(() => {
    const v = mainVideoRef.current;
    if (!v) return;

    const updateProgress = () => {
      if (v.duration && v.duration > 0) {
        const p = (v.currentTime / v.duration) * 100;
        progressRef.current = p;
        setProgress(p);
      }
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    const handleEnded = () => {
      // Auto-advance to next video
      setActiveIndex(prev => (prev + 1) % allVideos.length);
    };

    v.addEventListener('ended', handleEnded);
    // Don't loop the main video — we handle advancement
    v.loop = false;
    rafRef.current = requestAnimationFrame(updateProgress);

    return () => {
      v.removeEventListener('ended', handleEnded);
      cancelAnimationFrame(rafRef.current);
    };
  }, [activeIndex, allVideos.length]);

  const goToVideo = useCallback((index: number) => {
    setActiveIndex(index);
    setProgress(0);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-neutral-950"
      style={{ height: '100vh' }}
    >
      {/* Background poster */}
      {backgroundPoster && (
        <img
          src={backgroundPoster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Background video — no loop, advances on end */}
      <video
        ref={mainVideoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20 lg:bg-gradient-to-r lg:from-black/80 lg:via-black/40 lg:to-black/20" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-6 sm:px-6 sm:pb-12 lg:mx-auto lg:flex lg:max-w-7xl lg:items-end lg:justify-between lg:px-8 lg:pb-20">

        {/* Text */}
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

        {/* Project slider with progress rings */}
        {projects.length > 0 && (
          <div className="mt-5 sm:mt-8 lg:mt-0 lg:ml-12 lg:max-w-lg">
            {/* Mobile + Desktop: thumbnail cards with progress */}
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:gap-4"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {projects.map((project, index) => (
                <button
                  key={index}
                  type="button"
                  className={`relative flex-shrink-0 snap-start overflow-hidden rounded-xl outline-none transition-all duration-500 ${
                    activeIndex === index
                      ? 'w-40 sm:w-48 lg:w-56 ring-2 ring-white/40'
                      : 'w-28 sm:w-36 lg:w-44 opacity-60 hover:opacity-90'
                  }`}
                  onClick={() => goToVideo(index)}
                >
                  <div className="aspect-[3/4] relative">
                    {/* Poster */}
                    {project.poster && (
                      <img
                        src={project.poster}
                        alt={project.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    {/* Overlay */}
                    <div className={`absolute inset-0 transition-all duration-500 ${
                      activeIndex === index ? 'bg-black/10' : 'bg-black/40'
                    }`} />

                    {/* Circular progress indicator — only on active */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative h-12 w-12 sm:h-14 sm:w-14">
                        {/* Background ring */}
                        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48">
                          <circle
                            cx="24" cy="24" r="20"
                            fill="none"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="2.5"
                          />
                          {/* Progress ring — animated */}
                          <circle
                            cx="24" cy="24" r="20"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 20}`}
                            strokeDashoffset={`${2 * Math.PI * 20 * (1 - (activeIndex === index ? progress / 100 : 0))}`}
                            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                          />
                        </svg>
                        {/* Play/active icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {activeIndex === index ? (
                            <div className="h-3 w-3 rounded-sm bg-white" style={{ clipPath: 'polygon(0 0, 35% 0, 35% 100%, 0 100%, 0 0, 65% 0, 65% 100%, 100% 100%, 100% 0, 65% 0)' }}>
                              {/* Playing indicator — two bars */}
                            </div>
                          ) : (
                            <svg className="ml-0.5 h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 px-3 py-2">
                      <p className="truncate text-[11px] font-medium text-white sm:text-xs">{project.title}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop nav arrows */}
            <div className="mt-4 hidden items-center gap-3 lg:flex">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-500 text-white transition-colors hover:border-white"
                aria-label="Previous project"
                onClick={() => goToVideo((activeIndex - 1 + projects.length) % projects.length)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-500 text-white transition-colors hover:border-white"
                aria-label="Next project"
                onClick={() => goToVideo((activeIndex + 1) % projects.length)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {/* Progress dots */}
              <div className="ml-4 flex items-center gap-2">
                {projects.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      activeIndex === i ? 'w-8 bg-white' : 'w-1.5 bg-neutral-500 hover:bg-neutral-400'
                    }`}
                    onClick={() => goToVideo(i)}
                    aria-label={`Go to video ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
