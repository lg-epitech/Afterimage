import { describe, expect, it } from "vitest";

import { createEntrySchema, entriesQuerySchema } from "./validation";

const validEntry = {
  tmdbId: 550,
  reaction: "loved",
  notes: "It followed me home.",
  watchedOn: "2026-09-02",
  watchedTimezone: "America/Toronto",
  utcOffsetMinutes: -240,
  watchContext: "home",
  locationLabel: "Montreal",
  venueName: null,
  platform: "Blu-ray",
  mood: "Reflective",
  companions: ["Alex"],
  tags: ["Late night"],
  isRewatch: false,
};

describe("entry validation", () => {
  it("normalizes optional text and removes duplicate list values", () => {
    const parsed = createEntrySchema.parse({
      ...validEntry,
      venueName: "   ",
      companions: ["Alex", " alex ", "Sam"],
      tags: ["Dreamlike", "dreamlike"],
    });

    expect(parsed.venueName).toBeNull();
    expect(parsed.companions).toEqual(["Alex", "Sam"]);
    expect(parsed.tags).toEqual(["Dreamlike"]);
  });

  it("rejects invalid timezone context instead of corrupting watch dates", () => {
    const parsed = createEntrySchema.safeParse({
      ...validEntry,
      watchedTimezone: "not/a-zone",
      utcOffsetMinutes: 900,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects future viewing dates at the API boundary", () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const parsed = createEntrySchema.safeParse({
      ...validEntry,
      watchedOn: tomorrow,
      watchedTimezone: "UTC",
      utcOffsetMinutes: 0,
    });

    expect(parsed.success).toBe(false);
  });

  it("coerces bounded journal pagination parameters", () => {
    expect(entriesQuerySchema.parse({ limit: "25", offset: "50" })).toMatchObject({
      limit: 25,
      offset: 50,
    });
    expect(entriesQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
  });
});
