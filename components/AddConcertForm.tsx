"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COST_FIELDS } from "@/lib/types";
import { formatMoney, totalCost, toNumber } from "@/lib/metrics";
import { VenueMapPicker } from "@/components/VenueMapPicker";
import { ArtistPicker } from "@/components/ArtistPicker";
import { TicketLinkImporter } from "@/components/TicketLinkImporter";
import {
  ConcertPhotoPicker,
  safePhotoFileName,
} from "@/components/ConcertPhotoPicker";

const emptyForm = {
  artist: "",
  venue: "",
  city: "",
  state: "",
  concert_date: "",
  distance_from_home: "0",
  hours_at_event: "3",
  ticket_cost: "0",
  ticket_fees: "0",
  tax_cost: "0",
  delivery_cost: "0",
  parking_cost: "0",
  food_drink_cost: "0",
  merchandise_cost: "0",
  lodging_cost: "0",
  travel_cost: "0",
  other_cost: "0",
  fun_rating: "7",
  notes: "",
};

export function AddConcertForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [venuePickerKey, setVenuePickerKey] = useState(0);
  const [artistPickerKey, setArtistPickerKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const liveTotal = useMemo(() => {
    const costShape = Object.fromEntries(
      COST_FIELDS.map((f) => [f.key, toNumber(form[f.key])])
    ) as Record<(typeof COST_FIELDS)[number]["key"], number>;
    return totalCost(costShape);
  }, [form]);

  function setField(key: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    if (!form.artist.trim()) {
      setSaving(false);
      setError("Please choose an artist or band.");
      return;
    }

    if (!form.venue.trim() || !form.city.trim() || !form.state.trim()) {
      setSaving(false);
      setError("Please search and pick a venue from the map so city and state are filled in.");
      return;
    }

    const artist = form.artist.trim();
    const supabase = createClient();

    let photo_url: string | null = null;
    if (photoFile) {
      const path = `${userId}/${Date.now()}-${safePhotoFileName(photoFile.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("concert-photos")
        .upload(path, photoFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: photoFile.type,
        });

      if (uploadError) {
        setSaving(false);
        setError(`Photo upload failed: ${uploadError.message}`);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("concert-photos")
        .getPublicUrl(path);
      photo_url = publicData.publicUrl;
    }

    const payload = {
      user_id: userId,
      // Kept for the database; the form no longer asks for a separate concert name.
      concert_name: artist,
      artist,
      venue: form.venue.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      concert_date: form.concert_date,
      distance_from_home: toNumber(form.distance_from_home),
      hours_at_event: toNumber(form.hours_at_event),
      ticket_cost: toNumber(form.ticket_cost),
      ticket_fees: toNumber(form.ticket_fees),
      tax_cost: toNumber(form.tax_cost),
      delivery_cost: toNumber(form.delivery_cost),
      parking_cost: toNumber(form.parking_cost),
      food_drink_cost: toNumber(form.food_drink_cost),
      merchandise_cost: toNumber(form.merchandise_cost),
      lodging_cost: toNumber(form.lodging_cost),
      travel_cost: toNumber(form.travel_cost),
      other_cost: toNumber(form.other_cost),
      fun_rating: Math.min(10, Math.max(1, Math.round(toNumber(form.fun_rating)))),
      notes: form.notes.trim() || null,
      photo_url,
    };

    const { error: insertError } = await supabase.from("concerts").insert(payload);

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccess(true);
    setForm(emptyForm);
    setPhotoFile(null);
    setVenuePickerKey((k) => k + 1);
    setArtistPickerKey((k) => k + 1);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {success && (
        <div className="alert alert-success">
          <span>Concert saved! Add another, or check My Concerts and the Dashboard.</span>
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <section className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body gap-4">
          <h2 className="card-title text-lg">Concert details</h2>
          <p className="text-sm opacity-70 -mt-2">Who played, where you were, and when.</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ArtistPicker
                key={artistPickerKey}
                required
                value={form.artist}
                onChange={(artist) => setField("artist", artist)}
              />
            </div>

            <VenueMapPicker
              key={venuePickerKey}
              venue={form.venue}
              city={form.city}
              state={form.state}
              onSelect={({ venue, city, state }) => {
                setForm((prev) => ({ ...prev, venue, city, state }));
                setSuccess(false);
                setError(null);
              }}
              onClear={() => {
                setForm((prev) => ({ ...prev, venue: "", city: "", state: "" }));
              }}
            />

            <Field label="Concert date" required>
              <input
                type="date"
                className="input input-bordered w-full"
                required
                value={form.concert_date}
                onChange={(e) => setField("concert_date", e.target.value)}
              />
            </Field>
            <Field label="Distance from home (miles)" hint="Rough estimate is fine.">
              <input
                type="number"
                min="0"
                step="0.1"
                className="input input-bordered w-full"
                value={form.distance_from_home}
                onChange={(e) => setField("distance_from_home", e.target.value)}
              />
            </Field>
            <Field label="Hours at the event" hint="Used for cost per hour.">
              <input
                type="number"
                min="0.1"
                step="0.1"
                className="input input-bordered w-full"
                required
                value={form.hours_at_event}
                onChange={(e) => setField("hours_at_event", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Notes" hint="Optional — parking tips, setlist favorites, etc.">
            <textarea
              className="textarea textarea-bordered w-full min-h-24"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Great opener, long merch line..."
            />
          </Field>

          <ConcertPhotoPicker file={photoFile} onChange={setPhotoFile} />
        </div>
      </section>

      <section className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body gap-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="card-title text-lg">Costs</h2>
              <p className="text-sm opacity-70">
                Paste a ticket link to auto-fill prices, or enter dollars by hand.
              </p>
            </div>
            <div className="stat bg-primary/10 rounded-box px-4 py-2">
              <div className="stat-title text-xs">Running total</div>
              <div className="stat-value text-2xl text-primary">{formatMoney(liveTotal)}</div>
            </div>
          </div>

          <TicketLinkImporter
            onApply={(costs) => {
              setForm((prev) => ({
                ...prev,
                ticket_cost: costs.ticket_cost,
                ticket_fees: costs.ticket_fees,
                tax_cost: costs.tax_cost,
                delivery_cost: costs.delivery_cost,
              }));
              setSuccess(false);
              setError(null);
            }}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {COST_FIELDS.map((field) => (
              <Field key={field.key} label={field.label}>
                <label className="input input-bordered flex items-center gap-2">
                  <span className="opacity-60">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="grow"
                    value={form[field.key]}
                    onChange={(e) => setField(field.key, e.target.value)}
                  />
                </label>
              </Field>
            ))}
          </div>
        </div>
      </section>

      <section className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body gap-4">
          <h2 className="card-title text-lg">Fun rating</h2>
          <p className="text-sm opacity-70 -mt-2">
            1 = Terrible Time · 10 = Best Time Ever
          </p>
          <div className="flex flex-col gap-2">
            <input
              type="range"
              min="1"
              max="10"
              className="range range-primary"
              value={form.fun_rating}
              onChange={(e) => setField("fun_rating", e.target.value)}
            />
            <div className="flex justify-between text-xs opacity-60 px-1">
              <span>1 Terrible</span>
              <span className="font-semibold text-base text-primary opacity-100">
                {form.fun_rating} / 10
              </span>
              <span>10 Best Ever</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <span className="loading loading-spinner" /> : null}
          {saving ? "Saving..." : "Save concert"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setForm(emptyForm);
            setPhotoFile(null);
            setVenuePickerKey((k) => k + 1);
            setArtistPickerKey((k) => k + 1);
            setError(null);
            setSuccess(false);
          }}
        >
          Clear form
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="form-control w-full">
      <div className="label py-1">
        <span className="label-text font-medium">
          {label}
          {required ? <span className="text-error"> *</span> : null}
        </span>
      </div>
      {children}
      {hint ? (
        <div className="label py-1">
          <span className="label-text-alt opacity-60">{hint}</span>
        </div>
      ) : null}
    </label>
  );
}
