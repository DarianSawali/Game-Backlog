"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import GameImage from "@/components/GameImage";
import { BACKLOG_STATUS_OPTIONS, type BacklogStatus, useBacklogStatuses } from "@/lib/backlog";
import type { SteamGame } from "@/lib/steam";

const PAGE_SIZE = 24;

export default function LibraryPageContent({ games }: { games: SteamGame[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BacklogStatus | "all">("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { statuses, setStatus } = useBacklogStatuses();
  const visibleGames = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return games.filter((game) => {
      const matchesSearch = !query || game.name.toLocaleLowerCase().includes(query);
      const matchesStatus = filter === "all" || statuses[String(game.appid)] === filter;
      return matchesSearch && matchesStatus;
    });
  }, [filter, games, search, statuses]);

  function changeSearch(value: string) {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  }

  function changeFilter(value: BacklogStatus | "all") {
    setFilter(value);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <main className="min-h-screen bg-[#070806] px-5 py-6 text-[#f4f0e6] sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[1600px]"><AppHeader active="library"/></div>
      <div className="mx-auto max-w-7xl py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-[9px] uppercase tracking-[0.3em] text-[#e4c66a]">Your collection</p><h1 className="mt-2 font-serif text-4xl sm:text-5xl">Library</h1><p className="mt-2 text-sm text-white/40">Browse games and organize your backlog.</p></div>
          <input type="search" value={search} onChange={(event) => changeSearch(event.target.value)} placeholder="Search games" className="w-full rounded-md border border-white/15 bg-[#11120f] px-4 py-3 text-sm outline-none transition duration-200 placeholder:text-white/25 hover:border-white/30 focus:border-[#e4c66a] focus:shadow-[0_0_0_3px_rgba(228,198,106,.1)] sm:w-72"/>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto px-1 py-3">
          <button type="button" aria-pressed={filter === "all"} onClick={() => changeFilter("all")} className={filterClass(filter === "all")}>All {games.length}</button>
          {BACKLOG_STATUS_OPTIONS.map((option) => <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={() => changeFilter(option.value)} className={filterClass(filter === option.value)}>{option.label} {games.filter((game) => statuses[String(game.appid)] === option.value).length}</button>)}
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
                    <select aria-label={`${game.name} classification`} value={statuses[String(game.appid)] ?? ""} onChange={(event) => setStatus(game.appid, event.target.value ? event.target.value as BacklogStatus : null)} className="min-h-9 min-w-0 flex-1 cursor-pointer rounded-md border border-white/15 bg-[#191a17] px-2 py-2 text-xs outline-none transition duration-200 hover:border-white/30 focus:border-[#e4c66a] focus:ring-2 focus:ring-[#e4c66a]/15"><option value="">No status</option>{BACKLOG_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
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
