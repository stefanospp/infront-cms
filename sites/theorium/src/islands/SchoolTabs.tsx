import { useState } from 'react';
import type { School } from '../data/schools';

interface Props {
  schools: School[];
}

const accentColors: Record<string, string> = {
  green: 'var(--th-green)',
  blue: 'var(--th-blue)',
  orange: 'var(--th-orange)',
};

const badgeColors: Record<string, string> = {
  yellow: 'var(--th-yellow)',
  green: 'var(--th-green)',
  blue: 'var(--th-blue)',
  orange: 'var(--th-orange)',
  purple: 'var(--th-purple)',
  default: '#E5E2DE',
};

export default function SchoolTabs({ schools }: Props) {
  const [active, setActive] = useState(0);
  const school = schools[active]!;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {schools.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setActive(i)}
            className={`shrink-0 rounded-md border px-5 py-3 text-sm font-bold uppercase tracking-wider transition-all ${
              i === active
                ? 'border-[var(--th-black)] bg-[var(--th-black)] text-white shadow-none'
                : 'border-neutral-300 bg-white text-[var(--th-black)] shadow-[var(--th-shadow)] hover:shadow-none'
            }`}
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {s.name.replace(' — Lyceum', '').replace(' Private School Larnaka', '').replace(' Private English School', '').replace(' Larnaca', '')}
          </button>
        ))}
      </div>

      {/* School card */}
      <div className="overflow-hidden rounded-lg border border-[var(--th-border)] bg-white shadow-[var(--th-shadow-lg)]">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-neutral-200 sm:flex-row sm:items-center">
          <div className="bg-[var(--th-black)] px-7 py-5 sm:shrink-0 sm:rounded-br-lg">
            <h3 className="text-lg font-extrabold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              {school.name}
            </h3>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2 px-6 py-3">
            <span className="mr-auto text-[11px] font-medium uppercase tracking-wider text-neutral-400 sm:mr-3" style={{ fontFamily: 'var(--font-mono)' }}>
              {school.type}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {school.qualifications.map((qual) => (
                <span
                  key={qual.label}
                  className="inline-block rounded border border-neutral-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ backgroundColor: badgeColors[qual.color] || badgeColors.default, fontFamily: 'var(--font-mono)' }}
                >
                  {qual.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Subject row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {school.subjects.map((subject, i) => (
            <div
              key={subject.name}
              className={`${i > 0 ? 'border-t border-neutral-200 sm:border-l' : ''} ${i < 2 ? 'sm:border-t-0' : 'lg:border-t-0'} ${i === 2 ? 'sm:border-l-0 lg:border-l' : ''}`}
            >
              <div
                className="h-[4px]"
                style={{ backgroundColor: accentColors[subject.accentColor] || accentColors.green }}
              />
              <div className="p-6">
                <h4 className="text-lg font-extrabold" style={{ fontFamily: 'var(--font-heading)' }}>
                  {subject.name}
                </h4>
                <p className="mt-3 text-[15px] font-medium leading-relaxed text-neutral-500">
                  {subject.topics}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
