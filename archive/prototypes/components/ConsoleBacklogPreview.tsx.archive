"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type Status = "Want to play" | "Playing" | "Completed" | "Paused" | "Dropped";
type Priority = "High" | "Medium" | "Low";
type View = "Home" | "Backlog" | "Library";
type RecommendationMode = "Backlog" | "Continue" | "Something new" | "Quick game" | "With friends";

type PreviewGame = {
  appid: number;
  title: string;
  hours: number;
  recentHours: number;
  status: Status;
  priority: Priority;
  progress: number;
  rating: number;
  note: string;
};

const initialGames: PreviewGame[] = [
  { appid: 1245620, title: "ELDEN RING", hours: 42.6, recentHours: 5.2, status: "Playing", priority: "High", progress: 61, rating: 5, note: "Continue exploring Altus Plateau." },
  { appid: 1086940, title: "Baldur's Gate 3", hours: 31.4, recentHours: 3.8, status: "Playing", priority: "High", progress: 46, rating: 5, note: "Return to the Shadow-Cursed Lands." },
  { appid: 1145360, title: "Hades", hours: 0, recentHours: 0, status: "Want to play", priority: "High", progress: 0, rating: 0, note: "Try this when I want a shorter session." },
  { appid: 367520, title: "Hollow Knight", hours: 1.3, recentHours: 0, status: "Paused", priority: "Medium", progress: 12, rating: 4, note: "Find the next bench before continuing." },
  { appid: 1091500, title: "Cyberpunk 2077", hours: 24.8, recentHours: 1.6, status: "Playing", priority: "Medium", progress: 38, rating: 4, note: "Finish the Panam quest line." },
  { appid: 413150, title: "Stardew Valley", hours: 86.5, recentHours: 0, status: "Completed", priority: "Low", progress: 100, rating: 5, note: "Completed the community center." },
  { appid: 292030, title: "The Witcher 3", hours: 67.2, recentHours: 0, status: "Paused", priority: "Low", progress: 74, rating: 5, note: "Resume Blood and Wine later." },
  { appid: 1174180, title: "Red Dead Redemption 2", hours: 0, recentHours: 0, status: "Want to play", priority: "Medium", progress: 0, rating: 0, note: "Save for a long weekend." },
];

const recommendationModes: RecommendationMode[] = ["Backlog", "Continue", "Something new", "Quick game", "With friends"];
const statusColors: Record<Status, string> = {
  "Want to play": "text-sky-200 border-sky-300/35 bg-sky-300/10",
  Playing: "text-emerald-200 border-emerald-300/35 bg-emerald-300/10",
  Completed: "text-violet-200 border-violet-300/35 bg-violet-300/10",
  Paused: "text-amber-200 border-amber-300/35 bg-amber-300/10",
  Dropped: "text-red-200 border-red-300/35 bg-red-300/10",
};

function headerUrl(appid: number) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

function Artwork({ game, className = "object-cover" }: { game: PreviewGame; className?: string }) {
  return <Image src={headerUrl(game.appid)} alt={`${game.title} artwork`} fill unoptimized sizes="(max-width: 768px) 100vw, 50vw" className={className} />;
}

function StatusChip({ status }: { status: Status }) {
  return <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${statusColors[status]}`}>{status}</span>;
}

export default function ConsoleBacklogPreview() {
  const [games, setGames] = useState(initialGames);
  const [view, setView] = useState<View>("Home");
  const [selectedId, setSelectedId] = useState(initialGames[0].appid);
  const [mode, setMode] = useState<RecommendationMode>("Backlog");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const selected = games.find((game) => game.appid === selectedId) ?? games[0];

  const visibleGames = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return games.filter((game) =>
      (!normalizedSearch || game.title.toLowerCase().includes(normalizedSearch)) &&
      (statusFilter === "All" || game.status === statusFilter)
    );
  }, [games, search, statusFilter]);

  const counts = useMemo(() => Object.fromEntries(
    (["Playing", "Want to play", "Completed", "Paused"] as Status[]).map((status) => [status, games.filter((game) => game.status === status).length])
  ), [games]);

  function updateSelected(update: Partial<PreviewGame>) {
    setGames((current) => current.map((game) => game.appid === selectedId ? { ...game, ...update } : game));
  }

  function chooseMode(nextMode: RecommendationMode) {
    const candidatesByMode: Record<RecommendationMode, PreviewGame[]> = {
      Backlog: games.filter((game) => game.status === "Want to play" || game.status === "Paused"),
      Continue: games.filter((game) => game.status === "Playing"),
      "Something new": games.filter((game) => game.hours === 0),
      "Quick game": games.filter((game) => game.hours < 2),
      "With friends": games.filter((game) => game.appid === 1245620 || game.appid === 1091500),
    };
    const candidates = candidatesByMode[nextMode];
    setMode(nextMode);
    if (candidates[0]) setSelectedId(candidates[0].appid);
    setView("Home");
  }

  return (
    <main className="min-h-screen bg-[#050708] text-white">
      <div className="relative min-h-screen overflow-hidden">
        <Artwork game={selected} className="object-cover opacity-45 transition duration-700" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050708] via-[#050708]/30 to-black/30" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.10]" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.16) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="relative z-10 mx-auto max-w-[1600px] px-5 pb-16 sm:px-8 lg:px-12">
          <nav className="flex flex-wrap items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-8"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 font-mono text-xs font-black text-cyan-100">GB</div><div><p className="text-sm font-black tracking-[0.18em]">PLAYQUEUE</p><p className="font-mono text-[8px] tracking-[0.2em] text-cyan-500/70">STEAM_LINK_READY</p></div></div><div className="hidden gap-2 md:flex">{(["Home", "Backlog", "Library"] as View[]).map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-full px-4 py-2 text-xs transition ${view === item ? "bg-white text-black" : "text-white/45 hover:bg-white/8 hover:text-white"}`}>{item}</button>)}</div></div>
            <div className="flex items-center gap-4"><Link href="/design-preview" className="hidden text-[10px] uppercase tracking-widest text-white/35 hover:text-cyan-200 sm:block">Design lab</Link><Link href="/" className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-xs backdrop-blur hover:bg-white/10">Current app</Link><div className="grid size-9 place-items-center rounded-full bg-white/10 text-[10px] font-bold">DS</div></div>
          </nav>

          <div className="flex gap-2 overflow-x-auto pb-2 pt-2 md:hidden">{(["Home", "Backlog", "Library"] as View[]).map((item) => <button key={item} onClick={() => setView(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs ${view === item ? "bg-white text-black" : "bg-white/8 text-white/60"}`}>{item}</button>)}</div>

          {view === "Home" && (
            <>
              <section className="grid min-h-[500px] items-center gap-8 py-12 lg:grid-cols-[1fr_340px]">
                <div className="max-w-3xl"><div className="flex gap-2 overflow-x-auto pb-2">{recommendationModes.map((item) => <button key={item} onClick={() => chooseMode(item)} className={`shrink-0 border px-3 py-1.5 font-mono text-[9px] tracking-widest ${mode === item ? "border-cyan-300 bg-cyan-300 text-[#031012]" : "border-white/15 bg-black/20 text-white/45"}`}>{item.toUpperCase()}</button>)}</div><p className="mt-9 font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300">Tonight&apos;s recommendation · Match 092</p><h1 className="mt-4 text-5xl font-black leading-none tracking-[-0.05em] sm:text-7xl lg:text-8xl">{selected.title}</h1><p className="mt-5 text-sm text-white/60">{selected.status} · {selected.hours ? `${selected.hours} hours played` : "Unplayed"} · {selected.priority} priority</p><div className="mt-8 flex flex-wrap gap-3"><button className="flex items-center gap-3 rounded-full bg-white py-3 pl-3 pr-6 text-sm font-bold text-black"><span className="grid size-7 place-items-center rounded-full bg-cyan-300 font-mono text-[10px]">A</span>Play game</button><button className="rounded-full border border-white/20 bg-black/25 px-5 py-3 text-xs backdrop-blur">Try another</button><button className="px-4 py-3 text-xs text-white/40">Not for me</button></div></div>
                <aside className="border border-cyan-300/20 bg-[#031012]/70 p-5 backdrop-blur [clip-path:polygon(0_0,calc(100%-18px)_0,100%_18px,100%_100%,0_100%)]"><div className="flex justify-between font-mono text-[9px] tracking-widest text-cyan-600"><span>RECOMMENDATION DATA</span><span>105 PTS</span></div><div className="mt-5 space-y-4">{[["Mode match",25],["Backlog priority",20],["Genre affinity",30],["Friend activity",20],["Recent activity",10]].map(([label,value]) => <div key={label as string}><div className="flex justify-between text-[10px]"><span className="text-white/45">{label}</span><span className="text-cyan-200">+{value}</span></div><div className="mt-1.5 h-1 bg-white/8"><div className="h-full bg-gradient-to-r from-cyan-500 to-lime-300" style={{ width: `${Number(value) * 3}%` }} /></div></div>)}</div><button onClick={() => setView("Backlog")} className="mt-6 w-full border border-cyan-300/25 py-2.5 font-mono text-[9px] tracking-widest text-cyan-200">EDIT BACKLOG DETAILS</button></aside>
              </section>

              <section><div className="mb-4 flex items-end justify-between"><div><p className="font-mono text-[9px] tracking-[0.25em] text-cyan-500">ACTIVE_QUEUE</p><h2 className="mt-1 text-xl font-bold">Continue playing</h2></div><button onClick={() => setView("Library")} className="text-xs text-white/40">View library →</button></div><div className="flex gap-3 overflow-x-auto pb-5">{games.filter((game) => game.status === "Playing").map((game) => <button key={game.appid} onClick={() => setSelectedId(game.appid)} className={`min-w-64 overflow-hidden rounded-xl border text-left transition ${selectedId === game.appid ? "border-cyan-300" : "border-white/10 opacity-65 hover:opacity-100"}`}><div className="relative aspect-[616/353]"><Artwork game={game}/><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/><StatusChip status={game.status}/><p className="absolute inset-x-0 bottom-0 truncate p-4 text-sm font-bold">{game.title}</p></div></button>)}</div></section>

              <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{(["Playing", "Want to play", "Completed", "Paused"] as Status[]).map((status) => <button key={status} onClick={() => { setStatusFilter(status); setView("Backlog"); }} className="rounded-xl border border-white/10 bg-black/25 p-4 text-left backdrop-blur"><p className="text-3xl font-black">{counts[status]}</p><p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{status}</p></button>)}</section>
            </>
          )}

          {view === "Backlog" && (
            <section className="py-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[9px] tracking-[0.25em] text-cyan-400">BACKLOG_CONTROL</p><h1 className="mt-2 text-4xl font-black">Your active queue</h1></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as Status | "All")} className="rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs"><option>All</option>{Object.keys(statusColors).map((status) => <option key={status}>{status}</option>)}</select></div><div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleGames.map((game, index) => <button key={game.appid} onClick={() => setSelectedId(game.appid)} className={`overflow-hidden rounded-xl border bg-black/35 p-2 text-left backdrop-blur ${selectedId === game.appid ? "border-cyan-300" : "border-white/10"}`}><div className="relative aspect-[616/353] overflow-hidden rounded-lg"><Artwork game={game}/><span className="absolute left-2 top-2 bg-black/70 px-2 py-1 font-mono text-[8px] text-cyan-200">0{index+1}</span></div><div className="p-2"><p className="truncate text-sm font-bold">{game.title}</p><div className="mt-3 flex items-center justify-between"><StatusChip status={game.status}/><span className="text-[10px] text-white/40">{game.priority}</span></div></div></button>)}</div><GameEditor game={selected} update={updateSelected}/></div></section>
          )}

          {view === "Library" && (
            <section className="py-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[9px] tracking-[0.25em] text-cyan-400">FULL_LIBRARY / {games.length} DEMO TITLES</p><h1 className="mt-2 text-4xl font-black">Browse your games</h1></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search library" className="w-full rounded-full border border-white/15 bg-black/45 px-5 py-3 text-sm outline-none placeholder:text-white/30 focus:border-cyan-300 sm:w-72" /></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleGames.map((game) => <button key={game.appid} onClick={() => { setSelectedId(game.appid); setView("Backlog"); }} className="group overflow-hidden rounded-xl border border-white/10 bg-black/35 text-left backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/60"><div className="relative aspect-[616/353]"><Artwork game={game} className="object-contain"/><div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"/><div className="absolute bottom-3 left-3"><StatusChip status={game.status}/></div></div><div className="p-4"><p className="truncate font-bold">{game.title}</p><p className="mt-1 text-xs text-white/40">{game.hours ? `${game.hours} hours played` : "Unplayed"}</p></div></button>)}</div></section>
          )}
        </div>
      </div>
    </main>
  );
}

function GameEditor({ game, update }: { game: PreviewGame; update: (update: Partial<PreviewGame>) => void }) {
  return (
    <aside className="h-fit border border-cyan-300/20 bg-[#031012]/80 p-5 backdrop-blur [clip-path:polygon(0_0,calc(100%-18px)_0,100%_18px,100%_100%,0_100%)]"><p className="font-mono text-[9px] tracking-[0.25em] text-cyan-500">EDIT_GAME_RECORD</p><h2 className="mt-3 text-2xl font-black">{game.title}</h2><p className="mt-1 text-xs text-white/40">{game.hours} hours played · {game.progress}% progress</p><label className="mt-6 block text-[10px] uppercase tracking-widest text-white/45">Status<select value={game.status} onChange={(event) => update({ status: event.target.value as Status })} className="mt-2 w-full border border-white/15 bg-[#071012] px-3 py-2.5 text-sm normal-case tracking-normal">{Object.keys(statusColors).map((status) => <option key={status}>{status}</option>)}</select></label><label className="mt-4 block text-[10px] uppercase tracking-widest text-white/45">Priority<select value={game.priority} onChange={(event) => update({ priority: event.target.value as Priority })} className="mt-2 w-full border border-white/15 bg-[#071012] px-3 py-2.5 text-sm normal-case tracking-normal">{["High", "Medium", "Low"].map((priority) => <option key={priority}>{priority}</option>)}</select></label><label className="mt-4 block text-[10px] uppercase tracking-widest text-white/45">Personal rating<select value={game.rating} onChange={(event) => update({ rating: Number(event.target.value) })} className="mt-2 w-full border border-white/15 bg-[#071012] px-3 py-2.5 text-sm normal-case tracking-normal"><option value={0}>Not rated</option>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select></label><label className="mt-4 block text-[10px] uppercase tracking-widest text-white/45">Notes<textarea value={game.note} onChange={(event) => update({ note: event.target.value })} rows={4} className="mt-2 w-full resize-y border border-white/15 bg-[#071012] px-3 py-2.5 text-sm normal-case tracking-normal" /></label><p className="mt-5 border-t border-white/10 pt-4 font-mono text-[9px] text-cyan-700">LOCAL_PREVIEW_STATE / CHANGES_NOT_SAVED</p></aside>
  );
}
