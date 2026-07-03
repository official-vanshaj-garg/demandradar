# DemandRadar Domain Model

## Core Philosophy
DemandRadar is building the demand graph for hyperlocal India. 
While traditional mapping applications show what already exists, DemandRadar reveals what is missing. It is **not** a complaint or grievance application.

## Core Concepts

### Demand Signal
A single, user-reported unfulfilled need or opportunity in a specific area. It represents the raw submission before it is clustered or aggregated.

### Demand Card
The structured, AI-enriched representation of a demand signal. It translates raw, unstructured text into actionable intelligence (categorized, ranked, and structured) for businesses, operators, and civic bodies.

### Submission Model
The entry point for capturing demand signals. It normalizes unstructured user input into a consistent intent classification, separating the raw user voice from the structured intelligence.

### Location Ownership Rule
Location data is strictly application-owned. The AI classification layer must **never** return, override, or hallucinate location fields (e.g., coordinates, area labels). The AI only receives read-only `location_context` (such as the area label or city) to inform its understanding of the text, but the system of record for the location remains the user's explicit selection via `resolveLocation()`.

### AI Classification Boundary
The AI layer (Signal Engine / Intelligence Layer) is treated as a pure side-effect-free function: `ClassifyInput -> ClassifyOutput`. It parses intent, urgency, and category, but does not mutate the core submission state or location coordinates. 

### Evidence Model
Proof of demand (e.g., photos, audio, links) is optional. Evidence is modeled as metadata references rather than raw binary data, supporting future uploads without polluting the core domain schema.

### Quality Flags
Mechanisms to detect, flag, and filter low-quality, spam, or toxic submissions. This ensures the aggregated demand graph remains highly reliable and actionable.

### Future B2B Aggregated Intelligence Model
The ultimate business model of DemandRadar involves selling aggregated, anonymized hyperlocal demand intelligence to businesses and brands looking to expand. The schema is designed to support clustering signals into highly confident "Demand Hotspots".

### Privacy Rule
**No personal data selling.** The platform models and exposes only aggregated, anonymized intelligence. Personally identifiable information (PII) such as phone numbers or emails is strictly redacted and never exposed to the aggregated intelligence layer.

### What is Intentionally Not Built Yet
- **Real Database / Backend:** Currently relies on mock local storage.
- **Real AI Inference:** Currently uses a deterministic mock classifier; ready for a remote API adapter.
- **Auth / Payments:** Completely omitted for the Layer 1/2 shell.
- **Business Onboarding / Admin Panels:** To be developed after the core demand graph is stable.
- **Real Map Integrations:** Custom SVG radar is used for now instead of heavy map SDKs.
