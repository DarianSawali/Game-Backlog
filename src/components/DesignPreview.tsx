"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type DesignId =
  | "console"
  | "arcade"
  | "hybrid"
  | "showcase"
  | "gallery"
  | "achievements"
  | "minimal";

type Game = {
  appid: number;
  title: string;
  meta: string;
  status: string;
  progress: number;
};

const designs: { id: DesignId; label: string; note: string }[] = [
  { id: "console", label: "Console Library", note: "Artwork-first and cinematic" },
  { id: "arcade", label: "Arcade Terminal", note: "Technical and neon" },
  { id: "hybrid", label: "Console Terminal", note: "A blend of both directions" },
  { id: "showcase", label: "Console Showcase", note: "The strongest console emphasis" },
  { id: "gallery", label: "Box-art Gallery", note: "Celebrate the collection" },
  { id: "achievements", label: "Achievement Room", note: "Progress as the identity" },
  { id: "minimal", label: "Minimal Launcher", note: "Choose and play quickly" },
];

const games: Game[] = [
  { appid: 1245620, title: "ELDEN RING", meta: "42.6 hours", status: "HIGH PRIORITY", progress: 61 },
  { appid: 1086940, title: "Baldur's Gate 3", meta: "31.4 hours", status: "PLAYING", progress: 46 },
  { appid: 1145360, title: "Hades", meta: "Unplayed", status: "WANT TO PLAY", progress: 4 },
  { appid: 367520, title: "Hollow Knight", meta: "1.3 hours", status: "PAUSED", progress: 12 },
  { appid: 1091500, title: "Cyberpunk 2077", meta: "24.8 hours", status: "PLAYING", progress: 38 },
  { appid: 413150, title: "Stardew Valley", meta: "86.5 hours", status: "COMPLETED", progress: 100 },
];

const modes = ["BACKLOG", "CONTINUE", "NEW GAME", "QUICK PICK", "WITH FRIENDS"];

function artwork(appid: number) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

function boxArtwork(appid: number) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_600x900_2x.jpg`;
}

function GameArt({ game, className = "object-cover" }: { game: Game; className?: string }) {
  return <Image src={artwork(game.appid)} alt={`${game.title} artwork`} fill unoptimized sizes="(max-width: 768px) 100vw, 50vw" className={className} />;
}

function ConsoleDesign() {
  const [selected, setSelected] = useState(0);
  const game = games[selected];

  return (
    <div className="min-h-[820px] overflow-hidden rounded-[2rem] bg-[#0a0b0d] text-[#f5f0e8] shadow-2xl shadow-black/50">
      <div className="relative min-h-[520px]">
        <GameArt game={game} className="object-cover opacity-55 transition duration-500" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090a0c] via-[#090a0c]/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0d] via-transparent to-black/30" />
        <nav className="relative z-10 flex items-center justify-between px-7 py-6 lg:px-10">
          <p className="text-sm font-black tracking-[0.25em]">PLAYQUEUE</p>
          <div className="hidden gap-8 text-xs uppercase tracking-[0.16em] text-stone-400 md:flex"><span className="text-orange-400">Home</span><span>Collection</span><span>Friends</span></div>
          <div className="size-9 rounded-full border border-orange-400/50 bg-orange-400/10" />
        </nav>
        <div className="relative z-10 max-w-2xl px-7 pt-24 lg:px-10 lg:pt-32">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-400">Tonight&apos;s pick · Backlog mode</p>
          <h2 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">{game.title}</h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-stone-300">Selected because it is high priority, matches your favorite genres, and two friends played it this week.</p>
          <div className="mt-7 flex gap-3"><button className="rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-black">▶ Play</button><button className="rounded-full border border-white/20 bg-black/20 px-6 py-3 text-sm backdrop-blur">Why this game?</button></div>
        </div>
      </div>
      <section className="px-7 pb-10 lg:px-10">
        <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold">Your next games</h3><p className="text-xs text-stone-500">LB / RB Browse</p></div>
        <div className="flex gap-4 overflow-x-auto pb-5">
          {games.map((item, index) => (
            <button key={item.appid} onClick={() => setSelected(index)} className={`min-w-56 text-left transition ${selected === index ? "scale-100" : "opacity-55 hover:opacity-100"}`}>
              <div className={`relative aspect-[616/353] overflow-hidden rounded-xl border-2 ${selected === index ? "border-orange-400 shadow-lg shadow-orange-950" : "border-transparent"}`}><GameArt game={item} /></div>
              <p className="mt-3 truncate text-sm font-bold">{item.title}</p><p className="mt-1 text-xs text-stone-500">{item.meta}</p>
            </button>
          ))}
        </div>
        <div className="flex gap-5 border-t border-white/8 pt-5 text-[11px] uppercase tracking-widest text-stone-500"><span><b className="mr-2 text-orange-400">A</b>Select</span><span><b className="mr-2 text-sky-400">X</b>Details</span><span><b className="mr-2 text-yellow-300">Y</b>Filter</span></div>
      </section>
    </div>
  );
}

function ArcadeDesign() {
  const [mode, setMode] = useState("BACKLOG");
  return (
    <div className="relative min-h-[820px] overflow-hidden rounded-lg border border-emerald-400/30 bg-[#020706] font-mono text-emerald-300 shadow-2xl shadow-emerald-950/40" style={{ backgroundImage: "linear-gradient(rgba(16,185,129,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,.035) 1px,transparent 1px)", backgroundSize: "24px 24px" }}>
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.5) 4px)" }} />
      <header className="relative flex flex-wrap items-center justify-between gap-4 border-b border-emerald-400/20 px-6 py-5"><div><p className="text-xs tracking-[0.35em] text-emerald-500">SYSTEM://GAME_SELECTOR</p><h2 className="mt-1 text-2xl font-bold text-emerald-200">BACKLOG_OS v5.0</h2></div><p className="animate-pulse text-xs">● STEAM LINK ACTIVE</p></header>
      <div className="relative grid gap-6 p-6 lg:grid-cols-[240px_1fr]">
        <aside className="border border-emerald-400/20 bg-emerald-950/10 p-4"><p className="text-xs text-emerald-600">SELECT_ROUTINE</p><div className="mt-4 space-y-2">{modes.map(item => <button key={item} onClick={() => setMode(item)} className={`block w-full border px-3 py-2 text-left text-xs ${mode === item ? "border-emerald-300 bg-emerald-400/15 text-emerald-100" : "border-emerald-900 text-emerald-600 hover:border-emerald-600"}`}>{mode === item ? "> " : "  "}{item.replace(" ", "_")}</button>)}</div><div className="mt-8 border-t border-emerald-900 pt-4 text-[11px] leading-6 text-emerald-700"><p>LIBRARY_SIZE.....247</p><p>QUEUED_GAMES......24</p><p>ACTIVE_PLAYERS.....4</p><p>SYNC_STATUS.......OK</p></div></aside>
        <section><div className="border border-emerald-400/30 bg-black/60 p-2"><div className="relative aspect-[16/7] min-h-64 overflow-hidden"><GameArt game={games[2]} className="object-cover opacity-45 grayscale"/><div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent"/><div className="absolute inset-0 flex max-w-xl flex-col justify-center p-6"><p className="text-xs tracking-[0.3em]">OUTPUT://PRIMARY_MATCH</p><h3 className="mt-3 text-4xl font-bold text-emerald-100 sm:text-6xl">HADES</h3><p className="mt-3 text-xs leading-6 text-emerald-500">UNPLAYED [+30] / GENRE_MATCH [+25] / HIGH_CONFIDENCE [92%]</p><button className="mt-6 w-fit border border-emerald-300 bg-emerald-300 px-5 py-2 text-xs font-black text-black">EXECUTE_GAME()</button></div></div></div>
          <p className="mt-6 text-xs text-emerald-600">RECENT_PROCESSES</p><div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{games.slice(0,3).map((game,index)=><div key={game.appid} className="border border-emerald-900 bg-black/50 p-3"><p className="text-[10px] text-emerald-800">PROC_00{index+1}</p><p className="mt-2 truncate text-sm text-emerald-200">{game.title}</p><div className="mt-3 h-1 bg-emerald-950"><div className="h-full bg-emerald-400" style={{width:`${game.progress}%`}}/></div></div>)}</div>
        </section>
      </div>
      <footer className="relative border-t border-emerald-400/20 px-6 py-3 text-[10px] text-emerald-800">READY_ <span className="text-emerald-300">█</span> &nbsp; [F] FILTER &nbsp; [R] RANDOMIZE &nbsp; [ENTER] LAUNCH</footer>
    </div>
  );
}

function ConsoleShowcaseDesign() {
  const [selected, setSelected] = useState(1);
  const game = games[selected];

  return (
    <div className="relative min-h-[850px] overflow-hidden rounded-[2.25rem] border border-cyan-300/15 bg-[#080a0d] text-white shadow-2xl shadow-black/60">
      <GameArt game={game} className="object-cover opacity-60 transition duration-700" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/35 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080a0d] via-transparent to-black/45" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.16) 1px,transparent 1px)", backgroundSize: "42px 42px" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 4px,rgba(0,0,0,.8) 5px)" }} />

      <div className="relative z-10 flex min-h-[850px] flex-col">
        <nav className="flex items-center justify-between px-7 py-6 lg:px-11">
          <div className="flex items-center gap-4">
            <div className="grid size-10 place-items-center rounded-full border border-cyan-300/35 bg-black/30 text-xs font-black text-cyan-100 backdrop-blur">GB</div>
            <div className="hidden items-center gap-7 text-xs font-medium text-white/55 md:flex"><span className="text-white">Home</span><span>Games</span><span>Backlog</span><span>Friends</span></div>
          </div>
          <div className="flex items-center gap-4"><p className="hidden font-mono text-[9px] tracking-[0.2em] text-cyan-300/60 sm:block">SYS://LIBRARY_READY</p><div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 py-1.5 pl-4 pr-2 backdrop-blur"><div className="text-right"><p className="text-[11px] font-semibold">Darian</p><p className="text-[9px] text-emerald-300">Online</p></div><div className="grid size-8 place-items-center rounded-full bg-white/10 text-[10px] font-bold">DS</div></div></div>
        </nav>

        <section className="flex flex-1 items-center px-7 pb-36 lg:px-11">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3"><span className="h-px w-10 bg-cyan-300"/><p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Continue playing</p><span className="font-mono text-[9px] text-cyan-400/50">MATCH_092</span></div>
            <h2 className="mt-5 text-5xl font-black leading-none tracking-[-0.045em] drop-shadow-2xl sm:text-7xl lg:text-8xl">{game.title}</h2>
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/65">{game.status} · {game.meta} · Your most relevant game right now</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-3 rounded-full bg-white py-3 pl-3 pr-6 text-sm font-bold text-black transition hover:scale-105"><span className="grid size-7 place-items-center rounded-full bg-cyan-300 font-mono text-[10px] text-[#041012]">A</span>Play game</button>
              <button className="grid size-13 place-items-center rounded-full border border-white/20 bg-black/30 text-lg backdrop-blur transition hover:bg-white/15" aria-label="Game details">•••</button>
              <div className="ml-2 hidden h-1 w-40 overflow-hidden rounded-full bg-white/15 sm:block"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-cyan-300" style={{ width: `${game.progress}%` }}/></div>
              <span className="hidden text-xs text-white/50 sm:block">{game.progress}%</span>
            </div>
          </div>
        </section>

        <section className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#080a0d] via-[#080a0d]/95 to-transparent px-7 pb-8 pt-24 lg:px-11">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold">Recently played</p><p className="mt-1 text-[10px] text-white/40">Move through your library</p></div><p className="text-[10px] uppercase tracking-widest text-white/35">LB &nbsp; Browse &nbsp; RB</p></div>
          <div className="flex items-end gap-3 overflow-x-auto pb-2 pt-2">
            {games.map((item, index) => (
              <button key={item.appid} onClick={() => setSelected(index)} className={`relative shrink-0 overflow-hidden rounded-xl transition duration-300 ${selected === index ? "w-64 -translate-y-2 ring-3 ring-cyan-300 shadow-2xl shadow-cyan-950/40" : "w-40 opacity-55 hover:-translate-y-1 hover:opacity-90 sm:w-48"}`}>
                <div className="relative aspect-[616/353]"><GameArt game={item}/><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/><span className="absolute left-2 top-2 rounded bg-black/65 px-1.5 py-1 font-mono text-[8px] text-cyan-200/80">0{index + 1}</span></div>
                <div className="absolute inset-x-0 bottom-0 p-3 text-left"><p className="truncate text-xs font-bold">{item.title}</p>{selected === index && <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-cyan-300">{item.status}</p>}</div>
              </button>
            ))}
            <button className="grid aspect-[616/353] w-40 shrink-0 place-items-center rounded-xl border border-dashed border-white/15 bg-black/25 text-xs text-white/40 backdrop-blur sm:w-48">View all games →</button>
          </div>
          <div className="mt-3 flex gap-5 border-t border-cyan-300/10 pt-4 font-mono text-[9px] tracking-widest text-white/35"><span><b className="text-cyan-300">A</b> SELECT</span><span><b className="text-sky-300">X</b> DETAILS</span><span><b className="text-yellow-300">Y</b> FILTER</span><span className="ml-auto hidden text-cyan-800 sm:block">QUEUE_SYNC_OK / LATENCY_24MS</span></div>
        </section>
      </div>
    </div>
  );
}

function BoxArtGalleryDesign() {
  const [selected, setSelected] = useState(0);
  const game = games[selected];

  return (
    <div className="min-h-[850px] overflow-hidden rounded-3xl bg-[#d8d2c5] text-[#191816] shadow-2xl shadow-black/40">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/15 px-7 py-7 lg:px-10">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#756f64]">Personal archive · 247 titles</p><h2 className="mt-2 font-serif text-4xl tracking-tight">The Collection</h2></div>
        <div className="flex gap-6 text-xs font-medium text-[#777166]"><span className="text-black">All games</span><span>Playing</span><span>Backlog</span><span>Finished</span></div>
      </header>

      <div className="grid gap-8 p-7 lg:grid-cols-[1fr_330px] lg:p-10">
        <section>
          <div className="flex items-end justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-[#817a6e]">Shelf 01</p><h3 className="mt-1 font-serif text-2xl">Currently curated</h3></div><button className="text-xs underline underline-offset-4">Sort by priority</button></div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
            {games.map((item, index) => (
              <button key={item.appid} onClick={() => setSelected(index)} className={`group text-left transition ${selected === index ? "-translate-y-2" : "opacity-75 hover:-translate-y-1 hover:opacity-100"}`}>
                <div className={`relative aspect-[2/3] overflow-hidden rounded-sm bg-[#aaa397] shadow-[0_12px_25px_rgba(28,24,18,.25)] ${selected === index ? "ring-4 ring-[#cc3f2b] ring-offset-4 ring-offset-[#d8d2c5]" : ""}`}>
                  <Image src={boxArtwork(item.appid)} alt={`${item.title} cover`} fill unoptimized sizes="(max-width: 768px) 50vw, 20vw" className="object-cover" />
                  {item.progress === 100 && <span className="absolute right-2 top-2 rotate-6 border-2 border-[#f1dca7] bg-[#8c2f24] px-2 py-1 text-[9px] font-black uppercase text-[#f7e8bd]">Complete</span>}
                  {item.status === "HIGH PRIORITY" && <span className="absolute -left-7 top-5 -rotate-45 bg-[#e7bd3d] px-8 py-1 text-[8px] font-black uppercase">Priority</span>}
                </div>
                <p className="mt-3 truncate font-serif text-base font-semibold">{item.title}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-[#817a6e]">{item.status}</p>
              </button>
            ))}
          </div>
          <div className="mt-10 h-3 rounded-sm bg-gradient-to-b from-[#695a46] to-[#342b20] shadow-[0_8px_16px_rgba(34,28,20,.35)]" />
        </section>

        <aside className="h-fit border border-black/15 bg-[#e5dfd2] p-6 shadow-[8px_8px_0_rgba(44,39,31,.12)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#9a493c]">Selected case</p>
          <h3 className="mt-3 font-serif text-3xl leading-tight">{game.title}</h3>
          <p className="mt-2 text-sm text-[#746e63]">{game.status} · {game.meta}</p>
          <div className="my-6 border-y border-black/15 py-5"><p className="font-serif text-lg italic">“A strong choice for your next evening session.”</p><p className="mt-3 text-xs leading-5 text-[#746e63]">Recommended from your priority, recent genres, and current play rotation.</p></div>
          <dl className="grid grid-cols-2 gap-4 text-xs"><div><dt className="text-[#8d867a]">Progress</dt><dd className="mt-1 text-lg font-bold">{game.progress}%</dd></div><div><dt className="text-[#8d867a]">Personal score</dt><dd className="mt-1 text-lg font-bold">4.5 / 5</dd></div></dl>
          <button className="mt-7 w-full bg-[#1d1b18] px-5 py-3 text-xs font-bold uppercase tracking-widest text-[#f0ebe1]">Play from collection</button>
        </aside>
      </div>
    </div>
  );
}

function AchievementRoomDesign() {
  return (
    <div className="min-h-[850px] overflow-hidden rounded-3xl bg-[#101419] text-[#e9edf0] shadow-2xl shadow-black/50">
      <header className="border-b border-[#d6a84b]/20 bg-gradient-to-r from-[#171d24] to-[#101419] px-7 py-7 lg:px-10"><div className="flex flex-wrap items-center justify-between gap-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#d6a84b]">Player record / Season 2026</p><h2 className="mt-2 text-3xl font-black tracking-tight">Darian&apos;s Achievement Room</h2></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-2xl font-black text-[#f0c66d]">LVL 42</p><p className="text-[9px] uppercase tracking-widest text-slate-500">Library explorer</p></div><div className="grid size-14 place-items-center rounded-full border-2 border-[#d6a84b] bg-[#d6a84b]/10 text-xl">★</div></div></div></header>
      <div className="p-7 lg:p-10">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["63","Games completed","+4 this season"],["1,284h","Total playtime","Across 247 games"],["18","Rare milestones","Top 12%"],["72%","Backlog progress","Personal best"]].map(([value,label,note],index)=><div key={label} className="relative overflow-hidden border border-white/8 bg-[#171d24] p-5"><div className="absolute right-0 top-0 size-16 bg-gradient-to-bl from-[#d6a84b]/15 to-transparent"/><p className="text-3xl font-black text-[#f0c66d]">{value}</p><p className="mt-2 text-xs font-bold uppercase tracking-wider">{label}</p><p className="mt-1 text-[10px] text-slate-500">{note}</p><span className="absolute bottom-2 right-3 text-[10px] text-[#d6a84b]/30">0{index+1}</span></div>)}</section>
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border border-white/8 bg-[#151a20] p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d6a84b]">Active objective</p><h3 className="mt-2 text-2xl font-black">Complete the Lands Between</h3></div><span className="rounded-full border border-[#d6a84b]/30 bg-[#d6a84b]/10 px-3 py-1 text-[10px] text-[#edc878]">LEGENDARY</span></div><div className="relative mt-5 aspect-[16/7] overflow-hidden"><GameArt game={games[0]} /><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/><div className="absolute inset-x-0 bottom-0 p-5"><p className="text-sm font-bold">ELDEN RING</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full bg-gradient-to-r from-[#9d6f24] to-[#f2d382]" style={{width:"61%"}}/></div><div className="mt-2 flex justify-between text-[10px] text-slate-400"><span>42.6 hours played</span><span>61% complete</span></div></div></div><div className="mt-5 flex gap-3"><button className="bg-[#d6a84b] px-5 py-3 text-xs font-black text-[#15120b]">CONTINUE OBJECTIVE</button><button className="border border-white/10 px-5 py-3 text-xs">VIEW MILESTONES</button></div></div>
          <aside className="border border-white/8 bg-[#151a20] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d6a84b]">Recent unlocks</p><div className="mt-5 space-y-4">{games.slice(1,5).map((game,index)=><div key={game.appid} className="flex items-center gap-4 border-b border-white/6 pb-4"><div className="grid size-12 shrink-0 place-items-center rounded-full border border-[#d6a84b]/30 bg-[#d6a84b]/8 text-lg text-[#e6bd68]">{["◆","✦","▲","●"][index]}</div><div className="min-w-0"><p className="truncate text-sm font-bold">{game.title}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{game.status} · {game.progress}%</p></div><span className="ml-auto text-[10px] text-[#d6a84b]">+{25-index*5} XP</span></div>)}</div></aside>
        </section>
      </div>
    </div>
  );
}

function MinimalLauncherDesign() {
  const [selected, setSelected] = useState(4);
  const game = games[selected];

  return (
    <div className="relative min-h-[850px] overflow-hidden rounded-[2rem] bg-black text-white shadow-2xl shadow-black/70">
      <GameArt game={game} className="object-cover opacity-75 transition duration-700" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/10 to-transparent"/><div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/25"/>
      <div className="relative z-10 flex min-h-[850px] flex-col justify-between p-7 lg:p-11">
        <header className="flex items-center justify-between"><p className="text-sm font-bold tracking-[0.2em]">PLAY</p><div className="flex items-center gap-3"><button className="grid size-10 place-items-center rounded-full bg-black/25 text-lg backdrop-blur" aria-label="Search">⌕</button><div className="size-9 rounded-full border border-white/25 bg-white/10"/></div></header>
        <section className="max-w-2xl pb-20"><p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">Ready when you are</p><h2 className="mt-5 text-5xl font-black leading-none tracking-[-0.05em] drop-shadow-2xl sm:text-8xl">{game.title}</h2><p className="mt-5 text-sm text-white/65">{game.meta} · {game.status}</p><button className="mt-8 flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-black transition hover:scale-105"><span className="text-base">▶</span> Start playing</button></section>
        <section><div className="flex items-center gap-3 overflow-x-auto pb-2">{games.map((item,index)=><button key={item.appid} onClick={()=>setSelected(index)} className={`relative shrink-0 overflow-hidden rounded-lg transition duration-300 ${selected===index?"w-60 ring-2 ring-white":"w-32 opacity-40 hover:w-40 hover:opacity-85 sm:w-40"}`}><div className="relative aspect-[616/353]"><GameArt game={item}/><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/></div>{selected===index&&<p className="absolute inset-x-0 bottom-0 truncate p-3 text-left text-xs font-bold">{item.title}</p>}</button>)}</div><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] uppercase tracking-[0.2em] text-white/35"><p>{selected+1} / {games.length}</p><p>Move to browse · Enter to play · / to search</p></div></section>
      </div>
    </div>
  );
}

function HybridDesign() {
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState("BACKLOG");
  const game = games[selected];

  return (
    <div className="relative min-h-[820px] overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#05090b] font-mono text-[#e8f3ef] shadow-2xl shadow-cyan-950/30">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.06) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
      <nav className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-cyan-300/15 bg-[#05090b]/80 px-6 py-5 backdrop-blur lg:px-9"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center border border-cyan-300/50 bg-cyan-300/10 text-xs font-black text-cyan-200">PQ</div><div><p className="text-sm font-black tracking-[0.2em]">PLAYQUEUE</p><p className="text-[9px] tracking-widest text-cyan-700">CONSOLE LINK / READY</p></div></div><div className="hidden gap-7 text-[10px] tracking-[0.2em] text-slate-500 md:flex"><span className="text-cyan-300">HOME</span><span>LIBRARY</span><span>BACKLOG</span><span>SQUAD</span></div><p className="text-[10px] text-lime-300">● ONLINE</p></nav>

      <section className="relative min-h-[455px]">
        <GameArt game={game} className="object-cover opacity-55 transition duration-500" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05090b] via-[#05090b]/65 to-transparent"/><div className="absolute inset-0 bg-gradient-to-t from-[#05090b] via-transparent to-transparent"/>
        <div className="relative z-10 grid min-h-[455px] items-center gap-8 px-6 py-10 lg:grid-cols-[1fr_320px] lg:px-9">
          <div className="max-w-2xl"><div className="flex flex-wrap gap-2">{modes.map(item=><button key={item} onClick={()=>setMode(item)} className={`border px-3 py-1.5 text-[10px] tracking-widest transition ${mode===item?"border-cyan-300 bg-cyan-300 text-[#041012]":"border-white/15 bg-black/20 text-slate-400 hover:border-cyan-400/50"}`}>{item}</button>)}</div><p className="mt-8 text-[10px] tracking-[0.3em] text-cyan-300">RECOMMENDATION://{mode.replace(" ", "_")}</p><h2 className="mt-3 text-5xl font-black tracking-tight sm:text-7xl">{game.title}</h2><p className="mt-4 max-w-lg text-xs leading-6 text-slate-300">High-priority match detected. Recent genre activity and friend signals raise this title above the rest of your queue.</p><div className="mt-7 flex gap-3"><button className="bg-cyan-300 px-6 py-3 text-xs font-black text-[#031012]">A&nbsp;&nbsp;LAUNCH</button><button className="border border-white/20 bg-black/30 px-5 py-3 text-xs">X&nbsp;&nbsp;DETAILS</button></div></div>
          <aside className="border border-cyan-300/25 bg-[#031012]/75 p-5 backdrop-blur [clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,0_100%)]"><div className="flex justify-between text-[10px] tracking-widest text-cyan-600"><span>MATCH ANALYSIS</span><span>105 PTS</span></div><div className="mt-5 space-y-4">{[["MODE FIT",95],["PRIORITY",88],["GENRES",82],["FRIEND SIGNAL",64]].map(([label,value])=><div key={label as string}><div className="flex justify-between text-[10px]"><span className="text-slate-400">{label}</span><span className="text-cyan-300">{value}%</span></div><div className="mt-1.5 h-1 bg-slate-800"><div className="h-full bg-gradient-to-r from-cyan-500 to-lime-300" style={{width:`${value}%`}}/></div></div>)}</div><p className="mt-5 border-t border-cyan-900 pt-4 text-[10px] leading-5 text-slate-500">STATUS: {game.status}<br/>PLAYTIME: {game.meta}<br/>CONFIDENCE: HIGH</p></aside>
        </div>
      </section>

      <section className="relative px-6 pb-8 lg:px-9"><div className="mb-4 flex items-center justify-between"><h3 className="text-xs font-bold tracking-[0.2em] text-cyan-200">QUEUE / NEXT UP</h3><p className="text-[10px] text-slate-600">LB / RB NAVIGATE</p></div><div className="flex gap-3 overflow-x-auto pb-4">{games.map((item,index)=><button key={item.appid} onClick={()=>setSelected(index)} className={`min-w-52 border bg-[#071012] p-2 text-left transition ${selected===index?"border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,.14)]":"border-white/8 opacity-55 hover:opacity-100"}`}><div className="relative aspect-[616/353] overflow-hidden"><GameArt game={item}/><span className="absolute left-2 top-2 bg-black/70 px-2 py-1 text-[9px] text-cyan-200">0{index+1}</span></div><div className="px-1 pb-1 pt-3"><p className="truncate text-xs font-bold">{item.title}</p><div className="mt-2 flex justify-between text-[9px] text-slate-600"><span>{item.status}</span><span>{item.progress}%</span></div></div></button>)}</div><div className="flex flex-wrap gap-5 border-t border-cyan-950 pt-4 text-[9px] tracking-widest text-slate-600"><span><b className="text-cyan-300">A</b> SELECT</span><span><b className="text-sky-300">X</b> DETAILS</span><span><b className="text-lime-300">Y</b> FILTER</span><span className="ml-auto text-cyan-800">STEAM_SYNC_OK</span></div></section>
    </div>
  );
}

const previews: Record<DesignId, () => React.ReactNode> = {
  console: ConsoleDesign,
  arcade: ArcadeDesign,
  hybrid: HybridDesign,
  showcase: ConsoleShowcaseDesign,
  gallery: BoxArtGalleryDesign,
  achievements: AchievementRoomDesign,
  minimal: MinimalLauncherDesign,
};

export default function DesignPreview() {
  const [design, setDesign] = useState<DesignId>("console");
  const Preview = previews[design];

  return (
    <main className="min-h-screen bg-[#090a0d] px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">Game Backlog · Design Lab</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Focused game-interface concepts</h1><p className="mt-2 max-w-2xl text-sm text-zinc-500">Compare seven distinct approaches using the same mock library, including three new collection, progression, and launcher concepts.</p></div><Link href="/" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white">Return to current app</Link></header>
        <div className="my-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{designs.map((item,index)=><button key={item.id} onClick={()=>setDesign(item.id)} className={`rounded-xl border p-4 text-left transition ${design===item.id?"border-white/30 bg-white/10 text-white":"border-white/8 bg-white/[0.025] text-zinc-500 hover:border-white/15 hover:text-zinc-300"}`}><span className="text-[10px] font-bold tracking-[0.18em]">0{index+1}</span><span className="mt-2 block text-sm font-semibold">{item.label}</span><span className="mt-1 block text-[11px]">{item.note}</span></button>)}</div>
        <Preview />
      </div>
    </main>
  );
}
