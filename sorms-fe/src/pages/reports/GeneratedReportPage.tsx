import { useState } from 'react';
import { reportApi } from '../../api/reports';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BarChart3, RefreshCw } from 'lucide-react';

export default function GeneratedReportPage({ type }: { type: 'occupancy' | 'service-usage' | 'revenue' }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const titleMap = { occupancy: 'Occupancy Report', 'service-usage': 'Service Usage Report', revenue: 'Revenue Report' };
  const fnMap = { occupancy: reportApi.generateOccupancy, 'service-usage': reportApi.generateServiceUsage, revenue: reportApi.generateRevenue };

  const generate = async () => {
    setLoading(true); setError('');
    try {
      const res = await fnMap[type]();
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-shell max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{titleMap[type]}</h1>
          <p className="page-subtitle">Generate and inspect report output without losing detail.</p>
        </div>
        <button onClick={generate} className="btn btn-primary" disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {error && <div className="alert-banner alert-error">{error}</div>}
      {loading && <LoadingSpinner text="Generating report..." />}
      {data && !loading && (
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <BarChart3 size={20} className="text-[var(--color-primary)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Report Data</h3>
          </div>
          <pre className="max-h-[500px] overflow-auto rounded-xl bg-[var(--bg-primary)] p-4 text-xs text-[var(--text-secondary)] whitespace-pre-wrap">
            {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
      {!data && !loading && (
        <div className="glass-card p-12 text-center text-[var(--text-muted)]">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>Click "Generate Report" to view data</p>
        </div>
      )}
    </div>
  );
}
