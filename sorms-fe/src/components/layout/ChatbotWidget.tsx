import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { chatbotApi } from "@/api/chatbotApi";
import { roomApi } from "@/api/roomApi";

interface ChatMessage {
  from: "user" | "bot";
  text: string;
}

export function ChatbotWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "bot", text: "Xin chào! Mình là AI consultant của SORM. Bạn cần tìm phòng như thế nào?" }
  ]);

  const sessionId = useMemo(() => `chat-${Date.now()}`, []);

  const { data: roomsData } = useQuery({
    queryKey: ["chatbot", "rooms", "all"],
    queryFn: async () => {
      const response = await roomApi.getRooms();
      return response.data?.data ?? response.data;
    }
  });

  const roomNumberToIdMap = useMemo(() => {
    const map = new Map<string, string>();
    const rooms = Array.isArray(roomsData) ? roomsData : [];
    rooms.forEach((room: any) => {
      const roomNumber = String(room?.roomNumber ?? "").trim();
      const roomId = String(room?.id ?? room?.roomId ?? "").trim();
      if (roomNumber && roomId) {
        map.set(roomNumber, roomId);
      }
    });
    return map;
  }, [roomsData]);

  const extractMentionedRoomNumbers = (text: string) => {
    const roomNumbers = new Set<string>();
    const matches = text.matchAll(/phòng\s+([a-zA-Z0-9-]+)/gi);
    for (const match of matches) {
      const roomNumber = String(match[1] ?? "").trim();
      if (roomNumber) roomNumbers.add(roomNumber);
    }
    return Array.from(roomNumbers);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { from: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const response = await chatbotApi.ask({ sessionId, message: trimmed });
      const reply = response.data?.replyMessage ?? "Mình chưa có phản hồi phù hợp.";
      setMessages((prev) => [...prev, { from: "bot", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { from: "bot", text: "Có lỗi khi gọi chatbot, vui lòng thử lại." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="glass-card mb-3 h-[480px] w-[340px] rounded-2xl border border-white/20 p-3"
          >
            <div className="mb-3 rounded-xl border border-slate-200/80 bg-white/75 px-3 py-2 dark:border-white/10 dark:bg-white/5">
              <p className="font-semibold text-slate-900 dark:text-slate-100">SORM AI Consultant</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Room search • amenities • pricing • reviews</p>
            </div>
            <div className="mb-3 h-[342px] space-y-2 overflow-auto pr-1">
              {messages.map((message, index) => (
                <div
                  key={`${message.from}-${index}`}
                  className={`max-w-[92%] rounded-xl border px-3 py-2 text-sm ${
                    message.from === "user"
                      ? "ml-auto border-primary/40 bg-primary/10 text-slate-800 dark:text-slate-100"
                      : "border-slate-200/80 bg-white/80 text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
                  }`}
                >
                  <p>{message.text}</p>
                  {message.from === "bot" ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {extractMentionedRoomNumbers(message.text).map((roomNumber) => {
                        const roomId = roomNumberToIdMap.get(roomNumber);
                        if (!roomId) return null;
                        return (
                          <button
                            key={`${index}-${roomNumber}`}
                            className="rounded-lg border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary transition hover:bg-primary/20"
                            onClick={() => {
                              navigate(`/rooms/${roomId}`);
                              setOpen(false);
                            }}
                          >
                            Xem & đặt phòng {roomNumber}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && sendMessage()}
                placeholder="Ask AI..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white shadow-soft disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="grid h-14 w-14 place-items-center rounded-full bg-brand-gradient text-white shadow-lg"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
