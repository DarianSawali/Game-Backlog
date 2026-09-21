import {SteamGame} from "@/lib/steam";
import GameCard from "./GameCard";

type Props = {
    games: SteamGame[];
};

export default function RecentlyPlayed({ games }: Props) {
    if (games.length === 0) {
        return null;
      }
    
      return (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            Recently Played
          </h2>
    
          <p className="mt-1 text-sm text-gray-500">
            Games you&apos;ve been playing recently
          </p>
    
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.map((game) => (
              <GameCard
                key={game.appid}
                game={game}
              />
            ))}
          </div>
        </section>
      );
}
