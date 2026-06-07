// 40 hand-crafted Bengaluru demand reports. Lat/lng jittered around real area centroids.
// All AI-derived fields produced via the same `mockClassify` contract used at runtime.

import { mockClassify } from "../ai/mockClassifier";
import type { DemandReport } from "../ai/types";
import { BLR_ZONES, roundCoord } from "../geo/bengaluru";

const RAW: Array<{ raw: string; zone: string; loc?: string; status?: "new" | "reviewing" | "acknowledged"; upvotes?: number; daysAgo?: number }> = [
  { raw: "We desperately need a 24-hour study library near Christ University. PG rooms are too noisy during exam season.", zone: "koramangala", loc: "Near Christ University", status: "reviewing", upvotes: 47, daysAgo: 1 },
  { raw: "No affordable thali under ₹100 around Yelahanka new town. Students survive on Maggi.", zone: "yelahanka", loc: "Yelahanka New Town", upvotes: 38, daysAgo: 2 },
  { raw: "Closest 24x7 pharmacy from BTM 2nd stage is 4 km away. Urgent medicines at night impossible.", zone: "btm_layout", loc: "BTM 2nd Stage", status: "acknowledged", upvotes: 62, daysAgo: 3 },
  { raw: "Need a women-only gym in Indiranagar. Existing ones are crowded and intimidating.", zone: "indiranagar", loc: "Indiranagar 100ft Road", upvotes: 29, daysAgo: 1 },
  { raw: "Last bus from Whitefield ITPL stops at 9:30pm. Tech workers ending late shifts have no public transport.", zone: "whitefield", loc: "ITPL Main Road", status: "reviewing", upvotes: 91, daysAgo: 4 },
  { raw: "Verified PG listings for female students near Jain college are missing. Brokers overcharge.", zone: "jayanagar", loc: "Jayanagar 4th Block", upvotes: 33 },
  { raw: "Photocopy shops in Banashankari close by 8pm. Assignment season is brutal.", zone: "banashankari", loc: "Banashankari 2nd Stage", upvotes: 18 },
  { raw: "No cheap laundry pickup in Hebbal flyover area. Daily wage workers struggle.", zone: "hebbal", loc: "Hebbal", upvotes: 22 },
  { raw: "Counselling support for first-year students is not visible on campus. Anxiety is real.", zone: "koramangala", loc: "Koramangala 5th Block", status: "reviewing", upvotes: 54, daysAgo: 6 },
  { raw: "Local kirana in Rajajinagar 2nd block doesn't deliver. Seniors can't carry groceries.", zone: "rajajinagar", loc: "Rajajinagar 2nd Block", upvotes: 41, daysAgo: 2 },
  { raw: "Street lighting on the lane behind Koramangala 6th block is broken. Unsafe for women returning from offices.", zone: "koramangala", loc: "Koramangala 6th Block", status: "acknowledged", upvotes: 87, daysAgo: 5 },
  { raw: "Daycare options near Electronic City phase 1 are full. Tech parents on waitlist for months.", zone: "electronic_city", loc: "Electronic City Phase 1", upvotes: 36 },
  { raw: "Both ATMs near Banashankari metro out of cash for 3 days running.", zone: "banashankari", loc: "Banashankari Metro", upvotes: 25 },
  { raw: "Need a quiet co-working spot in Indiranagar with reliable wifi. Cafes get loud after 6pm.", zone: "indiranagar", loc: "CMH Road", upvotes: 31 },
  { raw: "Tiffin services in Whitefield Hope Farm charge ₹4500/month. Junior engineers can't afford.", zone: "whitefield", loc: "Hope Farm", upvotes: 44, daysAgo: 3 },
  { raw: "Yoga studios in Jayanagar all run morning batches only. Working women need evening slots.", zone: "jayanagar", loc: "Jayanagar 9th Block", upvotes: 27 },
  { raw: "Generic medicine pharmacy missing in Yelahanka phase 2. Branded prices are crushing.", zone: "yelahanka", loc: "Yelahanka Phase 2", upvotes: 33 },
  { raw: "Hostel-style PG with mess for postgraduate male students near IIIT-B doesn't exist.", zone: "electronic_city", loc: "Near IIIT-B", upvotes: 39 },
  { raw: "Color print and binding before submission deadline impossible after 7pm in BTM.", zone: "btm_layout", loc: "BTM 1st Stage", upvotes: 21 },
  { raw: "Feeder bus from Hebbal metro to Manyata tech park is overcrowded and infrequent.", zone: "hebbal", loc: "Hebbal Metro", status: "reviewing", upvotes: 73, daysAgo: 4 },
  { raw: "No affordable laundry around Rajajinagar 1st block. Bachelor renters struggle.", zone: "rajajinagar", loc: "Rajajinagar 1st Block", upvotes: 19 },
  { raw: "Therapy at ₹500-1000 per session is unaffordable for students. Need subsidized counselling near campuses.", zone: "btm_layout", loc: "BTM Layout", upvotes: 58, daysAgo: 7 },
  { raw: "Veg grocery delivery slots in Whitefield are always full till 9pm. Working families miss dinner prep.", zone: "whitefield", loc: "Whitefield Main", upvotes: 35 },
  { raw: "Auto refusals at Yelahanka station after 10pm leave women stranded.", zone: "yelahanka", loc: "Yelahanka Station", upvotes: 49, daysAgo: 2 },
  { raw: "Trusted creche near Indiranagar metro for toddlers under 2 years is missing.", zone: "indiranagar", loc: "Indiranagar Metro", upvotes: 24 },
  { raw: "Working ATM near Banashankari 3rd stage hasn't existed for weeks. Cash-only vendors hurting.", zone: "banashankari", loc: "Banashankari 3rd Stage", upvotes: 28 },
  { raw: "Affordable mess for breakfast under ₹40 doesn't exist near PES Banashankari.", zone: "banashankari", loc: "Near PES University", upvotes: 30 },
  { raw: "Need a budget gym (₹500/month) in Jayanagar. Existing gyms charge ₹2000+.", zone: "jayanagar", loc: "Jayanagar East", upvotes: 26 },
  { raw: "Electronic City phase 2 has no 24x7 medical store. Night-shift engineers in trouble.", zone: "electronic_city", loc: "Electronic City Phase 2", status: "reviewing", upvotes: 51, daysAgo: 3 },
  { raw: "Female PG in Koramangala 4th block with curfew flexibility for working women is missing.", zone: "koramangala", loc: "Koramangala 4th Block", upvotes: 32 },
  { raw: "Cheap stationery and printing point near MS Ramaiah Hebbal is overdue.", zone: "hebbal", loc: "Near MS Ramaiah", upvotes: 17 },
  { raw: "Auto/cab availability after 11pm at Whitefield Kadugodi is poor. Women feel unsafe.", zone: "whitefield", loc: "Kadugodi", status: "reviewing", upvotes: 64, daysAgo: 5 },
  { raw: "Quick dry-clean and ironing service near Indiranagar HAL stage 2 needed.", zone: "indiranagar", loc: "HAL Stage 2", upvotes: 16 },
  { raw: "Mental health peer support group for college students in Rajajinagar would help.", zone: "rajajinagar", loc: "Rajajinagar", upvotes: 37 },
  { raw: "Local kirana doesn't accept UPI in pockets of Yelahanka. ATMs nearby always empty.", zone: "yelahanka", loc: "Yelahanka", upvotes: 23 },
  { raw: "Affordable tiffin under ₹80 for students near Acharya Bangalore is missing.", zone: "yelahanka", loc: "Near Acharya College", upvotes: 42, daysAgo: 1 },
  { raw: "Late-night printing/binding for thesis submission near Jayanagar engineering hubs needed.", zone: "jayanagar", loc: "Jayanagar 5th Block", upvotes: 20 },
  { raw: "Direct shuttle from BTM to Electronic City office parks would replace 2 cab transfers.", zone: "btm_layout", loc: "BTM Silk Board", status: "reviewing", upvotes: 78, daysAgo: 6 },
  { raw: "Budget yoga and meditation classes for seniors in Banashankari are not available.", zone: "banashankari", loc: "Banashankari 1st Stage", upvotes: 19 },
  { raw: "Verified daycare for tech worker parents in Hebbal Manyata isn't available within 3km.", zone: "hebbal", loc: "Manyata Tech Park", upvotes: 34 },
];

let counter = 0;
function generateLocalId(seed: string) {
  counter++;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `seed-${counter.toString().padStart(2, "0")}-${(h & 0xffff).toString(16)}`;
}

function jitter(n: number, amount = 0.008, seed = 1) {
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  const r = s - Math.floor(s);
  return n + (r - 0.5) * amount * 2;
}

export function buildSeedDemands(): DemandReport[] {
  return RAW.map((row, i) => {
    const zone = BLR_ZONES.find((z) => z.key === row.zone)!;
    const lat = roundCoord(jitter(zone.lat, 0.012, i + 1));
    const lng = roundCoord(jitter(zone.lng, 0.012, i + 7));
    const ai = mockClassify({
      raw_text: row.raw,
      area_label: zone.label,
      location_text: row.loc,
      latitude: lat,
      longitude: lng,
    });
    const daysAgo = row.daysAgo ?? Math.floor((i % 9) + 1);
    const created = new Date(Date.now() - daysAgo * 86400_000 - i * 3600_000).toISOString();
    return {
      id: generateLocalId(row.raw),
      created_at: created,
      reporter_session: `seed-${i}`,
      raw_text: row.raw,
      location_text: row.loc ?? zone.label,
      area_label: zone.label,
      latitude: lat,
      longitude: lng,
      status: row.status ?? "new",
      upvotes: row.upvotes ?? Math.floor(10 + (i * 7) % 40),
      ...ai,
    } as DemandReport;
  });
}

export const SEED_DEMANDS: DemandReport[] = buildSeedDemands();
