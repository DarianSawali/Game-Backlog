import type { Metadata } from "next";
import LibraryPageContent from "@/components/LibraryPageContent";
import { getOwnedGames, type SteamGame } from "@/lib/steam";

export const metadata: Metadata = { title: "Library | Game Backlog" };

export default async function LibraryPage() {
  let games: SteamGame[] = [];
  try { games = await getOwnedGames(); } catch {}
  return <LibraryPageContent games={games}/>;
}
