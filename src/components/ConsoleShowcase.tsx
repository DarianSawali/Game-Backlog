"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import GameImage from "@/components/GameImage";
import {
  BACKLOG_PRIORITY_OPTIONS,
  BACKLOG_STATUS_OPTIONS,
  type BacklogPriority,
  type BacklogRating,
  type BacklogStatus,
  useBacklogNotes,
  useBacklogPriorities,
  useBacklogRatings,
  useBacklogStatuses,
} from "@/lib/backlog";
import type { FriendGameActivity } from "@/lib/friends";
import { getGameMetadataBatch } from "@/lib/game-metadata-client";
import {
  RECOMMENDATION_MODES,
  buildGenreProfile,
  getCandidateGames,
  getGamesForMode,
  getTopRecommendation,
  isRecommendableGame,
  scoreGameRecommendation,
  type RecommendationMode,
  type ScoreBreakdownItem,
} from "@/lib/recommendations";
import type { SteamGame, SteamGameMetadata } from "@/lib/steam";

type View = "home" | "backlog" | "library" | "friends";
type Props = {
  games: SteamGame[];
  recentGames: SteamGame[];
  friendActivity: FriendGameActivity[];
  warnings: string[];
};

const PAGE_SIZE = 24;
const statusTone: Record<BacklogStatus, string> = {
  wantToPlay: "border-sky-300/40 bg-sky-300/10 text-sky-200",
  playing: "border-emerald-300/40 bg-emerald-300/10 text-emerald-200",
  completed: "border-violet-300/40 bg-violet-300/10 text-violet-200",
  paused: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  dropped: "border-red-300/40 bg-red-300/10 text-red-200",
};

function playtime(minutes: number) {
  return minutes === 0 ? "Unplayed" : `${(minutes / 60).toFixed(1)} hours played`;
}

function StatusPill({ status }: { status: BacklogStatus | null }) {
  if (!status) return <span className="text-[10px] uppercase tracking-widest text-white/35">Untracked</span>;
  const label = BACKLOG_STATUS_OPTIONS.find((option) => option.value === status)?.label;
  return <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${statusTone[status]}`}>{label}</span>;
}

export default function ConsoleShowcase({ games, recentGames, friendActivity, warnings }: Props) {
  const [view, setView] = useState<View>("home");
  const [focusedGameId, setFocusedGameId] = useState<number | null>(null);
  const [mode, setMode] = useState<RecommendationMode>("backlog");
  const [suggestion, setSuggestion] = useState<SteamGame | null>(null);
  const [suggestionMetadata, setSuggestionMetadata] = useState<SteamGameMetadata | null>(null);
  const [breakdown, setBreakdown] = useState<ScoreBreakdownItem[]>([]);
  const [score, setScore] = useState(0);
  const [rejectedIds, setRejectedIds] = useState<number[]>([]);
  const [recommendationState, setRecommendationState] = useState<"idle" | "loading" | "error">("idle");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BacklogStatus | "tracked" | "all">("tracked");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [genreProfile, setGenreProfile] = useState<Map<string, number>>(new Map());
  const runRef = useRef(0);
  const { statuses, setStatus } = useBacklogStatuses();
  const { priorities, setPriority } = useBacklogPriorities();
  const { ratings, setRating } = useBacklogRatings();
  const { notes, setNote } = useBacklogNotes();

  const friendMap = useMemo(() => new Map(friendActivity.map((item) => [item.appid, item.friendsPlaying])), [friendActivity]);
  const rejectedSet = useMemo(() => new Set(rejectedIds), [rejectedIds]);
  const eligibleGames = useMemo(
    () => getGamesForMode(mode, games, recentGames, friendMap, statuses, rejectedSet),
    [friendMap, games, mode, recentGames, rejectedSet, statuses]
  );
  const continueGames = useMemo(
    () => games.filter((game) => statuses[String(game.appid)] === "playing").sort((a, b) => (b.playtime_2weeks ?? 0) - (a.playtime_2weeks ?? 0)).slice(0, 10),
    [games, statuses]
  );
  const counts = useMemo(() => Object.fromEntries(BACKLOG_STATUS_OPTIONS.map((option) => [option.value, games.filter((game) => statuses[String(game.appid)] === option.value).length])) as Record<BacklogStatus, number>, [games, statuses]);
  const displayedGames = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return games.filter((game) => {
      const status = statuses[String(game.appid)];
      const matchesStatus = statusFilter === "all" || (statusFilter === "tracked" ? Boolean(status) : status === statusFilter);
      return matchesStatus && (!query || game.name.toLocaleLowerCase().includes(query));
    }).sort((a, b) => {
      const weights = { high: 3, medium: 2, low: 1 };
      return (weights[priorities[String(b.appid)] ?? "low"] - weights[priorities[String(a.appid)] ?? "low"]) || b.playtime_forever - a.playtime_forever;
    });
  }, [games, priorities, search, statusFilter, statuses]);

  useEffect(() => {
    let cancelled = false;
    void getGameMetadataBatch(recentGames.map((game) => game.appid)).then((metadata) => {
      if (!cancelled) setGenreProfile(buildGenreProfile([...metadata.values()].filter((item): item is SteamGameMetadata => item !== null)));
    });
    return () => { cancelled = true; };
  }, [recentGames]);

  async function recommend(excludedId?: number) {
    const candidates = getCandidateGames(eligibleGames.filter((game) => game.appid !== excludedId));
    if (!candidates.length) {
      setSuggestion(null);
      setRecommendationState("error");
      return;
    }
    const run = ++runRef.current;
    setRecommendationState("loading");
    try {
      const metadata = await getGameMetadataBatch(candidates.map((game) => game.appid));
      const recentIds = new Set(recentGames.map((game) => game.appid));
      const enriched = candidates.map((game) => {
        const details = metadata.get(game.appid) ?? null;
        return { game, metadata: details, ...scoreGameRecommendation(mode, game, details, recentIds, genreProfile, friendMap, statuses, priorities) };
      }).filter((item) => isRecommendableGame(item.metadata));
      const next = getTopRecommendation(enriched, suggestion);
      if (run !== runRef.current) return;
      if (!next) throw new Error("No recommendation");
      setSuggestion(next.game);
      setFocusedGameId(next.game.appid);
      setSuggestionMetadata(next.metadata);
      setBreakdown(next.breakdown);
      setScore(next.score);
      setRecommendationState("idle");
    } catch {
      if (run === runRef.current) setRecommendationState("error");
    }
  }

  function changeMode(nextMode: RecommendationMode) {
    runRef.current += 1;
    setMode(nextMode);
    setSuggestion(null);
    setSuggestionMetadata(null);
    setBreakdown([]);
    setScore(0);
    setRecommendationState("idle");
  }

  function rejectSuggestion() {
    if (!suggestion) return;
    const id = suggestion.appid;
    setRejectedIds((current) => [...current.filter((item) => item !== id), id].slice(-5));
    setSuggestion(null);
    void recommend(id);
  }

  const carouselGames = useMemo(() => {
    const source = recentGames.length ? recentGames : games;
    return source.slice(0, 16);
  }, [games, recentGames]);
  const heroGame = games.find((game) => game.appid === focusedGameId) ?? suggestion ?? continueGames[0] ?? recentGames[0] ?? games[0] ?? null;
  const trackedCount = Object.values(counts).reduce((total, count) => total + count, 0);
  const completionRate = trackedCount ? Math.round((counts.completed / trackedCount) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#060809] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-[0.09] [background-image:linear-gradient(rgba(34,211,238,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.18)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_-20%,rgba(34,211,238,.22),transparent_60%)]" />
      <div className="relative mx-auto min-h-screen max-w-[1600px] px-5 pb-24 sm:px-8 lg:px-12">
        <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 py-5">
          <button type="button" onClick={() => setView("home")} className="flex items-center gap-3 text-left">
            <span className="relative grid size-11 place-items-center rounded-full border border-cyan-300/50 bg-cyan-300/10 font-mono text-xs font-black text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,.18)]"><span className="absolute size-5 rounded-full border border-cyan-200/30" />GB</span>
            <span><span className="block text-sm font-black tracking-[0.18em]">GAME VAULT</span><span className="block font-mono text-[8px] tracking-[0.2em] text-cyan-500/70">PLAYER_ONE / ONLINE</span></span>
          </button>
          <div className="flex items-center gap-5">
            {([{ value: "home", label: "Home" }, { value: "library", label: "Games" }, { value: "backlog", label: "Backlog" }, { value: "friends", label: "Friends" }] as { value: View; label: string }[]).map((item) => <button key={item.value} type="button" onClick={() => setView(item.value)} className={`border-b py-2 text-xs transition ${view === item.value ? "border-cyan-300 text-white" : "border-transparent text-white/45 hover:text-white"}`}>{item.label}</button>)}
          </div>
          <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-[10px] font-bold">LEVEL {Math.max(trackedCount, 1)}</p><div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gradient-to-r from-cyan-400 to-lime-300" style={{ width: `${Math.max(completionRate, 8)}%` }} /></div></div><Link href="/" className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/5 text-xs font-bold text-white/70 hover:border-cyan-300 hover:text-white">DS</Link></div>
        </nav>

        {warnings.length > 0 && <div className="mb-6 border border-amber-300/25 bg-amber-300/10 px-4 py-3 font-mono text-[10px] text-amber-100">PARTIAL_DATA / {warnings.join(" / ")}</div>}
        {!games.length && <div className="mt-16 border border-red-300/25 bg-red-300/10 p-8 text-center"><h1 className="text-2xl font-bold">Steam library offline</h1><p className="mt-2 text-sm text-white/55">Check the Steam credentials and profile visibility, then reload this page.</p></div>}

        {games.length > 0 && view === "home" && <>
          <section className="relative mt-3 min-h-[760px] overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-[0_40px_120px_rgba(0,0,0,.65)]">
            {heroGame && <div className="absolute inset-y-0 right-0 w-full opacity-65 lg:w-3/4"><GameImage appid={heroGame.appid} name={heroGame.name} iconHash={heroGame.img_icon_url} className="h-full [&>div]:h-full [&>div]:aspect-auto" /></div>}
            <div className="absolute inset-0 bg-gradient-to-r from-[#060809] via-[#060809]/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060809] via-transparent to-black/30" />
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-cyan-400 via-lime-300 to-transparent" />
            <div className="relative z-10 flex min-h-[760px] items-center p-6 pb-64 sm:p-10 sm:pb-64 lg:p-14 lg:pb-64">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.25em] text-white/40"><span className="rounded-md border border-white/15 bg-black/50 px-2 py-1 font-mono">LB</span><span>Choose a mission</span><span className="rounded-md border border-white/15 bg-black/50 px-2 py-1 font-mono">RB</span></div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-2">{RECOMMENDATION_MODES.map((option) => <button key={option.value} type="button" onClick={() => changeMode(option.value)} className={`shrink-0 rounded-lg border px-3 py-2 font-mono text-[9px] tracking-widest transition ${mode === option.value ? "border-cyan-300 bg-cyan-300 text-[#031012] shadow-[0_0_24px_rgba(34,211,238,.28)]" : "border-white/15 bg-black/40 text-white/50 hover:border-white/35"}`}>{option.label.toUpperCase()}</button>)}</div>
                <p className="mt-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300"><span className="h-px w-10 bg-cyan-300" />{suggestion ? "Recommended for you" : "Continue playing"}<span className="text-[8px] text-cyan-700">MATCH_{String(heroGame?.appid ?? 0).slice(-3)}</span></p>
                <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.05em] sm:text-7xl lg:text-8xl">{heroGame?.name ?? "Choose your next game"}</h1>
                {heroGame && <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/55"><StatusPill status={statuses[String(heroGame.appid)] ?? null} /><span>{playtime(heroGame.playtime_forever)}</span><span className="text-white/20">◆</span><span>{friendMap.get(heroGame.appid) ?? 0} friends recently active</span></div>}
                <div className="mt-8 flex flex-wrap gap-3">
                  {heroGame && <a href={`steam://run/${heroGame.appid}`} className="flex items-center gap-3 rounded-full bg-white py-3 pl-3 pr-6 text-sm font-bold text-black"><span className="grid size-7 place-items-center rounded-full bg-cyan-300 font-mono text-[10px]">A</span>Launch game</a>}
                  <button type="button" onClick={() => void recommend()} disabled={!eligibleGames.length || recommendationState === "loading"} className="flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-5 py-3 text-xs backdrop-blur disabled:opacity-40"><span className="grid size-5 place-items-center rounded-full bg-fuchsia-400 text-[8px] font-bold text-black">X</span>{recommendationState === "loading" ? "Finding..." : suggestion ? "Try another" : "Recommend a game"}</button>
                  {suggestion && <button type="button" onClick={rejectSuggestion} className="flex items-center gap-2 px-4 py-3 text-xs text-white/45 hover:text-white"><span className="grid size-5 place-items-center rounded-full bg-rose-400 text-[8px] font-bold text-black">B</span>Not for me</button>}
                </div>
                {heroGame && <div className="mt-5 flex max-w-md items-center gap-4"><span className="font-mono text-[9px] text-white/35">PROGRESS</span><div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gradient-to-r from-amber-400 to-cyan-300" style={{ width: `${Math.min(Math.max(heroGame.playtime_forever / 20, 8), 100)}%` }} /></div><span className="font-mono text-[9px] text-white/45">{Math.min(Math.round(heroGame.playtime_forever / 20), 100)}%</span></div>}
                {suggestion && <div className="mt-5 flex flex-wrap items-center gap-2"><span className="font-mono text-[9px] text-cyan-300">{score} SCORE</span>{breakdown.slice(0, 2).map((item) => <span key={item.label} className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[9px] text-white/45">{item.label} +{item.points}</span>)}{suggestionMetadata?.genres?.slice(0, 2).map((genre) => <span key={genre.id} className="rounded-full border border-cyan-300/20 px-3 py-1 text-[9px] text-cyan-200">{genre.description}</span>)}</div>}
                {recommendationState === "error" && <p className="mt-4 text-sm text-amber-200">No matching game could be prepared for this mode.</p>}
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/95 to-transparent px-6 pb-6 pt-20 sm:px-10 lg:px-14"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-bold">Recently played</p><p className="mt-1 text-[9px] uppercase tracking-widest text-white/35">Move through your library</p></div><div className="flex items-center gap-3 font-mono text-[9px] text-white/35"><span>LB</span><span>BROWSE</span><span>RB</span></div></div><div className="flex gap-3 overflow-x-auto pb-3">{carouselGames.map((game, index) => <button key={game.appid} type="button" onClick={() => { setFocusedGameId(game.appid); setSuggestion(null); }} className={`group relative min-w-48 overflow-hidden rounded-xl border-2 text-left transition sm:min-w-60 ${heroGame?.appid === game.appid ? "border-cyan-300 shadow-[0_0_30px_rgba(34,211,238,.25)]" : "border-transparent opacity-55 hover:opacity-100"}`}><GameImage appid={game.appid} name={game.name} iconHash={game.img_icon_url} /><span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 font-mono text-[8px] text-cyan-300">{String(index + 1).padStart(2, "0")}</span><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-3 pt-10"><p className="truncate text-xs font-bold">{game.name}</p>{heroGame?.appid === game.appid && <p className="mt-1 font-mono text-[8px] text-cyan-300">PLAYING</p>}</div></button>)}</div></div>
          </section>

          <section className="mt-8"><div className="mb-4 flex items-center justify-between"><div><p className="font-mono text-[9px] tracking-[0.25em] text-cyan-500">PLAYER_PROGRESS</p><h2 className="mt-1 text-xl font-bold">Backlog achievements</h2></div><div className="text-right"><p className="text-xl font-black text-lime-300">{completionRate}%</p><p className="text-[9px] uppercase tracking-widest text-white/35">completion</p></div></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{BACKLOG_STATUS_OPTIONS.map((option, index) => <button key={option.value} type="button" onClick={() => { setStatusFilter(option.value); setView("backlog"); }} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-black/40 p-4 text-left shadow-lg transition hover:-translate-y-1 hover:border-cyan-300/50"><div className="absolute -right-3 -top-4 text-7xl font-black text-white/[0.035]">{index + 1}</div><div className={`mb-4 grid size-9 place-items-center rounded-xl border ${statusTone[option.value]}`}><span className="text-sm">{["＋", "▶", "★", "Ⅱ", "×"][index]}</span></div><p className="text-3xl font-black">{counts[option.value]}</p><p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{option.label}</p><div className="mt-4 h-1 overflow-hidden rounded-full bg-white/8"><div className="h-full bg-cyan-300 transition-all group-hover:bg-lime-300" style={{ width: `${trackedCount ? Math.max((counts[option.value] / trackedCount) * 100, 4) : 4}%` }} /></div></button>)}</div></section>
        </>}

        {games.length > 0 && (view === "backlog" || view === "library") && <section className="py-10">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-cyan-950/60 via-black/60 to-fuchsia-950/30 p-6 shadow-2xl sm:p-8"><div className="flex flex-wrap items-end justify-between gap-5"><div><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">{view === "backlog" ? "◆" : "▦"}</span><p className="font-mono text-[9px] tracking-[0.25em] text-cyan-400">{view === "backlog" ? `BACKLOG_CONTROL / ${trackedCount} TRACKED` : `STEAM_LIBRARY / ${games.length} TITLES`}</p></div><h1 className="mt-4 text-4xl font-black sm:text-5xl">{view === "backlog" ? "Your active queue" : "Choose your next world"}</h1><p className="mt-2 text-sm text-white/40">{view === "backlog" ? "Organize your campaign and keep every adventure moving." : "Your entire Steam collection, ready to explore."}</p></div><label className="relative w-full sm:w-72"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300">⌕</span><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="Search games" className="w-full rounded-full border border-white/15 bg-black/50 py-3 pl-10 pr-5 text-sm outline-none placeholder:text-white/30 focus:border-cyan-300" /></label></div></div>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2"><button type="button" onClick={() => setStatusFilter(view === "library" ? "all" : "tracked")} className={`shrink-0 rounded-full border px-4 py-2 text-[10px] uppercase tracking-wider ${statusFilter === (view === "library" ? "all" : "tracked") ? "border-cyan-300 bg-cyan-300 text-black" : "border-white/15 text-white/50"}`}>{view === "library" ? "All games" : "All tracked"}</button>{BACKLOG_STATUS_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => setStatusFilter(option.value)} className={`shrink-0 rounded-full border px-4 py-2 text-[10px] uppercase tracking-wider ${statusFilter === option.value ? "border-cyan-300 bg-cyan-300 text-black" : "border-white/15 text-white/50"}`}>{option.label} {counts[option.value]}</button>)}</div>
          <p className="mt-5 font-mono text-[9px] text-white/35">SHOWING {Math.min(visibleCount, displayedGames.length)} / {displayedGames.length}</p>
          {displayedGames.length ? <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{displayedGames.slice(0, visibleCount).map((game, index) => <article key={game.appid} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-xl transition duration-300 hover:-translate-y-2 hover:scale-[1.015] hover:border-cyan-300/60 hover:shadow-[0_20px_60px_rgba(34,211,238,.12)]"><div className="relative"><GameImage appid={game.appid} name={game.name} iconHash={game.img_icon_url} /><div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100" /><span className="absolute left-3 top-3 rounded-md border border-white/15 bg-black/70 px-2 py-1 font-mono text-[8px] text-cyan-200 backdrop-blur">SLOT {String(index + 1).padStart(2, "0")}</span><a href={`steam://run/${game.appid}`} className="absolute bottom-3 right-3 grid size-9 translate-y-2 place-items-center rounded-full bg-white text-[10px] font-black text-black opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100">A</a></div><div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-bold">{game.name}</h2><p className="mt-1 text-xs text-white/40">{playtime(game.playtime_forever)}</p></div><StatusPill status={statuses[String(game.appid)] ?? null} /></div><div className="mt-4 grid grid-cols-2 gap-2"><select aria-label={`${game.name} status`} value={statuses[String(game.appid)] ?? ""} onChange={(event) => setStatus(game.appid, event.target.value ? event.target.value as BacklogStatus : null)} className="min-w-0 rounded-lg border border-white/15 bg-[#071012] px-2 py-2 text-xs"><option value="">No status</option>{BACKLOG_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><select aria-label={`${game.name} priority`} value={priorities[String(game.appid)] ?? ""} onChange={(event) => setPriority(game.appid, event.target.value ? event.target.value as BacklogPriority : null)} className="min-w-0 rounded-lg border border-white/15 bg-[#071012] px-2 py-2 text-xs"><option value="">No priority</option>{BACKLOG_PRIORITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>{view === "backlog" && <><select aria-label={`${game.name} rating`} value={ratings[String(game.appid)] ?? ""} onChange={(event) => setRating(game.appid, event.target.value ? Number(event.target.value) as BacklogRating : null)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#071012] px-2 py-2 text-xs"><option value="">Not rated</option>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select><textarea key={notes[String(game.appid)] ?? ""} defaultValue={notes[String(game.appid)] ?? ""} onBlur={(event) => setNote(game.appid, event.target.value)} placeholder="Add a note..." rows={2} maxLength={500} className="mt-2 w-full resize-y rounded-lg border border-white/15 bg-[#071012] px-3 py-2 text-xs placeholder:text-white/25" /></>}</div></article>)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/45">No games match this view. Try another filter or search.</div>}
          {visibleCount < displayedGames.length && <div className="mt-8 text-center"><button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="rounded-full border border-white/20 px-6 py-3 text-xs hover:border-cyan-300">Load more</button></div>}
        </section>}
        {games.length > 0 && view === "friends" && <section className="py-10"><div className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-cyan-950/60 via-black/60 to-fuchsia-950/30 p-8"><p className="font-mono text-[9px] tracking-[0.25em] text-cyan-400">FRIEND_ACTIVITY / LIVE SIGNAL</p><h1 className="mt-4 text-4xl font-black sm:text-5xl">Friends are playing</h1><p className="mt-2 text-sm text-white/40">Games appearing across your Steam circle recently.</p></div>{friendActivity.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{friendActivity.map((activity, index) => <article key={activity.appid} className="group overflow-hidden rounded-2xl border border-white/10 bg-black/50 transition hover:-translate-y-1 hover:border-cyan-300/50"><div className="relative"><GameImage appid={activity.appid} name={activity.name} iconHash={activity.img_icon_url} /><span className="absolute left-3 top-3 rounded bg-black/75 px-2 py-1 font-mono text-[8px] text-cyan-300">PARTY {String(index + 1).padStart(2, "0")}</span></div><div className="p-4"><h2 className="truncate font-bold">{activity.name}</h2><p className="mt-1 text-xs text-white/45">{activity.friendsPlaying} {activity.friendsPlaying === 1 ? "friend has" : "friends have"} played recently</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => { setFocusedGameId(activity.appid); setView("home"); }} className="rounded-full bg-white px-4 py-2 text-[10px] font-bold text-black">View game</button><a href={`steam://run/${activity.appid}`} className="rounded-full border border-white/15 px-4 py-2 text-[10px] text-white/60">Launch</a></div></div></article>)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/45">Friend activity is unavailable or your friends have no recent public activity.</div>}</section>}
        <div className="fixed inset-x-0 bottom-0 z-30 hidden border-t border-white/10 bg-black/75 px-8 py-3 backdrop-blur-xl md:block"><div className="mx-auto flex max-w-[1500px] justify-end gap-6 text-[10px] font-bold uppercase tracking-wider text-white/45"><span className="flex items-center gap-2"><b className="grid size-5 place-items-center rounded-full bg-emerald-300 text-[8px] text-black">A</b>Select</span><span className="flex items-center gap-2"><b className="grid size-5 place-items-center rounded-full bg-rose-400 text-[8px] text-black">B</b>Back</span><span className="flex items-center gap-2"><b className="grid size-5 place-items-center rounded-full bg-fuchsia-400 text-[8px] text-black">X</b>Recommend</span></div></div>
      </div>
    </main>
  );
}
