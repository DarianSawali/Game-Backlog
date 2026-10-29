import { notFound } from "next/navigation";
import GameDetailsContent from "@/components/GameDetailsContent";
import { getGameMetadata, getOwnedGames } from "@/lib/steam";

export default async function GameDetailsPage({ params }: { params: Promise<{ appid: string }> }) {
  const steamId = process.env.STEAM_ID;
  const { appid: rawAppid } = await params;
  const appid = Number(rawAppid);
  if (!Number.isInteger(appid) || appid <= 0) notFound();

  const [gamesResult, metadataResult] = await Promise.allSettled([
    steamId ? getOwnedGames(steamId) : Promise.reject(new Error("STEAM_ID is missing")),
    getGameMetadata(appid),
  ]);
  const game = gamesResult.status === "fulfilled" && gamesResult.value.status === "available"
    ? gamesResult.value.games.find((item) => item.appid === appid)
    : undefined;
  const metadata = metadataResult.status === "fulfilled" ? metadataResult.value : null;
  if (!game && !metadata) notFound();

  return <GameDetailsContent game={game ?? { appid, name: metadata?.name ?? "Unknown game", playtime_forever: 0, img_icon_url: "" }} metadata={metadata}/>;
}
