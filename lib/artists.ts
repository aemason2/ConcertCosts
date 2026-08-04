export type ArtistSource = "apple";

export type ArtistResult = {
  id: string;
  name: string;
  sources: ArtistSource[];
  genres: string[];
  imageUrl?: string;
  appleUrl?: string;
};

export function normalizeArtistName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Prefer names that start with / closely match the typed query. */
export function rankArtists(artists: ArtistResult[], query: string): ArtistResult[] {
  const q = normalizeArtistName(query);
  return [...artists].sort((a, b) => {
    const an = normalizeArtistName(a.name);
    const bn = normalizeArtistName(b.name);
    const score = (n: string) => {
      let s = 0;
      if (n === q) s += 100;
      else if (n.startsWith(q)) s += 60;
      else if (n.includes(q)) s += 30;
      return s;
    };
    return score(bn) - score(an);
  });
}
