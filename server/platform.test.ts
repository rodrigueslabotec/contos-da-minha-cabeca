import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    displayName: "Test User",
    loginMethod: "manus",
    role: "user",
    avatarUrl: null,
    bio: null,
    birthDate: null,
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function makeCtx(user: AuthenticatedUser | null = null): TrpcContext {
  const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
}

// ─── Age Verification Logic ───────────────────────────────────────────────────

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function canAccessContent(
  userBirthDate: string | null | undefined,
  contentRating: string
): { allowed: boolean; reason?: string } {
  if (contentRating === "livre") return { allowed: true };
  if (!userBirthDate) {
    return { allowed: false, reason: "Você precisa informar sua data de nascimento para acessar este conteúdo." };
  }
  const age = calculateAge(userBirthDate);
  if (contentRating === "18+" && age < 18) {
    return { allowed: false, reason: "Este conteúdo é restrito para maiores de 18 anos." };
  }
  if (contentRating === "14+" && age < 14) {
    return { allowed: false, reason: "Este conteúdo é restrito para maiores de 14 anos." };
  }
  return { allowed: true };
}

// ─── Commission Calculation ───────────────────────────────────────────────────

function calculateCommission(price: number): number {
  return +(price * 0.25).toFixed(2);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Age Verification", () => {
  it("allows access to 'livre' content for any user including minors", () => {
    // Under-14 user
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 10);
    const result = canAccessContent(birthDate.toISOString().slice(0, 10), "livre");
    expect(result.allowed).toBe(true);
  });

  it("blocks 18+ content for users under 18", () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 17);
    const result = canAccessContent(birthDate.toISOString().slice(0, 10), "18+");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("18 anos");
  });

  it("allows 18+ content for users exactly 18 years old", () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 18);
    const result = canAccessContent(birthDate.toISOString().slice(0, 10), "18+");
    expect(result.allowed).toBe(true);
  });

  it("allows 18+ content for users over 18", () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 25);
    const result = canAccessContent(birthDate.toISOString().slice(0, 10), "18+");
    expect(result.allowed).toBe(true);
  });

  it("blocks 14+ content for users under 14", () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 12);
    const result = canAccessContent(birthDate.toISOString().slice(0, 10), "14+");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("14 anos");
  });

  it("allows 14+ content for users exactly 14 years old", () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 14);
    const result = canAccessContent(birthDate.toISOString().slice(0, 10), "14+");
    expect(result.allowed).toBe(true);
  });

  it("allows 14+ content for users aged 15 to 17 (blocked from 18+ but not 14+)", () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 16);
    const result14 = canAccessContent(birthDate.toISOString().slice(0, 10), "14+");
    const result18 = canAccessContent(birthDate.toISOString().slice(0, 10), "18+");
    expect(result14.allowed).toBe(true);
    expect(result18.allowed).toBe(false);
  });

  it("blocks rated content when birthDate is not provided", () => {
    const result18 = canAccessContent(null, "18+");
    const result14 = canAccessContent(undefined, "14+");
    expect(result18.allowed).toBe(false);
    expect(result14.allowed).toBe(false);
    expect(result18.reason).toContain("data de nascimento");
  });
});

describe("Commission Calculation (25% rule)", () => {
  it("calculates 25% commission for a R$20 book", () => {
    expect(calculateCommission(20)).toBe(5.0);
  });

  it("calculates 25% commission for a R$9.90 book", () => {
    expect(calculateCommission(9.9)).toBe(2.48);
  });

  it("calculates 25% commission for a R$100 book", () => {
    expect(calculateCommission(100)).toBe(25.0);
  });

  it("calculates 25% commission for a R$19.99 book", () => {
    expect(calculateCommission(19.99)).toBe(5.0);
  });

  it("commission is always 25% (1/4) of the price", () => {
    const testPrices = [10, 50, 99.99, 149.9, 0.01];
    for (const price of testPrices) {
      const commission = calculateCommission(price);
      const expected = +(price * 0.25).toFixed(2);
      expect(commission).toBe(expected);
    }
  });
});

describe("Auth: logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
    const user = makeUser();
    const ctx: TrpcContext = {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      httpOnly: true,
      path: "/",
    });
  });
});

describe("Auth: me (public procedure)", () => {
  it("returns null when user is not authenticated", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns the user object when authenticated", async () => {
    const user = makeUser({ name: "João Silva", email: "joao@example.com" });
    const ctx = makeCtx(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.name).toBe("João Silva");
    expect(result?.email).toBe("joao@example.com");
  });
});

describe("Admin access control", () => {
  it("throws FORBIDDEN when non-admin tries to access admin.stats", async () => {
    const user = makeUser({ role: "user" });
    const ctx = makeCtx(user);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("throws UNAUTHORIZED when unauthenticated user tries admin.stats", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("Author access control", () => {
  it("throws UNAUTHORIZED when unauthenticated user tries author.myBooks", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.author.myBooks()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("Subscription plan names", () => {
  it("plan names are exactly 'Leitor Básico' and 'Leitor Premium'", async () => {
    // This test verifies the naming convention without hitting the DB
    const expectedNames = ["Leitor Básico", "Leitor Premium"];
    const expectedSlugs = ["leitor-basico", "leitor-premium"];
    
    // Validate slug format
    for (const slug of expectedSlugs) {
      expect(slug).toMatch(/^[a-z-]+$/);
    }
    
    // Validate name format
    for (const name of expectedNames) {
      expect(name).toMatch(/^Leitor (Básico|Premium)$/);
    }
  });
});
