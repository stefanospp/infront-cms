import { useEffect, useLayoutEffect, useRef } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const initializedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = ['#34D399', '#6B8AED', '#A78BFA', '#F0783C', '#E8D44D'];
    const linkColor = '#C2BAB0';
    const linkDistance = 150;
    const particleCount = 65;
    let mouse = { x: -1000, y: -1000 };

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      opacity: number;
    }

    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let running = false;

    function init(width: number, height: number) {
      const dpr = window.devicePixelRatio || 1;
      w = width;
      h = height;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Create particles
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          size: Math.random() * 3 + 2,
          color: colors[Math.floor(Math.random() * colors.length)]!,
          opacity: Math.random() * 0.4 + 0.4,
        });
      }

      if (!running) {
        running = true;
        loop();
      }
    }

    function draw() {
      if (w === 0 || h === 0) return;
      ctx!.clearRect(0, 0, w, h);

      // Draw links
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i]!.x - particles[j]!.x;
          const dy = particles[i]!.y - particles[j]!.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDistance) {
            ctx!.strokeStyle = linkColor;
            ctx!.globalAlpha = (1 - dist / linkDistance) * 0.3;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(particles[i]!.x, particles[i]!.y);
            ctx!.lineTo(particles[j]!.x, particles[j]!.y);
            ctx!.stroke();
          }
        }

        // Mouse grab lines
        const mdx = particles[i]!.x - mouse.x;
        const mdy = particles[i]!.y - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 200) {
          ctx!.strokeStyle = linkColor;
          ctx!.globalAlpha = (1 - mDist / 200) * 0.5;
          ctx!.lineWidth = 1.5;
          ctx!.beginPath();
          ctx!.moveTo(particles[i]!.x, particles[i]!.y);
          ctx!.lineTo(mouse.x, mouse.y);
          ctx!.stroke();
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
    }

    function update() {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));
      }
    }

    function loop() {
      if (!running) return;
      update();
      draw();
      animRef.current = requestAnimationFrame(loop);
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }

    function handleMouseLeave() {
      mouse.x = -1000;
      mouse.y = -1000;
    }

    // Observe the grandparent (the absolute inset-0 div) for size changes
    // The canvas itself is absolutely positioned so its contentRect may be 0
    const observeTarget = canvas.closest('.absolute') || canvas.parentElement || canvas;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          init(width, height);
        }
      }
    });
    observer.observe(observeTarget);

    // Fallback: also try after a short delay in case ResizeObserver doesn't fire
    const fallbackTimer = setTimeout(() => {
      if (w === 0 || h === 0) {
        const rect = canvas.getBoundingClientRect();
        const fw = rect.width || window.innerWidth;
        const fh = rect.height || window.innerHeight;
        if (fw > 0 && fh > 0) init(fw, fh);
      }
    }, 200);

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      clearTimeout(fallbackTimer);
      observer.disconnect();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ pointerEvents: 'auto' }}
    />
  );
}
