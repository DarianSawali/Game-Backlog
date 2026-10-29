import type { Metadata } from "next";
import ProfilePageContent from "@/components/ProfilePageContent";
import { getOwnedGames, type SteamGame } from "@/lib/steam";

export const metadata: Metadata = { title: "Profile | Game Backlog" };

export default async function ProfilePage() {
  const steamId = process.env.STEAM_ID;
  let games: SteamGame[] = [];
  try {
    if (steamId) {
      const result = await getOwnedGames(steamId);
      if (result.status === "available") games = result.games;
    }
  } catch {}
  return <ProfilePageContent games={games}/>;
}
