import {SteamGame} from '@/lib/steam';

type Props = {
    game: SteamGame;
};

export default function GameCard({ game }: Props) {
    const hours = game.playtime_forever / 60;
  
    const iconUrl = game.img_icon_url
      ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
      : null;
  
    return (
      <div className="flex items-center gap-4 rounded-lg border p-4">
        {iconUrl && (
          <img
            src={iconUrl}
            alt={game.name}
            className="h-12 w-12 rounded object-cover"
          />
        )}
  
        <div>
          <h2 className="font-medium">
            {game.name}
          </h2>
  
          <p className="text-sm text-gray-500">
            {game.playtime_forever === 0
              ? "Unplayed"
              : `${hours.toFixed(1)} hours played`}
          </p>
        </div>
      </div>
    );
  }