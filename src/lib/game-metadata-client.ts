import type { SteamGameMetadata } from "@/lib/steam";

type MetadataResponse = {
  games: SteamGameMetadata[];
};

const metadataCache = new Map<number, SteamGameMetadata | null>();
const pendingMetadata = new Map<
  number,
  Promise<SteamGameMetadata | null>
>();
const BATCH_SIZE = 50;

export async function getGameMetadataBatch(appids: number[]) {
  const uniqueAppIds = [...new Set(appids)].filter(
    (appid) => Number.isInteger(appid) && appid > 0
  );
  const missingAppIds = uniqueAppIds.filter(
    (appid) =>
      !metadataCache.has(appid) && !pendingMetadata.has(appid)
  );

  for (
    let index = 0;
    index < missingAppIds.length;
    index += BATCH_SIZE
  ) {
    const batchAppIds = missingAppIds.slice(index, index + BATCH_SIZE);
    const batchPromise = fetch(
      `/api/steam/games?appids=${batchAppIds.join(",")}`
    ).then(async (response) => {
      if (!response.ok) {
        throw new Error("Unable to load Steam game metadata");
      }

      const data = (await response.json()) as MetadataResponse;
      return new Map(data.games.map((game) => [game.appid, game]));
    });

    for (const appid of batchAppIds) {
      const metadataPromise = batchPromise
        .then((games) => games.get(appid) ?? null)
        .then((metadata) => {
          metadataCache.set(appid, metadata);
          return metadata;
        })
        .finally(() => {
          pendingMetadata.delete(appid);
        });

      pendingMetadata.set(appid, metadataPromise);
    }
  }

  const entries = await Promise.all(
    uniqueAppIds.map(async (appid) => {
      if (metadataCache.has(appid)) {
        return [appid, metadataCache.get(appid) ?? null] as const;
      }

      try {
        return [
          appid,
          (await pendingMetadata.get(appid)) ?? null,
        ] as const;
      } catch {
        return [appid, null] as const;
      }
    })
  );

  return new Map(entries);
}
