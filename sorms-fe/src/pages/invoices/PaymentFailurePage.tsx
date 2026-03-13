import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { paymentApi } from '../../api/payment';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AlertTriangle, ArrowRight, CreditCard, Home, Receipt, RotateCcw, ShieldAlert } from 'lucide-react';

export default function PaymentFailurePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [reason, setReason] = useState<string>('Unknown error');
  const [statusText, setStatusText] = useState<string>('Cancelled');

  const invoiceRoute = useMemo(() => {
    if (!user) return '/login';
    return user.userRole === 'Resident' ? '/resident/invoices' : '/invoices';
  }, [user]);

  useEffect(() => {
    const loadFailureState = async () => {
      try {
        const id = searchParams.get('invoice_id');
        const orderCode = searchParams.get('orderCode');
        const cancel = searchParams.get('cancel') === 'true';
        const status = (searchParams.get('status') || '').toUpperCase();
        const code = searchParams.get('code');

        if (id) {
          setInvoiceId(parseInt(id, 10));
        }

        if (orderCode) {
          const verification = await paymentApi.verifyPayment(parseInt(orderCode, 10));
          if (verification.success) {
            navigate(`/payment/success?${searchParams.toString()}`, { replace: true });
            return;
          }
        }

        if (cancel || status === 'CANCELLED') {
          setStatusText('Cancelled');
          setReason('The transaction was cancelled on PayOS, or the checkout session was cancelled.');
        } else if (status === 'PENDING' || status === 'PROCESSING') {
          setStatusText('Pending');
          setReason('The transaction is not complete yet. Check your banking app or retry verification from the invoice page.');
        } else if (code && code !== '00') {
          setStatusText('Failed');
          setReason(`PayOS returned error code ${code}. The transaction was not confirmed.`);
        } else {
          setStatusText('Failed');
          setReason(searchParams.get('reason') || 'The payment was not completed successfully. Please try again.');
        }
      } catch (err) {
        console.error('Error parsing payment failure state:', err);
        setStatusText('Failed');
        setReason('The status returned from PayOS could not be read.');
      } finally {
        setLoading(false);
      }
    };

    void loadFailureState();
  }, [navigate, searchParams]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[rgba(217,119,6,0.08)] via-[rgba(255,248,240,0.72)] to-[rgba(15,118,110,0.06)] px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="payment-surface rounded-[2rem] p-5 sm:p-8">
            <div className="rounded-[1.75rem] border border-[rgba(217,119,6,0.22)] bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(15,118,110,0.12),_transparent_28%),linear-gradient(145deg,#fff9f2,#fff3e7)] p-6 text-slate-900 shadow-[0_28px_80px_-45px_rgba(180,83,9,0.32)] sm:p-8 dark:border-[rgba(217,119,6,0.2)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.12),_transparent_28%),linear-gradient(145deg,rgba(14,31,39,0.95),rgba(11,24,31,0.98))] dark:text-white">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/85 shadow-lg backdrop-blur dark:bg-white/10">
                    <AlertTriangle className="h-9 w-9 text-[var(--color-warning)] dark:text-[var(--color-accent)]" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Payment Not Completed</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-300 sm:text-base">
                      PayOS has not confirmed a successful payment for this invoice. Review the reason below and start a fresh payment session if needed.
                    </p>
                  </div>
                </div>

                <div className="inline-flex h-fit w-fit items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--color-warning)] shadow-sm backdrop-blur dark:bg-[rgba(180,83,9,0.16)] dark:text-[var(--color-accent)]">
                  <div className="h-2.5 w-2.5 rounded-full bg-current" />
                  {statusText}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Gateway</div>
                  <div className="mt-2 font-semibold text-slate-900 dark:text-white">PayOS</div>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Invoice</div>
                  <div className="mt-2 font-semibold text-slate-900 dark:text-white">{invoiceId ? `#${invoiceId}` : 'Unavailable'}</div>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Action</div>
                  <div className="mt-2 font-semibold text-slate-900 dark:text-white">Retry available</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-white/70 bg-white/88 p-6 shadow-[0_28px_80px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/88">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[rgba(217,119,6,0.12)] p-3 text-[var(--color-warning)] dark:bg-[rgba(180,83,9,0.18)] dark:text-[var(--color-accent)]">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Failure details</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">A short explanation of why the last payment session did not finish.</div>
                </div>
              </div>

              <div className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-800">
                  <span>Status</span>
                  <span className="font-semibold text-[var(--color-warning)] dark:text-[var(--color-accent)]">{statusText}</span>
                </div>
                <div className="space-y-2 border-b border-slate-200/80 pb-4 dark:border-slate-800">
                  <div className="font-medium text-slate-900 dark:text-white">Reason</div>
                  <p className="leading-6 text-slate-600 dark:text-slate-300">{reason}</p>
                </div>
                {invoiceId && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>Invoice ID</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">#{invoiceId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/70 bg-white/88 p-6 shadow-[0_28px_80px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/88">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[linear-gradient(135deg,var(--color-secondary),var(--color-primary))] p-3 text-white">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">What you can do next</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Recommended next actions before retrying safely.</div>
                </div>
              </div>

              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">Check whether the transaction was cancelled in your banking app.</li>
                <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">Generate a new QR code if the previous session expired or was cancelled.</li>
                <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">Make sure the transfer amount and payment reference match the values shown by PayOS.</li>
                <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">If money was deducted but the state did not update, wait a few minutes and check again.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(invoiceRoute)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-light))] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(15,118,110,0.75)] transition-all hover:-translate-y-0.5 hover:brightness-105"
              >
                <CreditCard className="h-4 w-4" />
                Try Again
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate(invoiceRoute)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[color:var(--border-color)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
              >
                <Receipt className="h-4 w-4" />
                Back to Invoices
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
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-500">
          In local environments, the PayOS webhook only works when the backend is exposed through a public HTTPS URL.
        </p>
      </div>
    </div>
  );
}
