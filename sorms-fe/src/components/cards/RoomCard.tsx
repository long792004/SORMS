import { motion } from "framer-motion";
import { BedDouble, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { resolveMediaUrl } from "@/utils/media";

interface RoomCardProps {
  title: string;
  price: string;
  rating?: string;
  location?: string;
  imageUrl?: string;
  reviewCount?: number;
  status?: string;
  onView?: () => void;
  onBook?: () => void;
}

const fallbackImage = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop";

export function RoomCard({
  title,
  price,
  rating = "0.0",
  location = "SORM Residence",
  imageUrl,
  reviewCount = 0,
  status = "Available",
  onView,
  onBook
}: RoomCardProps) {
  const coverImage = resolveMediaUrl(imageUrl) || fallbackImage;

  return (
    <motion.article whileHover={{ scale: 1.05 }} className="glass-card overflow-hidden rounded-xl">
      <button type="button" onClick={onView} className="block w-full text-left">
        <img src={coverImage} alt={title} className="h-44 w-full object-cover" />
      </button>
      <div className="space-y-3 p-4">
        <button type="button" onClick={onView} className="text-left">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h4>
        </button>
        <p className="text-sm text-slate-700 dark:text-slate-300">{price}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-accent" />{rating} ({reviewCount})</span>
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{location}</span>
          <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{status}</span>
        </div>
        <Button className="w-full" onClick={onBook}>Book now</Button>
      </div>
    </motion.article>
  );
}
