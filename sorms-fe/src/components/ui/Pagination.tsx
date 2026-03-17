import { Button } from "@/components/ui/Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <Button variant="ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Prev
      </Button>
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Page {page} / {totalPages}
      </span>
      <Button variant="ghost" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}
