"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import {
  BACKLOG_STATUS_OPTIONS,
  useGenrePreferences,
  useUserGameData,
} from "@/lib/backlog";
import { getGameMetadataBatch } from "@/lib/game-metadata-client";
import { getStoreLabels } from "@/lib/library";
import type { SteamGame, SteamGameMetadata } from "@/lib/steam";

export default function ProfilePageContent({ games }: { games: SteamGame[] }) {
  const { getGameData, updateGameData } = useUserGameData();
  const { preferredGenres, toggleGenre } = useGenrePreferences();
  const [metadataById, setMetadataById] = useState<Map<number, SteamGameMetadata | null>>(new Map());
  const [genreState, setGenreState] = useState<"loading" | "ready" | "error">("loading");
  const storeGenres = useMemo(() => getStoreLabels(metadataById), [metadataById]);
  const genreOptions = useMemo(
    () => [...new Set([...storeGenres, ...preferredGenres])].sort((left, right) => left.localeCompare(right)),
    [preferredGenres, storeGenres]
  );
  const tracked = games.filter((game) => getGameData(game.appid).status);
  const hiddenLibrary = games.filter((game) => getGameData(game.appid).hidden);
  const completed = games.filter((game) => getGameData(game.appid).status === "completed").length;
  const completion = tracked.length ? Math.round((completed / tracked.length) * 100) : 0;
  const hours = Math.round(games.reduce((total, game) => total + game.playtime_forever, 0) / 60);

  useEffect(() => {
    let cancelled = false;

    async function loadStoreGenres() {
      try {
        const metadata = await getGameMetadataBatch(games.map((game) => game.appid));
        if (!cancelled) {
          setMetadataById(metadata);
          setGenreState("ready");
        }
      } catch {
        if (!cancelled) setGenreState("error");
      }
    }

    void loadStoreGenres();
    return () => { cancelled = true; };
  }, [games]);

  return (
    <main className="min-h-screen bg-[#070806] px-5 py-6 text-[#f4f0e6] sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[1600px]"><AppHeader active="profile"/></div>
      <div className="mx-auto max-w-6xl py-14">
        <p className="text-[9px] uppercase tracking-[0.35em] text-[#e4c66a]">Profile</p>
        <h1 className="mt-4 font-serif text-5xl sm:text-6xl">Darian&apos;s Chronicle</h1>
        <div className="mt-10 grid grid-cols-2 gap-px bg-[#d8c79a]/15 lg:grid-cols-4">
          {[[games.length, "Games owned"], [tracked.length, "Tracked"], [completed, "Completed"], [hours, "Hours played"]].map(([value, label]) => <div key={label} className="bg-[#11120f] p-6"><p className="font-serif text-4xl text-[#e4c66a]">{value}</p><p className="mt-2 text-[9px] uppercase tracking-widest text-white/35">{label}</p></div>)}
        </div>
        <section className="mt-10 rounded-lg border border-white/10 bg-[#11120f] p-6"><div className="flex items-end justify-between"><div><p className="text-sm font-medium">Backlog completion</p><p className="mt-1 text-xs text-white/35">{completed} of {tracked.length} tracked games completed</p></div><p className="font-serif text-4xl text-[#e4c66a]">{completion}%</p></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#e4c66a]" style={{ width: `${completion}%` }}/></div></section>
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{BACKLOG_STATUS_OPTIONS.map((option) => <div key={option.value} className="rounded-lg border border-white/10 bg-[#11120f] p-4"><p className="font-serif text-2xl">{games.filter((game) => getGameData(game.appid).status === option.value).length}</p><p className="mt-1 text-[9px] uppercase tracking-widest text-white/35">{option.label}</p></div>)}</section>

        <section className="mt-10 rounded-xl border border-white/10 bg-[#11120f] p-6 sm:p-8">
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#e4c66a]">Profile setup</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="font-serif text-3xl">Genre and tag preferences</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">Choose from the genres and popular user tags shown on Steam for your library. Recent activity still contributes to your taste profile.</p></div>
            <p aria-live="polite" className="text-[9px] uppercase tracking-widest text-white/30">{genreState === "loading" ? "Loading Steam genres and tags..." : genreState === "error" ? "Steam genres and tags unavailable" : preferredGenres.length ? `${preferredGenres.length} selected` : "No preferences yet"}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {genreOptions.map((genre) => {
              const selected = preferredGenres.includes(genre);
              return <button key={genre} type="button" aria-pressed={selected} onClick={() => toggleGenre(genre)} className={`rounded-full border px-4 py-2 text-[10px] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c66a] active:scale-95 ${selected ? "border-[#e4c66a] bg-[#e4c66a] text-black shadow-[0_0_18px_rgba(228,198,106,.14)]" : "border-white/15 text-white/45 hover:-translate-y-0.5 hover:border-[#e4c66a]/60 hover:bg-white/5 hover:text-white"}`}>{genre}</button>;
            })}
          </div>
          {genreState === "ready" && genreOptions.length === 0 && <div className="mt-6 rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-white/30">No genre or tag metadata is available for this library.</div>}
        </section>

        <section className="mt-6 rounded-xl border border-white/10 bg-[#11120f] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[9px] uppercase tracking-[0.3em] text-[#e4c66a]">Library controls</p><h2 className="mt-3 font-serif text-3xl">Hidden games</h2><p className="mt-2 text-sm text-white/40">Hidden titles stay out of your library views and recommendations until restored.</p></div><p className="font-serif text-3xl text-[#e4c66a]">{hiddenLibrary.length}</p></div>
          {hiddenLibrary.length ? <div className="mt-6 divide-y divide-white/10 border-y border-white/10">{hiddenLibrary.map((game) => <div key={game.appid} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><Link href={`/games/${game.appid}`} className="block truncate text-sm transition hover:text-[#e4c66a]">{game.name}</Link><p className="mt-1 text-xs text-white/30">{game.playtime_forever ? `${(game.playtime_forever / 60).toFixed(1)} hours played` : "Unplayed"}</p></div><button type="button" onClick={() => updateGameData(game.appid, { hidden: false })} className="shrink-0 rounded-md border border-white/15 px-4 py-2 text-[9px] uppercase tracking-wider text-white/55 transition hover:border-[#e4c66a] hover:text-[#e4c66a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c66a] active:scale-95">Restore</button></div>)}</div> : <div className="mt-6 rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-white/30">No games are hidden.</div>}
        </section>
      </div>
    </main>
  );
}
