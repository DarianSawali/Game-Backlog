import Link from "next/link";
import BacklogWorkspace from "@/components/BacklogWorkspace";
import { getOwnedGames, SteamGame } from "@/lib/steam";

export default async function BacklogPage() {
  let games: SteamGame[] = [];
  let error = false;

  try {
    games = await getOwnedGames();
  } catch {
    error = true;
  }

  return (
    <main className="min-h-screen p-8">
      <nav className="mb-8 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold">
          Game Backlog
        </Link>
        <Link href="/" className="rounded-lg border px-3 py-2 text-sm">
          Dashboard
        </Link>
      </nav>

      <h1 className="text-3xl font-bold">Backlog workspace</h1>
      <p className="mt-2 max-w-2xl text-gray-500">
        Review tracked games, set priorities, and keep personal notes and
        ratings.
      </p>

      {error ? (
        <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Your Steam library could not be loaded. Please try again later.
        </div>
      ) : (
        <BacklogWorkspace games={games} />
      )}
    </main>
  );
}
