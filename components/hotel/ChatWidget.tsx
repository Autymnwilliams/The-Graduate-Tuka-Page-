"use client";

import { useState } from "react";
import type { PublicHotel } from "@/lib/types";
import { track } from "@/lib/analytics-client";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
  recommendedIds?: string[];
}

export function ChatWidget({ hotel }: { hotel: PublicHotel }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelSlug: hotel.slug, message: text }),
      });
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "bot", text: "Sorry, I couldn't respond just now." }]);
        return;
      }
      const data = (await res.json()) as { reply: string; recommendedIds: string[] };
      setMessages((prev) => [...prev, { role: "bot", text: data.reply, recommendedIds: data.recommendedIds }]);
      track("chat_message", hotel.slug, { recommendedCount: data.recommendedIds.length });
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "Sorry, I couldn't respond just now." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end">
      {open && (
        <div className="mb-2 flex max-h-[60vh] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
          <div className="bg-[var(--tuka-ink)] px-4 py-3 text-sm font-semibold text-white">
            💬 Ask your digital concierge
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {messages.length === 0 && (
              <p className="text-sm text-zinc-400">Ask about places to go near {hotel.name}…</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`mb-2 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-[var(--tuka-gold)] text-[var(--tuka-ink)]"
                      : "bg-zinc-100 text-zinc-800"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-zinc-200 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about places to go…"
              className="flex-1 rounded-full border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[var(--tuka-ink)]"
            />
            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="rounded-full bg-[var(--tuka-ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--tuka-ink)] text-2xl text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
        aria-label="Chat with your digital concierge"
      >
        💬
      </button>
    </div>
  );
}
