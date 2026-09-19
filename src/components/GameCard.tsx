import {SteamGame} from '@/lib/steam';

type Props = {
    game: SteamGame;
};

export default function GameCard({ game }: Props) {
    const hours = game.playtime_forever / 60;

    const imageUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
  
    const iconUrl = game.img_icon_url
      ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
      : null;
  
    return (
        <div className="overflow-hidden rounded-lg border">
        <img
          src={imageUrl}
          alt={game.name}
          className="h-auto w-full object-cover"
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
        </div>
      </div>
    );
  }