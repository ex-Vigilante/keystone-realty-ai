// Pre-written fallbacks used when no API key is set or the live call fails.
import { listings, leads as seedLeads, monthlySales, WEEK_START, LEAD_STAGES, fmtUSD, computeKpis } from "./data";

/* ---------- listing writer ---------- */
const HOOD_NOTES = {
  zilker: "Zilker is known for its closeness to Barton Springs Pool and the Barton Creek Greenbelt.",
  "hyde park": "Hyde Park is one of Austin's older neighborhoods, with tree-lined streets and the Duval Road shops nearby.",
  mueller: "Mueller is a planned community built on the former airport site, with a lake trail, a farmers market and parks.",
  "barton hills": "Barton Hills borders the Barton Creek Greenbelt and has quick access to South Lamar.",
  "travis heights": "Travis Heights sits just south of Lady Bird Lake, close to South Congress.",
  clarksville: "Clarksville is a central, historic neighborhood near West Sixth Street and the Lamar corridor.",
  tarrytown: "Tarrytown is a west-side neighborhood near Lake Austin and Mopac.",
  "bouldin creek": "Bouldin Creek is a south-central neighborhood near South First and South Congress.",
  "east austin": "East Austin is close to downtown and to the East Cesar Chavez dining corridor.",
  "westlake hills": "Westlake Hills is a hill country enclave west of downtown with access to Loop 360.",
  "circle c": "Circle C is a master-planned community in southwest Austin with pools, parks and trails.",
  rosedale: "Rosedale is a central neighborhood close to Burnet Road and Rosedale Park.",
  brentwood: "Brentwood is a central neighborhood near Brentwood Park and Burnet Road.",
  crestview: "Crestview is a north-central neighborhood served by the Crestview rail station.",
};

function list(items) {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function demoWriter(v) {
  const type = v.propertyType.toLowerCase();
  const hood = v.neighborhood;
  const sqft = v.sqft.toLocaleString("en-US");
  const bathsText = v.baths === 1 ? "1 bath" : `${v.baths} baths`;
  const bedsText = v.beds === 0 ? "a studio layout" : v.beds === 1 ? "1 bedroom" : `${v.beds} bedrooms`;
  const headline = v.beds === 0 ? `studio ${type} with ${bathsText}` : `${v.beds}-bedroom ${type} with ${bathsText}`;
  const feats = list(v.features.map((f) => f.toLowerCase()));
  const hoodLine = HOOD_NOTES[hood.toLowerCase()] || `${hood} is in Austin, Texas.`;

  const T = {
    Warm: {
      open: `Welcome to this ${headline} in ${hood}, with ${sqft} square feet to work with.`,
      feat: feats ? `Features include ${feats}.` : "",
      hood: hoodLine,
      extra: `The home has ${bedsText} and ${bathsText} across ${sqft} square feet.`,
      close: "Call to arrange a showing.",
    },
    Luxury: {
      open: `This ${sqft}-square-foot ${type} in ${hood} has ${bedsText} and ${bathsText}.`,
      feat: feats ? `Highlights: ${feats}.` : "",
      hood: hoodLine,
      extra: `Size and layout: ${sqft} square feet, ${bedsText}, ${bathsText}.`,
      close: "Contact the listing agent to arrange a private showing.",
    },
    Concise: {
      open: `${v.beds === 0 ? "Studio" : `${v.beds} bed`}, ${bathsText} ${type}. ${sqft} sq ft. ${hood}.`,
      feat: feats ? `Features: ${feats}.` : "",
      hood: "",
      extra: "",
      close: "Contact the agent to schedule a showing.",
    },
  }[v.tone];

  const order = { Short: ["open", "feat"], Standard: ["open", "feat", "hood", "close"], Long: ["open", "feat", "hood", "extra", "close"] }[v.length];
  const parts = order.map((k) => T[k]).filter(Boolean);
  return parts.join(v.length === "Long" && v.tone !== "Concise" ? "\n\n" : " ");
}

/* ---------- assistant ---------- */
const open = () => listings.filter((l) => l.status !== "Sold");

function aging() {
  const rows = open().filter((l) => l.dom > 30).sort((a, b) => b.dom - a.dom);
  const lines = rows.map((l) => `- ${l.address} (${l.neighborhood}): ${l.dom} days, ${l.status}, ${fmtUSD(l.price)}`);
  const stale = rows.filter((l) => l.status === "Active" && l.dom > 60);
  const tip = stale.length
    ? `\n\n${stale.map((l) => l.address).join(" and ")} ${stale.length === 1 ? "has" : "have"} passed 60 days on the market.`
    : "";
  return `${rows.length} of ${open().length} open listings have been on the market more than 30 days:\n${lines.join("\n")}${tip}`;
}

function weekLeads(ls) {
  const rows = ls.filter((c) => c.created >= WEEK_START).sort((a, b) => b.created.localeCompare(a.created));
  const lines = rows.map((c) => `- ${c.name} via ${c.source}, now ${c.stage}, budget ${fmtUSD(c.budget)} (${c.interest})`);
  const total = rows.reduce((a, c) => a + c.budget, 0);
  return `${rows.length} leads came in since Monday, Nov 2, with a combined budget of ${fmtUSD(total)}:\n${lines.join("\n")}`;
}

function pending() {
  const rows = listings.filter((l) => l.status === "Pending");
  return `${rows.length} listings are pending:\n${rows.map((l) => `- ${l.address}: ${fmtUSD(l.price)}, ${l.dom} days on market`).join("\n")}\n\nTotal pending value is ${fmtUSD(rows.reduce((a, l) => a + l.price, 0))}.`;
}

function closed() {
  const k = computeKpis();
  const best = monthlySales.reduce((a, m) => (m.closed > a.closed ? m : a));
  const sold = listings.filter((l) => l.status === "Sold").sort((a, b) => b.closeDate.localeCompare(a.closeDate));
  return `Year to date (through Nov 6), Keystone has closed ${k.closedYtd} sales for $${k.volumeYtd.toFixed(1)}M in volume. ${best.month} was the busiest month with ${best.closed} closings.\n\nMost recent closings:\n${sold
    .map((l) => `- ${l.address}: ${fmtUSD(l.soldPrice)} on ${l.closeDate} (list ${fmtUSD(l.price)})`)
    .join("\n")}`;
}

function pipeline(ls) {
  const counts = LEAD_STAGES.map((s) => ({ s, n: ls.filter((c) => c.stage === s).length }));
  const offers = ls.filter((c) => c.stage === "Offer");
  const tail = offers.length
    ? `\n\nLeads at the offer stage: ${offers.map((c) => `${c.name} (${fmtUSD(c.budget)} budget)`).join(", ")}.`
    : "\n\nNo leads are at the offer stage right now.";
  return `Lead pipeline by stage:\n${counts.map((c) => `- ${c.s}: ${c.n}`).join("\n")}${tail}`;
}

function sources(ls) {
  const map = {};
  ls.forEach((c) => (map[c.source] = (map[c.source] || 0) + 1));
  const rows = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return `Lead sources across ${ls.length} leads:\n${rows.map(([s, n]) => `- ${s}: ${n}`).join("\n")}`;
}

function prices() {
  const act = listings.filter((l) => l.status === "Active");
  const avg = act.reduce((a, l) => a + l.price, 0) / act.length;
  const hi = [...act].sort((a, b) => b.price - a.price)[0];
  const lo = [...act].sort((a, b) => a.price - b.price)[0];
  const ppsf = Math.round(act.reduce((a, l) => a + l.price / l.sqft, 0) / act.length);
  return `Across ${act.length} active listings, the average list price is ${fmtUSD(avg)} (about ${fmtUSD(ppsf)} per sq ft).\n- Highest: ${hi.address}, ${fmtUSD(hi.price)}\n- Lowest: ${lo.address}, ${fmtUSD(lo.price)}`;
}

function generic(ls) {
  const k = computeKpis();
  return `Here is where the book stands: ${k.active} active listings, ${k.pending} pending, and ${ls.filter((c) => c.stage !== "Closed").length} open leads. Average days on market across open listings is ${k.avgDom}.\n\nI can break that down. Try asking about listings over 30 days on market, this week's leads, pending deals, closed volume, lead stages, lead sources, or active prices.`;
}

export function demoChat(question, ls = seedLeads) {
  const q = question.toLowerCase();
  if (/(30 days|days on (the )?market|\bdom\b|stale|slow|aging|sitting)/.test(q)) return aging();
  if (/(this week|new leads|recent leads|summari[sz]e.*lead)/.test(q)) return weekLeads(ls);
  if (/pending|under contract/.test(q)) return pending();
  if (/(closed|closing|volume|sold|sales|revenue)/.test(q)) return closed();
  if (/(stage|pipeline|offer|touring|funnel)/.test(q)) return pipeline(ls);
  if (/(source|zillow|referral|instagram|where.*leads)/.test(q)) return sources(ls);
  if (/(price|expensive|cheapest|average|avg|cost)/.test(q)) return prices();
  if (/lead/.test(q)) return weekLeads(ls);
  return generic(ls);
}
