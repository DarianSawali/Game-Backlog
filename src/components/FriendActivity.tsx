import GameImage from "@/components/GameImage";
import BacklogControls from "@/components/BacklogControls";
import { FriendGameActivity } from "@/lib/friends";
import { SteamGame } from "@/lib/steam";

type Props = {
  activity: FriendGameActivity[];
  ownedGames: SteamGame[];
};

export default function FriendActivity({
  activity,
  ownedGames,
}: Props) {
  const ownedGameIds = new Set(
    ownedGames.map((game) => game.appid)
  );

  if (activity.length === 0) {
    return (
      <section className="mt-10 rounded-xl border border-dashed p-6">
        <h2 className="text-xl font-semibold">Friends Are Playing</h2>
        <p className="mt-2 text-sm text-gray-500">
          No recent friend activity is available. Friend activity may be
          private.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold">
        Friends Are Playing
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Games your Steam friends have played recently
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {activity.slice(0, 12).map((game) => {
          const owned = ownedGameIds.has(game.appid);

          return (
            <div
              key={game.appid}
              className="overflow-hidden rounded-lg border"
            >
              <GameImage
                appid={game.appid}
                name={game.name}
                iconHash={game.img_icon_url}
              />

              <div className="p-4">
                <h3 className="font-medium">
                  {game.name}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {game.friendsPlaying}{" "}
                  {game.friendsPlaying === 1
                    ? "friend"
                    : "friends"}{" "}
                  played recently
                </p>

                <p className="mt-1 text-sm">
                  {owned
                    ? "In your library"
                    : "Not in your library"}
                </p>

                {owned && (
                  <BacklogControls appid={game.appid} className="mt-3" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
