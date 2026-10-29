"use client";

import Link from "next/link";
import AppNav from "@/components/AppNav";
import { useAppState } from "@/components/auth/AppStateProvider";

type Props = {
  active: "home" | "library" | "profile";
  showExitPreview?: boolean;
};

export default function AppHeader({ active, showExitPreview = false }: Props) {
  const { state, dispatch } = useAppState();
  const user = state.auth.status === "authenticated" ? state.auth.user : null;
  const steamConnected = state.library.status === "available";

  return (
    <header className="grid grid-cols-[1fr_auto] items-center gap-x-5 gap-y-4 border-b border-[#d8c79a]/15 pb-5 sm:grid-cols-[1fr_auto_1fr]">
      <Link href="/" className="col-start-1 row-start-1 flex items-center gap-4 justify-self-start">
        <span className="grid size-10 rotate-45 place-items-center border border-[#d8c79a]/45 bg-black/30"><span className="-rotate-45 font-serif text-xs font-bold text-[#e4c66a]">GB</span></span>
        <span><span className="block font-serif text-sm tracking-[0.25em]">THE BACKLOG</span><span className="mt-1 block text-[8px] uppercase tracking-[0.3em] text-[#d8c79a]/45">Chronicle of games</span></span>
      </Link>
      <div className="col-span-2 row-start-2 w-full justify-self-center sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:w-auto"><AppNav active={active}/></div>
      <div className="col-start-2 row-start-1 flex items-center gap-3 justify-self-end sm:col-start-3">
        {user && <span className="hidden size-8 place-items-center rounded-full border border-[#d8c79a]/25 bg-[#11120f] font-serif text-[9px] text-[#e4c66a] lg:grid">{user.displayName.slice(0, 2).toUpperCase()}</span>}
        {user && <div className="hidden text-right sm:block"><p className="text-[8px] uppercase tracking-[0.2em] text-[#d8c79a]/45"><span className={`mr-1.5 inline-block size-1.5 rounded-full ${steamConnected ? "bg-emerald-300" : "bg-white/25"}`} />{steamConnected ? "Steam connected" : "Player"}</p><p className="mt-1 max-w-28 truncate text-[9px] uppercase tracking-[0.16em] text-[#f4f0e6]">{user.displayName}</p></div>}
        {user && <button type="button" onClick={() => dispatch({ type: "SIGN_OUT_REQUESTED" })} className="border border-[#d8c79a]/20 bg-black/30 px-2 py-2 text-[8px] uppercase tracking-[0.12em] text-white/35 transition hover:border-[#e4c66a] hover:text-[#e4c66a] sm:px-3 sm:tracking-[0.16em]">Sign out</button>}
        {showExitPreview && <Link href="/" className="border border-[#d8c79a]/25 bg-black/30 px-4 py-2 text-[9px] uppercase tracking-[0.2em] text-[#d8c79a]/70 hover:border-[#e4c66a] hover:text-[#e4c66a]">Exit preview</Link>}
      </div>
    </header>
  );
}
