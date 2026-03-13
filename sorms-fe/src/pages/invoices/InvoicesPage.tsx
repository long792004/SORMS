import { useEffect, useState } from 'react'
import { paymentApi } from '../../api/payment'
import type { InvoiceDto } from '../../types'
import StatusBadge from '../../components/StatusBadge'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import PaymentCheckout from '../../components/PaymentCheckout'
import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  Eye,
  Receipt,
  ShieldCheck,
  Wallet
} from 'lucide-react'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const res = await paymentApi.getMyInvoices()
      if (res.success && res.data) {
        setInvoices(res.data)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (invoice: InvoiceDto) => {
    setSelectedInvoice(invoice)
    setShowDetailModal(true)
  }

  if (loading) return <LoadingSpinner />

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(v)

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const paidAmount = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)
  const pendingAmount = invoices.filter((i) => i.status === 'Pending').reduce((s, i) => s + i.amount, 0)
  const latestInvoice = [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  return (
    <div className="page-shell mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="hero-banner">
        <div className="hero-grid">
          <div>
            <span className="hero-kicker">
              <Receipt size={14} />
              Payment and invoices
            </span>
            <div className="page-header mt-5">
              <h1 className="page-title">Invoices and payments, arranged clearly</h1>
              <p className="page-subtitle">
                Track total cost, paid balance, and individual invoice detail from one cleaner booking-style view.
              </p>
            </div>
          </div>

          <div className="spotlight-card flex flex-col justify-between">
            <div>
              <div className="metric-label">Latest update</div>
              <div className="mt-3 text-2xl font-extrabold text-[var(--text-primary)]">
                {latestInvoice ? latestInvoice.description : 'No invoice has been issued yet'}
              </div>
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                {latestInvoice
                  ? `Issued on ${new Date(latestInvoice.createdAt).toLocaleDateString('en-US')} • ${fmt(latestInvoice.amount)}`
                  : 'New invoices will appear here as soon as the system creates them.'}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
              <ShieldCheck size={16} />
              Secure checkout with PayOS
            </div>
          </div>
        </div>
      </div>

      <div className="listing-summary">
        <div className="metric-card">
          <div className="metric-label">Total value</div>
          <div className="metric-value">{fmt(totalAmount)}</div>
          <div className="metric-note">{invoices.length} invoices</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Paid</div>
          <div className="metric-value">{fmt(paidAmount)}</div>
          <div className="metric-note">{invoices.filter((i) => i.status === 'Paid').length} completed payments</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pending</div>
          <div className="metric-value">{fmt(pendingAmount)}</div>
          <div className="metric-note">{invoices.filter((i) => i.status === 'Pending').length} open invoices</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Completion rate</div>
          <div className="metric-value">{invoices.length > 0 ? Math.round((paidAmount / totalAmount) * 100 || 0) : 0}%</div>
          <div className="metric-note">Based on payment value</div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_320px]">
        <div className="space-y-3">
        {invoices.length === 0 ? (
          <div className="glass-card p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No invoices are available yet.
          </div>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className="payment-invoice-card transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-slate-900 dark:text-white">
                      {inv.description}
                    </span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(inv.createdAt).toLocaleDateString('en-US')}
                    </span>
                    <span>#{inv.id}</span>
                    {inv.roomNumber && <span>Room {inv.roomNumber}</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <span className="break-words text-lg font-bold text-slate-900 dark:text-white">{fmt(inv.amount)}</span>
                  <button
                    onClick={() => handleViewDetails(inv)}
                    className={`btn btn-sm sm:min-w-[8.5rem] ${inv.status === 'Paid' || inv.status === 'Cancelled' ? 'btn-ghost' : 'btn-primary'}`}
                  >
                    {inv.status === 'Paid' || inv.status === 'Cancelled' ? <Eye className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                    {inv.status === 'Paid' ? 'Details' : inv.status === 'Cancelled' ? 'Cancelled' : 'Pay now'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        </div>

        <div className="glass-card p-5">
          <div className="metric-label">Quick guidance</div>
          <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
            <div className="card-subtle">
              <div className="flex items-start gap-3">
                <Wallet size={18} className="mt-0.5 text-[var(--color-primary)]" />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Track total cost</div>
                  <div className="text-xs text-[var(--text-muted)]">Every invoice is grouped by value, issue date, and linked room.</div>
                </div>
              </div>
            </div>
            <div className="card-subtle">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 text-[var(--color-success)]" />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Secure payment</div>
                  <div className="text-xs text-[var(--text-muted)]">You can complete checkout directly inside the modal without leaving the dashboard.</div>
                </div>
              </div>
            </div>
            <div className="card-subtle">
              <div className="flex items-start gap-3">
                <ArrowRight size={18} className="mt-0.5 text-[var(--color-accent)]" />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Handle pending invoices fast</div>
                  <div className="text-xs text-[var(--text-muted)]">Use the payment action on each row to continue immediately.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedInvoice(null)
        }}
        title="Payment details"
        maxWidth={900}
      >
        {selectedInvoice && (
          <PaymentCheckout
            invoice={selectedInvoice}
            onPaymentSuccess={() => {
              setShowDetailModal(false)
              fetchInvoices()
            }}
            onPaymentError={(err: string) => {
              console.error(err)
            }}
          />
        )}
      </Modal>
    </div>
  )
}