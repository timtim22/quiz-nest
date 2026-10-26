import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/** "Page 2 of 5" with previous/next buttons. Hidden when everything fits on one page. */
export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages === 1) return null;

  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
        Previous
      </Button>
      <span className="text-sm text-slate-600">
        Page {page} of {pages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
      </Button>
    </nav>
  );
}
