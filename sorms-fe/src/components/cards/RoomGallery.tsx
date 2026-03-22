import { useState } from "react";
import { resolveMediaUrl } from "@/utils/media";

interface RoomGalleryProps {
  images?: string[];
}

const fallbackImages = [
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop"
];

export function RoomGallery({ images }: RoomGalleryProps) {
  const gallery = images && images.length > 0 ? images.map((image) => resolveMediaUrl(image)) : fallbackImages;
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-3">
      <img src={gallery[active]} alt="Room" className="h-72 w-full rounded-xl object-cover md:h-[420px]" />
      <div className="grid grid-cols-3 gap-2">
        {gallery.map((image, index) => (
          <button key={`${image}-${index}`} onClick={() => setActive(index)} className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
            <img src={image} alt={`Room ${index + 1}`} className="h-20 w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
