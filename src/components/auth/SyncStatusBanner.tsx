"use client";

import { useAppState } from "@/components/auth/AppStateProvider";

export default function SyncStatusBanner() {
  const { state, dispatch } = useAppState();
  const sync = state.sync;

  if (sync.status === "idle") return null;

  const retry = () => {
    dispatch({ type: "SYNC_STARTED" });
    window.location.reload();
  };

  return (
    <div className={`fixed left-1/2 top-4 z-[70] flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center justify-between gap-4 border px-4 py-3 text-xs shadow-2xl backdrop-blur-md ${sync.status === "failed" ? "border-red-300/30 bg-[#211110]/95 text-red-100" : sync.status === "success" ? "border-emerald-300/25 bg-[#0d1d16]/95 text-emerald-100" : "border-[#e4c66a]/30 bg-[#17150e]/95 text-[#f4e4ad]"}`} role="status" aria-live="polite">
      <div>
        <p className="font-medium">{sync.status === "syncing" ? "Syncing Steam library…" : sync.status === "failed" ? "Steam sync failed" : "Steam library synchronized"}</p>
        <p className="mt-1 text-[10px] opacity-55">{sync.status === "failed" ? sync.message : sync.status === "success" ? `${sync.added} added · ${sync.updated} updated · ${sync.markedUnavailable} unavailable` : "Your existing library remains available while Steam is checked."}</p>
      </div>
      {sync.status === "failed" ? <button type="button" onClick={retry} className="shrink-0 border border-current/30 px-3 py-2 text-[9px] uppercase tracking-wider transition hover:bg-white/10">Retry</button> : <button type="button" onClick={() => dispatch({ type: "SYNC_RESET" })} className="shrink-0 px-2 py-2 text-[9px] uppercase tracking-wider opacity-55 transition hover:opacity-100">Dismiss</button>}
    </div>
  );
}
