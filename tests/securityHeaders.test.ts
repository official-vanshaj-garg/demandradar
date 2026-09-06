import { describe, expect, test } from "bun:test";
import {
  applyPublicDemoSecurityHeaders,
  PUBLIC_DEMO_CSP,
  PUBLIC_DEMO_SECURITY_HEADERS,
} from "../src/lib/securityHeaders";

describe("public demo security headers", () => {
  test("includes the required response protections and noindex directive", () => {
    expect(PUBLIC_DEMO_SECURITY_HEADERS["Permissions-Policy"]).toContain("geolocation=(self)");
    expect(PUBLIC_DEMO_SECURITY_HEADERS["X-Robots-Tag"]).toBe("noindex, nofollow, noarchive");
    expect(PUBLIC_DEMO_SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
    expect(PUBLIC_DEMO_SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    expect(PUBLIC_DEMO_SECURITY_HEADERS["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("keeps the CSP strict while permitting current fonts and hydration", () => {
    expect(PUBLIC_DEMO_CSP).toContain("frame-ancestors 'none'");
    expect(PUBLIC_DEMO_CSP).toContain("https://fonts.googleapis.com");
    expect(PUBLIC_DEMO_CSP).toContain("https://fonts.gstatic.com");
    expect(PUBLIC_DEMO_CSP).not.toContain("unsafe-eval");
    expect(PUBLIC_DEMO_CSP).not.toContain("*");
  });

  test("applies headers without replacing the response body or existing headers", async () => {
    const response = applyPublicDemoSecurityHeaders(
      new Response("demo", { status: 201, headers: { "content-type": "text/plain" } }),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("content-type")).toBe("text/plain");
    expect(response.headers.get("content-security-policy")).toBe(PUBLIC_DEMO_CSP);
    expect(await response.text()).toBe("demo");
  });
});
