import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  gradient: string;
  subtitle?: string;
}

export default function StatsCard({ title, value, icon, gradient, subtitle }: StatsCardProps) {
  return (
    <div className="glass-card relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="metric-label">{title}</p>
          <p className="metric-value">{value}</p>
          {subtitle && <p className="metric-note">{subtitle}</p>}
        </div>

        <div className={`${gradient} flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
