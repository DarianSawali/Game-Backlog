"use client";

import { useMemo, useState, useEffect } from "react";
import { SteamGame, SteamGameMetadata } from "@/lib/steam";
import { FriendGameActivity } from "@/lib/friends";

import GameImage from "@/components/GameImage";

import {
  RecommendationCategory,
  getGamesByCategory,
  getRandomGame,
  getRecommendationReason,
  getTopRecommendation,
  calculateGameScore,
  getCandidateGames,
  buildGenreProfile,
} from "@/lib/recommendations";

type Props = {
  games: SteamGame[];
  recentGames: SteamGame[];
  friendActivity: FriendGameActivity[];
};

export default function GameSuggestion({
  games,
  recentGames,
  friendActivity,
}: Props) {
  const [category, setCategory] =
    useState<RecommendationCategory>("unplayed");

  const [suggestedGame, setSuggestedGame] =
    useState<SteamGame | null>(null);

  const [metadata, setMetadata] =
    useState<SteamGameMetadata | null>(null);

  const [loadingMetadata, setLoadingMetadata] =
    useState(false);

  const [isRecommending, setIsRecommending] =
    useState(false);

  const [genreProfile, setGenreProfile] =
    useState<Map<string, number>>(new Map());

  const friendActivityMap = useMemo(
    () =>
      new Map(
        friendActivity.map((activity) => [
          activity.appid,
          activity.friendsPlaying,
        ])
      ),
    [friendActivity]
  );



  const eligibleGames = useMemo(() => {
    return getGamesByCategory(
      category,
      games,
      recentGames,
      friendActivityMap
    );
  }, [
    category,
    games,
    recentGames,
    friendActivityMap,
  ]);



  // function suggestGame() {
  //   const game = getRandomGame(
  //     eligibleGames,
  //     suggestedGame
  //   );

  //   setSuggestedGame(game);
  // }

  const suggestedGameFriendCount =
    suggestedGame
      ? friendActivityMap.get(suggestedGame.appid) ?? 0
      : 0;

  async function suggestGame() {
    if (eligibleGames.length === 0) {
      return;
    }

    setIsRecommending(true);

    try {
      const candidates = getCandidateGames(
        eligibleGames,
        12
      );

      const recentGameIds = new Set(
        recentGames.map((game) => game.appid)
      );

      const enrichedCandidates = await Promise.all(
        candidates.map(async (game) => {
          try {
            const response = await fetch(
              `/api/steam/game/${game.appid}`
            );

            const metadata = response.ok
              ? await response.json()
              : null;

            return {
              game,
              metadata,
              score: calculateGameScore(
                game,
                metadata,
                recentGameIds,
                genreProfile,
                friendActivityMap
              ),
            };
          } catch {
            return {
              game,
              metadata: null,
              score: calculateGameScore(
                game,
                null,
                recentGameIds,
                genreProfile,
                friendActivityMap
              ),
            };
          }
        })
      );

      const recommendation =
        getTopRecommendation(
          enrichedCandidates,
          suggestedGame
        );

      if (!recommendation) {
        return;
      }

      setSuggestedGame(recommendation.game);
      setMetadata(recommendation.metadata);
    } finally {
      setIsRecommending(false);
    }
  }

  useEffect(() => {
    async function loadRecentGameMetadata() {
      const results = await Promise.all(
        recentGames.map(async (game) => {
          try {
            const response = await fetch(
              `/api/steam/game/${game.appid}`
            );

            if (!response.ok) {
              return null;
            }

            const metadata: SteamGameMetadata =
              await response.json();

            return metadata;
          } catch {
            return null;
          }
        })
      );

      const validMetadata = results.filter(
        (
          metadata
        ): metadata is SteamGameMetadata =>
          metadata !== null
      );

      const profile =
        buildGenreProfile(validMetadata);

      setGenreProfile(profile);
    }

    if (recentGames.length > 0) {
      loadRecentGameMetadata();
    }
  }, [recentGames]);

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

          <option value="friendsPlaying">
            Friends Are Playing
          </option>

          <option value="all">
            All Games
          </option>
        </select>

        <button
          onClick={suggestGame}
          disabled={
            eligibleGames.length === 0 ||
            isRecommending
          }
          className="rounded-lg bg-black px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRecommending
            ? "Finding a game..."
            : "Suggest a Game"}
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

            {suggestedGameFriendCount > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {suggestedGameFriendCount}{" "}
                {suggestedGameFriendCount === 1
                  ? "friend has"
                  : "friends have"}{" "}
                played this recently.
              </p>
            )}

            <p className="mt-1 text-sm text-gray-500">
              {suggestedGame.playtime_forever === 0
                ? "Unplayed"
                : `${(
                  suggestedGame.playtime_forever / 60
                ).toFixed(1)} hours played`}
            </p>

            {loadingMetadata && (
              <p className="mt-3 text-sm text-gray-500">
                Loading game details...
              </p>
            )}

            {metadata && (
              <div className="mt-4">
                {metadata.genres &&
                  metadata.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {metadata.genres.map((genre) => (
                        <span
                          key={genre.id}
                          className="rounded-full border px-3 py-1 text-xs"
                        >
                          {genre.description}
                        </span>
                      ))}
                    </div>
                  )}

                {metadata.shortDescription && (
                  <p className="mt-4 text-sm text-gray-500">
                    {metadata.shortDescription}
                  </p>
                )}

                {metadata.developers &&
                  metadata.developers.length > 0 && (
                    <p className="mt-3 text-sm text-gray-500">
                      Developer:{" "}
                      {metadata.developers.join(", ")}
                    </p>
                  )}

                {metadata.releaseDate && (
                  <p className="mt-1 text-sm text-gray-500">
                    Released: {metadata.releaseDate}
                  </p>
                )}
              </div>
            )}

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
                disabled={isRecommending}
                className="rounded-lg border px-4 py-2 disabled:opacity-50"
              >
                {isRecommending
                  ? "Finding..."
                  : "Try Another"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
