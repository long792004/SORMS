import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles: Record<NonNullable<ConfirmDialogProps['variant']>, string> = {
  danger: 'bg-[rgba(185,28,28,0.12)] text-[var(--color-danger)] dark:bg-[rgba(185,28,28,0.22)] dark:text-[rgba(254,202,202,0.96)]',
  warning: 'bg-[rgba(217,119,6,0.12)] text-[var(--color-warning)] dark:bg-[rgba(180,83,9,0.18)] dark:text-[var(--color-accent)]',
  default: 'bg-[rgba(15,118,110,0.12)] text-[var(--color-primary)] dark:bg-[rgba(20,184,166,0.18)] dark:text-[var(--color-primary-light)]'
};

const confirmButtonStyles: Record<NonNullable<ConfirmDialogProps['variant']>, string> = {
  danger: 'btn-danger',
  warning: 'bg-[linear-gradient(135deg,var(--color-accent),var(--color-warning))] text-white shadow-[0_18px_38px_-24px_rgba(180,83,9,0.55)] hover:brightness-105',
  default: 'btn-primary'
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} maxWidth={620}>
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-[1.4rem] border border-[color:var(--border-color)] bg-[var(--bg-elevated)] p-4">
          <div className={`mt-0.5 rounded-xl p-2.5 ${variantStyles[variant]}`}>
            <AlertTriangle size={18} />
          </div>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">{message}</p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn btn-secondary w-full sm:w-auto"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`btn w-full sm:w-auto ${confirmButtonStyles[variant]}`}
          >
            {loading ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}