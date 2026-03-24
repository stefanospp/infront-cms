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
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number>(0);
  const count = projects.length || 1;

  // Set hero height to exact viewport
  useEffect(() => {
    const setHeight = () => {
      if (!sectionRef.current) return;
      const nav = document.getElementById('site-nav');
      const navH = nav ? nav.offsetHeight : 0;
      sectionRef.current.style.height = (window.innerHeight + navH) + 'px';
      sectionRef.current.style.marginTop = `-${navH}px`;
    };
    setHeight();
    window.addEventListener('resize', setHeight);
    window.addEventListener('orientationchange', setHeight);
    return () => {
      window.removeEventListener('resize', setHeight);
      window.removeEventListener('orientationchange', setHeight);
    };
  }, []);

  // Load active video
  useEffect(() => {
    const v = mainVideoRef.current;
    if (!v) return;
    v.src = projects[activeIndex]?.video || backgroundVideo;
    v.loop = false;
    v.load();
    v.play().catch(() => {});
    setProgress(0);
  }, [activeIndex]); // eslint-disable-line

  // Track progress + auto-advance
  useEffect(() => {
    const v = mainVideoRef.current;
    if (!v) return;
    const tick = () => {
      if (v.duration > 0 && !v.paused) setProgress((v.currentTime / v.duration) * 100);
      rafRef.current = requestAnimationFrame(tick);
    };
    const onEnd = () => setActiveIndex(i => (i + 1) % count);
    v.addEventListener('ended', onEnd);
    rafRef.current = requestAnimationFrame(tick);
    return () => { v.removeEventListener('ended', onEnd); cancelAnimationFrame(rafRef.current); };
  }, [count]);

  const goTo = useCallback((i: number) => { setActiveIndex(((i % count) + count) % count); setProgress(0); }, [count]);

  // Compute visual order: positions relative to active (-2, -1, 0, +1, +2)
  const getOffset = (i: number) => {
    let diff = i - activeIndex;
    // Wrap around for circular feel
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    return diff;
  };

  const RING_C = 2 * Math.PI * 20;

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-neutral-950" style={{ height: '100vh' }}>
      {backgroundPoster && (
        <img src={backgroundPoster} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <video ref={mainVideoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20 lg:bg-gradient-to-r lg:from-black/80 lg:via-black/40 lg:to-black/20" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-6 sm:px-6 sm:pb-10 lg:mx-auto lg:flex lg:max-w-7xl lg:items-end lg:justify-between lg:px-8 lg:pb-16">

        {/* Left: Text */}
        <div className="text-center lg:max-w-lg lg:text-left">
          {eyebrow && <p className="text-xs font-medium uppercase tracking-widest text-neutral-400 sm:text-sm">{eyebrow}</p>}
          <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:mt-4 sm:text-4xl lg:text-6xl">{heading}</h1>
          {subheading && <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-neutral-300 sm:mt-5 sm:max-w-md sm:text-base lg:mx-0 lg:text-lg">{subheading}</p>}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:mt-7 lg:justify-start">
            {ctaText && ctaHref && (
              <a href={ctaHref} className="inline-flex items-center rounded-full border-2 border-white px-5 py-2 text-xs font-semibold text-white transition-all duration-300 hover:bg-white hover:text-neutral-900 sm:px-6 sm:py-3 sm:text-sm">{ctaText}</a>
            )}
            {secondaryCtaText && secondaryCtaHref && (
              <a href={secondaryCtaHref} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:text-white sm:px-6 sm:py-3 sm:text-sm">
                {secondaryCtaText}
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </a>
            )}
          </div>
        </div>

        {/* Right: Centered Carousel */}
        {projects.length > 0 && (
          <div className="mt-5 sm:mt-8 lg:mt-0 lg:ml-8">
            {/* Carousel container */}
            <div className="relative flex items-center justify-center" style={{ height: '280px', width: '100%', minWidth: '300px' }}>
              {projects.map((project, i) => {
                const offset = getOffset(i);
                const isActive = offset === 0;
                const isVisible = Math.abs(offset) <= 1;
                // Positions: active center, ±1 to the sides
                const tx = offset * 120; // px shift
                const sc = isActive ? 1 : 0.7;
                const op = isActive ? 1 : 0.5;
                const zIdx = isActive ? 10 : 5 - Math.abs(offset);

                return (
                  <button
                    key={i}
                    type="button"
                    className="absolute outline-none"
                    style={{
                      transform: `translateX(${tx}px) scale(${sc})`,
                      opacity: isVisible ? op : 0,
                      zIndex: zIdx,
                      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      pointerEvents: isVisible ? 'auto' : 'none',
                    }}
                    onClick={() => goTo(i)}
                  >
                    <div className="relative overflow-hidden rounded-xl" style={{ width: '160px', height: '240px' }}>
                      {/* Poster */}
                      {project.poster && (
                        <img src={project.poster} alt={project.title} className="absolute inset-0 h-full w-full object-cover" />
                      )}
                      <div className={`absolute inset-0 transition-all duration-500 ${isActive ? 'bg-black/10' : 'bg-black/40'}`} />

                      {/* Progress ring — active only */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative h-12 w-12">
                          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48">
                            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                            {isActive && (
                              <circle
                                cx="24" cy="24" r="20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"
                                strokeDasharray={RING_C}
                                strokeDashoffset={RING_C * (1 - progress / 100)}
                                style={{ transition: 'stroke-dashoffset 0.15s linear' }}
                              />
                            )}
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isActive ? (
                              <div className="flex gap-[3px]">
                                <div className="h-3 w-[3px] rounded-sm bg-white" />
                                <div className="h-3 w-[3px] rounded-sm bg-white" />
                              </div>
                            ) : (
                              <svg className="ml-0.5 h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 px-3 py-2">
                        <p className="truncate text-[11px] font-medium text-white">{project.title}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Arrows + dots — centered below carousel */}
            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-500 text-white transition-all duration-300 hover:border-white hover:bg-white/10"
                onClick={() => goTo(activeIndex - 1)}
                aria-label="Previous"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {projects.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`rounded-full transition-all duration-500 ${
                      activeIndex === i ? 'h-2 w-6 bg-white' : 'h-2 w-2 bg-neutral-500 hover:bg-neutral-400'
                    }`}
                    onClick={() => goTo(i)}
                    aria-label={`Video ${i + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-500 text-white transition-all duration-300 hover:border-white hover:bg-white/10"
                onClick={() => goTo(activeIndex + 1)}
                aria-label="Next"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
