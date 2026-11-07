import { leads, LEAD_STAGES } from "./data";

export const STAGE_KEY = "ks-lead-stages";

// Returns only valid overrides (known lead id, known stage) saved by the Leads page.
export function loadStageOverrides() {
  try {
    const saved = JSON.parse(localStorage.getItem(STAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return {};
    const out = {};
    for (const l of leads) if (LEAD_STAGES.includes(saved[l.id])) out[l.id] = saved[l.id];
    return out;
  } catch {
    return {};
  }
}
