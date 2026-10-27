import {
  recordMetadataRequest,
  recordMetadataRetry,
} from "@/lib/performance";
import type { SteamGameMetadata } from "@/lib/steam";

type MetadataResponse = {
  games: SteamGameMetadata[];
};

type CacheEntry = {
  metadata: SteamGameMetadata | null;
  cachedAt: number;
};

const metadataCache = new Map<number, CacheEntry>();
const pendingMetadata = new Map<
  number,
  Promise<SteamGameMetadata | null>
>();
const BATCH_SIZE = 50;
const BATCH_CONCURRENCY = 2;
const MAX_CACHE_ENTRIES = 500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_RETRIES = 2;

function getCachedMetadata(appid: number) {
  const entry = metadataCache.get(appid);

  if (!entry) {
    return undefined;
  }

  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    metadataCache.delete(appid);
    return undefined;
  }

  // Metadata cached before store-tag support has no `tags` field. Refetch it
  // instead of keeping a valid-looking but incomplete search index for a day.
  if (entry.metadata && !Array.isArray(entry.metadata.tags)) {
    metadataCache.delete(appid);
    return undefined;
  }

  metadataCache.delete(appid);
  metadataCache.set(appid, entry);
  return entry.metadata;
}

function setCachedMetadata(
  appid: number,
  metadata: SteamGameMetadata | null
) {
  metadataCache.delete(appid);
  metadataCache.set(appid, { metadata, cachedAt: Date.now() });

  while (metadataCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = metadataCache.keys().next().value;

    if (oldestKey === undefined) {
      break;
    }

    metadataCache.delete(oldestKey);
  }
}

function wait(delayMs: number) {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

export async function fetchMetadataWithRetry(
  appids: number[],
  fetcher: typeof fetch = fetch,
  waitForRetry: (delayMs: number) => Promise<unknown> = wait
) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    recordMetadataRequest();
    let response: Response | null = null;

    try {
      response = await fetcher(
        `/api/steam/games?appids=${appids.join(",")}`,
        { cache: "no-store" }
      );
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Metadata request failed");
    }

    if (response?.ok) {
      return (await response.json()) as MetadataResponse;
    }

    if (response) {
      lastError = new Error("Unable to load Steam game metadata");

      if (response.status < 500 && response.status !== 429) {
        throw lastError;
      }
    }

    if (attempt < MAX_RETRIES) {
      recordMetadataRetry();
      await waitForRetry(150 * 2 ** attempt);
    }
  }

  throw lastError ?? new Error("Unable to load Steam game metadata");
}

export async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  task: (item: T) => Promise<void>
) {
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await task(items[index]);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(concurrency, 1), items.length) },
      () => worker()
    )
  );
}

export async function getGameMetadataBatch(appids: number[]) {
  const uniqueAppIds = [...new Set(appids)].filter(
    (appid) => Number.isInteger(appid) && appid > 0
  );
  const missingAppIds = uniqueAppIds.filter(
    (appid) =>
      getCachedMetadata(appid) === undefined &&
      !pendingMetadata.has(appid)
  );
  const batches: number[][] = [];

  for (let index = 0; index < missingAppIds.length; index += BATCH_SIZE) {
    batches.push(missingAppIds.slice(index, index + BATCH_SIZE));
  }

  await mapWithConcurrency(batches, BATCH_CONCURRENCY, async (batchAppIds) => {
    const batchPromise = fetchMetadataWithRetry(batchAppIds).then(
      (data) => new Map(data.games.map((game) => [game.appid, game]))
    );

    for (const appid of batchAppIds) {
      const metadataPromise = batchPromise
        .then((games) => games.get(appid) ?? null)
        .then((metadata) => {
          setCachedMetadata(appid, metadata);
          return metadata;
        })
        .finally(() => {
          pendingMetadata.delete(appid);
        });

      pendingMetadata.set(appid, metadataPromise);
    }

    await Promise.allSettled(
      batchAppIds.map((appid) => pendingMetadata.get(appid))
    );
  });

  const entries = await Promise.all(
    uniqueAppIds.map(async (appid) => {
      const cachedMetadata = getCachedMetadata(appid);

      if (cachedMetadata !== undefined) {
        return [appid, cachedMetadata] as const;
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
