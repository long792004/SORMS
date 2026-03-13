import { useEffect, useState } from 'react';
import { paymentApi } from '../../api/payment';
import type { RoomPricingDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import NoticeDialog from '../../components/NoticeDialog';
import { Settings, Plus, Edit2, Trash2, DollarSign } from 'lucide-react';

export default function RoomPricingPage() {
  const [pricings, setPricings] = useState<RoomPricingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletePricingId, setDeletePricingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ open: boolean; title: string; message: string; variant: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'info'
  });

  const [formData, setFormData] = useState({
    roomId: '',
    dailyRate: '',
    electricityRate: '',
    waterRate: '',
    internetFee: '',
    maintenanceFee: '',
    effectiveFrom: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchPricings();
  }, []);

  const fetchPricings = async () => {
    try {
      setLoading(true);
      const res = await paymentApi.getAllRoomPricings();
      if (res.success && res.data) {
        setPricings(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pricing?: RoomPricingDto) => {
    if (pricing) {
      setEditingId(pricing.id);
      setFormData({
        roomId: pricing.roomId.toString(),
        dailyRate: (pricing.dailyRate || pricing.monthlyRent || 0).toString(),
        electricityRate: pricing.electricityRate.toString(),
        waterRate: pricing.waterRate.toString(),
        internetFee: pricing.internetFee.toString(),
        maintenanceFee: pricing.maintenanceFee.toString(),
        effectiveFrom: pricing.effectiveFrom.split('T')[0]
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      roomId: '',
      dailyRate: '',
      electricityRate: '',
      waterRate: '',
      internetFee: '',
      maintenanceFee: '',
      effectiveFrom: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomId || !formData.dailyRate) {
      setNotice({ open: true, title: 'Validation Error', message: 'Please fill in required fields.', variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      const data = {
        roomId: parseInt(formData.roomId),
        dailyRate: parseFloat(formData.dailyRate),
        electricityRate: parseFloat(formData.electricityRate) || 0,
        waterRate: parseFloat(formData.waterRate) || 0,
        internetFee: parseFloat(formData.internetFee) || 0,
        maintenanceFee: parseFloat(formData.maintenanceFee) || 0,
        effectiveFrom: formData.effectiveFrom
      };

      if (editingId) {
        const res = await paymentApi.updateRoomPricing(parseInt(formData.roomId), data);
        if (res.success && res.data) {
          setPricings(pricings.map(p => p.id === editingId ? res.data! : p));
          setNotice({ open: true, title: 'Pricing Updated', message: 'Pricing updated successfully.', variant: 'success' });
        }
      } else {
        const res = await paymentApi.createRoomPricing(parseInt(formData.roomId), data);
        if (res.success && res.data) {
          setPricings([res.data, ...pricings]);
          setNotice({ open: true, title: 'Pricing Created', message: 'Pricing created successfully.', variant: 'success' });
        }
      }

      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      setNotice({
        open: true,
        title: 'Save Failed',
        message: err instanceof Error ? err.message : 'Failed to save pricing',
        variant: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePricingId) return;
    try {
      // Note: Delete endpoint may need to be added to backend
      setPricings(pricings.filter(p => p.id !== deletePricingId));
      setNotice({ open: true, title: 'Pricing Deleted', message: 'Pricing deleted successfully.', variant: 'success' });
    } catch (err: unknown) {
      setNotice({
        open: true,
        title: 'Delete Failed',
        message: err instanceof Error ? err.message : 'Failed to delete pricing',
        variant: 'error'
      });
    } finally {
      setDeletePricingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          Room Pricing Management
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Pricing
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Pricing Cards Grid */}
      {pricings.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No room pricing configured yet.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Create the first pricing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pricings.map((pricing) => (
            <div
              key={pricing.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-indigo-50 dark:from-indigo-900/20 to-purple-50 dark:to-purple-900/20 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Room {pricing.roomNumber}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    pricing.isActive
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                  }`}>
                    {pricing.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Effective from {new Date(pricing.effectiveFrom).toLocaleDateString()}
                </p>
              </div>

              {/* Card Body */}
              <div className="px-6 py-4 space-y-3">
                {/* Daily Rate */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Daily Rate
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pricing.dailyRate || pricing.monthlyRent || 0)}
                  </span>
                </div>

                {/* Utilities Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Electricity</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pricing.electricityRate)}<span className="text-xs">/kWh</span>
                    </p>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Water</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pricing.waterRate)}<span className="text-xs">/m³</span>
                    </p>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Internet</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pricing.internetFee)}
                    </p>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Maintenance</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pricing.maintenanceFee)}
                    </p>
                  </div>
                </div>

                {/* Total Estimated Cost */}
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Estimated Total</p>
                  <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pricing.totalEstimatedCost)}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-2 justify-end">
                <button
                  onClick={() => handleOpenModal(pricing)}
                  className="inline-flex items-center gap-2 px-3 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setDeletePricingId(pricing.id)}
                  className="inline-flex items-center gap-2 px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pricing Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingId ? 'Edit Room Pricing' : 'Create Room Pricing'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Room ID <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              disabled={!!editingId}
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Daily Rate (VND) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.dailyRate}
              onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Electricity Rate (VND/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.electricityRate}
                onChange={(e) => setFormData({ ...formData, electricityRate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Water Rate (VND/m³)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.waterRate}
                onChange={(e) => setFormData({ ...formData, waterRate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Internet Fee (VND)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.internetFee}
                onChange={(e) => setFormData({ ...formData, internetFee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Maintenance Fee (VND)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.maintenanceFee}
                onChange={(e) => setFormData({ ...formData, maintenanceFee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Effective From
            </label>
            <input
              type="date"
              value={formData.effectiveFrom}
              onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {submitting ? 'Saving...' : editingId ? 'Update Pricing' : 'Create Pricing'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deletePricingId !== null}
        title="Delete Pricing"
        message="Are you sure you want to delete this pricing configuration?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletePricingId(null)}
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
