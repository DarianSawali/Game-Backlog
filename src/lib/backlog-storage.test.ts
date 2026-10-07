import { describe, expect, it } from "vitest";
import {
  parseStoredRecord,
  updateStoredRecord,
} from "@/lib/backlog-storage";

describe("backlog storage", () => {
  const isRating = (value: unknown): value is number =>
    typeof value === "number" && value >= 1 && value <= 5;

  it("keeps valid values and removes invalid persisted data", () => {
    expect(
      parseStoredRecord('{"10":5,"11":8,"12":"great"}', isRating)
    ).toEqual({ "10": 5 });
    expect(parseStoredRecord("not-json", isRating)).toEqual({});
  });

  it("updates and removes values without mutating the source", () => {
    const source = { "10": "playing" };
    const updated = updateStoredRecord(source, 12, "completed");
    const removed = updateStoredRecord(updated, 10, null);

    expect(source).toEqual({ "10": "playing" });
    expect(updated).toEqual({ "10": "playing", "12": "completed" });
    expect(removed).toEqual({ "12": "completed" });
  });
});
