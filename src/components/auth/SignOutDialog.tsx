"use client";

import { useEffect } from "react";
import { useAppState } from "@/components/auth/AppStateProvider";

export default function SignOutDialog() {
  const { state, dispatch } = useAppState();
  const open = state.signOutConfirmationOpen;

  useEffect(() => {
    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") dispatch({ type: "SIGN_OUT_CANCELLED" });
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [dispatch, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 px-5 backdrop-blur-sm" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) dispatch({ type: "SIGN_OUT_CANCELLED" });
    }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="sign-out-title" aria-describedby="sign-out-description" className="w-full max-w-md border border-[#d8c79a]/25 bg-[#11120f] p-7 text-[#f4f0e6] shadow-2xl">
        <p className="text-[9px] uppercase tracking-[0.3em] text-[#e4c66a]">End session</p>
        <h2 id="sign-out-title" className="mt-3 font-serif text-3xl">Sign out?</h2>
        <p id="sign-out-description" className="mt-4 text-sm leading-6 text-white/45">Your local backlog data will remain on this device. Signing out only ends the current application session.</p>
        <div className="mt-7 flex justify-end gap-3">
          <button type="button" autoFocus onClick={() => dispatch({ type: "SIGN_OUT_CANCELLED" })} className="border border-white/15 px-4 py-2.5 text-[10px] uppercase tracking-widest text-white/55 transition hover:border-white/35 hover:text-white">Cancel</button>
          <button type="button" onClick={() => dispatch({ type: "SIGN_OUT_CONFIRMED" })} className="bg-[#e4c66a] px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-black transition hover:bg-[#f4dc8e]">Sign out</button>
        </div>
      </section>
    </div>
  );
}
