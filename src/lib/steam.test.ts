import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getFriendList,
  getOwnedGames,
  getPlayerProfile,
  getRecentlyPlayedGames,
  parseSteamStoreTags,
} from "@/lib/steam";

const steamId = "76561198000000000";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("parseSteamStoreTags", () => {
  it("extracts and decodes unique tags from Steam hover markup", () => {
    const html = `
      <div class="app_tag">Survival</div>
      <div class="app_tag">Hack &amp; Slash</div>
      <div class="app_tag">Survival</div>
    `;

    expect(parseSteamStoreTags(html)).toEqual([
      "Survival",
      "Hack & Slash",
    ]);
  });
});

describe("user-aware Steam requests", () => {
  it("forwards the supplied Steam ID to each account endpoint", async () => {
    vi.stubEnv("STEAM_API_KEY", "test-key");
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ response: { game_count: 0, games: [] } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ response: { games: [] } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ response: { players: [] } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ friendslist: { friends: [] } })));
    vi.stubGlobal("fetch", fetcher);

    await expect(getOwnedGames(steamId)).resolves.toEqual({
      status: "available",
      games: [],
    });
    await getRecentlyPlayedGames(steamId);
    await getPlayerProfile(steamId);
    await getFriendList(steamId);

    const urls = fetcher.mock.calls.map(([input]) => new URL(String(input)));
    expect(urls[0].searchParams.get("steamid")).toBe(steamId);
    expect(urls[1].searchParams.get("steamid")).toBe(steamId);
    expect(urls[2].searchParams.get("steamids")).toBe(steamId);
    expect(urls[3].searchParams.get("steamid")).toBe(steamId);
  });

  it("rejects invalid IDs before making a Steam request", async () => {
    vi.stubEnv("STEAM_API_KEY", "test-key");
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);

    await expect(getOwnedGames("not-a-steam-id")).rejects.toThrow(
      "A valid 17-digit Steam ID is required"
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("distinguishes an inaccessible library from an empty public library", async () => {
    vi.stubEnv("STEAM_API_KEY", "test-key");
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ response: {} }))
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ response: { game_count: 0 } }))
      );
    vi.stubGlobal("fetch", fetcher);

    await expect(getOwnedGames(steamId)).resolves.toEqual({ status: "private" });
    await expect(getOwnedGames(steamId)).resolves.toEqual({
      status: "available",
      games: [],
    });
  });

  it("returns a retryable state for Steam failures", async () => {
    vi.stubEnv("STEAM_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(null, { status: 429, statusText: "Too Many Requests" })
      )
    );

    await expect(getOwnedGames(steamId)).resolves.toMatchObject({
      status: "failed",
      reason: "rate-limited",
    });
  });
});
