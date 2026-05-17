import { describe, expect, it } from "vitest";
import { z } from "zod";
import { enabledCategories } from "./categories";

describe("analysis category boundary", () => {
  it("enables housing-lease, labor, interior, freelance and blocks wedding (not implemented)", () => {
    const categorySchema = z.enum(enabledCategories);

    expect(categorySchema.safeParse("housing-lease").success).toBe(true);
    expect(categorySchema.safeParse("labor").success).toBe(true);
    expect(categorySchema.safeParse("interior").success).toBe(true);
    expect(categorySchema.safeParse("freelance").success).toBe(true);
    expect(categorySchema.safeParse("wedding").success).toBe(false);
  });
});
