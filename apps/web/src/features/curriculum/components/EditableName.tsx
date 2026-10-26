import { Check, Pencil, Trash2, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { inputClasses } from '@/components/ui/input-styles';
import { cn } from '@/lib/cn';

interface EditableNameProps {
  name: string;
  /** What this is, for button labels: "subject", "chapter" or "topic". */
  kind: string;
  /** Shown before deleting, e.g. 'Delete chapter "Motion" and its topics?' */
  confirmDelete: string;
  onRename: (name: string) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
  className?: string;
}

const iconButton =
  'grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50';

/** A name with rename and delete buttons. Errors (e.g. duplicate names) show underneath. */
export function EditableName({
  name,
  kind,
  confirmDelete,
  onRename,
  onDelete,
  className,
}: EditableNameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(undefined);
    try {
      await action();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(event: FormEvent) {
    event.preventDefault();
    const next = draft.trim();
    if (!next || next === name) {
      setEditing(false);
      return;
    }
    if (await run(() => onRename(next))) setEditing(false);
  }

  function handleDelete() {
    if (window.confirm(confirmDelete)) void run(onDelete);
  }

  return (
    <div className="min-w-0 flex-1">
      {editing ? (
        <form onSubmit={handleRename} className="flex items-center gap-1">
          <input
            autoFocus
            aria-label={`New name for ${kind} ${name}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={120}
            className={inputClasses(!!error, 'h-9 min-w-0 flex-1 text-sm')}
          />
          <button type="submit" aria-label="Save name" className={iconButton} disabled={busy}>
            <Check className="size-4 text-brand-700" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Cancel renaming"
            className={iconButton}
            onClick={() => {
              setEditing(false);
              setError(undefined);
            }}
          >
            <X className="size-4" aria-hidden />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-1">
          <span className={cn('min-w-0 flex-1 truncate', className)} dir="auto">
            {name}
          </span>
          <button
            type="button"
            aria-label={`Rename ${kind} ${name}`}
            className={iconButton}
            onClick={() => {
              setDraft(name);
              setEditing(true);
            }}
          >
            <Pencil className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={`Delete ${kind} ${name}`}
            className={cn(iconButton, 'hover:text-red-600')}
            onClick={handleDelete}
            disabled={busy}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
