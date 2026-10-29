"use client";

import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import GameImage from "@/components/GameImage";
import {
  BACKLOG_PRIORITY_OPTIONS,
  BACKLOG_STATUS_OPTIONS,
  type BacklogPriority,
  type BacklogRating,
  type BacklogStatus,
  useUserGameData,
} from "@/lib/backlog";
import type { SteamGame, SteamGameMetadata } from "@/lib/steam";

export default function GameDetailsContent({ game, metadata }: { game: SteamGame; metadata: SteamGameMetadata | null }) {
  const { getGameData, updateGameData } = useUserGameData();
  const gameData = getGameData(game.appid);
  const hidden = gameData.hidden;

  return (
    <main className="min-h-screen bg-[#070806] px-5 py-6 text-[#f4f0e6] sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[1600px]"><AppHeader active="library"/></div>
      <div className="mx-auto max-w-7xl py-8">
        <Link href="/library" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition hover:text-[#e4c66a]">← Back to Library</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,.55fr)]">
          <section className="overflow-hidden rounded-xl border border-white/10 bg-[#11120f]">
            <GameImage appid={game.appid} name={game.name} iconHash={game.img_icon_url} className="bg-black"/>
            <div className="p-6 sm:p-8">
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#e4c66a]">Game details</p>
              <h1 className="mt-3 font-serif text-4xl sm:text-6xl">{metadata?.name ?? game.name}</h1>
              <div className="mt-4 flex flex-wrap gap-2 text-[9px] uppercase tracking-wider text-white/45"><span className="rounded-full border border-white/10 px-3 py-2">{game.playtime_forever ? `${(game.playtime_forever / 60).toFixed(1)} hours played` : "Unplayed"}</span>{metadata?.releaseDate && <span className="rounded-full border border-white/10 px-3 py-2">Released {metadata.releaseDate}</span>}{metadata?.controllerSupport && <span className="rounded-full border border-white/10 px-3 py-2">Controller {metadata.controllerSupport}</span>}</div>
              {metadata?.shortDescription && <p className="mt-6 max-w-3xl text-sm leading-7 text-white/55">{metadata.shortDescription}</p>}
              {metadata?.genres?.length ? <div className="mt-6 flex flex-wrap gap-2">{metadata.genres.map((genre) => <span key={genre.id} className="rounded-full border border-[#e4c66a]/25 bg-[#e4c66a]/5 px-3 py-1.5 text-[9px] uppercase tracking-wider text-[#e4c66a]">{genre.description}</span>)}</div> : null}
              <div className="mt-8 flex flex-wrap gap-3"><a href={`steam://run/${game.appid}`} className="rounded-md bg-[#e4c66a] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-black transition hover:bg-[#f4dc8e]">Play now</a><a href={`https://store.steampowered.com/app/${game.appid}`} target="_blank" rel="noopener noreferrer" className="rounded-md border border-white/15 px-5 py-3 text-[10px] uppercase tracking-wider text-white/60 transition hover:border-[#e4c66a] hover:text-[#e4c66a]">View on Steam</a><button type="button" aria-pressed={hidden} onClick={() => updateGameData(game.appid, { hidden: !hidden })} className={`rounded-md border px-5 py-3 text-[10px] uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c66a] active:scale-95 ${hidden ? "border-[#e4c66a]/50 bg-[#e4c66a]/10 text-[#e4c66a]" : "border-white/15 text-white/45 hover:border-[#e4c66a] hover:text-[#e4c66a]"}`}>{hidden ? "Restore to library" : "Hide game"}</button></div>
              {hidden && <p role="status" className="mt-4 text-xs text-[#e4c66a]">Hidden from normal library views and recommendations.</p>}
            </div>
          </section>

          <aside className="h-fit rounded-xl border border-white/10 bg-[#11120f] p-6">
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#e4c66a]">Your record</p>
            <label className="mt-6 block text-xs text-white/45">Classification<select value={gameData.status ?? ""} onChange={(event) => updateGameData(game.appid, { status: event.target.value ? event.target.value as BacklogStatus : null })} className="mt-2 w-full rounded-md border border-white/15 bg-[#191a17] px-3 py-3 text-sm text-white outline-none focus:border-[#e4c66a]"><option value="">No status</option>{BACKLOG_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="mt-5 block text-xs text-white/45">Priority<select value={gameData.priority ?? ""} onChange={(event) => updateGameData(game.appid, { priority: event.target.value ? event.target.value as BacklogPriority : null })} className="mt-2 w-full rounded-md border border-white/15 bg-[#191a17] px-3 py-3 text-sm text-white outline-none focus:border-[#e4c66a]"><option value="">No priority</option>{BACKLOG_PRIORITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="mt-5 block text-xs text-white/45">Personal rating<select value={gameData.rating ?? ""} onChange={(event) => updateGameData(game.appid, { rating: event.target.value ? Number(event.target.value) as BacklogRating : null })} className="mt-2 w-full rounded-md border border-white/15 bg-[#191a17] px-3 py-3 text-sm text-white outline-none focus:border-[#e4c66a]"><option value="">Not rated</option>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select></label>
            <label className="mt-5 block text-xs text-white/45">Notes<textarea key={gameData.notes} defaultValue={gameData.notes} onBlur={(event) => updateGameData(game.appid, { notes: event.target.value })} rows={6} maxLength={500} placeholder="Add your thoughts or a reminder..." className="mt-2 w-full resize-y rounded-md border border-white/15 bg-[#191a17] px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#e4c66a]"/></label>
            {(metadata?.developers?.length || metadata?.publishers?.length) && <div className="mt-6 border-t border-white/10 pt-5 text-xs leading-6 text-white/35">{metadata.developers?.length ? <p>Developer: {metadata.developers.join(", ")}</p> : null}{metadata.publishers?.length ? <p>Publisher: {metadata.publishers.join(", ")}</p> : null}</div>}
          </aside>
        </div>
      </div>
    </main>
  );
}
