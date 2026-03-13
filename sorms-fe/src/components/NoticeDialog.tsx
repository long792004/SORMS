import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react';
import Modal from './Modal';

interface NoticeDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  buttonText?: string;
  onClose: () => void;
}

const noticeStyles = {
  success: {
    shell: 'bg-[rgba(15,118,110,0.12)] text-[var(--color-primary-dark)] dark:bg-[rgba(20,184,166,0.18)] dark:text-[var(--color-primary-light)]',
    icon: CheckCircle2
  },
  error: {
    shell: 'bg-[rgba(185,28,28,0.12)] text-[var(--color-danger)] dark:bg-[rgba(185,28,28,0.22)] dark:text-[rgba(254,202,202,0.96)]',
    icon: XCircle
  },
  warning: {
    shell: 'bg-[rgba(217,119,6,0.12)] text-[var(--color-warning)] dark:bg-[rgba(180,83,9,0.18)] dark:text-[var(--color-accent)]',
    icon: TriangleAlert
  },
  info: {
    shell: 'bg-[rgba(15,118,110,0.12)] text-[var(--color-primary)] dark:bg-[rgba(20,184,166,0.18)] dark:text-[var(--color-primary-light)]',
    icon: Info
  }
} as const;

export default function NoticeDialog({
  isOpen,
  title,
  message,
  variant = 'info',
  buttonText = 'OK',
  onClose
}: NoticeDialogProps) {
  const meta = noticeStyles[variant];
  const Icon = meta.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={560}>
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-[1.4rem] border border-[color:var(--border-color)] bg-[var(--bg-elevated)] p-4">
          <div className={`mt-0.5 rounded-xl p-2.5 ${meta.shell}`}>
            <Icon size={18} />
          </div>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">{message}</p>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="btn btn-primary min-w-[8rem] sm:w-auto">
            {buttonText}
          </button>
        </div>
      </div>
    </Modal>
  );
}