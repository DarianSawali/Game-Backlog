import { describe, expect, it } from "vitest";
import { getGameImageSources } from "@/lib/game-images";

describe("getGameImageSources", () => {
  it("tries Steam artwork and the community icon before the local fallback", () => {
    const sources = getGameImageSources(10, "icon-hash");

    expect(sources.map((source) => source.presentation)).toEqual([
      "cover",
      "cover",
      "icon",
      "fallback",
    ]);
    expect(sources.at(-1)?.src).toBe("/game-placeholder.svg");
  });

  it("always includes the local fallback when no icon is available", () => {
    const sources = getGameImageSources(10);

    expect(sources).toHaveLength(3);
    expect(sources.at(-1)).toEqual({
      src: "/game-placeholder.svg",
      presentation: "fallback",
    });
  });
});
