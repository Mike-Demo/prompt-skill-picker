import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cookie: "", setCookie: vi.fn(), rpc: vi.fn() }));
vi.mock("@tanstack/react-start/server", () => ({
  getCookie: () => mocks.cookie, setCookie: mocks.setCookie,
  getRequest: () => ({ headers: new Headers({ "cf-connecting-ip": "192.0.2.1" }) }),
}));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: mocks.rpc } }));
import { requireCaptcha, verifyCaptcha } from "./captcha.server";
import { enforceRateLimit } from "./rate-limit.server";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.cookie = "";
  vi.stubEnv("HCAPTCHA_SECRET_KEY", "unit-test-secret");
  vi.stubEnv("HCAPTCHA_SITEKEY", "unit-test-sitekey");
});

describe("public expensive action protection", () => {
  it("rejects missing CAPTCHA proof", async () => {
    await expect(requireCaptcha()).rejects.toThrow("human verification");
  });
  it("rejects a forged CAPTCHA proof", async () => {
    mocks.cookie = `${Date.now() + 60000}.${"0".repeat(64)}`;
    await expect(requireCaptcha()).rejects.toThrow("human verification");
  });
  it("rejects expired CAPTCHA proof", async () => {
    mocks.cookie = `${Date.now() - 1}.invalid`;
    await expect(requireCaptcha()).rejects.toThrow("human verification");
  });
  it("does not issue proof after provider verification fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: false })));
    await expect(verifyCaptcha("invalid-token")).rejects.toThrow("failed or expired");
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });
  it("allows public requests after real provider success using signed server proof", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: true })));
    await verifyCaptcha("provider-token");
    const call = mocks.setCookie.mock.calls[0];
    if (!call) throw new Error("No verification cookie was issued");
    mocks.cookie = String(call[1]);
    expect(call[2]).toMatchObject({ httpOnly: true, sameSite: "strict", maxAge: 300 });
    await expect(requireCaptcha()).resolves.toBeUndefined();
  });
  it.each(["search", "enhance"] as const)("keeps %s at 3/minute and 30/day", async action => {
    mocks.rpc.mockResolvedValue({ data: { allowed: true }, error: null });
    await enforceRateLimit("192.0.2.1", action);
    expect(mocks.rpc).toHaveBeenCalledWith("check_rate_limit", expect.objectContaining({
      _action: action, _windows: [{ seconds: 60, max: 3 }, { seconds: 86400, max: 30 }],
    }));
  });
  it("persists library quotas separately from API traffic", async () => {
    mocks.rpc.mockResolvedValue({ data: { allowed: true }, error: null });
    await enforceRateLimit("192.0.2.1", "library");
    expect(mocks.rpc).toHaveBeenCalledWith("check_rate_limit", expect.objectContaining({
      _action: "library", _windows: [{ seconds: 60, max: 20 }, { seconds: 3600, max: 200 }],
    }));
  });
  it("fails closed when the durable abuse counter is unavailable", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("unavailable") });
    await expect(enforceRateLimit("192.0.2.1", "download")).rejects.toThrow("temporarily unavailable");
  });
  it("refuses quota-exhausted requests with retry information", async () => {
    mocks.rpc.mockResolvedValue({ data: { allowed: false, retry_after_seconds: 60 }, error: null });
    await expect(enforceRateLimit("192.0.2.1", "download")).rejects.toMatchObject({ retryAfterSeconds: 60 });
  });
});