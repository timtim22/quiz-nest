import { Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { inputClasses } from '@/components/ui/input-styles';

interface InlineAddFormProps {
  /** Read by screen readers, e.g. "New chapter name". */
  label: string;
  placeholder: string;
  buttonText?: string;
  pending?: boolean;
  error?: string;
  onSubmit: (name: string) => Promise<unknown>;
}

/** A one-line "type a name, press Add" form. Clears itself after a successful add. */
export function InlineAddForm({
  label,
  placeholder,
  buttonText = 'Add',
  pending,
  error,
  onSubmit,
}: InlineAddFormProps) {
  const [value, setValue] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const name = value.trim();
    if (!name) return;
    try {
      await onSubmit(name);
      setValue('');
    } catch {
      // The error comes back through the `error` prop; keep the text so it can be fixed.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5">
      <div className="flex gap-2">
        <input
          aria-label={label}
          aria-invalid={error ? true : undefined}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          maxLength={120}
          className={inputClasses(!!error, 'min-w-0 flex-1')}
        />
        <Button type="submit" variant="secondary" disabled={pending || !value.trim()}>
          <Plus className="size-4" aria-hidden />
          {buttonText}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
