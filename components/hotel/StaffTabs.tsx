"use client";

import { useState } from "react";
import type { Rec } from "@/lib/types";

type Tab = "overview" | "performance" | "manage";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "performance", label: "Recommendation Performance" },
  { id: "manage", label: "Manage Recommendations" },
];

export interface RecPerformance {
  recId: string;
  name: string;
  likeCount: number;
  reservationClicks: number;
  uberClicks: number;
  directionsClicks: number;
  avgDwellSeconds: number;
}

export interface StaffTabsProps {
  hotelSlug: string;
  kpis: { pageViews: number; signups: number; totalLikes: number; recCount: number };
  performance: RecPerformance[];
  recs: Rec[];
  addRecAction: (formData: FormData) => void;
  updateRecAction: (recId: string, formData: FormData) => void;
  deleteRecAction: (recId: string) => void;
  uploadPhotosAction: (recId: string, formData: FormData) => void;
  deletePhotoAction: (recId: string, photoUrl: string) => void;
}

export function StaffTabs({
  hotelSlug,
  kpis,
  performance,
  recs,
  addRecAction,
  updateRecAction,
  deleteRecAction,
  uploadPhotosAction,
  deletePhotoAction,
}: StaffTabsProps) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-zinc-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap ${
              tab === t.id
                ? "border-[var(--tuka-ink)] text-[var(--tuka-ink)]"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <section>
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Overall metrics across all recommendations
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi value={kpis.pageViews} label="Page views" />
            <Kpi value={kpis.signups} label="Sign-ups" />
            <Kpi value={kpis.totalLikes} label="Total likes" />
            <Kpi value={kpis.recCount} label="Recommendations" />
          </div>
        </section>
      )}

      {tab === "performance" && (
        <section>
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Performance by recommendation
          </h2>
          <div className="flex flex-col gap-2">
            {performance.length === 0 && <p className="text-sm text-zinc-500">No recommendations yet.</p>}
            {performance.map((r) => (
              <div key={r.recId} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                <span className="font-medium text-zinc-800">{r.name}</span>
                <span className="text-right text-xs text-zinc-500">
                  {r.likeCount} likes · {r.reservationClicks} reservation clicks · {r.uberClicks} Uber clicks · {r.directionsClicks} directions
                  {r.avgDwellSeconds > 0 && <> · avg {r.avgDwellSeconds}s on page</>}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "manage" && (
        <ManageTab
          hotelSlug={hotelSlug}
          recs={recs}
          addRecAction={addRecAction}
          updateRecAction={updateRecAction}
          deleteRecAction={deleteRecAction}
          uploadPhotosAction={uploadPhotosAction}
          deletePhotoAction={deletePhotoAction}
        />
      )}
    </div>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function Kpi({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <div className="text-2xl font-bold text-[var(--tuka-ink)]">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

function ManageTab({
  recs,
  addRecAction,
  updateRecAction,
  deleteRecAction,
  uploadPhotosAction,
  deletePhotoAction,
}: Pick<
  StaffTabsProps,
  "hotelSlug" | "recs" | "addRecAction" | "updateRecAction" | "deleteRecAction" | "uploadPhotosAction" | "deletePhotoAction"
>) {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase">Create a recommendation</h2>
        <form action={addRecAction} className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2">
          <input name="name" placeholder="Name" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="category" placeholder="Category (e.g. dining)" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="address" placeholder="Address" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
          <input name="lat" type="number" step="any" placeholder="Latitude" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="lng" type="number" step="any" placeholder="Longitude" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <textarea name="shortDescription" placeholder="Short description" required rows={2} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
          <input name="priceLevel" placeholder="Price level (e.g. $$)" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="tags" placeholder="Tags, comma separated" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="bookingLink" placeholder="Booking link (optional)" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
          <input name="hours" placeholder="Hours (e.g. Daily 9am-5pm) -- only shown for non-reservable categories" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
          <button type="submit" className="w-fit rounded-full bg-[var(--tuka-ink)] px-6 py-2.5 text-sm font-semibold text-white sm:col-span-2">
            Add recommendation
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase">All recommendations</h2>
        <div className="flex flex-col gap-3">
          {recs.map((rec) => (
            <details key={rec.id} className="rounded-xl border border-zinc-200 p-3">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-zinc-800">
                <span>
                  {rec.name} <span className="text-zinc-400">({rec.category})</span>
                </span>
                <form action={deleteRecAction.bind(null, rec.id)}>
                  <button type="submit" className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700">
                    Delete
                  </button>
                </form>
              </summary>
              <form action={updateRecAction.bind(null, rec.id)} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input name="name" defaultValue={rec.name} placeholder="Name" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                <input name="category" defaultValue={rec.category} placeholder="Category" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                <input name="address" defaultValue={rec.address} placeholder="Address" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
                <input name="lat" type="number" step="any" defaultValue={rec.coordinates.lat} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                <input name="lng" type="number" step="any" defaultValue={rec.coordinates.lng} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                <textarea name="shortDescription" defaultValue={rec.shortDescription} rows={2} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
                <input name="priceLevel" defaultValue={rec.priceLevel} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                <input name="tags" defaultValue={rec.tags.join(", ")} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                <input name="bookingLink" defaultValue={rec.bookingLink ?? ""} placeholder="Booking link" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
                <input name="hours" defaultValue={rec.hours ?? ""} placeholder="Hours (e.g. Daily 9am-5pm)" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
                <button type="submit" className="w-fit rounded-full bg-[var(--tuka-ink)] px-5 py-2 text-sm font-semibold text-white sm:col-span-2">
                  Save changes
                </button>
              </form>

              <details className="mt-3 rounded-lg border border-zinc-200 p-2">
                <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-zinc-600">
                  <EditIcon />
                  Photos ({rec.photoUrls.length})
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  {rec.photoUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {rec.photoUrls.map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <div key={url} className="group relative overflow-hidden rounded-lg border border-zinc-200">
                          <img src={url} alt="" className="h-20 w-full object-cover" />
                          <form action={deletePhotoAction.bind(null, rec.id, url)}>
                            <button
                              type="submit"
                              aria-label="Remove photo"
                              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                            >
                              ×
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}
                  <form action={uploadPhotosAction.bind(null, rec.id)} className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      name="photos"
                      accept="image/*"
                      multiple
                      required
                      className="text-xs text-zinc-600 file:mr-2 file:rounded-full file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                    />
                    <button type="submit" className="rounded-full bg-[var(--tuka-ink)] px-4 py-1.5 text-xs font-semibold text-white">
                      Upload
                    </button>
                  </form>
                  <p className="text-[10px] text-zinc-400">
                    Uploaded photos always take priority over automatic Google Places photos.
                  </p>
                </div>
              </details>
            </details>
          ))}
          {recs.length === 0 && <p className="text-sm text-zinc-500">No recommendations yet.</p>}
        </div>
      </section>
    </div>
  );
}
