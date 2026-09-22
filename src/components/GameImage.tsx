"use client";

import { useState } from "react";

type Props = {
  appid: number;
  name: string;
  iconHash?: string;
  className?: string;
};

export default function GameImage({
  appid,
  name,
  iconHash,
  className = "",
}: Props) {
  const imageSources = [
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg`,
    iconHash
      ? `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${iconHash}.jpg`
      : null,
  ].filter(Boolean) as string[];

  const [imageIndex, setImageIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const isIcon = imageIndex === 2;

  function handleError() {
    const nextIndex = imageIndex + 1;

    if (nextIndex < imageSources.length) {
      setImageIndex(nextIndex);
    } else {
      setFailed(true);
    }
  }

  if (failed || imageSources.length === 0) {
    return (
      <div
        className={`flex h-44 w-full items-center justify-center bg-zinc-950 px-4 text-center text-sm text-zinc-500 ${className}`}
      >
        {name}
      </div>
    );
  }

  return (
    <div
      className={`flex h-44 w-full items-center justify-center overflow-hidden bg-zinc-950 ${className}`}
    >
      <img
        src={imageSources[imageIndex]}
        alt={name}
        onError={handleError}
        className={
          isIcon
            ? "h-20 w-20 rounded-lg object-cover"
            : "h-full w-full object-cover"
        }
      />
    </div>
  );
}