"use client";

import AppHeader from "@/components/AppHeader";
import { BACKLOG_STATUS_OPTIONS, useBacklogStatuses } from "@/lib/backlog";
import type { SteamGame } from "@/lib/steam";

export default function ProfilePageContent({ games }: { games: SteamGame[] }) {
  const { statuses } = useBacklogStatuses();
  const tracked = games.filter((game) => statuses[String(game.appid)]);
  const completed = games.filter((game) => statuses[String(game.appid)] === "completed").length;
  const completion = tracked.length ? Math.round((completed / tracked.length) * 100) : 0;
  const hours = Math.round(games.reduce((total, game) => total + game.playtime_forever, 0) / 60);

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
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{BACKLOG_STATUS_OPTIONS.map((option) => <div key={option.value} className="rounded-lg border border-white/10 bg-[#11120f] p-4"><p className="font-serif text-2xl">{games.filter((game) => statuses[String(game.appid)] === option.value).length}</p><p className="mt-1 text-[9px] uppercase tracking-widest text-white/35">{option.label}</p></div>)}</section>
      </div>
    </main>
  );
}
