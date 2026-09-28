"use client";

import { useMemo, useState } from "react";
import { SteamGame } from "@/lib/steam";
import GameImage from "@/components/GameImage";

import {
  RecommendationCategory,
  getGamesByCategory,
  getRandomGame,
  getRecommendationReason,
} from "@/lib/recommendations";

type Props = {
  games: SteamGame[];
  recentGames: SteamGame[];
};

export default function GameSuggestion({
  games,
  recentGames,
}: Props) {
  const [category, setCategory] =
    useState<RecommendationCategory>("unplayed");

  const [suggestedGame, setSuggestedGame] =
    useState<SteamGame | null>(null);

  const eligibleGames = useMemo(() => {
    return getGamesByCategory(
      category,
      games,
      recentGames
    );
  }, [category, games, recentGames]);

  function suggestGame() {
    const game = getRandomGame(
      eligibleGames,
      suggestedGame
    );

    setSuggestedGame(game);
  }

  return (
    <section className="mt-8 rounded-xl border p-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => {
            setCategory(
              e.target.value as RecommendationCategory
            );

            setSuggestedGame(null);
          }}
          className="rounded-lg border px-3 py-2"
        >
          <option value="unplayed">
            Unplayed
          </option>

          <option value="barelyPlayed">
            Barely Played
          </option>

          <option value="forgotten">
            Forgotten Games
          </option>

          <option value="recentlyPlayed">
            Recently Played
          </option>

          <option value="all">
            All Games
          </option>
        </select>

        <button
          onClick={suggestGame}
          disabled={eligibleGames.length === 0}
          className="rounded-lg bg-black px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Suggest a Game
        </button>
      </div>

      <p className="mt-3 text-sm text-gray-500">
        {eligibleGames.length} eligible games
      </p>

      {suggestedGame && (
  <div className="mt-6 max-w-xl overflow-hidden rounded-xl border">
    <GameImage
      appid={suggestedGame.appid}
      name={suggestedGame.name}
      iconHash={suggestedGame.img_icon_url}
    />

    <div className="p-5">
      <p className="text-sm text-gray-500">
        You should play
      </p>

      <h2 className="mt-1 text-2xl font-bold">
        {suggestedGame.name}
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        {getRecommendationReason(category, suggestedGame)}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={`https://store.steampowered.com/app/${suggestedGame.appid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          View on Steam
        </a>

        <a
          href={`steam://run/${suggestedGame.appid}`}
          className="rounded-lg border px-4 py-2"
        >
          Launch Game
        </a>

        <button
          onClick={suggestGame}
          className="rounded-lg border px-4 py-2"
        >
          Try Another
        </button>
      </div>
    </div>
  </div>
)}
    </section>
  );
}
