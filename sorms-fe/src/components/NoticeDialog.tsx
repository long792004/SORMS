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
    shell: 'bg-[linear-gradient(135deg,rgba(15,118,110,0.15),rgba(20,184,166,0.1))] text-[var(--color-primary-dark)] dark:text-[#7ce6d7]',
    icon: CheckCircle2,
    border: 'border-[rgba(15,118,110,0.2)]'
  },
  error: {
    shell: 'bg-[linear-gradient(135deg,rgba(185,28,28,0.12),rgba(239,68,68,0.08))] text-[var(--color-danger)] dark:text-[#fecaca]',
    icon: XCircle,
    border: 'border-[rgba(185,28,28,0.2)]'
  },
  warning: {
    shell: 'bg-[linear-gradient(135deg,rgba(217,119,6,0.12),rgba(245,158,11,0.08))] text-[var(--color-warning)] dark:text-[var(--color-accent)]',
    icon: TriangleAlert,
    border: 'border-[rgba(217,119,6,0.2)]'
  },
  info: {
    shell: 'bg-[linear-gradient(135deg,rgba(15,118,110,0.12),rgba(3,105,161,0.08))] text-[var(--color-primary)] dark:text-[var(--color-primary-light)]',
    icon: Info,
    border: 'border-[var(--border-color)]'
  }
} as const;

export default function NoticeDialog({
  isOpen,
  title,
  message,
  variant = 'info',
  buttonText = 'Xác nhận',
  onClose
}: NoticeDialogProps) {
  const meta = noticeStyles[variant];
  const Icon = meta.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={540}>
      <div className="space-y-6">
        <div className={`flex items-start gap-4 rounded-[1.75rem] border ${meta.border} ${meta.shell} p-5 shadow-sm transition-all`}>
          <div className="mt-0.5 flex shrink-0 items-center justify-center rounded-2xl bg-white/40 p-3 shadow-inner backdrop-blur-md dark:bg-white/10">
            <Icon size={22} strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold tracking-tight">{title}</h4>
            <p className="text-sm leading-relaxed opacity-90">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-primary min-w-[10rem] shadow-[0_15px_35px_-15px_rgba(15,118,110,0.5)] active:scale-95"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </Modal>
  );
}