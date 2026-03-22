import { Search } from "lucide-react";
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
  onSubmit
}: SearchBarProps) {
  return (
    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-soft dark:border-white/10 dark:bg-white/5 md:grid-cols-5">
      <input
        value={location}
        onChange={(event) => onLocationChange(event.target.value)}
        placeholder="Location"
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5"
      />
      <input type="date" value={checkIn} onChange={(event) => onCheckInChange(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5" />
      <input type="date" value={checkOut} onChange={(event) => onCheckOutChange(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5" />
      <input
        type="number"
        min={1}
        value={guests}
        onChange={(event) => onGuestsChange(Number(event.target.value))}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5"
      />
      <Button className="h-10 w-full" onClick={onSubmit}>
        <Search className="mr-2 h-4 w-4" /> Search
      </Button>
    </div>
  );
}
