import { afterEach, describe, expect, it, vi } from "vitest";
import { getFriendActivity } from "@/lib/friends";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getFriendActivity", () => {
  it("loads the friend list for the supplied Steam ID", async () => {
    const steamId = "76561198000000000";
    vi.stubEnv("STEAM_API_KEY", "test-key");
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ friendslist: { friends: [] } }))
    );
    vi.stubGlobal("fetch", fetcher);

    await expect(getFriendActivity(steamId)).resolves.toEqual([]);
    const requestUrl = new URL(String(fetcher.mock.calls[0][0]));
    expect(requestUrl.searchParams.get("steamid")).toBe(steamId);
  });
});
