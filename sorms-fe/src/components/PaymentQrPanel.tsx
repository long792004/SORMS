import { useCallback, useEffect, useRef, useState } from 'react';
import { paymentApi } from '../api/payment';
import type { CreatePaymentLinkResponse, PaymentStatusDto } from '../types';
import { CheckCircle2, Clock3, ExternalLink, QrCode, RefreshCw, ShieldCheck, Smartphone, Sparkles, XCircle } from 'lucide-react';

interface PaymentQrPanelProps {
  invoiceId: number;
  amount: number;
  initialPayment: CreatePaymentLinkResponse;
  onPaymentVerified?: () => void;
}

function getStatusMeta(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === 'paid') {
    return {
      label: 'Payment successful',
      className: 'border-[rgba(15,118,110,0.24)] bg-[rgba(15,118,110,0.12)] text-[var(--color-primary-dark)] dark:border-[rgba(20,184,166,0.24)] dark:bg-[rgba(20,184,166,0.18)] dark:text-[var(--color-primary-light)]',
      icon: CheckCircle2
    };
  }

  if (normalized === 'failed' || normalized === 'cancelled' || normalized === 'expired') {
    return {
      label: 'Payment not completed',
      className: 'border-[rgba(217,119,6,0.24)] bg-[rgba(217,119,6,0.12)] text-[var(--color-warning)] dark:border-[rgba(217,119,6,0.28)] dark:bg-[rgba(180,83,9,0.18)] dark:text-[var(--color-accent)]',
      icon: XCircle
    };
  }

  if (normalized === 'processing') {
    return {
      label: 'Processing payment',
      className: 'border-[rgba(15,118,110,0.22)] bg-[rgba(15,118,110,0.1)] text-[var(--color-primary)] dark:border-[rgba(20,184,166,0.24)] dark:bg-[rgba(20,184,166,0.14)] dark:text-[var(--color-primary-light)]',
      icon: RefreshCw
    };
  }

  return {
    label: 'Waiting for payment',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: Clock3
  };
}

export default function PaymentQrPanel({
  invoiceId,
  amount,
  initialPayment,
  onPaymentVerified
}: PaymentQrPanelProps) {
  const [status, setStatus] = useState(initialPayment.status || 'Pending');
  const [statusData, setStatusData] = useState<PaymentStatusDto | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string>('Scan the QR code or open the checkout page to finish the payment.');
  const notifiedRef = useRef(false);

  const refreshStatus = useCallback(async (manualVerify: boolean = false) => {
    try {
      setChecking(true);

      if (manualVerify && initialPayment.orderCode) {
        await paymentApi.verifyPayment(initialPayment.orderCode);
      }

      const response = await paymentApi.getPaymentStatus(invoiceId);
      const nextStatus = response.data?.status || 'Pending';
      setStatusData(response.data || null);
      setStatus(nextStatus);

      if (nextStatus === 'Paid') {
        setMessage('The system has recorded the payment and is updating the invoice status.');
        if (!notifiedRef.current) {
          notifiedRef.current = true;
          onPaymentVerified?.();
        }
      } else if (nextStatus === 'Cancelled') {
        setMessage('The transaction was cancelled or expired. Generate a new QR session if you want to continue.');
      } else if (nextStatus === 'Processing') {
        setMessage('PayOS is processing the payment. The system will update automatically once the final result is available.');
      } else if (manualVerify) {
        setMessage('No payment has been recorded yet. Complete the transfer in your banking app, then check again.');
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
      if (manualVerify) {
        setMessage('Payment status could not be checked right now.');
      }
    } finally {
      setChecking(false);
    }
  }, [initialPayment.orderCode, invoiceId, onPaymentVerified]);

  useEffect(() => {
    void refreshStatus(false);

    const intervalId = window.setInterval(() => {
      void refreshStatus(false);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [refreshStatus]);

  const qrCode = statusData?.qrCodeDataUrl || initialPayment.qrCodeDataUrl;
  const checkoutUrl = statusData?.checkoutUrl || initialPayment.checkoutUrl;
  const statusMeta = getStatusMeta(status);
  const StatusIcon = statusMeta.icon;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND'
  }).format(statusData?.amount ?? amount);

  return (
    <div className="payment-surface rounded-[1.75rem] p-4 sm:p-6">
      <div className="payment-grid gap-5">
        <div className="min-w-0 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Live session
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <QrCode className="h-4 w-4 text-[var(--color-primary)] dark:text-[var(--color-primary-light)]" />
                Pay with PayOS QR
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Order #{initialPayment.orderCode ?? statusData?.payOSOrderId ?? invoiceId}
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                This QR code belongs only to the current payment session. If your bank reports the session as expired or you cancel the transfer, create a new session using the action below.
              </p>
            </div>

            <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
              <StatusIcon className={`h-4 w-4 ${status.toLowerCase() === 'processing' ? 'animate-spin' : ''}`} />
              {statusMeta.label}
            </div>
          </div>

          {qrCode ? (
            <div className="relative overflow-hidden rounded-[1.75rem] border border-[color:var(--border-color)] bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.14),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(217,119,6,0.14),_transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,248,240,0.86))] p-5 shadow-[0_24px_70px_-45px_rgba(38,30,24,0.45)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(217,119,6,0.12),_transparent_28%),linear-gradient(180deg,rgba(11,27,35,0.96),rgba(9,20,27,0.98))]">
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-primary-light)]/70 to-transparent" />
              <div className="mx-auto w-full max-w-[19rem] rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-xl shadow-[rgba(38,30,24,0.12)] dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(9,22,29,0.92)]">
                <img src={qrCode} alt="Payment QR code" className="mx-auto aspect-square w-full max-w-[15rem] rounded-xl object-contain" />
              </div>

              <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                <div className="rounded-2xl border border-[color:var(--border-color)] bg-[rgba(255,255,255,0.72)] p-3 dark:bg-[rgba(9,22,29,0.86)]">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 1</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Open your banking app</div>
                </div>
                <div className="rounded-2xl border border-[color:var(--border-color)] bg-[rgba(255,255,255,0.72)] p-3 dark:bg-[rgba(9,22,29,0.86)]">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 2</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Scan this exact QR code</div>
                </div>
                <div className="rounded-2xl border border-[color:var(--border-color)] bg-[rgba(255,255,255,0.72)] p-3 dark:bg-[rgba(9,22,29,0.86)]">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 3</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Wait for system confirmation</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
              The QR code could not be generated. You can still open the direct checkout page.
            </div>
          )}

          <div className="rounded-[1.5rem] border border-[color:var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-sm">
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{message}</p>
          </div>
        </div>

        <div className="min-w-0 space-y-4 rounded-[1.75rem] border border-[color:var(--border-color)] bg-[var(--bg-card)] p-5 shadow-[0_24px_70px_-50px_rgba(38,30,24,0.45)] backdrop-blur">
          <div className="rounded-[1.5rem] bg-[linear-gradient(145deg,var(--color-secondary),var(--color-primary))] p-4 text-white shadow-lg dark:bg-[linear-gradient(145deg,var(--color-primary-dark),var(--color-primary))]">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">Amount</div>
            <div className="mt-2 break-words text-3xl font-semibold tracking-tight">{formattedAmount}</div>
            <p className="mt-2 text-sm text-white/75">The amount is locked to this payment session, so no manual entry is required when you use the QR code.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-[color:var(--border-color)] bg-[var(--bg-elevated)] p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                <Smartphone className="h-3.5 w-3.5" />
                Status
              </div>
              <div className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{status}</div>
            </div>

            <div className="rounded-2xl border border-[color:var(--border-color)] bg-[var(--bg-elevated)] p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure channel
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">The system checks the transaction automatically every 5 seconds to keep the status current.</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--border-color)] bg-[var(--bg-elevated)] p-4">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Notes</div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              <li>Scan only the QR code from the current session to avoid mismatched transactions.</li>
              <li>If money has already been sent but the state does not change immediately, wait a few seconds and check again.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[color:var(--border-color)] bg-[var(--bg-elevated)] p-4">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Actions</div>
            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void refreshStatus(true)}
                disabled={checking}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-light))] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(15,118,110,0.75)] transition-all hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-wait disabled:[background:var(--text-soft)] disabled:shadow-none"
              >
                <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                Check payment status
              </button>
              <button
                type="button"
                onClick={() => checkoutUrl && window.open(checkoutUrl, '_blank', 'noopener,noreferrer')}
                disabled={!checkoutUrl}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[color:var(--border-color)] bg-transparent px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ExternalLink className="h-4 w-4" />
                Open checkout page
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
