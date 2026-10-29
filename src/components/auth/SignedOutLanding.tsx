"use client";

import { useAppState } from "@/components/auth/AppStateProvider";

export default function SignedOutLanding() {
  const {
    dispatch,
    developmentUser,
    developmentControlsEnabled,
  } = useAppState();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070806] px-6 py-6 text-[#f4f0e6] sm:px-10 lg:px-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(228,198,106,.12),transparent_35%),linear-gradient(120deg,transparent_48%,rgba(216,199,154,.04)_48%,rgba(216,199,154,.04)_49%,transparent_49%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1600px] flex-col">
        <header className="flex items-center border-b border-[#d8c79a]/15 pb-5">
          <div className="flex items-center gap-4">
            <span className="grid size-10 rotate-45 place-items-center border border-[#d8c79a]/45 bg-black/30"><span className="-rotate-45 font-serif text-xs font-bold text-[#e4c66a]">GB</span></span>
            <span><span className="block font-serif text-sm tracking-[0.25em]">THE BACKLOG</span><span className="mt-1 block text-[8px] uppercase tracking-[0.3em] text-[#d8c79a]/45">Chronicle of games</span></span>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[minmax(0,.9fr)_minmax(420px,1.1fr)]">
          <div>
            <p className="text-[9px] uppercase tracking-[0.4em] text-[#e4c66a]">Your library, with intent</p>
            <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[.95] sm:text-7xl">Turn your Steam library into your next game.</h1>
            <p className="mt-7 max-w-xl text-sm leading-7 text-white/45">Organize your backlog, remember what you paused, and get recommendations that account for your playtime and preferences.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              {developmentControlsEnabled && developmentUser ? (
                <button type="button" onClick={() => dispatch({ type: "SIGNED_IN", user: developmentUser })} className="bg-[#e4c66a] px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition hover:-translate-y-0.5 hover:bg-[#f4dc8e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4c66a] active:scale-95">Use development profile</button>
              ) : (
                <button type="button" disabled className="cursor-not-allowed border border-[#d8c79a]/25 px-6 py-3 text-xs uppercase tracking-widest text-white/35">Steam sign-in coming next</button>
              )}
              <p className="max-w-xs text-[10px] leading-5 text-white/30">Steam provides ownership and playtime. Your personal backlog data remains separate.</p>
            </div>
          </div>

          <div className="relative border border-[#d8c79a]/15 bg-[#11120f]/85 p-7 shadow-2xl shadow-black/50 sm:p-10">
            <div className="absolute -left-3 -top-3 size-6 border-l border-t border-[#e4c66a]" />
            <div className="absolute -bottom-3 -right-3 size-6 border-b border-r border-[#e4c66a]" />
            <p className="text-[9px] uppercase tracking-[0.35em] text-[#d8c79a]/45">Once connected</p>
            <div className="mt-7 space-y-6">
              {[
                ["01", "See every owned game", "Search by title, genre, or Steam store tag."],
                ["02", "Build a real backlog", "Track status, priority, ratings, notes, and hidden games."],
                ["03", "Choose what to play", "Use recommendation modes shaped by your actual library."],
              ].map(([number, title, description]) => (
                <div key={number} className="grid grid-cols-[auto_1fr] gap-5 border-t border-white/10 pt-5">
                  <span className="font-serif text-sm text-[#e4c66a]">{number}</span>
                  <div><h2 className="font-serif text-xl">{title}</h2><p className="mt-2 text-xs leading-5 text-white/35">{description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
