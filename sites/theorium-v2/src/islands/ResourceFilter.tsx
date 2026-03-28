import { useState, useMemo } from 'react';

export interface Resource {
  slug: string;
  name: string;
  description: string;
  subject: string;
  level: string;
  type: string;
  examBoard: string;
  fileType?: string;
  fileSize?: string;
  url?: string;
  date: string;
  color: string;
  status: 'available' | 'coming-soon';
}

interface Props {
  resources: Resource[];
}

type SortOption = 'date' | 'subject' | 'type';

const PER_PAGE = 9;

function getOptions(resources: Resource[], key: keyof Resource): string[] {
  const values = new Set<string>();
  resources.forEach((r) => {
    const val = r[key];
    if (typeof val === 'string' && val) values.add(val);
  });
  return Array.from(values).sort();
}

export default function ResourceFilter({ resources }: Props) {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState<SortOption>('date');
  const [page, setPage] = useState(0);

  const subjects = getOptions(resources, 'subject');
  const levels = getOptions(resources, 'level');
  const types = getOptions(resources, 'type');

  const hasActiveFilters = search || subject || level || type;

  const filtered = useMemo(() => {
    let result = resources;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      );
    }
    if (subject) result = result.filter((r) => r.subject === subject);
    if (level) result = result.filter((r) => r.level === level);
    if (type) result = result.filter((r) => r.type === type);

    result = [...result].sort((a, b) => {
      if (sort === 'date') return b.date.localeCompare(a.date);
      if (sort === 'subject') return a.subject.localeCompare(b.subject);
      return a.type.localeCompare(b.type);
    });

    return result;
  }, [resources, search, subject, level, type, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const filterKey = `${search}|${subject}|${level}|${type}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(0);
  }

  function clearAll() {
    setSearch('');
    setSubject('');
    setLevel('');
    setType('');
  }

  return (
    <div>
      {/* Results count */}
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center justify-between">
        <span>{filtered.length} {filtered.length === 1 ? 'resource' : 'resources'}{hasActiveFilters ? ' found' : ''}</span>
        {hasActiveFilters && (
          <button onClick={clearAll} className="text-xs font-black uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* Filter bar — matches course filter layout */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
        <FilterSelect label="Subject" value={subject} options={subjects} onChange={setSubject} />
        <FilterSelect label="Level" value={level} options={levels} onChange={setLevel} />
        <FilterSelect label="Type" value={type} options={types} onChange={setType} />
        <FilterSelect
          label="Sort: Latest"
          value={sort}
          options={[
            { value: 'date', label: 'Sort: Latest' },
            { value: 'subject', label: 'Sort: Subject' },
            { value: 'type', label: 'Sort: Type' },
          ]}
          onChange={(v) => setSort(v as SortOption)}
          isSort
        />

        {/* Search — spans 2 cols */}
        <div className="relative col-span-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full h-10 pl-9 pr-8 text-sm font-medium bg-gray-50 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:bg-white transition-colors"
            aria-label="Search resources"
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

      {/* Resource grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-bold mb-2">No resources match your filters</p>
          <button onClick={clearAll} className="text-sm font-bold underline hover:text-gray-900">
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((resource) => {
              const isAvailable = resource.status === 'available' && resource.url;
              const href = resource.url || '#';
              const Tag = isAvailable ? 'a' : 'div';
              const linkProps = isAvailable
                ? { href, download: true, target: resource.type === 'External Link' ? '_blank' : undefined, rel: resource.type === 'External Link' ? 'noopener noreferrer' : undefined }
                : {};

              return (
                <Tag
                  key={resource.slug}
                  {...linkProps}
                  className={`border-2 border-gray-200 bg-white p-5 flex flex-col transition-all no-underline ${
                    isAvailable
                      ? 'hover:border-gray-400 hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#e5e7eb] cursor-pointer'
                      : 'opacity-75'
                  }`}
                >
                  {/* Top: type badge + subject color */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-black text-white px-2 py-0.5 uppercase tracking-wider">
                        {resource.type}
                      </span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {resource.level}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-black uppercase tracking-widest px-2 py-1 shrink-0"
                      style={{ background: resource.color }}
                    >
                      {resource.subject}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black mb-2 leading-tight text-gray-900">{resource.name}</h3>

                  {/* Description — truncated */}
                  <p className="text-sm text-gray-600 font-medium leading-relaxed mb-4 line-clamp-3 flex-1">
                    {resource.description}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {resource.fileType && <span>{resource.fileType}</span>}
                    {resource.fileSize && (
                      <>
                        <span className="text-gray-200">|</span>
                        <span>{resource.fileSize}</span>
                      </>
                    )}
                    <span className="text-gray-200">|</span>
                    <span>{resource.examBoard}</span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                    {resource.status === 'available' ? (
                      <span className="text-[10px] font-black uppercase tracking-wider text-green-600">
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Coming soon
                      </span>
                    )}
                    {isAvailable ? (
                      <span className="text-xs font-black uppercase tracking-wider text-gray-900">
                        Download →
                      </span>
                    ) : resource.status === 'available' ? (
                      <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                        Download →
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                        Coming soon
                      </span>
                    )}
                  </div>
                </Tag>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Resource pages" className="flex items-center justify-center gap-1 sm:gap-2 mt-8">
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
        aria-label={isSort ? 'Sort resources' : `Filter by ${label}`}
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
