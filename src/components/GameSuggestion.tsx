"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GameImage from "@/components/GameImage";
import BacklogStatusSelect from "@/components/BacklogStatusSelect";
import { FriendGameActivity } from "@/lib/friends";
import { getGameMetadataBatch } from "@/lib/game-metadata-client";
import {
  RecommendationCategory,
  buildGenreProfile,
  getCandidateGames,
  getGamesByCategory,
  getRecommendationReason,
  getTopRecommendation,
  scoreGameRecommendation,
} from "@/lib/recommendations";
import { SteamGame, SteamGameMetadata } from "@/lib/steam";

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
  const [scoreReasons, setScoreReasons] = useState<string[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendationError, setRecommendationError] =
    useState<string | null>(null);
  const [genreProfile, setGenreProfile] =
    useState<Map<string, number>>(new Map());
  const recommendationRun = useRef(0);

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
  const eligibleGames = useMemo(
    () =>
      getGamesByCategory(
        category,
        games,
        recentGames,
        friendActivityMap
      ),
    [category, games, recentGames, friendActivityMap]
  );
  const suggestedGameFriendCount = suggestedGame
    ? friendActivityMap.get(suggestedGame.appid) ?? 0
    : 0;

  async function suggestGame() {
    if (eligibleGames.length === 0) {
      return;
    }

    const run = recommendationRun.current + 1;
    recommendationRun.current = run;
    setIsRecommending(true);
    setRecommendationError(null);

    try {
      const candidates = getCandidateGames(eligibleGames, 12);
      const metadataByAppId = await getGameMetadataBatch(
        candidates.map((game) => game.appid)
      );
      const recentGameIds = new Set(
        recentGames.map((game) => game.appid)
      );
      const enrichedCandidates = candidates.map((game) => {
        const gameMetadata = metadataByAppId.get(game.appid) ?? null;
        const recommendationScore = scoreGameRecommendation(
          game,
          gameMetadata,
          recentGameIds,
          genreProfile,
          friendActivityMap
        );

        return {
          game,
          metadata: gameMetadata,
          ...recommendationScore,
        };
      });
      const recommendation = getTopRecommendation(
        enrichedCandidates,
        suggestedGame
      );

      if (!recommendation || recommendationRun.current !== run) {
        return;
      }

      setSuggestedGame(recommendation.game);
      setMetadata(recommendation.metadata);
      setScoreReasons(recommendation.reasons);
    } catch {
      if (recommendationRun.current === run) {
        setRecommendationError(
          "A recommendation could not be prepared. Please try again."
        );
      }
    } finally {
      if (recommendationRun.current === run) {
        setIsRecommending(false);
      }
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadGenreProfile() {
      const metadataByAppId = await getGameMetadataBatch(
        recentGames.map((game) => game.appid)
      );
      const recentMetadata = [...metadataByAppId.values()].filter(
        (gameMetadata): gameMetadata is SteamGameMetadata =>
          gameMetadata !== null
      );

      if (!cancelled) {
        setGenreProfile(buildGenreProfile(recentMetadata));
      }
    }

    if (recentGames.length > 0) {
      void loadGenreProfile();
    }

    return () => {
      cancelled = true;
    };
  }, [recentGames]);

  function changeCategory(nextCategory: RecommendationCategory) {
    recommendationRun.current += 1;
    setCategory(nextCategory);
    setSuggestedGame(null);
    setMetadata(null);
    setScoreReasons([]);
    setIsRecommending(false);
    setRecommendationError(null);
  }

  return (
    <section className="mt-8 rounded-xl border p-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(event) =>
            changeCategory(
              event.target.value as RecommendationCategory
            )
          }
          className="rounded-lg border px-3 py-2"
        >
          <option value="unplayed">Unplayed</option>
          <option value="barelyPlayed">Barely Played</option>
          <option value="forgotten">Forgotten Games</option>
          <option value="recentlyPlayed">Recently Played</option>
          <option value="friendsPlaying">Friends Are Playing</option>
          <option value="all">All Games</option>
        </select>

        <button
          onClick={suggestGame}
          disabled={eligibleGames.length === 0 || isRecommending}
          className="rounded-lg bg-black px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRecommending ? "Finding a game..." : "Suggest a Game"}
        </button>
      </div>

      <p className="mt-3 text-sm text-gray-500">
        {eligibleGames.length} eligible games
      </p>

      {eligibleGames.length === 0 && (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
          No games are available in this category.
        </p>
      )}

      {recommendationError && (
        <p
          className="mt-3 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {recommendationError}
        </p>
      )}

      {suggestedGame && (
        <div className="mt-6 max-w-xl overflow-hidden rounded-xl border">
          <GameImage
            appid={suggestedGame.appid}
            name={suggestedGame.name}
            iconHash={suggestedGame.img_icon_url}
          />

          <div className="p-5">
            <p className="text-sm text-gray-500">You should play</p>
            <h2 className="mt-1 text-2xl font-bold">
              {suggestedGame.name}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {getRecommendationReason(category, suggestedGame)}
            </p>

            {scoreReasons.length > 0 && (
              <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
                <p className="font-medium">Why this game</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600 dark:text-gray-300">
                  {scoreReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {suggestedGameFriendCount > 0 && scoreReasons.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {suggestedGameFriendCount}{" "}
                {suggestedGameFriendCount === 1
                  ? "friend has"
                  : "friends have"}{" "}
                played this recently.
              </p>
            )}

            <p className="mt-3 text-sm text-gray-500">
              {suggestedGame.playtime_forever === 0
                ? "Unplayed"
                : `${(
                    suggestedGame.playtime_forever / 60
                  ).toFixed(1)} hours played`}
            </p>

            <BacklogStatusSelect
              appid={suggestedGame.appid}
              className="mt-4 max-w-48"
            />

            {metadata && (
              <div className="mt-4">
                {metadata.genres && metadata.genres.length > 0 && (
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

                {metadata.developers && metadata.developers.length > 0 && (
                  <p className="mt-3 text-sm text-gray-500">
                    Developer: {metadata.developers.join(", ")}
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
                {isRecommending ? "Finding..." : "Try Another"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
