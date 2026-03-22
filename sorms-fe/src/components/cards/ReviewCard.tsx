interface ReviewCardProps {
  author: string;
  comment: string;
  rating: number;
  roomName?: string;
  createdAt?: string;
}

export function ReviewCard({ author, comment, rating, roomName, createdAt }: ReviewCardProps) {
  const createdLabel = createdAt ? new Date(createdAt).toLocaleDateString("vi-VN") : null;

  return (
    <article className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="font-semibold">{author}</h5>
          {roomName || createdLabel ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{roomName ? `Phòng ${roomName}` : ""}{roomName && createdLabel ? " • " : ""}{createdLabel ?? ""}</p> : null}
        </div>
        <span className="text-accent">{rating.toFixed(1)}★</span>
      </div>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{comment}</p>
    </article>
  );
}
