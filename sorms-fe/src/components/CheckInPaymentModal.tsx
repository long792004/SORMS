import { useState } from 'react'
import { paymentApi } from '../api/payment'
import type { CreatePaymentLinkResponse, InvoiceDto } from '../types'
import Modal from './Modal'
import PaymentQrPanel from './PaymentQrPanel'
import StatusBadge from './StatusBadge'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Loader,
  ShieldCheck
} from 'lucide-react'

interface CheckInPaymentModalProps {
  isOpen: boolean
  invoice: InvoiceDto | null
  onPaymentSuccess: () => void
  onCancel: () => void
  loading?: boolean
}

export default function CheckInPaymentModal({
  isOpen,
  invoice,
  onPaymentSuccess: _onPaymentSuccess,
  onCancel,
  loading = false
}: CheckInPaymentModalProps) {
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentSession, setPaymentSession] =
    useState<CreatePaymentLinkResponse | null>(null)

  const modalWidth = paymentSession ? 1120 : 820

  if (!invoice) return null

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND'
  }).format(invoice.amount)

  const handlePayment = async () => {
    try {
      setPaying(true)
      setError(null)

      const currentUrl = window.location.origin
      const returnUrl = `${currentUrl}/payment/success?invoice_id=${invoice.id}`
      const cancelUrl = `${currentUrl}/payment/failure?invoice_id=${invoice.id}`

      const res = await paymentApi.createPaymentLink(
        invoice.id,
        returnUrl,
        cancelUrl
      )

      if (res.success && res.checkoutUrl) {
        setPaymentSession(res)
      } else {
        setError(res.message || 'Failed to create payment link')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment initialization failed')
    } finally {
      setPaying(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Check-in payment" maxWidth={modalWidth}>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="rounded-3xl border border-[rgba(15,118,110,0.2)] bg-[radial-gradient(circle_at_top_right,_rgba(217,119,6,0.18),_transparent_32%),linear-gradient(135deg,var(--color-primary-dark),var(--color-primary-light))] p-5 text-white shadow-xl sm:p-6 dark:border-[rgba(20,184,166,0.2)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-90">
                <Building2 size={16} />
                Check-In Settlement
              </div>

              <h3 className="mt-2 text-xl font-bold sm:text-2xl">
                Complete payment to continue check-in
              </h3>

              <p className="mt-1 max-w-xl text-sm leading-6 opacity-90">
                Once payment is confirmed, the request can move into staff approval without another manual step.
              </p>
            </div>

            <div className="w-full rounded-2xl bg-white/20 px-4 py-3 text-right backdrop-blur-md sm:w-auto">
              <div className="text-xs opacity-80">Amount</div>
              <div className="break-words text-2xl font-bold">{formattedAmount}</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur">
              <div className="text-xs opacity-70">Invoice</div>
              <div className="font-semibold break-all">#{invoice.id}</div>
            </div>

            <div className="bg-white/20 rounded-xl p-3 backdrop-blur">
              <div className="text-xs opacity-70">Room</div>
              <div className="font-semibold break-words">
                {invoice.roomNumber || 'Pending'}
              </div>
            </div>

            <div className="bg-white/20 rounded-xl p-3 backdrop-blur">
              <div className="text-xs opacity-70">Status</div>
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        {/* INFO */}
        <div className="grid gap-4 md:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs uppercase text-slate-500 dark:text-slate-400">
              Description
            </div>

            <div className="mt-2 text-lg font-semibold leading-7 text-slate-900 break-words dark:text-white">
              {invoice.description}
            </div>

            <div className="mt-5 flex gap-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
              <ShieldCheck className="text-amber-600" />

              <div className="text-sm leading-6 text-amber-800 dark:text-amber-200">
                Payment must be completed before staff can approve check-in.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-700 p-5 shadow-sm">

            <div className="flex justify-between border-b pb-3 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">
                Gateway
              </span>
              <span className="font-semibold dark:text-white">PayOS</span>
            </div>

            <div className="flex justify-between border-b py-3 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">
                Amount
              </span>
              <span className="font-semibold break-words text-right dark:text-white">
                {formattedAmount}
              </span>
            </div>

            <div className="flex justify-between pt-3">
              <span className="text-slate-500 dark:text-slate-400">
                Invoice Status
              </span>
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex gap-2 rounded-xl border border-[rgba(217,119,6,0.2)] bg-[rgba(217,119,6,0.1)] p-4 text-[var(--color-warning)] dark:border-[rgba(217,119,6,0.26)] dark:bg-[rgba(180,83,9,0.18)] dark:text-[var(--color-accent)]">
            <AlertCircle className="mt-0.5 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {/* QR PANEL */}
        {paymentSession && (
          <PaymentQrPanel
            invoiceId={invoice.id}
            amount={invoice.amount}
            initialPayment={paymentSession}
            onPaymentVerified={_onPaymentSuccess}
          />
        )}

        {/* ACTIONS */}
        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">

          <button
            onClick={onCancel}
            disabled={paying || loading}
            className="btn btn-secondary w-full sm:w-auto"
          >
            Cancel
          </button>

          <button
            onClick={handlePayment}
            disabled={paying || loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-light))] px-6 py-2.5 font-semibold text-white shadow-[0_18px_40px_-24px_rgba(15,118,110,0.75)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {paying && <Loader className="animate-spin" size={16} />}
            {paying ? 'Processing...' : paymentSession ? 'Regenerate QR' : 'Pay Now'}
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 flex justify-center gap-2">
          <ShieldCheck size={14} />
          Secured payment powered by PayOS
        </div>
      </div>
    </Modal>
  )
}