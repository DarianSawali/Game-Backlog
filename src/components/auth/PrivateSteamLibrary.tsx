"use client";

import AppHeader from "@/components/AppHeader";

export default function PrivateSteamLibrary() {
  return (
    <main className="min-h-screen bg-[#070806] px-6 py-6 text-[#f4f0e6] sm:px-10 lg:px-14">
      <div className="mx-auto max-w-[1600px]"><AppHeader active="home" /></div>
      <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center py-16 text-center">
        <div className="w-full border border-[#e4c66a]/25 bg-[#11120f] p-8 sm:p-12">
          <div className="mx-auto grid size-14 place-items-center rounded-full border border-[#e4c66a]/35 bg-[#e4c66a]/5 font-serif text-2xl text-[#e4c66a]">!</div>
          <p className="mt-7 text-[9px] uppercase tracking-[0.35em] text-[#e4c66a]">Steam connection needs attention</p>
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl">Your game details are private</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/45">Steam is connected, but it is not exposing your owned games. Review your Steam privacy settings, make Game details visible, and retry the connection.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="https://steamcommunity.com/my/edit/settings" target="_blank" rel="noopener noreferrer" className="bg-[#e4c66a] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition hover:bg-[#f4dc8e]">Open Steam privacy settings</a>
            <button type="button" onClick={() => window.location.reload()} className="border border-[#d8c79a]/25 px-5 py-3 text-[10px] uppercase tracking-widest text-white/55 transition hover:border-[#e4c66a] hover:text-[#e4c66a]">Retry</button>
          </div>
          <p className="mt-6 text-[10px] leading-5 text-white/25">Existing backlog information is preserved. A private response never deletes synchronized games.</p>
        </div>
      </section>
    </main>
  );
}
