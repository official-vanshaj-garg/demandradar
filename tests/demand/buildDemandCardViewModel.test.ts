import { describe, expect, test } from "bun:test";
import type { DemandReport } from "../../src/domain/demand";
import { buildDemandCardViewModel } from "../../src/lib/demand";

const baseDemand: DemandReport = {
  id: "demand-123456789",
  created_at: "2026-07-25T10:00:00.000Z",
  reporter_session: "session-1",
  raw_text: "Need late evening study rooms near the metro",
  clean_text: "Need late evening study rooms near the metro",
  title: "Late evening study space needed",
  need_summary: "Students need study rooms that stay open later near the metro.",
  category: "study_space",
  sub_category: "Late hours",
  affected_group: "working_women",
  urgency: 4,
  signal_strength: 86,
  impact_priority: "high",
  privacy_status: "clean",
  confidence_score: 91,
  recommended_actor: "local_business",
  suggested_action: "Open a compact study room near the station.",
  similar_reports_count: 7,
  location_text: "Indiranagar metro",
  area_label: "Indiranagar",
  latitude: 12.971234,
  longitude: 77.640876,
  status: "new",
  upvotes: 12,
};

describe("buildDemandCardViewModel", () => {
  test("projects report fields used by the card and drawer", () => {
    const viewModel = buildDemandCardViewModel(baseDemand);

    expect(viewModel).toMatchObject({
      id: "demand-123456789",
      displayId: "demand-1",
      title: "Late evening study space needed",
      needSummary: "Students need study rooms that stay open later near the metro.",
      subCategory: "Late hours",
      signalStrength: 86,
      urgency: 4,
      impactPriority: "high",
      confidenceScore: 91,
      privacyStatus: "clean",
      similarReportsCount: 7,
      status: "new",
      suggestedAction: "Open a compact study room near the station.",
      rawText: "Need late evening study rooms near the metro",
      areaLabel: "Indiranagar",
      upvotes: 12,
    });
  });

  test("formats labels, metadata, display id, and coordinates", () => {
    const viewModel = buildDemandCardViewModel(baseDemand);

    expect(viewModel.category).toEqual({
      key: "study_space",
      label: "Study Space",
      icon: "BookOpen",
      color: "oklch(0.82 0.16 195)",
    });
    expect(viewModel.affectedGroupLabel).toBe("working women");
    expect(viewModel.recommendedActorLabel).toBe("Local Business");
    expect(viewModel.locationText).toBe("Indiranagar metro");
    expect(viewModel.latitudeText).toBe("12.971");
    expect(viewModel.longitudeText).toBe("77.641");
  });

  test("handles already-displayable actor and group labels deterministically", () => {
    const viewModel = buildDemandCardViewModel({
      ...baseDemand,
      id: "short",
      affected_group: "general",
      recommended_actor: "transport_authority",
      latitude: 12,
      longitude: 77,
    });

    expect(viewModel.displayId).toBe("short");
    expect(viewModel.affectedGroupLabel).toBe("general");
    expect(viewModel.recommendedActorLabel).toBe("Transport Authority");
    expect(viewModel.latitudeText).toBe("12.000");
    expect(viewModel.longitudeText).toBe("77.000");
  });
});
