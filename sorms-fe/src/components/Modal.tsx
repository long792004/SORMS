import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: number;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 500 }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(7,16,24,0.56)] p-4 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <div
        className="animate-fade-in w-full overflow-hidden rounded-[1.75rem] border border-[color:var(--border-color)] bg-[var(--bg-card)] shadow-[0_32px_100px_-54px_rgba(38,30,24,0.48)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth, maxHeight: 'min(90vh, 960px)', overflowX: 'hidden', overflowY: 'auto' }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[color:var(--border-color)] bg-[rgba(255,252,247,0.92)] px-5 py-4 backdrop-blur-xl dark:bg-[rgba(9,22,29,0.94)] sm:px-6">
          <h3 className="pr-2 text-xl font-semibold leading-[1.25] text-[var(--text-primary)] break-words">{title}</h3>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl border border-transparent p-2 text-[var(--text-muted)] transition-colors hover:border-[color:var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 break-words sm:p-6">{children}</div>
      </div>
    </div>
  );
}
