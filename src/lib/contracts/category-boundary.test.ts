import { describe, expect, it } from "vitest";
import { z } from "zod";
import { enabledCategories } from "./categories";

describe("analysis category boundary", () => {
  it("keeps the MVP allowlist limited to housing leases", () => {
    const categorySchema = z.enum(enabledCategories);

    expect(categorySchema.safeParse("housing-lease").success).toBe(true);
    expect(categorySchema.safeParse("labor").success).toBe(false);
    expect(categorySchema.safeParse("wedding").success).toBe(false);
  });
});
