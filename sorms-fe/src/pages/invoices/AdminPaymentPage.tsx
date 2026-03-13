import { useCallback, useEffect, useState } from 'react';
import { paymentApi } from '../../api/payment';
import type { InvoiceDto } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import NoticeDialog from '../../components/NoticeDialog';
import { CreditCard, Trash2, Plus, DollarSign } from 'lucide-react';

export default function AdminPaymentPage() {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ open: boolean; title: string; message: string; variant: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'info'
  });

  const [formData, setFormData] = useState({
    residentId: '',
    roomId: '',
    amount: '',
    description: '',
    invoiceType: 'Rent'
  });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await paymentApi.getAllInvoices(1, 1000);
      if (res.success && res.data) {
        setInvoices(res.data);
      }
    } catch { /* noop */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInvoices();

    const intervalId = window.setInterval(() => {
      void fetchInvoices();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [fetchInvoices]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.residentId || !formData.amount || !formData.description) {
      setNotice({ open: true, title: 'Validation Error', message: 'Please fill in all required fields.', variant: 'warning' });
      return;
    }

    try {
      setCreatingInvoice(true);
      const res = await paymentApi.createInvoice({
        residentId: parseInt(formData.residentId),
        roomId: formData.roomId ? parseInt(formData.roomId) : undefined,
        amount: parseFloat(formData.amount),
        description: formData.description,
        invoiceType: formData.invoiceType
      });

      if (res.success && res.data) {
        setInvoices([res.data, ...invoices]);
        setShowCreateModal(false);
        setFormData({
          residentId: '',
          roomId: '',
          amount: '',
          description: '',
          invoiceType: 'Rent'
        });
        setNotice({ open: true, title: 'Invoice Created', message: 'Invoice created successfully.', variant: 'success' });
      }
    } catch (err: unknown) {
      setNotice({
        open: true,
        title: 'Create Failed',
        message: err instanceof Error ? err.message : 'Failed to create invoice',
        variant: 'error'
      });
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteInvoiceId) return;
    try {
      const res = await paymentApi.deleteInvoice(deleteInvoiceId);
      if (res.success) {
        setInvoices(invoices.filter(inv => inv.id !== deleteInvoiceId));
        setNotice({ open: true, title: 'Invoice Deleted', message: 'Invoice deleted successfully.', variant: 'success' });
      }
    } catch (err: unknown) {
      setNotice({
        open: true,
        title: 'Delete Failed',
        message: err instanceof Error ? err.message : 'Failed to delete invoice',
        variant: 'error'
      });
    } finally {
      setDeleteInvoiceId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices
    .filter(inv => inv.status === 'Pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-[var(--color-primary)] dark:text-[var(--color-primary-light)]" />
          Payment Management
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-light))] px-4 py-2 text-white font-medium transition-all shadow-[0_18px_40px_-24px_rgba(15,118,110,0.75)] hover:brightness-105"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="payment-invoice-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Total Amount</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
        </div>

        <div className="payment-invoice-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Paid</p>
              <p className="text-2xl font-bold text-[var(--color-primary)] dark:text-[var(--color-primary-light)]">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(paidAmount)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-[var(--color-primary-light)]" />
          </div>
        </div>

        <div className="payment-invoice-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Pending</p>
              <p className="text-2xl font-bold text-[var(--color-accent)] dark:text-[var(--color-accent)]">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pendingAmount)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-[var(--color-accent)]" />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="payment-surface rounded-[1.75rem] overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Invoice ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Resident
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      #{inv.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {inv.residentName || `Resident #${inv.residentId}`}
                    </td>
                    <td className="max-w-sm px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-normal break-words">
                      {inv.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(inv.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setDeleteInvoiceId(inv.id)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-1 text-[var(--color-warning)] transition-colors hover:bg-[rgba(217,119,6,0.1)] dark:hover:bg-[rgba(180,83,9,0.16)]"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Invoice"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Resident ID <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={formData.residentId}
              onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
              className="w-full rounded-lg border border-[color:var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              placeholder="Enter resident ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Room ID (Optional)
            </label>
            <input
              type="number"
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              className="w-full rounded-lg border border-[color:var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              placeholder="Enter room ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Amount (VND) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full rounded-lg border border-[color:var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Invoice Type
            </label>
            <select
              value={formData.invoiceType}
              onChange={(e) => setFormData({ ...formData, invoiceType: e.target.value })}
              className="w-full rounded-lg border border-[color:var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              <option value="Rent">Rent</option>
              <option value="Utility">Utility</option>
              <option value="Service">Service</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-[color:var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              placeholder="Enter invoice description"
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-[color:var(--border-color)] px-4 py-2 text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingInvoice}
              className="rounded-lg bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-light))] px-4 py-2 text-white transition-all hover:brightness-105 disabled:bg-[var(--text-soft)]"
            >
              {creatingInvoice ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteInvoiceId !== null}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteInvoice}
        onCancel={() => setDeleteInvoiceId(null)}
      />

      <NoticeDialog
        isOpen={notice.open}
        title={notice.title}
        message={notice.message}
        variant={notice.variant}
        onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
