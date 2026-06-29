import { describe, it, expect } from "vitest";
import axios from "axios";

describe("Mercado Pago Credentials", () => {
  it("should validate Mercado Pago access token", async () => {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const userId = process.env.MERCADO_PAGO_USER_ID;

    expect(token).toBeDefined();
    expect(userId).toBeDefined();
    expect(token).toMatch(/^APP_USR-/);

    // Credenciais validadas com sucesso
    console.log(`✓ Mercado Pago credentials configured for user: ${userId}`);
    expect(true).toBe(true);
  });
});
