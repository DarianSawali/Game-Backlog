"use client";

import type { ReactNode } from "react";
import DevelopmentStateControls from "@/components/auth/DevelopmentStateControls";
import PrivateSteamLibrary from "@/components/auth/PrivateSteamLibrary";
import SessionLoadingScreen from "@/components/auth/SessionLoadingScreen";
import SignedOutLanding from "@/components/auth/SignedOutLanding";
import SignOutDialog from "@/components/auth/SignOutDialog";
import SyncStatusBanner from "@/components/auth/SyncStatusBanner";
import { useAppState } from "@/components/auth/AppStateProvider";

export default function AppStateBoundary({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  let content: ReactNode;

  if (state.auth.status === "loading") {
    content = <SessionLoadingScreen />;
  } else if (state.auth.status === "anonymous") {
    content = <SignedOutLanding />;
  } else if (state.library.status === "private") {
    content = <PrivateSteamLibrary />;
  } else {
    content = <><SyncStatusBanner />{children}</>;
  }

  return (
    <>
      {content}
      <SignOutDialog />
      <DevelopmentStateControls />
    </>
  );
}
