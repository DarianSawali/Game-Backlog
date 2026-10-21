import type { Metadata } from "next";
import ProfilePageContent from "@/components/ProfilePageContent";
import { getOwnedGames, type SteamGame } from "@/lib/steam";

export const metadata: Metadata = { title: "Profile | Game Backlog" };

export default async function ProfilePage() {
  let games: SteamGame[] = [];
  try { games = await getOwnedGames(); } catch {}
  return <ProfilePageContent games={games}/>;
}
