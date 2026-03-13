export default function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="loading-shell flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="gradient-primary flex h-16 w-16 items-center justify-center rounded-[1.4rem] shadow-lg" style={{ animation: 'floatGlow 2.6s ease-in-out infinite' }}>
        <div
          className="h-8 w-8 rounded-full border-4 border-white/30 border-t-white"
          style={{ animation: 'spin 0.8s linear infinite' }}
        />
      </div>
      <div>
        <p className="text-base font-semibold text-[var(--text-primary)]">Loading data</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{text}</p>
      </div>
    </div>
  );
}
