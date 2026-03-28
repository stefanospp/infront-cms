import { useState, useMemo } from 'react';

export interface Course {
  slug: string;
  name: string;
  description: string;
  dates: string;
  subject: string;
  level: string;
  season: string;
  examBoard: string;
  schools: string[];
  classSize: string;
  color: string;
  status: 'enrolling' | 'coming-soon';
}

export interface ExamPeriod {
  name: string;
  dates: string;
}

interface Props {
  courses: Course[];
  examPeriods: ExamPeriod[];
}

type SortOption = 'season' | 'subject' | 'level';

const PER_PAGE = 9;

function getFilterOptions(courses: Course[], key: keyof Course): string[] {
  const values = new Set<string>();
  courses.forEach((c) => {
    const val = c[key];
    if (Array.isArray(val)) val.forEach((v) => values.add(v));
    else if (typeof val === 'string') values.add(val);
  });
  return Array.from(values).sort();
}

const seasonOrder: Record<string, number> = { Easter: 0, Summer: 1, Autumn: 2 };

export default function CourseFilter({ courses }: Props) {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [season, setSeason] = useState('');
  const [sort, setSort] = useState<SortOption>('season');
  const [page, setPage] = useState(0);

  const subjects = getFilterOptions(courses, 'subject');
  const levels = getFilterOptions(courses, 'level');
  const seasons = getFilterOptions(courses, 'season');

  const hasActiveFilters = search || subject || level || season;

  const filtered = useMemo(() => {
    let result = courses;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    if (subject) result = result.filter((c) => c.subject === subject);
    if (level) result = result.filter((c) => c.level === level);
    if (season) result = result.filter((c) => c.season === season);

    result = [...result].sort((a, b) => {
      if (sort === 'season') return (seasonOrder[a.season] ?? 99) - (seasonOrder[b.season] ?? 99);
      if (sort === 'subject') return a.subject.localeCompare(b.subject);
      return a.level.localeCompare(b.level);
    });

    return result;
  }, [courses, search, subject, level, season, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  // Reset page when filters change
  const filterKey = `${search}|${subject}|${level}|${season}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(0);
  }

  function clearAll() {
    setSearch('');
    setSubject('');
    setLevel('');
    setSeason('');
  }

  return (
    <div>
      {/* Results count */}
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center justify-between">
        <span>{filtered.length} {filtered.length === 1 ? 'course' : 'courses'}{hasActiveFilters ? ' found' : ''}</span>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-black uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Filter bar — aligned to 3-column card grid below */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
        <FilterSelect label="Subject" value={subject} options={subjects} onChange={setSubject} />
        <FilterSelect label="Level" value={level} options={levels} onChange={setLevel} />
        <FilterSelect label="Season" value={season} options={seasons} onChange={setSeason} />
        <FilterSelect label="Sort: Season" value={sort} options={[
          { value: 'season', label: 'Sort: Season' },
          { value: 'subject', label: 'Sort: Subject' },
          { value: 'level', label: 'Sort: Level' },
        ]} onChange={(v) => setSort(v as SortOption)} isSort />

        {/* Search — spans 2 cols to match 1 card width */}
        <div className="relative col-span-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full h-10 pl-9 pr-8 text-sm font-medium bg-gray-50 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:bg-white transition-colors"
            aria-label="Search courses"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm leading-none"
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Course grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-bold mb-2">No courses match your filters</p>
          <button onClick={clearAll} className="text-sm font-bold underline hover:text-gray-900">
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((course) => (
              <a
                key={course.slug}
                href={`/courses/${course.slug}`}
                className="border-2 border-gray-200 bg-white p-5 flex flex-col transition-all hover:border-gray-400 hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#e5e7eb] no-underline"
              >
                {/* Top: level + date badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                    {course.level}
                  </span>
                  <span
                    className="text-[10px] font-black uppercase tracking-widest px-2 py-1 shrink-0"
                    style={{ background: course.color }}
                  >
                    {course.dates}
                  </span>
                </div>

                {/* Title + tags */}
                <h3 className="text-lg font-black mb-1 leading-tight">{course.name}</h3>
                <div className="flex gap-2 mb-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {course.subject}
                  </span>
                  <span className="text-[10px] text-gray-300">|</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {course.season}
                  </span>
                </div>

                {/* Description — truncated to 3 lines */}
                <p className="text-sm text-gray-600 font-medium leading-relaxed mb-4 line-clamp-3 flex-1">
                  {course.description}
                </p>

                {/* Footer — always pinned to bottom */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500">{course.classSize}</span>
                    {course.status === 'enrolling' ? (
                      <span className="text-[10px] font-black uppercase tracking-wider text-green-600">
                        Enrolling
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider">
                    View &rarr;
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Course pages" className="flex items-center justify-center gap-1 sm:gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="h-11 px-3 sm:px-4 text-xs font-black uppercase tracking-wider border-2 border-gray-200 bg-white hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`h-11 w-11 text-xs font-black border-2 transition-colors ${
                    i === page
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                  aria-label={`Page ${i + 1}`}
                  aria-current={i === page ? 'page' : undefined}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
                className="h-11 px-3 sm:px-4 text-xs font-black uppercase tracking-wider border-2 border-gray-200 bg-white hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  isSort,
}: {
  label: string;
  value: string;
  options: string[] | { value: string; label: string }[];
  onChange: (v: string) => void;
  isSort?: boolean;
}) {
  const opts = typeof options[0] === 'string'
    ? (options as string[]).map((o) => ({ value: o, label: o }))
    : (options as { value: string; label: string }[]);

  return (
    <div className="relative flex-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-10 text-xs font-black uppercase tracking-wider pl-3 pr-8 border-2 appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 ${
          !isSort && value
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400'
        }`}
        aria-label={isSort ? 'Sort courses' : `Filter by ${label}`}
      >
        {!isSort && <option value="">{label}</option>}
        {opts.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${
          !isSort && value ? 'text-white' : 'text-gray-400'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
