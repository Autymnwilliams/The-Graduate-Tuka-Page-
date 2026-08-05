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

  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffPhone, setHandoffPhone] = useState("");
  const [handoffStatus, setHandoffStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const genericGreeting = `Hi! I'm the digital concierge for ${hotel.name}. I can help you book a table or appointment at one of our recommended spots — want me to help you book somewhere, or is there something else I can help with?`;

  async function fetchGreeting(): Promise<string> {
    try {
      const res = await fetch(`/api/chat/greeting?hotelSlug=${encodeURIComponent(hotel.slug)}`);
      if (res.ok) {
        const data = (await res.json()) as { kind: "liked" | "returning" | "none"; recNames?: string[]; name?: string | null };
        if (data.kind === "liked" && data.recNames?.[0]) {
          return `I see you liked ${data.recNames[0]} — want me to book something there, or suggest similar spots?`;
        }
        // "returning" (welcome-back greeting) intentionally disabled for now
        // (tasks.md) -- falls through to the time-of-day/generic greeting
        // below. The /api/chat/greeting endpoint still computes and returns
        // it, this just doesn't act on it.
      }
    } catch {
      // Fall through to the time-of-day / generic greeting below.
    }

    // Guest's own device clock -- their actual local time, more correct here than guessing the hotel's timezone server-side.
    const hour = new Date().getHours();
    if (hour >= 17 && hour <= 22) {
      return "Looking for dinner spots tonight? I can help you book something.";
    }
    return genericGreeting;
  }

  async function openChat() {
    setOpen((v) => !v);
    if (messages.length === 0) {
      const text = await fetchGreeting();
      setMessages([{ role: "bot", text }]);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelSlug: hotel.slug,
          message: text,
          history: history.map(({ role, text }) => ({ role, text })),
        }),
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

  async function sendHandoff() {
    const phone = handoffPhone.trim();
    if (!phone || handoffStatus === "sending") return;
    setHandoffStatus("sending");
    try {
      const res = await fetch("/api/chat/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelSlug: hotel.slug, phone }),
      });
      setHandoffStatus(res.ok ? "sent" : "error");
    } catch {
      setHandoffStatus("error");
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end">
      {open && (
        <div className="mb-2 flex max-h-[70dvh] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
          <div className="flex items-center gap-2 bg-[var(--tuka-ink)] px-4 py-3 text-sm font-semibold text-white">
            <img src="/tuka-logo.png" alt="" className="h-5 w-5 rounded-full" />
            Ask your digital concierge
          </div>

          <div className="flex-1 overflow-y-auto p-3">
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

          <div className="border-t border-zinc-200 p-2">
            {!handoffOpen ? (
              <button
                type="button"
                onClick={() => setHandoffOpen(true)}
                className="w-full px-1 pb-2 text-left text-xs text-zinc-500 hover:text-[var(--tuka-ink)] hover:underline"
              >
                Prefer texting? Continue this chat by SMS →
              </button>
            ) : handoffStatus === "sent" ? (
              <p className="px-1 pb-2 text-xs text-emerald-700">
                Sent! Keep chatting here, or watch your texts — either works.
              </p>
            ) : (
              <div className="flex gap-2 pb-2">
                <input
                  value={handoffPhone}
                  onChange={(e) => setHandoffPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendHandoff()}
                  type="tel"
                  placeholder="Your phone number"
                  // text-base (16px), not text-xs -- anything under 16px makes iOS Safari auto-zoom in on focus, which is what was breaking the page alignment/zoom on mobile.
                  className="flex-1 rounded-full border border-zinc-300 px-3 py-1.5 text-base outline-none focus:border-[var(--tuka-ink)]"
                />
                <button
                  type="button"
                  onClick={sendHandoff}
                  disabled={handoffStatus === "sending"}
                  className="rounded-full bg-[var(--tuka-gold)] px-3 py-1.5 text-xs font-semibold text-[var(--tuka-ink)] disabled:opacity-60"
                >
                  {handoffStatus === "sending" ? "…" : "Text me"}
                </button>
              </div>
            )}
            {handoffStatus === "error" && (
              <p className="px-1 pb-1 text-xs text-red-600">Couldn&apos;t send that — try again.</p>
            )}

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about places to go…"
                // text-base (16px), not text-sm -- same iOS auto-zoom fix as the phone input above.
                className="flex-1 rounded-full border border-zinc-300 px-3 py-2 text-base outline-none focus:border-[var(--tuka-ink)]"
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
        </div>
      )}
      <button
        type="button"
        onClick={openChat}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--tuka-ink)] shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
        aria-label="Chat with your digital concierge"
      >
        <img src="/tuka-logo.png" alt="" className="h-9 w-9 rounded-full" />
      </button>
    </div>
  );
}
