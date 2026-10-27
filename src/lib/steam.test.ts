import { describe, expect, it } from "vitest";
import { parseSteamStoreTags } from "@/lib/steam";

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
