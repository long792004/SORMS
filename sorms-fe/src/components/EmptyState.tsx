import { Inbox } from 'lucide-react';

export default function EmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="empty-surface flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="gradient-secondary flex h-16 w-16 items-center justify-center rounded-[1.35rem] text-white shadow-lg">
        <Inbox size={28} />
      </div>
      <div>
        <p className="text-base font-semibold text-[var(--text-primary)]">Nothing to show yet</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{message}</p>
      </div>
    </div>
  );
}
