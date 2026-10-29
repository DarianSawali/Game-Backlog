"use client";

import { useEffect } from "react";
import { useAppState } from "@/components/auth/AppStateProvider";
import type { LibraryAccessState } from "@/lib/auth-state";

export default function LibraryStateReporter({
  library,
}: {
  library: LibraryAccessState;
}) {
  const { dispatch } = useAppState();

  useEffect(() => {
    switch (library.status) {
      case "available":
        dispatch({ type: "LIBRARY_AVAILABLE", gameCount: library.gameCount });
        dispatch({ type: "SYNC_RESET" });
        break;
      case "private":
        dispatch({ type: "LIBRARY_PRIVATE" });
        break;
      case "failed":
        dispatch({ type: "LIBRARY_FAILED", message: library.message });
        break;
      case "unknown":
        dispatch({ type: "LIBRARY_UNKNOWN" });
        break;
    }
  }, [dispatch, library]);

  return null;
}
