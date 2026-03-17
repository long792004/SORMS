import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  max?: number;
}

export function RatingStars({ rating, max = 5 }: RatingStarsProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, index) => {
        const active = index + 1 <= Math.round(rating);
        return <Star key={index} className={`h-3.5 w-3.5 ${active ? "fill-accent text-accent" : "text-slate-300 dark:text-slate-600"}`} />;
      })}
      <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">{rating.toFixed(1)}</span>
    </div>
  );
}
