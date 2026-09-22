import { SteamGame } from "@/lib/steam";
import GameImage from "@/components/GameImage";

type Props = {
  game: SteamGame;
};

export default function GameCard({ game }: Props) {
  const hours = game.playtime_forever / 60;

  return (
    <div className="overflow-hidden rounded-lg border">
      <GameImage
        appid={game.appid}
        name={game.name}
        iconHash={game.img_icon_url}
        className="h-44 w-full object-cover"
      />

      <div className="p-4">
        <h2 className="font-medium">
          {game.name}
        </h2>

        <p className="text-sm text-gray-500">
          {game.playtime_forever === 0
            ? "Unplayed"
            : `${hours.toFixed(1)} hours played`}
        </p>

        {game.playtime_2weeks !== undefined &&
          game.playtime_2weeks > 0 && (
            <p className="mt-1 text-sm text-gray-400">
              {(game.playtime_2weeks / 60).toFixed(1)} hours recently
            </p>
          )}
      </div>
    </div>
  );
}