import { auth } from "@clerk/nextjs/server";

import { createMemoryEntry, listMemoryEntries } from "@/db/entries";
import { getMovieDetails, TmdbError } from "@/lib/tmdb";
import {
  createEntrySchema,
  entriesQuerySchema,
} from "@/lib/validation";

export const runtime = "nodejs";

const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

function issues(error: { issues: readonly { path: PropertyKey[]; message: string }[] }) {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));
}

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: PRIVATE_NO_STORE },
    );
  }

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = entriesQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid query", issues: issues(parsed.error) },
      { status: 400, headers: PRIVATE_NO_STORE },
    );
  }

  try {
    const page = await listMemoryEntries(userId, parsed.data);
    return Response.json(page, { headers: PRIVATE_NO_STORE });
  } catch (error) {
    console.error("Failed to list memory entries", error);
    return Response.json(
      { error: "Unable to load memories" },
      { status: 500, headers: PRIVATE_NO_STORE },
    );
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: PRIVATE_NO_STORE },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: PRIVATE_NO_STORE },
    );
  }

  const parsed = createEntrySchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid entry", issues: issues(parsed.error) },
      { status: 400, headers: PRIVATE_NO_STORE },
    );
  }

  let details;

  try {
    details = await getMovieDetails(parsed.data.tmdbId);
  } catch (error) {
    if (error instanceof TmdbError) {
      return Response.json(
        { error: error.publicMessage, code: error.code },
        { status: error.statusCode, headers: PRIVATE_NO_STORE },
      );
    }

    console.error("Failed to load canonical movie details", error);
    return Response.json(
      { error: "Movie details are temporarily unavailable" },
      { status: 502, headers: PRIVATE_NO_STORE },
    );
  }

  try {
    const entry = await createMemoryEntry(userId, parsed.data, details);
    return Response.json(
      { entry },
      { status: 201, headers: PRIVATE_NO_STORE },
    );
  } catch (error) {
    console.error("Failed to create memory entry", error);
    return Response.json(
      { error: "Unable to save this memory" },
      { status: 500, headers: PRIVATE_NO_STORE },
    );
  }
}
