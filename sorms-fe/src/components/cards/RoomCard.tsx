import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BedDouble, Clock, MapPin, Star } from "lucide-react";
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
  holdExpiresAt?: string | null;
  onView?: () => void;
  onBook?: () => void;
}

const fallbackImage = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop";

function StatusBadge({ status, holdExpiresAt }: { status: string; holdExpiresAt?: string | null }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (status !== "OnHold" || !holdExpiresAt) return;

    const update = () => {
      const diff = new Date(holdExpiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Hết hạn");
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${String(s).padStart(2, "0")}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [status, holdExpiresAt]);

  if (status === "OnHold") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-400/30">
        <Clock className="h-3 w-3" />
        Đang giữ chỗ {remaining ? `• ${remaining}` : ""}
      </span>
    );
  }

  if (status === "Occupied") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-300 border border-rose-400/30">
        Đã có người ở
      </span>
    );
  }

  if (status === "Maintenance") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/20 px-2.5 py-0.5 text-xs font-semibold text-slate-300 border border-slate-400/30">
        Bảo trì
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-400/30">
      Còn trống
    </span>
  );
}

export function RoomCard({
  title,
  price,
  rating = "0.0",
  location = "SORM Residence",
  imageUrl,
  reviewCount = 0,
  status = "Available",
  holdExpiresAt,
  onView,
  onBook
}: RoomCardProps) {
  const coverImage = resolveMediaUrl(imageUrl) || fallbackImage;
  const isOnHold = status === "OnHold";
  const isOccupied = status === "Occupied";
  const isMaintenance = status === "Maintenance";
  const canBook = !isOccupied && !isMaintenance;

  return (
    <motion.article whileHover={{ scale: 1.05 }} className="glass-card overflow-hidden rounded-xl">
      <button type="button" onClick={onView} className="relative block w-full text-left">
        <img src={coverImage} alt={title} className={`h-44 w-full object-cover ${isOnHold ? "opacity-80" : ""}`} />
        <div className="absolute top-2 right-2">
          <StatusBadge status={status} holdExpiresAt={holdExpiresAt} />
        </div>
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
        {canBook ? (
          <Button className="w-full" onClick={onBook}>
            {isOnHold ? "Xem chi tiết" : "Book now"}
          </Button>
        ) : (
          <Button className="w-full opacity-50 cursor-not-allowed" disabled>
            {isOccupied ? "Đã có người ở" : "Đang bảo trì"}
          </Button>
        )}
      </div>
    </motion.article>
  );
}
