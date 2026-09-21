"use client";

import { useState, useMemo } from "react";
import { SteamGame } from "@/lib/steam";

type Props = {
    games: SteamGame[];
};

type SuggestionFilter = "unplayed" | "under2" | "all";

export default function GameSuggestion({ games }: Props) {
    const [filter, setFilter] = useState<SuggestionFilter>("unplayed");
    const [suggestedGame, setSuggestedGame] = useState<SteamGame | null>(null);

    const eligibleGames = useMemo(() => {
        if (filter === "unplayed") {
            return games.filter((game) => game.playtime_forever === 0);
        } 
        else if (filter === "under2") {
            return games.filter(
                (game) => game.playtime_forever > 0 && game.playtime_forever < 120);
        }

        return games;

    }, [games, filter]);

    function suggestGame() {
        if (eligibleGames.length === 0) {
            setSuggestedGame(null);
            return;
        }

        let availableGames = eligibleGames;

        if (suggestedGame && eligibleGames.length > 1) {
        availableGames = eligibleGames.filter(
            (game) => game.appid !== suggestedGame.appid
        );
        }

        const randomIndex = Math.floor(
        Math.random() * availableGames.length
        );

        setSuggestedGame(availableGames[randomIndex]);
    }

    const imageUrl = suggestedGame ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${suggestedGame.appid}/header.jpg` : null;

    return (
        <section className="mt-8 rounded-xl border p-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as SuggestionFilter);
            setSuggestedGame(null);
          }}
          className="rounded-lg border px-3 py-2"
        >
          <option value="unplayed">
            Unplayed
          </option>

          <option value="under2">
            Under 2 Hours
          </option>

          <option value="all">
            All Games
          </option>
        </select>

        <button
          onClick={suggestGame}
          className="rounded-lg bg-black px-5 py-2 text-white"
        >
          Suggest a Game
        </button>
      </div>

      {suggestedGame && (
        <div className="mt-6 max-w-xl overflow-hidden rounded-xl border">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={suggestedGame.name}
              className="w-full object-cover"
            />
          )}

          <div className="p-5">
            <p className="text-sm text-gray-500">
              You should play
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {suggestedGame.name}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {suggestedGame.playtime_forever === 0
                ? "You haven't played this yet."
                : `${(
                    suggestedGame.playtime_forever / 60
                  ).toFixed(1)} hours played`}
            </p>

            <button
              onClick={suggestGame}
              className="mt-4 rounded-lg border px-4 py-2"
            >
              Try Another
            </button>
          </div>
        </div>
      )}
    </section>
  );
}