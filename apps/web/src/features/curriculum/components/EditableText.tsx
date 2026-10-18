import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface Props {
  value: string;
  onSave: (next: string) => Promise<unknown> | void;
  onDelete: () => Promise<unknown> | void;
  confirmMessage: string;
  className?: string;
}

export function EditableText({ value, onSave, onDelete, confirmMessage, className }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  async function save(e: FormEvent) {
    e.preventDefault();
    const next = draft.trim();
    if (!next || next === value) return setEditing(false);
    try {
      await onSave(next);
      setEditing(false);
    } catch {
      /* keep editing so the user can fix a duplicate name */
    }
  }

  if (editing) {
    return (
      <form onSubmit={save} className="flex flex-1 items-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={120}
          className="flex-1 rounded-md border border-emerald-800 bg-emerald-950 px-2 py-1 text-sm text-emerald-50 focus:border-amber-400 focus:outline-none"
        />
        <button type="submit" aria-label="Save" className="text-amber-400"><Check size={16} /></button>
        <button type="button" aria-label="Cancel" onClick={() => setEditing(false)} className="text-emerald-300">
          <X size={16} />
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-between gap-2">
      <span className={className}>{value}</span>
      <span className="flex gap-2 text-emerald-300">
        <button
          aria-label={`Rename ${value}`}
          onClick={() => { setDraft(value); setEditing(true); }}
          className="hover:text-amber-400"
        >
          <Pencil size={14} />
        </button>
        <button
          aria-label={`Delete ${value}`}
          onClick={() => window.confirm(confirmMessage) && onDelete()}
          className="hover:text-red-400"
        >
          <Trash2 size={14} />
        </button>
      </span>
    </div>
  );
}
