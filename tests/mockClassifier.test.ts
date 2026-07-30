import { describe, expect, test } from "bun:test";
import type { ClassifyInput } from "../src/domain/demand";
import { classify } from "../src/lib/ai";
import { mockClassify } from "../src/lib/ai/mockClassifier";

const REDACTED = "[redacted]";

function textualOutputValues(output: ReturnType<typeof mockClassify>) {
  return [
    output.clean_text,
    output.title,
    output.need_summary,
    output.suggested_action,
    output.sub_category,
  ];
}

describe("mockClassify determinism and immutability", () => {
  test("returns deeply equal output for identical input and does not mutate input", () => {
    const input: ClassifyInput = {
      raw_text: "Need a quiet study library near college",
      location_context: { area_label: "Indiranagar", city: "Bengaluru" },
    };
    const before = JSON.stringify(input);

    const first = mockClassify(input);
    const second = mockClassify(input);

    expect(second).toEqual(first);
    expect(JSON.stringify(input)).toBe(before);
    expect(input.location_context).toEqual({ area_label: "Indiranagar", city: "Bengaluru" });
  });
});

describe("mockClassify redaction and privacy", () => {
  test.each([
    ["phone number", "Need a pharmacy, call +91 98765 43210", "+91 98765 43210"],
    ["email address", "Need a study room, contact student@example.com", "student@example.com"],
    ["12-digit identifier", "Need food subsidy for ID 123456789012", "123456789012"],
  ])("redacts supported %s patterns", (_label, rawText, sensitiveValue) => {
    const output = mockClassify({ raw_text: rawText });

    expect(output.clean_text).toContain(REDACTED);
    expect(output.privacy_status).toBe("redacted");
    textualOutputValues(output).forEach((value) => expect(value).not.toContain(sensitiveValue));
  });

  test("redacts multiple supported PII forms in one report", () => {
    const output = mockClassify({
      raw_text:
        "Need medicine delivery, call 9876543210 or mail care@example.com for ID 123456789012",
    });

    expect(output.clean_text.match(/\[redacted\]/g)?.length).toBe(3);
    expect(output.privacy_status).toBe("redacted");
    expect(output.clean_text).not.toContain("9876543210");
    expect(output.clean_text).not.toContain("care@example.com");
    expect(output.clean_text).not.toContain("123456789012");
  });

  test("keeps safe ordinary text clean", () => {
    const output = mockClassify({ raw_text: "Need an affordable tiffin near college" });

    expect(output.privacy_status).toBe("clean");
    expect(output.clean_text).not.toContain(REDACTED);
  });
});

describe("mockClassify classification behaviour", () => {
  test.each([
    ["study", "Need a quiet study library near college", "study_space", "24h study library"],
    ["food", "Affordable tiffin and dinner needed", "food", "Affordable meals < \u20b9100"],
    ["transport", "Need a feeder bus shuttle after work", "transport", "Last-mile transport"],
    ["atm", "Working ATM with cash is missing", "atm", "Working ATM"],
  ] as const)("maps representative %s keyword text", (_label, rawText, category, subCategory) => {
    const output = mockClassify({ raw_text: rawText });

    expect(output.category).toBe(category);
    expect(output.sub_category).toBe(subCategory);
  });

  test("matches keywords case-insensitively", () => {
    const output = mockClassify({ raw_text: "Need PHARMACY and MEDICINE nearby" });

    expect(output.category).toBe("pharmacy");
    expect(output.sub_category).toBe("24x7 pharmacy");
  });

  test("falls back to other for unmatched text", () => {
    const output = mockClassify({ raw_text: "Need something useful for the neighbourhood" });

    expect(output.category).toBe("other");
    expect(output.sub_category).toBe("Emerging local need");
  });

  test("keeps the first ordered category when keyword scores tie", () => {
    const output = mockClassify({ raw_text: "Need study bus access" });

    expect(output.category).toBe("study_space");
    expect(output.sub_category).toBe("24h study library");
  });
});

describe("mockClassify affected group and actor routing", () => {
  test.each([
    ["students", "Need printing near college", "students"],
    ["working women", "Unsafe lane for women returning from office", "working_women"],
    ["seniors", "Senior residents need grocery delivery", "seniors"],
    ["families", "Parents need daycare for each child", "families"],
    ["commuters", "Need bus commute after work", "commuters"],
    ["fallback", "Need a neighbourhood notice board", "general"],
  ] as const)("routes affected group for %s", (_label, rawText, affectedGroup) => {
    expect(mockClassify({ raw_text: rawText }).affected_group).toBe(affectedGroup);
  });

  test.each([
    ["transport", "Need bus shuttle", "transport_authority"],
    ["women safety", "Unsafe dark street for women", "government"],
    ["mental health", "Need anxiety counselling", "ngo"],
    ["local business", "Need pharmacy medicine nearby", "local_business"],
    ["fallback", "Need a neighbourhood notice board", "community"],
  ] as const)("routes recommended actor for %s", (_label, rawText, actor) => {
    expect(mockClassify({ raw_text: rawText }).recommended_actor).toBe(actor);
  });
});

describe("mockClassify urgency and scoring contracts", () => {
  test("keeps low-urgency text low priority", () => {
    const output = mockClassify({ raw_text: "Need a budget gym nearby" });

    expect(output.urgency).toBe(2);
    expect(output.impact_priority).toBe("low");
  });

  test("maps high-urgency text to capped critical priority", () => {
    const output = mockClassify({
      raw_text: "Emergency pharmacy needed immediately, no medicine nearby",
    });

    expect(output.category).toBe("pharmacy");
    expect(output.urgency).toBe(5);
    expect(output.impact_priority).toBe("critical");
  });

  test("keeps scoring fields in allowed ranges and deterministic", () => {
    const input = { raw_text: "Need affordable dinner near college" };
    const first = mockClassify(input);
    const second = mockClassify(input);

    expect(first.urgency).toBeGreaterThanOrEqual(1);
    expect(first.urgency).toBeLessThanOrEqual(5);
    expect(first.signal_strength).toBeGreaterThanOrEqual(0);
    expect(first.signal_strength).toBeLessThanOrEqual(100);
    expect(first.confidence_score).toBeGreaterThanOrEqual(0);
    expect(first.confidence_score).toBeLessThanOrEqual(100);
    expect(first.similar_reports_count).toBeGreaterThanOrEqual(1);
    expect(first.similar_reports_count).toBeLessThanOrEqual(28);
    expect(second.similar_reports_count).toBe(first.similar_reports_count);
    expect(second.signal_strength).toBe(first.signal_strength);
    expect(second.confidence_score).toBe(first.confidence_score);
  });
});

describe("mockClassify location ownership", () => {
  test("does not return app-owned location fields", () => {
    const output = mockClassify({
      raw_text: "Need tiffin near Indiranagar",
      location_context: { area_label: "Indiranagar", city: "Bengaluru" },
    }) as Record<string, unknown>;

    expect("area_label" in output).toBe(false);
    expect("location_text" in output).toBe(false);
    expect("latitude" in output).toBe(false);
    expect("longitude" in output).toBe(false);
  });

  test("does not mutate structured location context", () => {
    const input: ClassifyInput = {
      raw_text: "Need bus commute",
      location_context: { area_label: "Whitefield", city: "Bengaluru", micro_area: "ITPL" },
    };
    const before = JSON.stringify(input.location_context);

    mockClassify(input);

    expect(JSON.stringify(input.location_context)).toBe(before);
  });
});

describe("classify public async entry point", () => {
  test("resolves to the deterministic mock classification contract", async () => {
    const input = {
      raw_text: "Need late night pharmacy nearby",
      location_context: { area_label: "BTM Layout" },
    };

    await expect(classify(input)).resolves.toEqual(mockClassify(input));
  });
});
