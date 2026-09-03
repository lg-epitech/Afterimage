import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getMovieDetails, TmdbError } from "@/lib/tmdb";

const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        error: "Sign in to view movie details.",
        code: "UNAUTHORIZED",
      },
      { status: 401, headers: PRIVATE_NO_STORE },
    );
  }

  const { id } = await context.params;

  if (!/^\d+$/u.test(id)) {
    return NextResponse.json(
      {
        error: "The selected movie ID is invalid.",
        code: "INVALID_REQUEST",
      },
      { status: 400, headers: PRIVATE_NO_STORE },
    );
  }

  try {
    const movie = await getMovieDetails(Number(id));
    return NextResponse.json({ movie }, { headers: PRIVATE_NO_STORE });
  } catch (error) {
    if (error instanceof TmdbError) {
      return NextResponse.json(
        {
          error: error.publicMessage,
          code: error.code,
        },
        { status: error.statusCode, headers: PRIVATE_NO_STORE },
      );
    }

    console.error("Unexpected movie detail failure", error);
    return NextResponse.json(
      {
        error: "Movie metadata is temporarily unavailable.",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers: PRIVATE_NO_STORE },
    );
  }
}
