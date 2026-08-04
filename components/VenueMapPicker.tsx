"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { PlaceResult } from "@/lib/places";

const VenueMap = dynamic(() => import("@/components/VenueMap"), {
  ssr: false,
  loading: () => (
    <div className="h-56 w-full rounded-box bg-base-200 flex items-center justify-center text-sm opacity-60">
      Loading map…
    </div>
  ),
});

type Props = {
  venue: string;
  city: string;
  state: string;
  onSelect: (place: { venue: string; city: string; state: string }) => void;
  onClear: () => void;
};

export function VenueMapPicker({ venue, city, state, onSelect, onClear }: Props) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearchError(null);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!res.ok) {
          setSearchError(data.error || "Search failed");
          setResults([]);
        } else {
          setResults(data.results ?? []);
          setOpen(true);
        }
      } catch {
        setSearchError("Could not search venues. Check your connection.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const mapPlace = useMemo(() => {
    if (selected) return selected;
    return null;
  }, [selected]);

  function choose(place: PlaceResult) {
    setSelected(place);
    setQuery(place.name);
    setOpen(false);
    onSelect({
      venue: place.name,
      city: place.city,
      state: place.state,
    });
  }

  function clearSelection() {
    setSelected(null);
    setQuery("");
    setResults([]);
    onClear();
  }

  const hasSelection = Boolean(venue && city && state);

  return (
    <div className="space-y-3 sm:col-span-2" ref={wrapRef}>
      <div className="form-control w-full">
        <div className="label py-1">
          <span className="label-text font-medium">
            Find venue on map <span className="text-error">*</span>
          </span>
        </div>
        <div className="relative">
          <input
            className="input input-bordered w-full pr-24"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Start typing a venue (e.g. Madison Square Garden)"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {loading ? <span className="loading loading-spinner loading-sm" /> : null}
            {(query || hasSelection) && (
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={clearSelection}
              >
                Clear
              </button>
            )}
          </div>

          {open && results.length > 0 && (
            <ul
              id={listId}
              role="listbox"
              className="absolute z-30 mt-1 w-full menu bg-base-100 border border-base-300 rounded-box shadow-lg max-h-64 overflow-auto p-1"
            >
              {results.map((place) => (
                <li key={place.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    className="text-left whitespace-normal"
                    onClick={() => choose(place)}
                  >
                    <span className="font-medium block">{place.name}</span>
                    <span className="text-xs opacity-60 block">{place.displayName}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="label py-1">
          <span className="label-text-alt opacity-60">
            Pick a result so venue, city, and state stay in sync.
          </span>
        </div>
        {searchError ? (
          <p className="text-error text-sm mt-1">{searchError}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ReadOnlyField label="Venue" value={venue} placeholder="Choose from search" />
        <ReadOnlyField label="City" value={city} placeholder="Auto-filled" />
        <ReadOnlyField label="State" value={state} placeholder="Auto-filled" />
      </div>

      {/* Hidden required inputs so native form validation still works */}
      <input type="hidden" name="venue" value={venue} required />
      <input type="hidden" name="city" value={city} required />
      <input type="hidden" name="state" value={state} required />

      <div className="rounded-box overflow-hidden border border-base-300">
        <VenueMap place={mapPlace} />
      </div>
      {!hasSelection ? (
        <p className="text-sm opacity-70">
          Search and select a venue above — the map will pin the location and fill city/state.
        </p>
      ) : null}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder: string;
}) {
  return (
    <label className="form-control w-full">
      <div className="label py-1">
        <span className="label-text font-medium">{label}</span>
      </div>
      <input
        className="input input-bordered w-full bg-base-200"
        value={value}
        placeholder={placeholder}
        readOnly
        tabIndex={-1}
      />
    </label>
  );
}
