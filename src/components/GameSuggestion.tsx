"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GameImage from "@/components/GameImage";
import BacklogControls from "@/components/BacklogControls";
import { FriendGameActivity } from "@/lib/friends";
import { getGameMetadataBatch } from "@/lib/game-metadata-client";
import {
  RECOMMENDATION_MODES,
  RecommendationMode,
  ScoreBreakdownItem,
  buildGenreProfile,
  getCandidateGames,
  getGamesForMode,
  getRecommendationModeDescription,
  getTopRecommendation,
  isRecommendableGame,
  scoreGameRecommendation,
} from "@/lib/recommendations";
import { SteamGame, SteamGameMetadata } from "@/lib/steam";
import {
  useBacklogPriorities,
  useBacklogStatuses,
} from "@/lib/backlog";

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
  const [mode, setMode] = useState<RecommendationMode>("backlog");
  const [suggestedGame, setSuggestedGame] =
    useState<SteamGame | null>(null);
  const [metadata, setMetadata] =
    useState<SteamGameMetadata | null>(null);
  const [scoreBreakdown, setScoreBreakdown] =
    useState<ScoreBreakdownItem[]>([]);
  const [recommendationScore, setRecommendationScore] = useState(0);
  const [rejectedGameIds, setRejectedGameIds] = useState<number[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendationError, setRecommendationError] =
    useState<string | null>(null);
  const [genreProfile, setGenreProfile] =
    useState<Map<string, number>>(new Map());
  const recommendationRun = useRef(0);
  const { statuses } = useBacklogStatuses();
  const { priorities } = useBacklogPriorities();
  const rejectedGameIdSet = useMemo(
    () => new Set(rejectedGameIds),
    [rejectedGameIds]
  );

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
      getGamesForMode(
        mode,
        games,
        recentGames,
        friendActivityMap,
        statuses,
        rejectedGameIdSet
      ),
    [
      friendActivityMap,
      games,
      mode,
      recentGames,
      rejectedGameIdSet,
      statuses,
    ]
  );
  const suggestedGameFriendCount = suggestedGame
    ? friendActivityMap.get(suggestedGame.appid) ?? 0
    : 0;

  async function suggestGame(extraExcludedId?: number) {
    if (eligibleGames.length === 0) {
      return;
    }

    const run = recommendationRun.current + 1;
    recommendationRun.current = run;
    setIsRecommending(true);
    setRecommendationError(null);

    try {
      const candidates = getCandidateGames(
        extraExcludedId
          ? eligibleGames.filter((game) => game.appid !== extraExcludedId)
          : eligibleGames
      );

      if (candidates.length === 0) {
        setSuggestedGame(null);
        setRecommendationError("No other games match this mode right now.");
        return;
      }

      const metadataByAppId = await getGameMetadataBatch(
        candidates.map((game) => game.appid)
      );
      const recentGameIds = new Set(
        recentGames.map((game) => game.appid)
      );
      const enrichedCandidates = candidates
        .map((game) => {
          const gameMetadata = metadataByAppId.get(game.appid) ?? null;
          const score = scoreGameRecommendation(
            mode,
            game,
            gameMetadata,
            recentGameIds,
            genreProfile,
            friendActivityMap,
            statuses,
            priorities
          );

          return { game, metadata: gameMetadata, ...score };
        })
        .filter(({ metadata: gameMetadata }) =>
          isRecommendableGame(gameMetadata)
        );
      const recommendation = getTopRecommendation(
        enrichedCandidates,
        suggestedGame
      );

      if (recommendationRun.current !== run) {
        return;
      }

      if (!recommendation) {
        setSuggestedGame(null);
        setRecommendationError(
          "No games with matching game metadata are available in this mode."
        );
        return;
      }

      setSuggestedGame(recommendation.game);
      setMetadata(recommendation.metadata);
      setScoreBreakdown(recommendation.breakdown);
      setRecommendationScore(recommendation.score);
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

  function changeMode(nextMode: RecommendationMode) {
    recommendationRun.current += 1;
    setMode(nextMode);
    setSuggestedGame(null);
    setMetadata(null);
    setScoreBreakdown([]);
    setRecommendationScore(0);
    setIsRecommending(false);
    setRecommendationError(null);
  }

  function rejectSuggestion() {
    if (!suggestedGame) {
      return;
    }

    const rejectedId = suggestedGame.appid;
    setRejectedGameIds((ids) => [...ids.filter((id) => id !== rejectedId), rejectedId].slice(-5));
    setSuggestedGame(null);
    setMetadata(null);
    setScoreBreakdown([]);
    setRecommendationScore(0);
    void suggestGame(rejectedId);
  }

  return (
    <section className="mt-8 rounded-xl border p-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={mode}
          onChange={(event) =>
            changeMode(event.target.value as RecommendationMode)
          }
          className="rounded-lg border px-3 py-2"
          aria-label="Recommendation mode"
        >
          {RECOMMENDATION_MODES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => void suggestGame()}
          disabled={eligibleGames.length === 0 || isRecommending}
          className="rounded-lg bg-black px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRecommending ? "Finding a game..." : "Suggest a Game"}
        </button>
      </div>

      <p className="mt-3 text-sm text-gray-500">
        {getRecommendationModeDescription(mode)} {eligibleGames.length} eligible
        games.
      </p>

      {eligibleGames.length === 0 && (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
          No games are available in this recommendation mode.
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
              Selected using your backlog and Steam activity signals.
            </p>

            {scoreBreakdown.length > 0 && (
              <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">Score breakdown</p>
                  <p className="font-semibold">{recommendationScore} points</p>
                </div>
                <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-300">
                  {scoreBreakdown.map((item) => (
                    <li key={item.label} className="flex justify-between gap-4">
                      <span>{item.label}</span>
                      <span className="font-medium">+{item.points}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {suggestedGameFriendCount > 0 && scoreBreakdown.length === 0 && (
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

            <BacklogControls
              appid={suggestedGame.appid}
              className="mt-4"
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
                onClick={() => void suggestGame()}
                disabled={isRecommending}
                className="rounded-lg border px-4 py-2 disabled:opacity-50"
              >
                {isRecommending ? "Finding..." : "Try Another"}
              </button>
              <button
                type="button"
                onClick={rejectSuggestion}
                disabled={isRecommending}
                className="rounded-lg border border-red-300 px-4 py-2 text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-300"
              >
                Not for me
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
