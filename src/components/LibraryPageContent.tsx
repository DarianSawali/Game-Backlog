"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import GameImage from "@/components/GameImage";
import { BACKLOG_STATUS_OPTIONS, type BacklogStatus, useUserGameData } from "@/lib/backlog";
import { getGameMetadataBatch } from "@/lib/game-metadata-client";
import { createLibrarySearchIndex } from "@/lib/library";
import type { SteamGame, SteamGameMetadata } from "@/lib/steam";

const PAGE_SIZE = 24;

export default function LibraryPageContent({ games }: { games: SteamGame[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BacklogStatus | "all" | "hidden">("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [metadataById, setMetadataById] = useState<Map<number, SteamGameMetadata | null>>(new Map());
  const [genreIndexState, setGenreIndexState] = useState<"loading" | "ready" | "error">("loading");
  const { getGameData, updateGameData } = useUserGameData();
  const deferredSearch = useDeferredValue(search);
  const searchIndex = useMemo(
    () => createLibrarySearchIndex(games, metadataById),
    [games, metadataById]
  );
  const activeGames = useMemo(
    () => games.filter((game) => !getGameData(game.appid).hidden),
    [games, getGameData]
  );
  const visibleGames = useMemo(() => {
    const query = deferredSearch.trim().normalize("NFKD").toLocaleLowerCase();
    return games.filter((game) => {
      const matchesSearch = !query || searchIndex.get(game.appid)?.includes(query);
      const data = getGameData(game.appid);
      const hidden = data.hidden;
      const matchesVisibility = filter === "hidden" ? hidden : !hidden;
      const matchesStatus = filter === "all" || filter === "hidden" || data.status === filter;
      return matchesSearch && matchesVisibility && matchesStatus;
    });
  }, [deferredSearch, filter, games, getGameData, searchIndex]);

  useEffect(() => {
    let cancelled = false;

    async function indexGenres() {
      try {
        const metadata = await getGameMetadataBatch(games.map((game) => game.appid));
        if (!cancelled) {
          setMetadataById(metadata);
          setGenreIndexState("ready");
        }
      } catch {
        if (!cancelled) setGenreIndexState("error");
      }
    }

    void indexGenres();
    return () => { cancelled = true; };
  }, [games]);

  function changeSearch(value: string) {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  }

  function changeFilter(value: BacklogStatus | "all" | "hidden") {
    setFilter(value);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <main className="min-h-screen bg-[#070806] px-5 py-6 text-[#f4f0e6] sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[1600px]"><AppHeader active="library"/></div>
      <div className="mx-auto max-w-7xl py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-[9px] uppercase tracking-[0.3em] text-[#e4c66a]">Your collection</p><h1 className="mt-2 font-serif text-4xl sm:text-5xl">Library</h1><p className="mt-2 text-sm text-white/40">Browse games and organize your backlog.</p></div>
          <div className="w-full sm:w-72"><input type="search" value={search} onChange={(event) => changeSearch(event.target.value)} placeholder="Search games, genres, or tags" className="w-full rounded-md border border-white/15 bg-[#11120f] px-4 py-3 text-sm outline-none transition duration-200 placeholder:text-white/25 hover:border-white/30 focus:border-[#e4c66a] focus:shadow-[0_0_0_3px_rgba(228,198,106,.1)]"/><p aria-live="polite" className="mt-2 text-right text-[9px] uppercase tracking-wider text-white/25">{genreIndexState === "loading" ? "Indexing genres and tags..." : genreIndexState === "error" ? "Name search available" : "Store search ready"}</p></div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto px-1 py-3">
          <button type="button" aria-pressed={filter === "all"} onClick={() => changeFilter("all")} className={filterClass(filter === "all")}>All {activeGames.length}</button>
          {BACKLOG_STATUS_OPTIONS.map((option) => <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={() => changeFilter(option.value)} className={filterClass(filter === option.value)}>{option.label} {activeGames.filter((game) => getGameData(game.appid).status === option.value).length}</button>)}
          <button type="button" aria-pressed={filter === "hidden"} onClick={() => changeFilter("hidden")} className={filterClass(filter === "hidden")}>Hidden {games.length - activeGames.length}</button>
        </div>

        <p className="mt-3 text-xs text-white/35">Showing {Math.min(visibleCount, visibleGames.length)} of {visibleGames.length} matching {visibleGames.length === 1 ? "game" : "games"}</p>
        {visibleGames.length ? (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleGames.slice(0, visibleCount).map((game) => (
                <article key={game.appid} className="group overflow-hidden rounded-lg border border-white/10 bg-[#11120f] shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-[#e4c66a]/45 hover:shadow-xl focus-within:border-[#e4c66a]/60">
                  <Link href={`/games/${game.appid}`} aria-label={`View details for ${game.name}`} className="block text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e4c66a]">
                    <GameImage appid={game.appid} name={game.name} iconHash={game.img_icon_url} className="transition duration-500 group-hover:brightness-110"/>
                    <div className="px-4 pt-4"><h2 className="truncate font-medium transition-colors group-hover:text-[#f7df95]">{game.name}</h2><p className="mt-1 text-xs text-white/35">{game.playtime_forever ? `${(game.playtime_forever / 60).toFixed(1)} hrs` : "Unplayed"}</p></div>
                  </Link>
                  <div className="flex items-stretch gap-2 p-4 pt-3">
                    <a href={`steam://run/${game.appid}`} className="inline-flex min-h-9 items-center justify-center rounded-md bg-[#e4c66a] px-3 py-2 text-[9px] font-bold uppercase leading-none tracking-wider text-black transition duration-200 hover:bg-[#f4dc8e] hover:shadow-[0_0_18px_rgba(228,198,106,.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c66a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#11120f] active:scale-95">Play</a>
                    <select aria-label={`${game.name} classification`} value={getGameData(game.appid).status ?? ""} onChange={(event) => updateGameData(game.appid, { status: event.target.value ? event.target.value as BacklogStatus : null })} className="min-h-9 min-w-0 flex-1 cursor-pointer rounded-md border border-white/15 bg-[#191a17] px-2 py-2 text-xs outline-none transition duration-200 hover:border-white/30 focus:border-[#e4c66a] focus:ring-2 focus:ring-[#e4c66a]/15"><option value="">No status</option>{BACKLOG_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                    <button type="button" onClick={() => updateGameData(game.appid, { hidden: filter !== "hidden" })} className="min-h-9 rounded-md border border-white/15 px-3 text-[9px] uppercase tracking-wider text-white/45 transition hover:border-[#e4c66a] hover:text-[#e4c66a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c66a] active:scale-95">{filter === "hidden" ? "Restore" : "Hide"}</button>
                  </div>
                </article>
              ))}
            </div>
            {visibleCount < visibleGames.length && <div className="mt-8 text-center"><button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="rounded-md border border-[#d8c79a]/30 bg-[#11120f] px-6 py-3 text-[10px] uppercase tracking-[0.18em] text-[#e4c66a] transition duration-200 hover:-translate-y-0.5 hover:border-[#e4c66a] hover:bg-[#e4c66a]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c66a] active:translate-y-0 active:scale-95">Load more</button></div>}
          </>
        ) : <div className="mt-8 rounded-lg border border-dashed border-white/15 p-10 text-center text-sm text-white/40">No games match your search and filters.</div>}
      </div>
    </main>
  );
}

function filterClass(active: boolean) {
  return `shrink-0 rounded-full border px-4 py-2 text-[9px] uppercase tracking-wider outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[#e4c66a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070806] active:scale-95 ${active ? "border-[#e4c66a] bg-[#e4c66a] text-black shadow-[0_0_18px_rgba(228,198,106,.14)]" : "border-white/15 text-white/45 hover:-translate-y-0.5 hover:border-[#d8c79a]/50 hover:bg-white/5 hover:text-white"}`;
}
