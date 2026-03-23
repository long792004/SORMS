import { CalendarDays, MapPin, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SearchBarProps {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  onLocationChange: (value: string) => void;
  onCheckInChange: (value: string) => void;
  onCheckOutChange: (value: string) => void;
  onGuestsChange: (value: number) => void;
  onSubmit: () => void;
  theme?: "default" | "hero";
}

export function SearchBar({
  location,
  checkIn,
  checkOut,
  guests,
  onLocationChange,
  onCheckInChange,
  onCheckOutChange,
  onGuestsChange,
  onSubmit,
  theme = "default"
}: SearchBarProps) {
  const isHero = theme === "hero";

  return (
    <div
      className={`grid gap-2 rounded-3xl border p-2.5 backdrop-blur-xl md:grid-cols-[1.2fr_1fr_1fr_0.9fr_auto] ${
        isHero
          ? "border-white/35 bg-slate-950/40 shadow-[0_30px_100px_rgba(2,6,23,0.55)]"
          : "border-slate-200/80 bg-white/92 shadow-panel"
      }`}
    >
      <label className={`rounded-2xl border px-3 py-2 ${isHero ? "border-white/20 bg-white/10" : "border-transparent bg-white/80"}`}>
        <span className={`mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${isHero ? "text-white/75" : "text-slate-500"}`}>
          <MapPin className="h-3 w-3" /> Location
        </span>
        <input
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          placeholder="City / Area"
          className={`h-7 w-full border-none bg-transparent text-sm outline-none ${isHero ? "text-white placeholder:text-white/60" : "text-slate-800"}`}
        />
      </label>

      <label className={`rounded-2xl border px-3 py-2 ${isHero ? "border-white/20 bg-white/10" : "border-transparent bg-white/80"}`}>
        <span className={`mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${isHero ? "text-white/75" : "text-slate-500"}`}>
          <CalendarDays className="h-3 w-3" /> Check In
        </span>
        <input
          type="date"
          value={checkIn}
          onChange={(event) => onCheckInChange(event.target.value)}
          className={`h-7 w-full border-none bg-transparent text-sm outline-none ${isHero ? "text-white [color-scheme:dark]" : "text-slate-800"}`}
        />
      </label>

      <label className={`rounded-2xl border px-3 py-2 ${isHero ? "border-white/20 bg-white/10" : "border-transparent bg-white/80"}`}>
        <span className={`mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${isHero ? "text-white/75" : "text-slate-500"}`}>
          <CalendarDays className="h-3 w-3" /> Check Out
        </span>
        <input
          type="date"
          value={checkOut}
          onChange={(event) => onCheckOutChange(event.target.value)}
          className={`h-7 w-full border-none bg-transparent text-sm outline-none ${isHero ? "text-white [color-scheme:dark]" : "text-slate-800"}`}
        />
      </label>

      <label className={`rounded-2xl border px-3 py-2 ${isHero ? "border-white/20 bg-white/10" : "border-transparent bg-white/80"}`}>
        <span className={`mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${isHero ? "text-white/75" : "text-slate-500"}`}>
          <Users className="h-3 w-3" /> Guests
        </span>
        <input
          type="number"
          min={1}
          value={guests}
          onChange={(event) => onGuestsChange(Number(event.target.value))}
          className={`h-7 w-full border-none bg-transparent text-sm outline-none ${isHero ? "text-white" : "text-slate-800"}`}
        />
      </label>

      <Button className={`h-full w-full min-w-[160px] px-5 ${isHero ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_16px_40px_rgba(249,115,22,0.45)]" : ""}`} onClick={onSubmit}>
        <Search className="mr-2 h-4 w-4" /> Search
      </Button>
    </div>
  );
}
