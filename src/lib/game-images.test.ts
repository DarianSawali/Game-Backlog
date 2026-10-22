import { describe, expect, it } from "vitest";
import { getGameImageSources } from "@/lib/game-images";

describe("getGameImageSources", () => {
  it("tries SteamGridDB, Steam artwork, and the community icon before the local fallback", () => {
    const sources = getGameImageSources(10, "icon-hash");

    expect(sources.map((source) => source.presentation)).toEqual([
      "cover",
      "cover",
      "cover",
      "icon",
      "fallback",
    ]);
    expect(sources.at(-1)?.src).toBe("/game-placeholder.svg");
  });

  it("always includes the local fallback when no icon is available", () => {
    const sources = getGameImageSources(10);

    expect(sources).toHaveLength(4);
    expect(sources.at(-1)).toEqual({
      src: "/game-placeholder.svg",
      presentation: "fallback",
    });
  });

  it("requests hero artwork when the wide presentation is selected", () => {
    expect(getGameImageSources(10, undefined, "hero")[0]?.src).toBe(
      "/api/artwork/10?kind=hero"
    );
  });
});
