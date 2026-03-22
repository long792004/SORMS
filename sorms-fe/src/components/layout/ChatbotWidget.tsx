import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";
import { chatbotApi } from "@/api/chatbotApi";

interface ChatMessage {
  from: "user" | "bot";
  text: string;
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "bot", text: "Xin chào! Mình là AI consultant của SORM. Bạn cần tìm phòng như thế nào?" }
  ]);

  const sessionId = useMemo(() => `chat-${Date.now()}`, []);

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
            className="glass-card mb-3 h-[460px] w-[340px] rounded-2xl p-3"
          >
            <div className="mb-3 border-b border-white/10 pb-2">
              <p className="font-semibold">SORM AI Consultant</p>
              <p className="text-xs text-slate-400">Room search • amenities • pricing • reviews</p>
            </div>
            <div className="mb-3 h-[330px] space-y-2 overflow-auto pr-1">
              {messages.map((message, index) => (
                <div
                  key={`${message.from}-${index}`}
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                    message.from === "user" ? "ml-auto bg-primary/30" : "bg-white/10"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && sendMessage()}
                placeholder="Ask AI..."
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none placeholder:text-slate-400"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white disabled:opacity-60"
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
