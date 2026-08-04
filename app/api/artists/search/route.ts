import { NextRequest, NextResponse } from "next/server";
import {
  type ArtistResult,
  normalizeArtistName,
  rankArtists,
} from "@/lib/artists";

type ItunesArtist = {
  artistId: number;
  artistName: string;
  primaryGenreName?: string;
  artistLinkUrl?: string;
};

type ItunesSong = {
  artistId?: number;
  artistName: string;
  artworkUrl100?: string;
  primaryGenreName?: string;
};

async function searchAppleMusic(query: string): Promise<ArtistResult[]> {
  const artistUrl = new URL("https://itunes.apple.com/search");
  artistUrl.searchParams.set("term", query);
  artistUrl.searchParams.set("entity", "musicArtist");
  artistUrl.searchParams.set("attribute", "artistTerm");
  artistUrl.searchParams.set("limit", "10");
  artistUrl.searchParams.set("media", "music");

  const songUrl = new URL("https://itunes.apple.com/search");
  songUrl.searchParams.set("term", query);
  songUrl.searchParams.set("entity", "song");
  songUrl.searchParams.set("limit", "20");
  songUrl.searchParams.set("media", "music");

  const [artistRes, songRes] = await Promise.all([
    fetch(artistUrl.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    }),
    fetch(songUrl.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    }),
  ]);

  const artworkByArtist = new Map<string, string>();
  const genreByArtist = new Map<string, string>();
  let songs: ItunesSong[] = [];

  if (songRes.ok) {
    const songData = (await songRes.json()) as { results?: ItunesSong[] };
    songs = songData.results ?? [];
    for (const song of songs) {
      const key = normalizeArtistName(song.artistName);
      if (song.artworkUrl100 && !artworkByArtist.has(key)) {
        artworkByArtist.set(
          key,
          song.artworkUrl100.replace("100x100bb", "200x200bb")
        );
      }
      if (song.primaryGenreName && !genreByArtist.has(key)) {
        genreByArtist.set(key, song.primaryGenreName);
      }
    }
  }

  const artists: ArtistResult[] = [];
  const seen = new Set<string>();

  if (artistRes.ok) {
    const data = (await artistRes.json()) as { results?: ItunesArtist[] };
    for (const item of data.results ?? []) {
      const key = normalizeArtistName(item.artistName);
      if (seen.has(key)) continue;
      seen.add(key);
      artists.push({
        id: `apple-${item.artistId}`,
        name: item.artistName,
        sources: ["apple"],
        genres: item.primaryGenreName
          ? [item.primaryGenreName]
          : genreByArtist.get(key)
            ? [genreByArtist.get(key)!]
            : [],
        imageUrl: artworkByArtist.get(key),
        appleUrl:
          item.artistLinkUrl ||
          `https://music.apple.com/us/search?term=${encodeURIComponent(item.artistName)}`,
      });
    }
  }

  for (const song of songs) {
    const key = normalizeArtistName(song.artistName);
    if (seen.has(key)) continue;
    seen.add(key);
    artists.push({
      id: `apple-song-${song.artistId ?? key}`,
      name: song.artistName,
      sources: ["apple"],
      genres: song.primaryGenreName ? [song.primaryGenreName] : [],
      imageUrl: artworkByArtist.get(key),
      appleUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(song.artistName)}`,
    });
  }

  return artists;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] as ArtistResult[] });
  }

  try {
    const apple = await searchAppleMusic(q);
    const results = rankArtists(apple, q).slice(0, 12);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Apple Music search failed", err);
    return NextResponse.json(
      { error: "Artist search is temporarily unavailable. Try again in a moment." },
      { status: 502 }
    );
  }
}
