"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  appStateReducer,
  createInitialAppState,
  type AppState,
  type AppStateAction,
  type AuthState,
  type UserProfile,
} from "@/lib/auth-state";

type AppStateContextValue = {
  state: AppState;
  dispatch: Dispatch<AppStateAction>;
  developmentUser: UserProfile | null;
  developmentControlsEnabled: boolean;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

type Props = {
  children: ReactNode;
  initialAuthState: AuthState;
  developmentUser: UserProfile | null;
  developmentControlsEnabled: boolean;
};

export default function AppStateProvider({
  children,
  initialAuthState,
  developmentUser,
  developmentControlsEnabled,
}: Props) {
  const [state, dispatch] = useReducer(
    appStateReducer,
    initialAuthState,
    createInitialAppState
  );
  const value = useMemo(() => ({
    state,
    dispatch,
    developmentUser,
    developmentControlsEnabled,
  }), [developmentControlsEnabled, developmentUser, state]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }

  return context;
}
