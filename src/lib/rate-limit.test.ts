import { describe, expect, it } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("izinkan sampai limit, lalu tolak dengan retryAfter", () => {
    const key = `test:${Math.random()}`;
    expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 3, 60_000).allowed).toBe(true);

    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("key berbeda tidak saling memengaruhi", () => {
    expect(rateLimit("a:x", 1, 60_000).allowed).toBe(true);
    expect(rateLimit("a:y", 1, 60_000).allowed).toBe(true);
    expect(rateLimit("a:x", 1, 60_000).allowed).toBe(false);
  });

  it("window kedaluwarsa -> boleh lagi (dengan windowMs mini)", async () => {
    const key = `test-exp:${Math.random()}`;
    expect(rateLimit(key, 1, 30).allowed).toBe(true);
    expect(rateLimit(key, 1, 30).allowed).toBe(false);
    await new Promise((r) => setTimeout(r, 40));
    expect(rateLimit(key, 1, 30).allowed).toBe(true);
  });
});
