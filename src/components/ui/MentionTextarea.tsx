import { useMemo, useRef, useState } from 'react';
import { knownUsers } from '@/store/projectStore';
import { useProjectStore } from '@/store/projectStore';

interface Props {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
}

/** Textarea with @mention autocomplete. */
export function MentionTextarea({ value, onChange, rows = 2, placeholder, className, onSubmit }: Props) {
  const project = useProjectStore((s) => s.project);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const users = useMemo(() => knownUsers(project), [project]);

  // Active @ query: the word being typed after the last @ before the caret.
  const [query] = useMemo((): [string | null, number] => {
    const el = taRef.current;
    const pos = el?.selectionStart ?? value.length;
    const before = value.slice(0, pos);
    const m = /(?:^|\s)@([A-Za-z0-9._-]{0,32})$/.exec(before);
    return m ? [m[1], pos] : [null, pos];
  }, [value]);

  const matches = useMemo(() => {
    if (query === null) return [];
    const q = query.toLowerCase();
    return users.filter((u) => u.toLowerCase().startsWith(q)).slice(0, 6);
  }, [users, query]);

  const showList = open && query !== null && matches.length > 0;

  const pick = (name: string) => {
    const el = taRef.current;
    const pos = el?.selectionStart ?? value.length;
    const before = value.slice(0, pos);
    const atIdx = before.lastIndexOf('@');
    const next = value.slice(0, atIdx + 1) + name + ' ' + value.slice(pos);
    onChange(next);
    setOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      const np = atIdx + 1 + name.length + 1;
      el?.setSelectionRange(np, np);
    });
  };

  return (
    <div className="relative">
      <textarea
        ref={taRef}
        value={value}
        rows={rows}
        placeholder={placeholder}
        className={className}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHi(0);
        }}
        onKeyDown={(e) => {
          if (showList && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            setHi((h) => (e.key === 'ArrowDown' ? Math.min(h + 1, matches.length - 1) : Math.max(h - 1, 0)));
          } else if (showList && (e.key === 'Enter' || e.key === 'Tab')) {
            e.preventDefault();
            pick(matches[hi] ?? matches[0]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && onSubmit) {
            e.preventDefault();
            onSubmit();
          }
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {showList && (
        <ul
          role="listbox"
          aria-label="Mention suggestions"
          className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-[var(--chrome)] bg-[var(--bg-surface)] shadow-xl shadow-black/40 py-1 animate-scale-in"
        >
          {matches.map((u, i) => (
            <li key={u}>
              <button
                type="button"
                role="option"
                aria-selected={i === hi}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(u);
                }}
                onMouseEnter={() => setHi(i)}
                className={`w-full text-left px-3 py-1.5 text-[13px] motion-press ${
                  i === hi ? 'bg-[var(--bg-raised)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                <span className="text-[var(--accent-bright)] font-medium">@{u}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
