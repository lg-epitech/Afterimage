import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

import { searchMovies, TmdbError } from "@/lib/tmdb";

const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

function errorResponse(error: TmdbError) {
  return NextResponse.json(
    {
      error: error.publicMessage,
      code: error.code,
    },
    { status: error.statusCode, headers: PRIVATE_NO_STORE },
  );
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to search movies.", code: "UNAUTHORIZED" },
      { status: 401, headers: PRIVATE_NO_STORE },
    );
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const rawPage = request.nextUrl.searchParams.get("page");

  if (rawPage !== null && !/^\d+$/u.test(rawPage)) {
    return errorResponse(
      new TmdbError(
        "INVALID_REQUEST",
        400,
        "Search page was not an integer.",
        "The requested search page is invalid.",
      ),
    );
  }

  try {
    const movies = await searchMovies(query, rawPage === null ? 1 : Number(rawPage));
    return NextResponse.json(
      { results: movies.results },
      { headers: PRIVATE_NO_STORE },
    );
  } catch (error) {
    if (error instanceof TmdbError) {
      return errorResponse(error);
    }

    console.error("Unexpected movie search failure", error);
    return NextResponse.json(
      {
        error: "Movie search is temporarily unavailable.",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers: PRIVATE_NO_STORE },
    );
  }
}
