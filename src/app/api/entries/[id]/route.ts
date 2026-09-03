import { auth } from "@clerk/nextjs/server";

import { deleteMemoryEntry } from "@/db/entries";
import { entryIdSchema } from "@/lib/validation";

export const runtime = "nodejs";

const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: PRIVATE_NO_STORE },
    );
  }

  const parsedId = entryIdSchema.safeParse((await params).id);

  if (!parsedId.success) {
    return Response.json(
      { error: "Invalid entry id" },
      { status: 400, headers: PRIVATE_NO_STORE },
    );
  }

  try {
    const deleted = await deleteMemoryEntry(userId, parsedId.data);

    if (!deleted) {
      return Response.json(
        { error: "Memory not found" },
        { status: 404, headers: PRIVATE_NO_STORE },
      );
    }

    return new Response(null, { status: 204, headers: PRIVATE_NO_STORE });
  } catch (error) {
    console.error("Failed to delete memory entry", error);
    return Response.json(
      { error: "Unable to delete this memory" },
      { status: 500, headers: PRIVATE_NO_STORE },
    );
  }
}
