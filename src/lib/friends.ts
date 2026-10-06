import {
  SteamFriend,
  getRecentlyPlayedGamesForUser,
} from "@/lib/steam";

const FRIEND_REQUEST_CONCURRENCY = 5;

export type FriendGameActivity = {
  appid: number;
  name: string;
  img_icon_url: string;
  friendsPlaying: number;
  friendSteamIds: string[];
};

export async function getFriendGameActivity(
  friends: SteamFriend[]
): Promise<FriendGameActivity[]> {
  const activityMap = new Map<number, FriendGameActivity>();

  for (
    let index = 0;
    index < friends.length;
    index += FRIEND_REQUEST_CONCURRENCY
  ) {
    const batch = friends.slice(
      index,
      index + FRIEND_REQUEST_CONCURRENCY
    );
    const results = await Promise.allSettled(
      batch.map(async (friend) => ({
        friend,
        games: await getRecentlyPlayedGamesForUser(friend.steamid),
      }))
    );

    for (const result of results) {
      if (result.status !== "fulfilled") {
        continue;
      }

      const { friend, games } = result.value;

      for (const game of games) {
        const existing = activityMap.get(game.appid);

        if (existing) {
          existing.friendsPlaying += 1;
          existing.friendSteamIds.push(friend.steamid);
          continue;
        }

        activityMap.set(game.appid, {
          appid: game.appid,
          name: game.name,
          img_icon_url: game.img_icon_url,
          friendsPlaying: 1,
          friendSteamIds: [friend.steamid],
        });
      }
    }
  }

  return [...activityMap.values()].sort(
    (a, b) => b.friendsPlaying - a.friendsPlaying
  );
}
