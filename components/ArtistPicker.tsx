"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ArtistResult } from "@/lib/artists";

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function ArtistPicker({ value, onChange, required }: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<ArtistResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

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
    if (q.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (picked && value.trim().toLowerCase() === q.toLowerCase()) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/artists/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Artist search failed");
          setResults([]);
        } else {
          setResults(data.results ?? []);
          setOpen(true);
        }
      } catch {
        setError("Could not search artists. Check your connection.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, picked, value]);

  function choose(artist: ArtistResult) {
    setPicked(true);
    setQuery(artist.name);
    onChange(artist.name);
    setOpen(false);
    setResults([]);
  }

  return (
    <div className="form-control w-full" ref={wrapRef}>
      <div className="label py-1">
        <span className="label-text font-medium">
          Artist or band{required ? <span className="text-error"> *</span> : null}
        </span>
        <span className="badge badge-sm badge-outline">Apple Music</span>
      </div>
      <div className="relative">
        <input
          className="input input-bordered w-full pr-12"
          required={required}
          value={query}
          onChange={(e) => {
            setPicked(false);
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (results.length > 0 && !picked) setOpen(true);
          }}
          placeholder="Start typing a performer (e.g. The Weeknd)"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
        />
        {loading ? (
          <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2" />
        ) : (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg opacity-40" aria-hidden>
            ♪
          </span>
        )}

        {open && query.trim().length >= 2 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 w-full menu bg-base-100 border border-base-300 rounded-box shadow-lg max-h-80 overflow-auto p-1"
          >
            {results.length === 0 && !loading ? (
              <li className="disabled">
                <span className="text-sm opacity-70">
                  No matches found. You can still type the name yourself.
                </span>
              </li>
            ) : (
              results.map((artist) => (
                <li key={artist.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    className="text-left whitespace-normal gap-3"
                    onClick={() => choose(artist)}
                  >
                    {artist.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={artist.imageUrl}
                        alt=""
                        className="w-11 h-11 rounded-md object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-md bg-base-200 flex items-center justify-center text-sm opacity-50 shrink-0">
                        ♪
                      </div>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold block truncate">{artist.name}</span>
                      <span className="flex flex-wrap gap-1 mt-1">
                        <span className="badge badge-sm badge-outline">Apple Music</span>
                        {artist.genres[0] ? (
                          <span className="badge badge-sm badge-ghost">{artist.genres[0]}</span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      <div className="label py-1">
        <span className="label-text-alt opacity-60">
          Suggestions from Apple Music — click a result to fill the field, or type your own.
        </span>
      </div>
      {error ? <p className="text-error text-sm mt-1">{error}</p> : null}
    </div>
  );
}
