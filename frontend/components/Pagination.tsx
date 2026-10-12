import type { PageMeta } from '@/lib/types';

interface Props {
  meta: PageMeta;
  disabled: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, disabled, onPageChange }: Props) {
  if (meta.total_pages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" disabled={disabled || meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
        ← Previous
      </button>
      <span className="muted">
        Page {meta.page} of {meta.total_pages}
      </span>
      <button type="button" disabled={disabled || meta.page >= meta.total_pages} onClick={() => onPageChange(meta.page + 1)}>
        Next →
      </button>
    </nav>
  );
}
