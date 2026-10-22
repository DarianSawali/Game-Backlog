"use client";

import { useState } from "react";
import Image from "next/image";
import {
  getGameImageSources,
} from "@/lib/game-images";
import type { GameImageSource } from "@/lib/game-images";

type Props = {
  appid: number;
  name: string;
  iconHash?: string;
  artworkType?: "grid" | "hero";
  className?: string;
};

type ImageWithFallbackProps = {
  name: string;
  sources: GameImageSource[];
  className: string;
};

function ImageWithFallback({
  name,
  sources,
  className,
}: ImageWithFallbackProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [allSourcesFailed, setAllSourcesFailed] = useState(false);
  const currentSource = sources[imageIndex];

  function handleError() {
    if (imageIndex < sources.length - 1) {
      setImageIndex((index) => index + 1);
    } else {
      setAllSourcesFailed(true);
    }
  }

  if (allSourcesFailed) {
    return (
      <div
        className={`flex aspect-[616/353] w-full items-center justify-center bg-zinc-950 px-4 text-center text-sm text-zinc-400 ${className}`}
        role="img"
        aria-label={`${name} artwork unavailable`}
      >
        {name}
      </div>
    );
  }

  return (
    <div
      className={`relative flex aspect-[616/353] w-full items-center justify-center overflow-hidden bg-zinc-950 ${className}`}
    >
      {currentSource.presentation === "icon" ? (
        <Image
          src={currentSource.src}
          alt={`${name} artwork`}
          width={80}
          height={80}
          loading="lazy"
          onError={handleError}
          className="h-20 w-20 rounded-lg object-cover"
        />
      ) : (
        <Image
          src={currentSource.src}
          alt={
            currentSource.presentation === "fallback"
              ? `${name} placeholder artwork`
              : `${name} artwork`
          }
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          loading="lazy"
          unoptimized={currentSource.presentation === "fallback"}
          onError={handleError}
          className={currentSource.fit === "cover" ? "object-cover" : "object-contain"}
        />
      )}
    </div>
  );
}

export default function GameImage({
  appid,
  name,
  iconHash,
  artworkType = "grid",
  className = "",
}: Props) {
  const sources = getGameImageSources(appid, iconHash, artworkType);

  return (
    <ImageWithFallback
      key={`${appid}-${artworkType}-${iconHash ?? "no-icon"}`}
      name={name}
      sources={sources}
      className={className}
    />
  );
}
