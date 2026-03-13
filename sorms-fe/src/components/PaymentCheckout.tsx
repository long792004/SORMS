import { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, CreditCard, Loader, ShieldCheck } from 'lucide-react';
import { paymentApi } from '../api/payment';
import type { CreatePaymentLinkResponse, InvoiceDto } from '../types';
import PaymentQrPanel from './PaymentQrPanel';
import StatusBadge from './StatusBadge';

interface PaymentCheckoutProps {
  invoice: InvoiceDto;
  onPaymentInitiated?: (checkoutUrl: string) => void;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

export default function PaymentCheckout({
  invoice,
  onPaymentInitiated,
  onPaymentSuccess,
  onPaymentError
}: PaymentCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSession, setPaymentSession] = useState<CreatePaymentLinkResponse | null>(null);

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(v);

  const handlePayment = async () => {
    if (invoice.status === 'Paid') {
      const msg = 'This invoice has already been paid.';
      setError(msg);
      onPaymentError?.(msg);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const origin = window.location.origin;
      const returnUrl = `${origin}/payment/success?invoice_id=${invoice.id}`;
      const cancelUrl = `${origin}/payment/failure?invoice_id=${invoice.id}`;

      const res = await paymentApi.createPaymentLink(invoice.id, returnUrl, cancelUrl);

      if (res.success && res.checkoutUrl) {
        setPaymentSession(res);
        onPaymentInitiated?.(res.checkoutUrl);
        return;
      }

      throw new Error(res.message || 'Unable to create the payment link.');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Payment initialization failed.';
      setError(errorMsg);
      onPaymentError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="payment-invoice-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Invoice #{invoice.id}
            </p>
            <h3 className="mt-1 text-xl font-bold leading-8 text-slate-900 dark:text-white">
              {invoice.description}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Issued on: {new Date(invoice.createdAt).toLocaleDateString('en-US')}
            </p>
          </div>
          <div className="sm:text-right sm:self-start">
            <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--border-color)] bg-[var(--bg-elevated)] px-4 py-3 shadow-sm">
              <CreditCard className="h-5 w-5 text-[var(--color-primary)] dark:text-[var(--color-primary-light)]" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total to pay</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{fmt(invoice.amount)}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-start sm:justify-end">
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        {[
          { step: '1', title: 'Create session', desc: 'Use the action below to create a PayOS payment session.' },
          { step: '2', title: 'Scan the QR', desc: 'Use your banking app to scan the QR code and transfer the payment.' },
          { step: '3', title: 'Confirm', desc: 'The system updates the invoice state automatically.' }
        ].map((s) => (
          <div
            key={s.step}
            className="rounded-xl border border-[color:var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-sm"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(15,118,110,0.12)] text-sm font-bold text-[var(--color-primary)] dark:bg-[rgba(20,184,166,0.16)] dark:text-[var(--color-primary-light)]">
              {s.step}
            </div>
            <h4 className="mt-3 font-semibold text-slate-900 dark:text-white">{s.title}</h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
          </div>
        ))}
      </div>

      {invoice.status === 'Paid' && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-medium text-emerald-800 dark:text-emerald-300">Invoice already completed</p>
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
              No new payment session is required for this invoice.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[rgba(217,119,6,0.24)] bg-[rgba(217,119,6,0.1)] p-4 dark:border-[rgba(217,119,6,0.28)] dark:bg-[rgba(180,83,9,0.18)]">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-warning)] dark:text-[var(--color-accent)]" />
          <div>
            <p className="font-medium text-[var(--color-warning)] dark:text-[var(--color-accent)]">Payment error</p>
            <p className="mt-1 text-sm text-[var(--color-warning)]/90 dark:text-[var(--color-accent)]/90">{error}</p>
          </div>
        </div>
      )}

      {paymentSession && (
        <PaymentQrPanel
          invoiceId={invoice.id}
          amount={invoice.amount}
          initialPayment={paymentSession}
          onPaymentVerified={onPaymentSuccess}
        />
      )}

      <button
        onClick={handlePayment}
        disabled={loading || invoice.status === 'Paid'}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold transition-colors sm:w-auto ${
          invoice.status === 'Paid'
            ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            : loading
              ? 'cursor-wait bg-[var(--color-primary)] text-white'
              : 'bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-light))] text-white shadow-[0_18px_40px_-24px_rgba(15,118,110,0.75)] hover:brightness-105'
        }`}
      >
        {loading && <Loader className="h-4 w-4 animate-spin" />}
        {invoice.status === 'Paid' ? 'Already paid' : paymentSession ? 'Generate QR again' : 'Pay now'}
        {!loading && invoice.status !== 'Paid' && <ArrowRight className="h-4 w-4" />}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5" />
        Secured by PayOS
      </p>
    </div>
  );
}
