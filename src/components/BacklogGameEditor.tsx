"use client";

import BacklogControls from "@/components/BacklogControls";
import GameImage from "@/components/GameImage";
import {
  BacklogRating,
  useBacklogNotes,
  useBacklogRatings,
  useBacklogStatusDates,
} from "@/lib/backlog";
import type { SteamGame } from "@/lib/steam";

type Props = {
  game: SteamGame;
};

export default function BacklogGameEditor({ game }: Props) {
  const { getNote, setNote } = useBacklogNotes();
  const { getRating, setRating } = useBacklogRatings();
  const { getStatusDate } = useBacklogStatusDates();
  const statusDate = getStatusDate(game.appid);

  return (
    <article className="overflow-hidden rounded-xl border">
      <GameImage appid={game.appid} name={game.name} />

      <div className="p-4">
        <h2 className="font-semibold">{game.name}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {(game.playtime_forever / 60).toFixed(1)} hours played
        </p>

        <BacklogControls appid={game.appid} className="mt-4" />

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium">
            Personal rating
          </span>
          <select
            value={getRating(game.appid) ?? ""}
            onChange={(event) =>
              setRating(
                game.appid,
                event.target.value
                  ? (Number(event.target.value) as BacklogRating)
                  : null
              )
            }
            className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm"
          >
            <option value="">Not rated</option>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} {rating === 1 ? "star" : "stars"}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium">Notes</span>
          <textarea
            key={getNote(game.appid)}
            defaultValue={getNote(game.appid)}
            onBlur={(event) => setNote(game.appid, event.target.value)}
            placeholder="Add a reminder or your thoughts..."
            rows={3}
            maxLength={500}
            className="w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm"
          />
        </label>

        <p className="mt-3 text-xs text-gray-500">
          {statusDate
            ? `Status changed ${new Intl.DateTimeFormat(undefined, {
                dateStyle: "medium",
              }).format(new Date(statusDate))}`
            : "Status change date is not available yet."}
        </p>
      </div>
    </article>
  );
}
