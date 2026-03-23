import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface InvoiceCardProps {
  id: string;
  amount: string;
  status: string;
  roomInfo?: string;
  checkIn?: string;
  checkOut?: string;
  guestList?: string;
  onPay?: () => void;
}

export function InvoiceCard({ id, amount, status, roomInfo, checkIn, checkOut, guestList, onPay }: InvoiceCardProps) {
  const [showGuests, setShowGuests] = useState(false);

  const parsedGuests = (() => {
    if (!guestList) return null;
    try {
      const arr = JSON.parse(guestList);
      return Array.isArray(arr) && arr.length > 0 ? arr : null;
    } catch {
      return guestList; // Fallback string xài plain text
    }
  })();

  return (
    <article className="glass-card rounded-xl p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Invoice #{id}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.toLowerCase() === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
            {status}
          </span>
        </div>
        
        <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{amount}</p>
        
        {(roomInfo || checkIn || checkOut) && (
          <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
            {roomInfo && <p>Phòng: {roomInfo}</p>}
            {(checkIn || checkOut) && <p>{checkIn || "-"} → {checkOut || "-"}</p>}
          </div>
        )}

        {parsedGuests && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/50 p-2 dark:border-white/5 dark:bg-white/5">
            <button 
              className="flex w-full items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-200"
              onClick={() => setShowGuests(!showGuests)}
            >
              <span>Khách lưu trú {Array.isArray(parsedGuests) ? `(${parsedGuests.length})` : ""}</span>
              <span className="text-[10px] text-primary">{showGuests ? "Thu gọn" : "Xem chi tiết"}</span>
            </button>
            
            {showGuests && (
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                {Array.isArray(parsedGuests) ? (
                  <ul className="list-inside list-disc space-y-1 pl-1">
                    {parsedGuests.map((g, i) => (
                      <li key={i}>
                        <span className={i === 0 ? "font-medium" : ""}>
                          {g.fullName || "(Chưa nhập tên)"}
                        </span>
                        {i === 0 ? <span className="ml-1 text-[10px] italic text-primary">(Người đặt)</span> : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{parsedGuests}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {onPay ? <Button className="mt-3 w-full" onClick={onPay}>Thanh toán ngay</Button> : null}
    </article>
  );
}
