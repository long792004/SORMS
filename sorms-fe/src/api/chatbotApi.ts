import { api } from "@/api/axios";

export const chatbotApi = {
  ask: (payload: { sessionId?: string; message: string }) => api.post("/Chatbot/ask", payload)
};
