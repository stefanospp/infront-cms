import type { SectionSchema, PropDefinition, ComponentDefinition } from './registry';
import { getComponent } from './registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditorPropertiesProps {
  section: SectionSchema | null;
  onUpdate: (updated: SectionSchema) => void;
}

// ---------------------------------------------------------------------------
// Prop Input Components
// ---------------------------------------------------------------------------

function TextInput({
  prop,
  value,
  onChange,
}: {
  prop: PropDefinition;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {prop.label}
        {prop.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={prop.placeholder ?? ''}
        className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
      />
    </div>
  );
}

function RichtextInput({
  prop,
  value,
  onChange,
}: {
  prop: PropDefinition;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {prop.label}
        {prop.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y transition-colors"
      />
    </div>
  );
}

function UrlInput({
  prop,
  value,
  onChange,
}: {
  prop: PropDefinition;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {prop.label}
        {prop.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={prop.placeholder ?? 'https://...'}
        className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
      />
    </div>
  );
}

function ImageInput({
  prop,
  value,
  onChange,
}: {
  prop: PropDefinition;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {prop.label}
        {prop.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/images/..."
        className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
      />
      <p className="mt-1 text-[10px] text-gray-600">Media picker coming soon</p>
    </div>
  );
}

function BooleanInput({
  prop,
  value,
  onChange,
}: {
  prop: PropDefinition;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            value ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
      <span className="text-xs font-medium text-gray-400">{prop.label}</span>
    </label>
  );
}

function NumberInput({
  prop,
  value,
  onChange,
}: {
  prop: PropDefinition;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {prop.label}
        {prop.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
      />
    </div>
  );
}

function SelectInput({
  prop,
  value,
  onChange,
}: {
  prop: PropDefinition;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {prop.label}
        {prop.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
      >
        <option value="">-- Select --</option>
        {prop.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Array Input
// ---------------------------------------------------------------------------

function ArrayInput({
  prop,
  value,
  onChange,
}: {
  prop: PropDefinition;
  value: unknown[];
  onChange: (v: unknown[]) => void;
}) {
  const itemPropsRecord = prop.itemProps ?? {};
  const itemPropsEntries = Object.entries(itemPropsRecord);

  function addItem() {
    const newItem: Record<string, unknown> = {};
    for (const [name, ip] of itemPropsEntries) {
      if (ip.type === 'boolean') newItem[name] = false;
      else if (ip.type === 'number') newItem[name] = 0;
      else newItem[name] = '';
    }
    onChange([...value, newItem]);
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function updateItem(index: number, propName: string, propValue: unknown) {
    const updated = value.map((item, i) => {
      if (i !== index) return item;
      return { ...(item as Record<string, unknown>), [propName]: propValue };
    });
    onChange(updated);
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-2">
        {prop.label}
        {prop.required && <span className="text-red-400 ml-0.5">*</span>}
        <span className="ml-1 text-gray-600">({value.length})</span>
      </label>

      <div className="space-y-3">
        {value.map((item, index) => {
          const itemRecord = item as Record<string, unknown>;
          return (
            <div
              key={index}
              className="rounded-md border border-gray-700 bg-gray-800/50 p-3 space-y-2"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-gray-500 uppercase">
                  Item {index + 1}
                </span>
                <button
                  onClick={() => removeItem(index)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                  aria-label={`Remove item ${index + 1}`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {itemPropsEntries.map(([name, ip]) => (
                <PropInput
                  key={name}
                  prop={ip}
                  value={itemRecord[name]}
                  onChange={(v) => updateItem(index, name, v)}
                />
              ))}
            </div>
          );
        })}
      </div>

      <button
        onClick={addItem}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-gray-600 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-300 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Item
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Prop input dispatcher
// ---------------------------------------------------------------------------

function PropInput({
  prop,
  value,
  onChange,
}: {
  prop: PropDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (prop.type) {
    case 'text':
      return <TextInput prop={prop} value={(value as string) ?? ''} onChange={onChange} />;
    case 'richtext':
      return <RichtextInput prop={prop} value={(value as string) ?? ''} onChange={onChange} />;
    case 'url':
      return <UrlInput prop={prop} value={(value as string) ?? ''} onChange={onChange} />;
    case 'image':
      return <ImageInput prop={prop} value={(value as string) ?? ''} onChange={onChange} />;
    case 'boolean':
      return <BooleanInput prop={prop} value={(value as boolean) ?? false} onChange={onChange} />;
    case 'number':
      return <NumberInput prop={prop} value={(value as number) ?? 0} onChange={onChange} />;
    case 'select':
      return <SelectInput prop={prop} value={(value as string) ?? ''} onChange={onChange} />;
    case 'array':
      return <ArrayInput prop={prop} value={(value as unknown[]) ?? []} onChange={onChange} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Variant Picker
// ---------------------------------------------------------------------------

function VariantPicker({
  variants,
  selected,
  onChange,
}: {
  variants: string[];
  selected: string;
  onChange: (v: string) => void;
}) {
  if (variants.length === 0) return null;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-2">Variant</label>
      <div className="flex flex-wrap gap-1.5">
        {variants.map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              v === selected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Wrapper Settings
// ---------------------------------------------------------------------------

function WrapperSettings({
  section,
  onChange,
}: {
  section: SectionSchema;
  onChange: (updates: Partial<SectionSchema>) => void;
}) {
  return (
    <div className="space-y-3 rounded-md border border-gray-700 bg-gray-800/50 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Section Wrapper
      </h4>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Heading</label>
        <input
          type="text"
          value={section.heading ?? ''}
          onChange={(e) => onChange({ heading: e.target.value })}
          placeholder="Section heading"
          className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Subheading</label>
        <input
          type="text"
          value={section.subheading ?? ''}
          onChange={(e) => onChange({ subheading: e.target.value })}
          placeholder="Section subheading"
          className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Background</label>
        <select
          value={section.background ?? 'light'}
          onChange={(e) =>
            onChange({
              background: e.target.value as 'light' | 'dark' | 'primary',
            })
          }
          className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-1.5 text-sm text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="primary">Primary</option>
        </select>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function EditorProperties({ section, onUpdate }: EditorPropertiesProps) {
  if (!section) {
    return (
      <div className="flex h-full w-[320px] flex-col border-l border-gray-700 bg-gray-900">
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <svg className="mx-auto h-10 w-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              Select a section to edit its properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Local non-null binding so closures see the narrowed type
  const activeSection = section;
  const compDef: ComponentDefinition | undefined = getComponent(activeSection.component);

  function updateProp(name: string, value: unknown) {
    onUpdate({
      ...activeSection,
      props: { ...activeSection.props, [name]: value },
    });
  }

  function updateVariant(variant: string) {
    onUpdate({ ...activeSection, variant });
  }

  function updateWrapperFields(updates: Partial<SectionSchema>) {
    onUpdate({ ...activeSection, ...updates });
  }

  return (
    <div className="flex h-full w-[320px] flex-col border-l border-gray-700 bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-100">
          {compDef?.name ?? activeSection.component}
        </h3>
        {compDef?.description && (
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{compDef.description}</p>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Variant picker */}
        {compDef && compDef.variants.length > 0 && (
          <VariantPicker
            variants={compDef.variants}
            selected={activeSection.variant}
            onChange={updateVariant}
          />
        )}

        {/* Section wrapper settings */}
        <WrapperSettings section={activeSection} onChange={updateWrapperFields} />

        {/* Divider */}
        {(compDef && compDef.variants.length > 0) && (
          <div className="border-t border-gray-700" />
        )}

        {/* Props */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Properties
          </h4>
          {compDef ? (
            Object.entries(compDef.props).map(([propName, prop]) => (
              <PropInput
                key={propName}
                prop={prop}
                value={activeSection.props[propName]}
                onChange={(v) => updateProp(propName, v)}
              />
            ))
          ) : (
            <p className="text-xs text-gray-500">
              Unknown component: {activeSection.component}
            </p>
          )}
        </div>
      </div>

      {/* Footer note */}
      <div className="border-t border-gray-700 px-4 py-2">
        <p className="text-[10px] text-gray-600">
          Save to apply changes to preview
        </p>
      </div>
    </div>
  );
}
