import { useEffect, useState } from 'react';
import { ratingApi } from '../../api/rating';
import type { RatingDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import NoticeDialog from '../../components/NoticeDialog';

interface Props {
  adminView?: boolean;
}

export default function RatingPage({ adminView = false }: Props) {
  const [ratings, setRatings] = useState<RatingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    checkInRecordId: 0,
    roomScore: 5,
    serviceScore: 5,
    comment: '',
  });
  const [notice, setNotice] = useState<{ open: boolean; title: string; message: string; variant: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'info',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = adminView ? await ratingApi.getAllRatings() : await ratingApi.getMyRatings();
      setRatings(res.data.data || []);
    } catch {
      setNotice({ open: true, title: 'Load failed', message: 'Cannot load ratings.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [adminView]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.checkInRecordId) {
      setNotice({ open: true, title: 'Missing data', message: 'Check-in record ID is required.', variant: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await ratingApi.create({
        checkInRecordId: form.checkInRecordId,
        roomScore: form.roomScore,
        serviceScore: form.serviceScore,
        comment: form.comment,
      });
      setNotice({ open: true, title: 'Rating submitted', message: 'Thank you for your feedback.', variant: 'success' });
      setForm({ checkInRecordId: 0, roomScore: 5, serviceScore: 5, comment: '' });
      await load();
    } catch (error: any) {
      setNotice({ open: true, title: 'Submit failed', message: error?.response?.data?.message || 'Cannot submit rating.', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-shell max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{adminView ? 'Resident Ratings' : 'My Ratings'}</h1>

      {!adminView && (
        <form className="glass-card p-5 sm:p-6 space-y-3" onSubmit={submit}>
          <h2 className="text-lg font-semibold">Submit a rating</h2>
          <input
            className="form-input"
            type="number"
            min={1}
            placeholder="Check-in record ID"
            value={form.checkInRecordId || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, checkInRecordId: Number(e.target.value) }))}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="form-input"
              type="number"
              min={1}
              max={5}
              value={form.roomScore}
              onChange={(e) => setForm((prev) => ({ ...prev, roomScore: Number(e.target.value) }))}
              placeholder="Room score (1-5)"
            />
            <input
              className="form-input"
              type="number"
              min={1}
              max={5}
              value={form.serviceScore}
              onChange={(e) => setForm((prev) => ({ ...prev, serviceScore: Number(e.target.value) }))}
              placeholder="Service score (1-5)"
            />
          </div>
          <textarea
            className="form-input min-h-[120px]"
            placeholder="Comment"
            value={form.comment}
            onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
          />
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </form>
      )}

      <div className="glass-card p-5 sm:p-6">
        {ratings.length === 0 ? (
          <EmptyState message="No ratings found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Check-In Record</th>
                  <th>Room Score</th>
                  <th>Service Score</th>
                  <th>Comment</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating) => (
                  <tr key={rating.id}>
                    <td>{rating.id}</td>
                    <td>{rating.checkInRecordId}</td>
                    <td>{rating.roomScore}</td>
                    <td>{rating.serviceScore}</td>
                    <td>{rating.comment || '—'}</td>
                    <td>{new Date(rating.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
