import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';

export default function ParticleNetwork() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: false,
      fpsLimit: 60,
      detectRetina: true,
      background: {
        color: { value: 'transparent' },
      },
      particles: {
        number: {
          value: 70,
          density: {
            enable: true,
          },
        },
        color: {
          value: ['#34D399', '#6B8AED', '#A78BFA', '#F0783C', '#E8D44D'],
        },
        shape: {
          type: 'circle',
        },
        opacity: {
          value: { min: 0.5, max: 0.8 },
          animation: {
            enable: true,
            speed: 0.8,
            sync: false,
          },
        },
        size: {
          value: { min: 3, max: 6 },
        },
        links: {
          enable: true,
          distance: 170,
          color: '#9E968C',
          opacity: 0.35,
          width: 1.2,
        },
        move: {
          enable: true,
          speed: 0.8,
          direction: 'none' as const,
          random: true,
          straight: false,
          outModes: {
            default: 'bounce' as const,
          },
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'grab',
          },
        },
        modes: {
          grab: {
            distance: 200,
            links: {
              opacity: 0.6,
            },
          },
        },
      },
    }),
    []
  );

  if (!init) return null;

  return (
    <Particles
      id="hero-particles"
      options={options}
      className="absolute inset-0 h-full w-full"
    />
  );
}
