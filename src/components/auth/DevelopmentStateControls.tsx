"use client";

import { useState } from "react";
import { useAppState } from "@/components/auth/AppStateProvider";

export default function DevelopmentStateControls() {
  const [open, setOpen] = useState(false);
  const { state, dispatch, developmentUser, developmentControlsEnabled } = useAppState();

  if (!developmentControlsEnabled) return null;

  return (
    <aside className="fixed bottom-4 left-4 z-[100] text-[#f4f0e6]">
      <button type="button" onClick={() => setOpen((value) => !value)} className="border border-fuchsia-300/30 bg-[#160f19]/95 px-3 py-2 text-[8px] uppercase tracking-[0.2em] text-fuchsia-200 shadow-xl backdrop-blur" aria-expanded={open}>Dev states</button>
      {open && <div className="mt-2 w-[min(340px,calc(100vw-2rem))] border border-fuchsia-300/20 bg-[#100d12]/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between"><p className="text-[9px] uppercase tracking-[0.2em] text-fuchsia-200">UI state preview</p><p className="text-[8px] text-white/30">Development only</p></div>
        <ControlGroup label={`Auth · ${state.auth.status}`}>
          <ControlButton onClick={() => dispatch({ type: "SESSION_LOADING" })}>Loading</ControlButton>
          <ControlButton onClick={() => dispatch({ type: "SIGNED_OUT" })}>Anonymous</ControlButton>
          <ControlButton disabled={!developmentUser} onClick={() => developmentUser && dispatch({ type: "SIGNED_IN", user: developmentUser })}>Authenticated</ControlButton>
        </ControlGroup>
        <ControlGroup label={`Library · ${state.library.status}`}>
          <ControlButton onClick={() => dispatch({ type: "LIBRARY_UNKNOWN" })}>Unknown</ControlButton>
          <ControlButton onClick={() => dispatch({ type: "LIBRARY_AVAILABLE", gameCount: 293 })}>Available</ControlButton>
          <ControlButton onClick={() => dispatch({ type: "LIBRARY_PRIVATE" })}>Private</ControlButton>
          <ControlButton onClick={() => dispatch({ type: "LIBRARY_FAILED", message: "Steam could not be reached." })}>Failed</ControlButton>
        </ControlGroup>
        <ControlGroup label={`Sync · ${state.sync.status}`}>
          <ControlButton onClick={() => dispatch({ type: "SYNC_RESET" })}>Idle</ControlButton>
          <ControlButton onClick={() => dispatch({ type: "SYNC_STARTED" })}>Syncing</ControlButton>
          <ControlButton onClick={() => dispatch({ type: "SYNC_SUCCEEDED", syncedAt: new Date().toISOString(), added: 3, updated: 18, markedUnavailable: 1 })}>Success</ControlButton>
          <ControlButton onClick={() => dispatch({ type: "SYNC_FAILED", message: "Steam timed out. Your previous library is still available." })}>Failed</ControlButton>
        </ControlGroup>
        {state.auth.status === "authenticated" && <button type="button" onClick={() => dispatch({ type: "SIGN_OUT_REQUESTED" })} className="mt-4 w-full border border-red-300/20 px-3 py-2 text-[8px] uppercase tracking-wider text-red-200/70 transition hover:bg-red-300/10">Preview sign-out confirmation</button>}
      </div>}
    </aside>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mt-4"><p className="mb-2 text-[8px] uppercase tracking-wider text-white/35">{label}</p><div className="flex flex-wrap gap-1.5">{children}</div></div>;
}

function ControlButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className="border border-white/10 bg-white/[.03] px-2.5 py-1.5 text-[8px] uppercase tracking-wider text-white/55 transition hover:border-fuchsia-200/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-25">{children}</button>;
}
