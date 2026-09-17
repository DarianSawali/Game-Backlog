import { getOwnedGames } from "@/lib/steam";
import GameCard from "@/components/GameCard";

export default async function Home() {
  const games = await getOwnedGames();
  
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">
        Game Backlog
      </h1>

      <p className="mt-2 text-gray-500">
        Your Steam library
      </p>

      <p className="mt-4 text-sm text-gray-400">
        {games.length} games found
      </p>

      <section className="mt-8">
        <div className="space-y-3">
          {games.map((game) => (
            <GameCard
              key={game.appid}
              game={game}
            />
          ))}
        </div>
      </section>
    </main>
  );



}