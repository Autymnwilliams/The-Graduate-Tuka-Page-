"use client";

import { useState } from "react";
import type { DayAvailability } from "@/lib/availability";
import { track } from "@/lib/analytics-client";

export interface AvailabilityCalendarProps {
  hotelSlug: string;
  recId: string;
  days: DayAvailability[];
  bookingLink?: string;
}

export function AvailabilityCalendar({ hotelSlug, recId, days, bookingLink }: AvailabilityCalendarProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selectedDay = days[selectedIdx];

  function trackSlotClick(time: string) {
    track("reservation_link_clicked", hotelSlug, { recId, requestedTime: time });
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Availability, next 2 weeks</h2>
        <span className="text-[10px] text-zinc-400">
          {selectedDay?.source === "real" ? "Live from Resy" : "Estimated"} — tap a time to check &amp; book
        </span>
      </div>

      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
        {days.map((day, i) => {
          const openCount = day.slots.filter((s) => s.available).length;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedIdx(i)}
              className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-xs ${
                i === selectedIdx
                  ? "border-[var(--tuka-ink)] bg-[var(--tuka-ink)] text-white"
                  : "border-zinc-200 bg-white text-zinc-700"
              }`}
            >
              <span className="font-semibold whitespace-nowrap">{day.label}</span>
              <span className={i === selectedIdx ? "text-white/70" : "text-zinc-400"}>
                {openCount > 0 ? `${openCount} open` : "booked"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {selectedDay?.slots.map((slot) => {
          if (!slot.available) {
            return (
              <button
                key={slot.time}
                type="button"
                disabled
                className="cursor-not-allowed rounded-lg bg-red-50 px-2 py-2 text-xs font-semibold text-red-300"
              >
                {slot.time}
              </button>
            );
          }

          const slotClassName = "rounded-lg bg-emerald-100 px-2 py-2 text-center text-xs font-semibold text-emerald-800 hover:bg-emerald-200";

          if (bookingLink) {
            return (
              <a
                key={slot.time}
                href={bookingLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSlotClick(slot.time)}
                className={slotClassName}
              >
                {slot.time}
              </a>
            );
          }

          return (
            <button key={slot.time} type="button" onClick={() => trackSlotClick(slot.time)} className={slotClassName}>
              {slot.time}
            </button>
          );
        })}
      </div>
    </div>
  );
}
