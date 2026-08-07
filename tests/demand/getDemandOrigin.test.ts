import { describe, expect, test } from "bun:test";
import {
  getDemandOrigin,
  getDemandOriginPresentation,
  getDemandOriginSummary,
} from "../../src/lib/demand";

describe("demand origin presentation", () => {
  test("classifies canonical seed ids as sample data", () => {
    expect(getDemandOrigin("seed-01-demo")).toBe("sample");
    expect(getDemandOriginPresentation("seed-01-demo")).toEqual({
      origin: "sample",
      label: "Sample data",
    });
  });

  test("classifies non-seed ids as browser-local reports", () => {
    expect(getDemandOrigin("usr-local-report")).toBe("browser-local");
    expect(getDemandOriginPresentation("usr-local-report")).toEqual({
      origin: "browser-local",
      label: "Saved in this browser",
    });
  });

  test("summarizes sample-only, browser-local-only, and mixed groups", () => {
    expect(getDemandOriginSummary(["seed-a", "seed-b"]).label).toBe("Sample data");
    expect(getDemandOriginSummary(["usr-a", "usr-b"]).label).toBe("Saved in this browser");
    expect(getDemandOriginSummary(["seed-a", "usr-a"]).label).toBe("Mixed demo data");
  });

  test("uses a neutral label when no demand records are present", () => {
    expect(getDemandOriginSummary([])).toEqual({ label: "No demand records" });
  });
});
