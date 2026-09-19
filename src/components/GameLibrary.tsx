"use client";

import { useState, useEffect } from "react";
import { SteamGame } from "@/lib/steam";
import GameCard from "./GameCard";

type Props = {
    games: SteamGame[];
};

type Filter = "all" | "unplayed" | "under2";

export default function GameLibrary({ games }: Props) {
    const [filter, setFilter] = useState<Filter>("all");

    const filteredGames = games.filter((game) => {
        if (filter === "unplayed") {
            return game.playtime_forever === 0;
        }
        if (filter === "under2") {
            return game.playtime_forever !== 0 && game.playtime_forever < 120;
        }
        return true;
    });

    return (
        <section className="mt-8">
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-4 py-2 ${
            filter === "all"
              ? "bg-black text-white"
              : "border"
          }`}
        >
          All ({games.length})
        </button>

        <button
          onClick={() => setFilter("unplayed")}
          className={`rounded-lg px-4 py-2 ${
            filter === "unplayed"
              ? "bg-black text-white"
              : "border"
          }`}
        >
          Unplayed (
            {games.filter((game) => game.playtime_forever === 0).length}
            )
        </button>

        <button
          onClick={() => setFilter("under2")}
          className={`rounded-lg px-4 py-2 ${
            filter === "under2"
              ? "bg-black text-white"
              : "border"
          }`}
        >
          Under 2 Hours (
            {
                games.filter(
                (game) =>
                    game.playtime_forever > 0 &&
                    game.playtime_forever < 120
                ).length
            }
            )
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        {filteredGames.length} games
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredGames.map((game) => (
          <GameCard
            key={game.appid}
            game={game}
          />
        ))}
      </div>
    </section>
    );
}