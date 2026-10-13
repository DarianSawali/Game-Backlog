export type GameImageSource = {
  src: string;
  presentation: "cover" | "icon" | "fallback";
};

export function getGameImageSources(
  appid: number,
  iconHash?: string
): GameImageSource[] {
  const sources: GameImageSource[] = [
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
