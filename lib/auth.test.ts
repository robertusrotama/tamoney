import { describe, expect, it } from "vitest";
import { authErrorMessage, safeNext } from "./auth";

describe("authErrorMessage", () => {
  it("translates common Supabase errors", () => {
    expect(authErrorMessage("Invalid login credentials")).toBe("Email atau password salah");
    expect(authErrorMessage("User already registered")).toBe("Email sudah terdaftar");
    expect(authErrorMessage("Email not confirmed")).toBe("Email belum diverifikasi. Cek kotak masuk Anda");
  });

  it("falls back to a generic message", () => {
    expect(authErrorMessage("something odd")).toBe("Terjadi kesalahan, coba lagi");
  });
});

describe("safeNext", () => {
  it("allows same-site relative paths", () => {
    expect(safeNext("/reset-password")).toBe("/reset-password");
  });

  it("rejects anything that could leave the site", () => {
    for (const bad of [null, "", "https://evil.com", "//evil.com", "/\\evil.com", "reset"]) {
      expect(safeNext(bad)).toBe("/");
    }
  });
});
