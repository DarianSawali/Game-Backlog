"use client";

import { useMemo, useRef, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { useAppState } from "@/components/auth/AppStateProvider";
import GameImage from "@/components/GameImage";
import { getGameMetadataBatch } from "@/lib/game-metadata-client";
import {
  BACKLOG_STATUS_OPTIONS,
  createUserGameIndexes,
  type BacklogStatus,
  useGenrePreferences,
  useUserGameData,
} from "@/lib/backlog";
import {
  buildGenreProfile,
  getCandidateGames,
  getGamesForMode,
  getTopRecommendation,
  isRecommendableGame,
  scoreGameRecommendation,
  type ScoreBreakdownItem,
} from "@/lib/recommendations";
import type { SteamGame, SteamGameMetadata } from "@/lib/steam";

type MenuSection = "recommend" | "continue" | "saves" | "library" | "profile";
type PageView = "home" | "library" | "profile";
type SuggestionMode = "backlog" | "continue" | "new" | "forgotten" | "quick";
type Props = {
  games: SteamGame[];
  recentGames: SteamGame[];
  hasError: boolean;
  isMainPage?: boolean;
};

const menuItems: { value: MenuSection; label: string; eyebrow: string }[] = [
  { value: "recommend", label: "New Games", eyebrow: "Find something to play" },
  { value: "continue", label: "Continue", eyebrow: "Resume an active game" },
  { value: "saves", label: "Saves", eyebrow: "Games kept for later" },
];

const suggestionModes: { value: SuggestionMode; label: string }[] = [
  { value: "backlog", label: "From backlog" },
  { value: "continue", label: "Continue" },
  { value: "new", label: "Something new" },
  { value: "forgotten", label: "Forgotten" },
  { value: "quick", label: "Quick game" },
];

function formatHours(minutes: number) {
  return minutes ? `${(minutes / 60).toFixed(1)} hrs` : "Unplayed";
}

export default function GameMenuPreview({ games, recentGames, hasError, isMainPage = false }: Props) {
  const { state: appState } = useAppState();
  const displayName = appState.auth.status === "authenticated"
    ? appState.auth.user.displayName
    : "Player";
  const [section, setSection] = useState<MenuSection>("recommend");
  const [pageView] = useState<PageView>("home");
  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>("new");
  const [recommendation, setRecommendation] = useState<SteamGame | null>(null);
  const [recommendationMetadata, setRecommendationMetadata] = useState<SteamGameMetadata | null>(null);
  const [recommendationBreakdown, setRecommendationBreakdown] = useState<ScoreBreakdownItem[]>([]);
  const [recommendationScore, setRecommendationScore] = useState(0);
  const [recommendationState, setRecommendationState] = useState<"idle" | "loading" | "error">("idle");
  const [selectedId, setSelectedId] = useState<number | null>(recentGames[0]?.appid ?? games[0]?.appid ?? null);
  const [search, setSearch] = useState("");
  const [libraryFilter, setLibraryFilter] = useState<BacklogStatus | "all">("all");
  const { userGames, updateGameData } = useUserGameData();
  const { preferredGenres } = useGenrePreferences();
  const recommendationRun = useRef(0);
  const { statuses, priorities, hiddenGameIds: hiddenSet, rejectedGameIds: rejectedSet } = useMemo(
    () => createUserGameIndexes(userGames),
    [userGames]
  );
  const activeGames = useMemo(() => games.filter((game) => !hiddenSet.has(game.appid)), [games, hiddenSet]);
  const activeRecentGames = useMemo(() => recentGames.filter((game) => !hiddenSet.has(game.appid)), [hiddenSet, recentGames]);
  const trackedGames = useMemo(() => activeGames.filter((game) => statuses[String(game.appid)]), [activeGames, statuses]);
  const continueGames = useMemo(() => activeGames.filter((game) => {
    const status = statuses[String(game.appid)];
    return status === "playing" || status === "paused";
  }), [activeGames, statuses]);
  const savedGames = useMemo(() => activeGames.filter((game) => statuses[String(game.appid)] === "wantToPlay" && game.playtime_forever === 0), [activeGames, statuses]);
  const completedCount = trackedGames.filter((game) => statuses[String(game.appid)] === "completed").length;
  const filteredGames = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return activeGames.filter((game) => {
      const matchesSearch = !query || game.name.toLocaleLowerCase().includes(query);
      const matchesStatus = libraryFilter === "all" || statuses[String(game.appid)] === libraryFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeGames, libraryFilter, search, statuses]);
  const suggestionCandidates = useMemo(
    () => getGamesForMode(suggestionMode, games, activeRecentGames, new Map(), statuses, rejectedSet, hiddenSet),
    [activeRecentGames, games, hiddenSet, rejectedSet, statuses, suggestionMode]
  );
  const selectedGame = activeGames.find((game) => game.appid === selectedId) ?? activeRecentGames.find((game) => game.appid === selectedId) ?? activeGames[0] ?? null;
  const displayGame = pageView === "home" && section === "recommend" ? recommendation : selectedGame;
  const sectionGames = section === "continue" ? continueGames : savedGames;

  function chooseSection(nextSection: MenuSection) {
    setSection(nextSection);
  }

  async function prepareSuggestion(mode: SuggestionMode, excludedId?: number) {
    const available = getGamesForMode(mode, games, activeRecentGames, new Map(), statuses, new Set([...rejectedSet, ...(excludedId ? [excludedId] : [])]), hiddenSet);
    const candidates = getCandidateGames(available);
    if (!candidates.length) {
      setRecommendation(null);
      setRecommendationState("error");
      return;
    }
    const run = ++recommendationRun.current;
    setRecommendationState("loading");
    try {
      const metadataById = await getGameMetadataBatch([...new Set([...candidates.map((game) => game.appid), ...activeRecentGames.map((game) => game.appid)])]);
      const recentIds = new Set(activeRecentGames.map((game) => game.appid));
      const recentMetadata = activeRecentGames.map((game) => metadataById.get(game.appid) ?? null).filter((item): item is SteamGameMetadata => item !== null);
      const genreProfile = buildGenreProfile(recentMetadata, preferredGenres);
      const enriched = candidates.map((game) => {
        const metadata = metadataById.get(game.appid) ?? null;
        return { game, metadata, ...scoreGameRecommendation(mode, game, metadata, recentIds, genreProfile, new Map(), statuses, priorities) };
      }).filter((item) => isRecommendableGame(item.metadata));
      const selected = getTopRecommendation(enriched, recommendation);
      if (run !== recommendationRun.current) return;
      if (!selected) throw new Error("No recommendation available");
      setRecommendation(selected.game);
      setRecommendationMetadata(selected.metadata);
      setRecommendationBreakdown(selected.breakdown);
      setRecommendationScore(selected.score);
      setRecommendationState("idle");
    } catch {
      if (run === recommendationRun.current) setRecommendationState("error");
    }
  }

  function changeSuggestionMode(mode: SuggestionMode) {
    setSuggestionMode(mode);
    setRecommendation(null);
    setRecommendationMetadata(null);
    setRecommendationBreakdown([]);
    void prepareSuggestion(mode);
  }

  function chooseAgain() {
    if (!recommendation) return void prepareSuggestion(suggestionMode);
    const rejectedId = recommendation.appid;
    updateGameData(rejectedId, { rejectedAt: new Date().toISOString() });
    void prepareSuggestion(suggestionMode, rejectedId);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070806] text-[#f4f0e6]">
      {displayGame && <div className="absolute inset-y-0 right-0 w-full bg-black lg:w-[75%] lg:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_16%,black_100%)] lg:[mask-image:linear-gradient(to_right,transparent_0%,black_16%,black_100%)]"><GameImage appid={displayGame.appid} name={displayGame.name} iconHash={displayGame.img_icon_url} className="h-full [&>img]:object-cover [&>img]:object-center" /></div>}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,4,.98)_0%,rgba(5,6,4,.96)_28%,rgba(5,6,4,.18)_68%,rgba(5,6,4,.55)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,6,4,.98),transparent_45%,rgba(5,6,4,.5))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:repeating-linear-gradient(0deg,white_0,white_1px,transparent_1px,transparent_4px)]" />

      <div className="relative z-10 flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-14">
        <AppHeader active="home" showExitPreview={!isMainPage}/>

        {hasError ? <div className="m-auto border border-red-300/25 bg-black/70 p-8 text-center"><h1 className="font-serif text-3xl">The library could not be opened</h1><p className="mt-3 text-sm text-white/45">Check Steam access and try again.</p></div> : <div className={`flex-1 gap-10 py-10 ${pageView === "library" ? "block" : "grid items-center lg:grid-cols-[minmax(280px,0.72fr)_1.28fr]"}`}>
          <nav aria-label="Game menu" className={`self-center ${pageView === "library" ? "hidden" : "block"}`}>
            <p className="mb-7 text-[9px] uppercase tracking-[0.4em] text-[#e4c66a]">{pageView === "home" ? "Game menu" : pageView}</p>
            {pageView === "home" ? <div className="space-y-1">{menuItems.map((item, index) => <button key={item.value} type="button" onClick={() => chooseSection(item.value)} className={`group flex w-full items-center gap-5 border-y px-1 py-5 text-left outline-none transition duration-200 focus-visible:border-[#e4c66a] focus-visible:ring-2 focus-visible:ring-[#e4c66a]/20 active:scale-[.99] ${section === item.value ? "border-[#e4c66a]/35 text-white" : "border-transparent text-white/35 hover:translate-x-2 hover:border-[#d8c79a]/20 hover:bg-white/[.025] hover:text-white/80"}`}><span className={`font-serif text-xs transition-colors group-hover:text-[#e4c66a] ${section === item.value ? "text-[#e4c66a]" : "text-white/15"}`}>0{index + 1}</span><span><span className={`block font-serif text-2xl tracking-wide transition sm:text-3xl ${section === item.value ? "translate-x-2" : ""}`}>{item.label}</span><span className={`mt-1 block text-[8px] uppercase tracking-[0.22em] ${section === item.value ? "text-[#d8c79a]/55" : "text-transparent"}`}>{item.eyebrow}</span></span>{section === item.value && <span className="ml-auto text-[#e4c66a]">◆</span>}</button>)}</div> : <div><h1 className="font-serif text-4xl sm:text-5xl">{pageView === "library" ? "The Library" : "Player Profile"}</h1><p className="mt-4 max-w-xs text-sm leading-6 text-white/40">{pageView === "library" ? "Browse every owned game and manage its backlog state." : "Review your collection and completion progress."}</p></div>}
          </nav>

          <section className="min-w-0 self-end lg:self-center">
            {pageView === "library" && <SimpleLibrary games={filteredGames} allGames={games} statuses={statuses} search={search} libraryFilter={libraryFilter} onSearch={setSearch} onFilter={setLibraryFilter} onStatus={(appId, status) => updateGameData(appId, { status })} />}
            {section === "library" && <div className="mb-5 flex flex-wrap gap-2"><button type="button" onClick={() => setLibraryFilter("all")} className={`border px-3 py-2 text-[8px] uppercase tracking-[0.18em] ${libraryFilter === "all" ? "border-[#e4c66a] bg-[#e4c66a] text-black" : "border-[#d8c79a]/20 bg-black/40 text-white/45"}`}>All {games.length}</button>{BACKLOG_STATUS_OPTIONS.map((option) => { const count = games.filter((game) => statuses[String(game.appid)] === option.value).length; return <button key={option.value} type="button" onClick={() => setLibraryFilter(option.value)} className={`border px-3 py-2 text-[8px] uppercase tracking-[0.18em] ${libraryFilter === option.value ? "border-[#e4c66a] bg-[#e4c66a] text-black" : "border-[#d8c79a]/20 bg-black/40 text-white/45"}`}>{option.label} {count}</button>; })}</div>}
            {pageView === "home" && (section === "continue" || section === "saves") && <>
              <div className="mb-5"><p className="text-[9px] uppercase tracking-[0.3em] text-[#d8c79a]/45">{section === "continue" ? `${continueGames.length} active games` : `${savedGames.length} games saved`}</p><h1 className="mt-2 font-serif text-3xl sm:text-4xl">{section === "continue" ? "Continue Playing" : "Saved for Later"}</h1></div>
              {sectionGames.length ? <div className="flex gap-4 overflow-x-auto pb-5">{sectionGames.slice(0, 16).map((game, index) => <button key={game.appid} type="button" onClick={() => setSelectedId(game.appid)} className={`relative min-w-52 overflow-hidden border bg-black/60 text-left transition duration-300 sm:min-w-64 ${selectedGame?.appid === game.appid ? "-translate-y-2 border-[#e4c66a] shadow-[0_18px_50px_rgba(0,0,0,.6)]" : "border-white/10 opacity-60 hover:opacity-100"}`}><GameImage appid={game.appid} name={game.name} iconHash={game.img_icon_url} /><span className="absolute left-3 top-3 bg-black/75 px-2 py-1 font-serif text-[9px] text-[#e4c66a]">{String(index + 1).padStart(2, "0")}</span><div className="border-t border-white/10 p-4"><p className="truncate font-serif text-lg">{game.name}</p><p className="mt-1 text-[9px] uppercase tracking-widest text-white/35">{formatHours(game.playtime_forever)}</p></div></button>)}</div> : <div className="border border-dashed border-[#d8c79a]/20 bg-black/30 p-8 text-center text-sm text-white/40">No games are recorded here yet.</div>}
              {selectedGame && <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#d8c79a]/15 pt-5"><a href={`steam://run/${selectedGame.appid}`} className="bg-[#e4c66a] px-5 py-3 text-xs font-bold uppercase tracking-widest text-black transition duration-200 hover:-translate-y-0.5 hover:bg-[#f4dc8e] hover:shadow-[0_0_20px_rgba(228,198,106,.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c66a] active:translate-y-0 active:scale-95">Play now</a><select aria-label={`${selectedGame.name} backlog status`} value={statuses[String(selectedGame.appid)] ?? ""} onChange={(event) => updateGameData(selectedGame.appid, { status: event.target.value ? event.target.value as BacklogStatus : null })} className="cursor-pointer border border-[#d8c79a]/25 bg-black/70 px-4 py-3 text-xs text-[#f4f0e6] outline-none transition duration-200 hover:border-[#e4c66a]/60 focus:border-[#e4c66a] focus:ring-2 focus:ring-[#e4c66a]/15"><option value="">Add to backlog</option>{BACKLOG_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><p className="text-[9px] uppercase tracking-widest text-white/30">{priorities[String(selectedGame.appid)] ? `${priorities[String(selectedGame.appid)]} priority` : "No priority assigned"}</p></div>}
            </>}

            {section === "recommend" && <div className="max-w-3xl border-l border-[#e4c66a]/45 pl-6 sm:pl-10">
              <div className="flex flex-wrap items-center gap-2">{suggestionModes.map((mode) => <button key={mode.value} type="button" onClick={() => changeSuggestionMode(mode.value)} disabled={recommendationState === "loading"} className={`border px-3 py-2 text-[8px] uppercase tracking-[0.18em] outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[#e4c66a] active:scale-95 disabled:cursor-wait disabled:opacity-50 ${suggestionMode === mode.value ? "border-[#e4c66a] bg-[#e4c66a] text-black shadow-[0_0_18px_rgba(228,198,106,.15)]" : "border-[#d8c79a]/20 bg-black/30 text-white/40 hover:-translate-y-0.5 hover:border-[#e4c66a]/55 hover:bg-white/5 hover:text-white"}`}>{mode.label}</button>)}</div>
              <p className="mt-8 text-[9px] uppercase tracking-[0.35em] text-[#e4c66a]">{recommendationState === "loading" ? "Consulting the oracle..." : `The oracle has chosen / ${suggestionCandidates.length} eligible`}</p>
              <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[0.92] sm:text-7xl">{recommendation?.name ?? (recommendationState === "loading" ? "Finding your next game" : recommendationState === "error" ? "No matching games found" : "Start a New Game")}</h1>
              {recommendation && <><div className="mt-6 flex flex-wrap gap-2"><span className="border border-[#d8c79a]/20 bg-black/40 px-3 py-2 text-[9px] uppercase tracking-widest text-white/45">{formatHours(recommendation.playtime_forever)}</span><span className="border border-[#e4c66a]/30 bg-[#e4c66a]/10 px-3 py-2 text-[9px] uppercase tracking-widest text-[#e4c66a]">Score {recommendationScore}</span>{recommendationMetadata?.genres?.slice(0, 2).map((genre) => <span key={genre.id} className="border border-[#d8c79a]/20 bg-black/40 px-3 py-2 text-[9px] uppercase tracking-widest text-white/45">{genre.description}</span>)}</div><div className="mt-5 max-w-xl space-y-1 text-xs text-white/45">{recommendationBreakdown.slice(0, 3).map((item) => <p key={item.label}>{item.label} <span className="text-[#e4c66a]">+{item.points}</span></p>)}</div><div className="mt-8 flex flex-wrap gap-3"><a href={`steam://run/${recommendation.appid}`} className="bg-[#e4c66a] px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition duration-200 hover:-translate-y-0.5 hover:bg-[#f4dc8e] hover:shadow-[0_0_20px_rgba(228,198,106,.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c66a] active:translate-y-0 active:scale-95">Play now</a><button type="button" onClick={chooseAgain} disabled={recommendationState === "loading" || suggestionCandidates.length < 2} className="border border-[#d8c79a]/25 bg-black/40 px-6 py-3 text-xs uppercase tracking-widest outline-none transition duration-200 hover:-translate-y-0.5 hover:border-[#e4c66a]/60 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#e4c66a] active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35">{recommendationState === "loading" ? "Choosing..." : "Choose again"}</button><button type="button" aria-pressed={statuses[String(recommendation.appid)] === "wantToPlay"} onClick={() => updateGameData(recommendation.appid, { status: statuses[String(recommendation.appid)] === "wantToPlay" ? null : "wantToPlay" })} className={`border px-5 py-3 text-[9px] uppercase tracking-widest outline-none transition duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#e4c66a] active:translate-y-0 active:scale-95 ${statuses[String(recommendation.appid)] === "wantToPlay" ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-200 hover:border-red-300/50 hover:bg-red-300/10 hover:text-red-200" : "border-[#d8c79a]/25 bg-black/40 text-white/60 hover:border-[#e4c66a] hover:bg-[#e4c66a]/10 hover:text-[#e4c66a]"}`}>{statuses[String(recommendation.appid)] === "wantToPlay" ? "Saved ✓ — undo" : "Add to backlog"}</button></div></>}
              {!recommendation && recommendationState === "idle" && <button type="button" onClick={() => void prepareSuggestion(suggestionMode)} className="mt-6 bg-[#e4c66a] px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition duration-200 hover:-translate-y-0.5 hover:bg-[#f4dc8e] hover:shadow-[0_0_20px_rgba(228,198,106,.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c66a] active:translate-y-0 active:scale-95">Suggest a game</button>}
              {recommendationState === "error" && <button type="button" onClick={() => void prepareSuggestion(suggestionMode)} className="mt-6 border border-[#d8c79a]/25 bg-black/40 px-5 py-3 text-[9px] uppercase tracking-widest text-[#e4c66a] transition duration-200 hover:-translate-y-0.5 hover:border-[#e4c66a] hover:bg-[#e4c66a]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c66a] active:scale-95">Try again</button>}
            </div>}

            {section === "library" && <div><div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[9px] uppercase tracking-[0.3em] text-[#d8c79a]/45">{games.length} games owned / {trackedGames.length} backlogged</p><h1 className="mt-2 font-serif text-3xl sm:text-4xl">Your Collection</h1></div><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your library" className="w-full border-b border-[#d8c79a]/30 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-white/25 focus:border-[#e4c66a] sm:w-56" /></div>{filteredGames.length ? <div className="flex gap-4 overflow-x-auto pb-5">{filteredGames.slice(0, 20).map((game, index) => <button key={game.appid} type="button" onClick={() => setSelectedId(game.appid)} className={`relative min-w-52 overflow-hidden border bg-black/60 text-left transition duration-300 sm:min-w-64 ${selectedGame?.appid === game.appid ? "-translate-y-2 border-[#e4c66a] shadow-[0_18px_50px_rgba(0,0,0,.6)]" : "border-white/10 opacity-60 hover:opacity-100"}`}><GameImage appid={game.appid} name={game.name} iconHash={game.img_icon_url} /><span className="absolute left-3 top-3 bg-black/75 px-2 py-1 font-serif text-[9px] text-[#e4c66a]">{String(index + 1).padStart(2, "0")}</span><div className="border-t border-white/10 p-4"><p className="truncate font-serif text-lg">{game.name}</p><p className="mt-1 text-[9px] uppercase tracking-widest text-white/35">{statuses[String(game.appid)] ? BACKLOG_STATUS_OPTIONS.find((option) => option.value === statuses[String(game.appid)])?.label : formatHours(game.playtime_forever)}</p></div></button>)}</div> : <div className="border border-dashed border-[#d8c79a]/20 bg-black/30 p-8 text-center text-sm text-white/40">No games match your search.</div>}{selectedGame && <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#d8c79a]/15 pt-5"><a href={`steam://run/${selectedGame.appid}`} className="bg-[#e4c66a] px-5 py-3 text-xs font-bold uppercase tracking-widest text-black">Play now</a><select aria-label={`${selectedGame.name} backlog status`} value={statuses[String(selectedGame.appid)] ?? ""} onChange={(event) => updateGameData(selectedGame.appid, { status: event.target.value ? event.target.value as BacklogStatus : null })} className="border border-[#d8c79a]/25 bg-black/70 px-4 py-3 text-xs text-[#f4f0e6]"><option value="">No backlog status</option>{BACKLOG_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>}</div>}

            {section === "profile" && <div className="max-w-2xl"><p className="text-[9px] uppercase tracking-[0.35em] text-[#e4c66a]">Player record</p><h1 className="mt-4 font-serif text-5xl">{displayName}&apos;s Chronicle</h1><div className="mt-8 grid grid-cols-2 gap-px bg-[#d8c79a]/15 sm:grid-cols-4">{[[games.length,"Games owned"],[trackedGames.length,"Tracked"],[completedCount,"Completed"],[Math.round(games.reduce((total, game) => total + game.playtime_forever, 0) / 60),"Hours played"]].map(([value,label]) => <div key={label} className="bg-black/70 p-5"><p className="font-serif text-3xl text-[#e4c66a]">{value}</p><p className="mt-2 text-[8px] uppercase tracking-widest text-white/35">{label}</p></div>)}</div><div className="mt-6 h-1 bg-white/10"><div className="h-full bg-[#e4c66a]" style={{ width: `${trackedGames.length ? Math.max((completedCount / trackedGames.length) * 100, 3) : 3}%` }} /></div><p className="mt-2 text-right text-[9px] uppercase tracking-widest text-white/30">Campaign completion {trackedGames.length ? Math.round((completedCount / trackedGames.length) * 100) : 0}%</p></div>}
          </section>
        </div>}

        <footer className="border-t border-[#d8c79a]/15 pt-4 text-[8px] uppercase tracking-[0.22em] text-white/25">Build 01 / Menu concept</footer>
      </div>
    </main>
  );
}

type SimpleLibraryProps = {
  games: SteamGame[];
  allGames: SteamGame[];
  statuses: Record<string, BacklogStatus>;
  search: string;
  libraryFilter: BacklogStatus | "all";
  onSearch: (value: string) => void;
  onFilter: (value: BacklogStatus | "all") => void;
  onStatus: (appid: number, status: BacklogStatus | null) => void;
};

function SimpleLibrary({ games, allGames, statuses, search, libraryFilter, onSearch, onFilter, onStatus }: SimpleLibraryProps) {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[#d8c79a]/15 pb-6">
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#e4c66a]">Your collection</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Library</h1>
          <p className="mt-2 text-sm text-white/40">Browse games and organize your backlog.</p>
        </div>
        <input type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search games" className="w-full rounded-md border border-white/15 bg-black/60 px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-[#e4c66a] sm:w-72" />
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        <button type="button" onClick={() => onFilter("all")} className={`shrink-0 rounded-full border px-4 py-2 text-[9px] uppercase tracking-wider ${libraryFilter === "all" ? "border-[#e4c66a] bg-[#e4c66a] text-black" : "border-white/15 bg-black/40 text-white/45"}`}>All {allGames.length}</button>
        {BACKLOG_STATUS_OPTIONS.map((option) => {
          const count = allGames.filter((game) => statuses[String(game.appid)] === option.value).length;
          return <button key={option.value} type="button" onClick={() => onFilter(option.value)} className={`shrink-0 rounded-full border px-4 py-2 text-[9px] uppercase tracking-wider ${libraryFilter === option.value ? "border-[#e4c66a] bg-[#e4c66a] text-black" : "border-white/15 bg-black/40 text-white/45"}`}>{option.label} {count}</button>;
        })}
      </div>

      <p className="mt-5 text-xs text-white/35">{games.length} {games.length === 1 ? "game" : "games"}</p>
      {games.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{games.map((game) => <article key={game.appid} className="overflow-hidden rounded-lg border border-white/10 bg-black/65"><GameImage appid={game.appid} name={game.name} iconHash={game.img_icon_url} /><div className="p-4"><h2 className="truncate font-medium">{game.name}</h2><p className="mt-1 text-xs text-white/35">{formatHours(game.playtime_forever)}</p><div className="mt-4 flex gap-2"><a href={`steam://run/${game.appid}`} className="rounded-md bg-[#e4c66a] px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-black">Play</a><select aria-label={`${game.name} classification`} value={statuses[String(game.appid)] ?? ""} onChange={(event) => onStatus(game.appid, event.target.value ? event.target.value as BacklogStatus : null)} className="min-w-0 flex-1 rounded-md border border-white/15 bg-[#11120f] px-2 py-2 text-xs"><option value="">No status</option>{BACKLOG_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div></div></article>)}</div> : <div className="mt-8 rounded-lg border border-dashed border-white/15 bg-black/30 p-10 text-center text-sm text-white/40">No games match your search and filters.</div>}
    </div>
  );
}
