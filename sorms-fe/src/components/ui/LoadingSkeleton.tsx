interface LoadingSkeletonProps {
  lines?: number;
}

export function LoadingSkeleton({ lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="h-4 rounded bg-slate-200 dark:bg-white/10" />
      ))}
    </div>
  );
}
