import { useState } from 'react';
import { roomInspectionApi } from '../../api/roomInspection';
import NoticeDialog from '../../components/NoticeDialog';

const defaultForm = {
  checkInRecordId: 0,
  furnitureStatus: 'OK',
  equipmentStatus: 'OK',
  roomConditionStatus: 'OK',
  result: 'OK',
  additionalFee: 0,
  notes: '',
};

export default function RoomInspectionPage() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ open: boolean; title: string; message: string; variant: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'info',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.checkInRecordId) {
      setNotice({ open: true, title: 'Missing record', message: 'Check-in record ID is required.', variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await roomInspectionApi.create({
        ...form,
        additionalFee: Number(form.additionalFee) || 0,
      });
      setNotice({ open: true, title: 'Inspection created', message: 'Room inspection has been saved successfully.', variant: 'success' });
      setForm(defaultForm);
    } catch (error: any) {
      setNotice({ open: true, title: 'Create failed', message: error?.response?.data?.message || 'Cannot create room inspection.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Room Inspection</h1>
      <form className="glass-card p-5 sm:p-6 space-y-4" onSubmit={submit}>
        <input
          className="form-input"
          type="number"
          min={1}
          placeholder="Check-in record ID"
          value={form.checkInRecordId || ''}
          onChange={(e) => setForm((prev) => ({ ...prev, checkInRecordId: Number(e.target.value) }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select className="form-input" value={form.furnitureStatus} onChange={(e) => setForm((prev) => ({ ...prev, furnitureStatus: e.target.value }))}>
            <option value="OK">Furniture: OK</option>
            <option value="Damaged">Furniture: Damaged</option>
            <option value="Missing">Furniture: Missing</option>
          </select>

          <select className="form-input" value={form.equipmentStatus} onChange={(e) => setForm((prev) => ({ ...prev, equipmentStatus: e.target.value }))}>
            <option value="OK">Equipment: OK</option>
            <option value="Damaged">Equipment: Damaged</option>
            <option value="Missing">Equipment: Missing</option>
          </select>

          <select className="form-input" value={form.roomConditionStatus} onChange={(e) => setForm((prev) => ({ ...prev, roomConditionStatus: e.target.value }))}>
            <option value="OK">Room condition: OK</option>
            <option value="Damaged">Room condition: Damaged</option>
            <option value="Missing">Room condition: Missing</option>
          </select>

          <select className="form-input" value={form.result} onChange={(e) => setForm((prev) => ({ ...prev, result: e.target.value }))}>
            <option value="OK">Result: OK</option>
            <option value="Damaged">Result: Damaged</option>
            <option value="Missing">Result: Missing</option>
          </select>
        </div>

        <input
          className="form-input"
          type="number"
          min={0}
          placeholder="Additional fee"
          value={form.additionalFee}
          onChange={(e) => setForm((prev) => ({ ...prev, additionalFee: Number(e.target.value) }))}
        />

        <textarea
          className="form-input min-h-[120px]"
          placeholder="Inspection notes"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
        />

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Inspection'}
        </button>
      </form>

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
