import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchMetadataWithRetry,
  mapWithConcurrency,
} from "@/lib/game-metadata-client";
import {
  getPerformanceSnapshot,
  resetPerformanceMetrics,
} from "@/lib/performance";

afterEach(() => {
  resetPerformanceMetrics();
});

describe("metadata requests", () => {
  it("retries transient failures with backoff", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ games: [] }), { status: 200 })
      );
    const waitForRetry = vi.fn(async () => undefined);

    await expect(
      fetchMetadataWithRetry([10], fetcher, waitForRetry)
    ).resolves.toEqual({ games: [] });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(waitForRetry).toHaveBeenNthCalledWith(1, 150);
    expect(waitForRetry).toHaveBeenNthCalledWith(2, 300);
    expect(getPerformanceSnapshot()).toMatchObject({
      metadataRequests: 3,
      metadataRetries: 2,
    });
  });

  it("does not retry permanent client errors", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 400 }));
    const waitForRetry = vi.fn(async () => undefined);

    await expect(
      fetchMetadataWithRetry([10], fetcher, waitForRetry)
    ).rejects.toThrow("Unable to load Steam game metadata");
    expect(fetcher).toHaveBeenCalledOnce();
    expect(waitForRetry).not.toHaveBeenCalled();
  });

  it("limits concurrent batch work", async () => {
    let activeTasks = 0;
    let peakTasks = 0;

    await mapWithConcurrency([1, 2, 3, 4, 5], 2, async () => {
      activeTasks += 1;
      peakTasks = Math.max(peakTasks, activeTasks);
      await Promise.resolve();
      activeTasks -= 1;
    });

    expect(peakTasks).toBe(2);
  });
});
