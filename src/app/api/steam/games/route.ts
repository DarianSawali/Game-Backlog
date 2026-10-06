import { NextRequest, NextResponse } from "next/server";
import {
  getGameMetadata,
  SteamGameMetadata,
} from "@/lib/steam";

const MAX_APP_IDS = 50;
const METADATA_CONCURRENCY = 6;

export async function GET(request: NextRequest) {
  const rawAppIds = request.nextUrl.searchParams.get("appids") ?? "";
  const appids = [
    ...new Set(
      rawAppIds
        .split(",")
        .map(Number)
        .filter((appid) => Number.isInteger(appid) && appid > 0)
    ),
  ];

  if (appids.length === 0) {
    return NextResponse.json(
      { error: "At least one valid Steam app ID is required" },
      { status: 400 }
    );
  }

  if (appids.length > MAX_APP_IDS) {
    return NextResponse.json(
      { error: `A maximum of ${MAX_APP_IDS} app IDs is allowed` },
      { status: 400 }
    );
  }

  const games: SteamGameMetadata[] = [];

  for (
    let index = 0;
    index < appids.length;
    index += METADATA_CONCURRENCY
  ) {
    const batch = appids.slice(index, index + METADATA_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((appid) => getGameMetadata(appid))
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        games.push(result.value);
      }
    }
  }

  return NextResponse.json({ games });
}
