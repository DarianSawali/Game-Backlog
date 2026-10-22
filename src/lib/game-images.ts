export type GameImageSource = {
  src: string;
  presentation: "cover" | "icon" | "fallback";
  fit?: "contain" | "cover";
};

export function getGameImageSources(
  appid: number,
  iconHash?: string,
  artworkType: "grid" | "hero" = "grid"
): GameImageSource[] {
  const sources: GameImageSource[] = [
    {
      src: `/api/artwork/${appid}?kind=${artworkType}`,
      presentation: "cover",
      fit: "cover",
    },
    {
      src: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
      presentation: "cover",
    },
    {
      src: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg`,
      presentation: "cover",
    },
  ];

  if (iconHash) {
    sources.push({
      src: `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${iconHash}.jpg`,
      presentation: "icon",
    });
  }

  sources.push({
    src: "/game-placeholder.svg",
    presentation: "fallback",
  });

  return sources;
}
