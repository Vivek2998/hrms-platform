import { describe, it, expect } from "vitest";
import { loginSchema, changePasswordSchema } from "./auth.schema.js";

describe("auth schema validation", () => {
  it("accepts valid login credentials", () => {
    const result = loginSchema.safeParse({
      email: "admin@democorp.in",
      password: "Admin@1234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "Admin@1234" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched password confirmation", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "Old@1234",
      newPassword: "New@1234!",
      confirmPassword: "Different@1234",
    });
    expect(result.success).toBe(false);
  });
});
