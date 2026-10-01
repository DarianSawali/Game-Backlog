import { NextResponse } from "next/server";
import { getGameMetadata } from "@/lib/steam";

type Props = {
  params: Promise<{
    appid: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: Props
) {
  const { appid } = await params;

  const parsedAppId = Number(appid);

  if (!Number.isInteger(parsedAppId)) {
    return NextResponse.json(
      {
        error: "Invalid Steam app ID",
      },
      {
        status: 400,
      }
    );
  }

  const metadata =
    await getGameMetadata(parsedAppId);

  if (!metadata) {
    return NextResponse.json(
      {
        error: "Game metadata not found",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(metadata);
}