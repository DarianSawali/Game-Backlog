import {NextResponse} from 'next/server';
import { getOwnedGames } from '@/lib/steam';

export async function GET(){
    try {
        const games = await getOwnedGames();

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