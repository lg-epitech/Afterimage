import { auth } from "@clerk/nextjs/server";

import { getMemoryStats } from "@/db/entries";

export const runtime = "nodejs";

const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: PRIVATE_NO_STORE },
    );
  }

  try {
    const stats = await getMemoryStats(userId);
    return Response.json(stats, { headers: PRIVATE_NO_STORE });
  } catch (error) {
    console.error("Failed to load memory stats", error);
    return Response.json(
      { error: "Unable to load stats" },
      { status: 500, headers: PRIVATE_NO_STORE },
    );
  }
}
