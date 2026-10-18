import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface Props {
  placeholder: string;
  pending?: boolean;
  error?: string | null;
  onSubmit: (value: string) => Promise<unknown> | void;
}

export function InlineAddForm({ placeholder, pending, error, onSubmit }: Props) {
  const [value, setValue] = useState('');

  async function handle(e: FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    try {
      await onSubmit(v);
      setValue('');
    } catch {
      /* error is shown via the `error` prop */
    }
  }

  return (
    <form onSubmit={handle} className="space-y-1">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          maxLength={120}
          className="flex-1 rounded-md border border-emerald-800 bg-emerald-950 px-3 py-1.5 text-sm text-emerald-50 placeholder:text-emerald-400/50 focus:border-amber-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !value.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-3 py-1.5 text-sm font-medium text-emerald-950 hover:bg-amber-300 disabled:opacity-50"
        >
          <Plus size={14} /> Add
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
