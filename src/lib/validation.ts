import { z } from "zod";

import { REACTIONS } from "@/lib/types";

const MAX_NOTES_LENGTH = 20_000;

function nullableText(maxLength: number) {
  return z
    .preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? null : value,
      z.string().trim().min(1).max(maxLength).nullable().optional(),
    )
    .transform((value) => value ?? null);
}

function uniqueTextList(maxItems: number, maxItemLength: number) {
  return z
    .array(z.string().trim().min(1).max(maxItemLength))
    .max(maxItems)
    .default([])
    .transform((values) => {
      const seen = new Set<string>();

      return values.filter((value) => {
        const key = value.toLocaleLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
}

function isIanaTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function todayInTimezone(timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export const reactionSchema = z.enum(REACTIONS);

export const createEntrySchema = z
  .object({
    tmdbId: z.number().int().positive(),
    reaction: reactionSchema,
    notes: z.string().trim().max(MAX_NOTES_LENGTH).default(""),
    watchedOn: z.iso.date(),
    watchedTimezone: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine(isIanaTimezone, "Must be a valid IANA timezone"),
    utcOffsetMinutes: z.number().int().min(-840).max(840),
    watchContext: nullableText(80),
    locationLabel: nullableText(160),
    venueName: nullableText(160),
    platform: nullableText(100),
    mood: nullableText(100),
    companions: uniqueTextList(20, 100),
    tags: uniqueTextList(30, 50),
    isRewatch: z.boolean().default(false),
  })
  .strict()
  .superRefine((entry, context) => {
    try {
      if (entry.watchedOn > todayInTimezone(entry.watchedTimezone)) {
        context.addIssue({
          code: "custom",
          path: ["watchedOn"],
          message: "Watched date cannot be in the future",
        });
      }
    } catch {
      // The timezone field already reports its own validation issue.
    }
  });

export const entriesQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  reaction: reactionSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
});

export const entryIdSchema = z.uuid();

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type EntriesQuery = z.infer<typeof entriesQuerySchema>;
