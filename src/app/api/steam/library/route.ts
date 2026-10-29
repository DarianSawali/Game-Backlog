import {NextResponse} from 'next/server';
import { getOwnedGames } from '@/lib/steam';

export async function GET(){
    try {
        const steamId = process.env.STEAM_ID;
        if (!steamId) throw new Error("STEAM_ID is missing");
        const result = await getOwnedGames(steamId);

        if (result.status === "private") {
            return NextResponse.json(
                {
                    code: "STEAM_LIBRARY_PRIVATE",
                    error: "Steam library is not visible",
                },
                { status: 403 }
            );
        }

        if (result.status === "failed") {
            return NextResponse.json(
                {
                    code: result.reason === "rate-limited"
                        ? "STEAM_RATE_LIMITED"
                        : "STEAM_UNAVAILABLE",
                    error: "Unable to fetch Steam library",
                },
                { status: result.reason === "rate-limited" ? 429 : 503 }
            );
        }

        const games = result.games;

        return NextResponse.json({
            count: games.length,
            games,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
        {
            error: "Unable to fetch Steam library",
        },
        {
            status: 500,
        }
        );
    }
}
