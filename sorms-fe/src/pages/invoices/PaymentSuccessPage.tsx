import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentApi } from '../../api/payment';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AlertCircle, ArrowRight, CheckCircle, Clock3, Home, Receipt, ShieldCheck, Sparkles } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<'paid' | 'pending' | 'cancelled' | 'failed'>('pending');

  const invoiceRoute = useMemo(() => {
    if (!user) return '/login';
    return user.userRole === 'Resident' ? '/resident/invoices' : '/invoices';
  }, [user]);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const id = searchParams.get('invoice_id');
        const orderCode = searchParams.get('orderCode');
        const status = (searchParams.get('status') || '').toUpperCase();
        const cancelled = searchParams.get('cancel') === 'true';

        if (!id) {
          setError('Invoice ID not found');
          setLoading(false);
          return;
        }

        setInvoiceId(parseInt(id));

        if (cancelled || status === 'CANCELLED') {
          setPaymentState('cancelled');
          setError('The transaction was cancelled on PayOS.');
          return;
        }

        if (orderCode) {
          const res = await paymentApi.verifyPayment(parseInt(orderCode, 10));
          if (res.success || status === 'PAID') {
            setPaymentState('paid');
          } else if (status === 'PENDING' || status === 'PROCESSING') {
            setPaymentState('pending');
            setError('The transaction is still waiting for confirmation from PayOS. Please return to the invoice page in a few minutes.');
          } else {
            setPaymentState('failed');
            setError(res.message || 'The transaction could not be verified with PayOS.');
          }
        } else if (status === 'PAID') {
          setPaymentState('paid');
        } else {
          setPaymentState('pending');
          setError('No PayOS order code was returned for verification.');
        }
      } catch (err: unknown) {
        setPaymentState('failed');
        setError(err instanceof Error ? err.message : 'Payment verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) return <LoadingSpinner />;

  const viewConfig = paymentState === 'paid'
    ? {
        title: 'Payment Successful',
      description: 'PayOS has confirmed the payment and your invoice status has been updated.',
        icon: CheckCircle,
        iconClass: 'text-[var(--color-primary)] dark:text-[var(--color-primary-light)]',
        bgClass: 'from-[rgba(15,118,110,0.08)] via-[rgba(255,248,240,0.65)] to-[rgba(217,119,6,0.08)] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950',
        statusLabel: 'Paid',
        statusClass: 'bg-[rgba(15,118,110,0.12)] text-[var(--color-primary-dark)] dark:bg-[rgba(20,184,166,0.18)] dark:text-[var(--color-primary-light)]'
      }
    : paymentState === 'pending'
    ? {
        title: 'Payment Pending',
      description: 'The transaction exists, but PayOS is still waiting for confirmation from the bank.',
        icon: Clock3,
        iconClass: 'text-amber-500 dark:text-amber-400',
        bgClass: 'from-[rgba(217,119,6,0.08)] via-[rgba(255,248,240,0.65)] to-[rgba(15,118,110,0.06)] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950',
        statusLabel: 'Pending',
        statusClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
      }
    : {
        title: 'Payment Not Completed',
      description: 'PayOS has not confirmed a successful transaction for this invoice.',
        icon: AlertCircle,
        iconClass: 'text-[var(--color-warning)] dark:text-[var(--color-accent)]',
        bgClass: 'from-[rgba(217,119,6,0.08)] via-[rgba(255,248,240,0.72)] to-[rgba(180,83,9,0.08)] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950',
        statusLabel: paymentState === 'cancelled' ? 'Cancelled' : 'Failed',
        statusClass: 'bg-[rgba(217,119,6,0.12)] text-[var(--color-warning)] dark:bg-[rgba(180,83,9,0.18)] dark:text-[var(--color-accent)]'
      };

  const StatusIcon = viewConfig.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${viewConfig.bgClass} px-4 py-10 sm:px-6 lg:px-8`}>
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="payment-surface rounded-[2rem] p-5 sm:p-8">
            <div className="payment-accent rounded-[1.75rem] p-6 text-slate-900 dark:text-white sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                <Sparkles className="h-3.5 w-3.5" />
                Payment result
              </div>

              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/85 shadow-lg backdrop-blur">
                      <StatusIcon className={`h-9 w-9 ${viewConfig.iconClass}`} />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        {viewConfig.title}
                      </h1>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-200 sm:text-base">
                        {viewConfig.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`inline-flex h-fit w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${viewConfig.statusClass}`}>
                  <div className="h-2.5 w-2.5 rounded-full bg-current" />
                  {viewConfig.statusLabel}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Gateway</div>
                  <div className="mt-2 font-semibold text-slate-900">PayOS</div>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Invoice</div>
                  <div className="mt-2 font-semibold text-slate-900">{invoiceId ? `#${invoiceId}` : 'Pending lookup'}</div>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Sync mode</div>
                  <div className="mt-2 font-semibold text-slate-900">Auto verification</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-white/70 bg-white/88 p-6 shadow-[0_28px_80px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/88">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[linear-gradient(135deg,var(--color-secondary),var(--color-primary))] p-3 text-white">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Transaction snapshot</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">A short summary for validating the payment state.</div>
                </div>
              </div>

              {invoiceId && (
                <div className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-800">
                    <span>Invoice ID</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">#{invoiceId}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-800">
                    <span>Status</span>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${viewConfig.statusClass}`}>
                      <div className="h-2 w-2 rounded-full bg-current" />
                      {viewConfig.statusLabel}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>Verification</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{paymentState === 'paid' ? 'Confirmed' : 'Waiting'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-white/70 bg-white/88 p-6 shadow-[0_28px_80px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/88">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[rgba(15,118,110,0.12)] p-3 text-[var(--color-primary)] dark:bg-[rgba(20,184,166,0.18)] dark:text-[var(--color-primary-light)]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Next step</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Fast navigation after payment.</div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <button
                  onClick={() => navigate(invoiceRoute)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-light))] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(15,118,110,0.75)] transition-all hover:-translate-y-0.5 hover:brightness-105"
                >
                  <Receipt className="h-4 w-4" />
                  Back to Invoices
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[color:var(--border-color)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
                >
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700 dark:text-amber-300" />
                  <p className="text-sm leading-6">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-500">
          If the state does not change immediately, PayOS may still be syncing the transaction with the bank.
        </p>
      </div>
    </div>
  );
}
