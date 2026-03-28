import { useState } from 'react';

interface SubjectLevel {
  label: string;
  filled: boolean;
}

interface Subject {
  code: string;
  name: string;
  slug: string;
  description: string;
  levels: SubjectLevel[];
}

interface SchoolData {
  name: string;
  location: string;
  examBoards: string;
  subjects: Subject[];
}

interface Props {
  schoolData: SchoolData[];
}

const subjectColors: Record<string, string> = {
  BIO: '#ffb3c6',
  CHE: '#fff33b',
  PHY: '#b8ff6b',
};

export default function SchoolTabs({ schoolData }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = schoolData[activeIndex]!;

  return (
    <div>
      {/* Info row */}
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center justify-between">
        <span>{active.subjects.length} subjects · {active.location}</span>
        <span>{active.examBoards}</span>
      </div>

      {/* School dropdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <select
            value={activeIndex}
            onChange={(e) => setActiveIndex(Number(e.target.value))}
            className="w-full h-10 text-xs font-black uppercase tracking-wider pl-3 pr-8 border-2 border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-400 appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-gray-900"
            aria-label="Select school"
          >
            {schoolData.map((school, i) => (
              <option key={school.name} value={i}>
                {school.name}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Subject cards — standardized like course cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {active.subjects.map((subject) => (
          <a
            key={`${active.name}-${subject.code}`}
            href={`/subjects/${subject.slug}`}
            className="border-2 border-gray-200 bg-white p-5 flex flex-col transition-all hover:border-gray-400 hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#e5e7eb] no-underline"
          >
            {/* Top: code badge + level badges */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2 py-1"
                style={{ background: subjectColors[subject.code] || '#e5e7eb' }}
              >
                {subject.code}
              </span>
              <div className="flex gap-1">
                {subject.levels.map((level) => (
                  <span
                    key={level.label}
                    className={`text-[10px] font-bold px-2 py-0.5 ${
                      level.filled
                        ? 'bg-black text-white'
                        : 'border border-gray-300 text-gray-500'
                    }`}
                  >
                    {level.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-black mb-1 leading-tight text-gray-900">{subject.name}</h3>

            {/* Tags */}
            <div className="flex gap-2 mb-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {active.name}
              </span>
            </div>

            {/* Description — truncated */}
            <p className="text-sm text-gray-600 font-medium leading-relaxed mb-4 line-clamp-3 flex-1">
              {subject.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
              <span className="text-xs font-semibold text-gray-500">{active.examBoards}</span>
              <span className="text-xs font-black uppercase tracking-wider text-gray-900">View →</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
