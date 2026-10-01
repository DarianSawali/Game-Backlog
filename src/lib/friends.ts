import {
    SteamFriend,
    SteamGame,
    getRecentlyPlayedGamesForUser,
} from "@/lib/steam";

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

    const friendResults = await Promise.all(
      friends.map(async (friend) => {
        const games = await getRecentlyPlayedGamesForUser(
          friend.steamid
        );

        return {
          friend,
          games,
        };
      })
    );

    for (const { friend, games } of friendResults) {
      for (const game of games) {
        const existing = activityMap.get(game.appid);

        if (existing) {
          existing.friendsPlaying += 1;
          existing.friendSteamIds.push(friend.steamid);
        } else {
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
