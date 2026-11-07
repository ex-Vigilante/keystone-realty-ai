// Demo data for the fictional Keystone Realty Group. Reference date for all
// "days" and "this week" calculations is fixed so the demo is deterministic.
export const AS_OF = "2026-11-06";
export const WEEK_START = "2026-11-02";

const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&h=420&q=70`;

export const listings = [
  { id: "L-1041", address: "2214 Bluebonnet Ln", neighborhood: "Zilker", zip: "78704", price: 1425000, beds: 4, baths: 3, sqft: 2680, status: "Active", dom: 10, listDate: "2026-10-27", photo: img("photo-1568605114967-8130f3a36994"), alt: "Two-story white stucco house with a deep front porch and live oak in the yard" },
  { id: "L-1042", address: "907 E 51st St", neighborhood: "Hyde Park", zip: "78751", price: 689000, beds: 3, baths: 2, sqft: 1740, status: "Active", dom: 53, listDate: "2026-09-14", photo: img("photo-1564013799919-ab600027ffc6"), alt: "Single-story craftsman bungalow with gray siding and a wide front porch" },
  { id: "L-1043", address: "4518 Mueller Blvd", neighborhood: "Mueller", zip: "78723", price: 579000, beds: 3, baths: 2.5, sqft: 1620, status: "Pending", dom: 35, listDate: "2026-10-02", photo: img("photo-1570129477492-45c003edd2be"), alt: "Modern townhome exterior with light brick, black window frames and a small front garden" },
  { id: "L-1044", address: "1303 Barton Hills Dr", neighborhood: "Barton Hills", zip: "78704", price: 1095000, beds: 4, baths: 3, sqft: 2410, status: "Active", dom: 5, listDate: "2026-11-01", photo: img("photo-1580587771525-78b9dba3b914"), alt: "Large hillside home with a stone facade and a three-car garage" },
  { id: "L-1045", address: "2706 Rosewood Ave", neighborhood: "East Austin", zip: "78702", price: 735000, beds: 3, baths: 2, sqft: 1580, status: "Active", dom: 69, listDate: "2026-08-29", photo: img("photo-1512917774080-9991f1c4c750"), alt: "Contemporary house with dark wood cladding and a flat roofline" },
  { id: "L-1046", address: "611 W Monroe St", neighborhood: "Travis Heights", zip: "78704", price: 899000, beds: 3, baths: 2, sqft: 1910, status: "Pending", dom: 22, listDate: "2026-10-15", photo: img("photo-1600596542815-ffad4c1539a9"), alt: "Mid-century ranch home with a low roof, brick planters and a sloped lawn" },
  { id: "L-1047", address: "3809 Brentwood St", neighborhood: "Brentwood", zip: "78756", price: 815000, beds: 3, baths: 2, sqft: 1760, status: "Sold", dom: 23, listDate: "2026-09-05", photo: img("photo-1605276374104-dee2a0ed3cd6"), alt: "Renovated 1950s cottage with a fresh white paint finish and a new metal roof", soldPrice: 828000, closeDate: "2026-10-28" },
  { id: "L-1048", address: "1820 Cedar Ridge Cv", neighborhood: "Westlake Hills", zip: "78746", price: 2450000, beds: 5, baths: 4.5, sqft: 4120, status: "Active", dom: 28, listDate: "2026-10-09", photo: img("photo-1613490493576-7fde63acd811"), alt: "Large contemporary estate with floor-to-ceiling glass and a limestone entry" },
  { id: "L-1049", address: "5102 Tarrytown Pl", neighborhood: "Tarrytown", zip: "78703", price: 1795000, beds: 4, baths: 3.5, sqft: 3050, status: "Active", dom: 37, listDate: "2026-09-30", photo: img("photo-1518780664697-55e3ad937233"), alt: "Traditional two-story brick home with black shutters and a circular drive" },
  { id: "L-1050", address: "1407 Clarksville Row", neighborhood: "Clarksville", zip: "78703", price: 1285000, beds: 3, baths: 2.5, sqft: 2040, status: "Sold", dom: 31, listDate: "2026-08-18", photo: img("photo-1523217582562-09d0def993a6"), alt: "Restored historic cottage with white board siding and a wraparound porch", soldPrice: 1262000, closeDate: "2026-10-09" },
  { id: "L-1051", address: "2931 Bouldin Creek Ct", neighborhood: "Bouldin Creek", zip: "78704", price: 649000, beds: 2, baths: 2, sqft: 1380, status: "Pending", dom: 16, listDate: "2026-10-21", photo: img("photo-1583608205776-bfd35f0d9f83"), alt: "Small modern duplex with corrugated metal accents and a landscaped front yard" },
  { id: "L-1052", address: "8814 Circle C Trl", neighborhood: "Circle C", zip: "78739", price: 489000, beds: 4, baths: 2.5, sqft: 2260, status: "Active", dom: 18, listDate: "2026-10-19", photo: img("photo-1572120360610-d971b9d7767c"), alt: "Suburban two-story home with a stone and siding exterior and a two-car garage" },
  { id: "L-1053", address: "1119 Rosedale Ter", neighborhood: "Rosedale", zip: "78756", price: 925000, beds: 3, baths: 2, sqft: 1840, status: "Sold", dom: 19, listDate: "2026-09-22", photo: img("photo-1576941089067-2de3c901e126"), alt: "Tidy brick ranch house with a gabled entry and mature landscaping", soldPrice: 941500, closeDate: "2026-11-03" },
  { id: "L-1054", address: "7706 Crestview Dr", neighborhood: "Crestview", zip: "78757", price: 389000, beds: 2, baths: 1, sqft: 1050, status: "Active", dom: 98, listDate: "2026-07-31", photo: img("photo-1600585154340-be6161a56a0c"), alt: "Compact 1960s starter home with a carport and a chain-link front fence" },
];

export const LEAD_STAGES = ["New", "Contacted", "Touring", "Offer", "Closed"];

export const leads = [
  { id: "C-201", name: "Priya Raman", source: "Zillow", stage: "New", budget: 700000, interest: "3 bed near Hyde Park, work from home", created: "2026-11-05", note: "Relocating from Seattle in January. Wants a dedicated office room." },
  { id: "C-202", name: "Marcus Bell", source: "Referral", stage: "Contacted", budget: 1500000, interest: "Zilker or Barton Hills, 4+ bed", created: "2026-11-03", note: "Referred by Tom Okafor. Pre-approved with Frost Bank." },
  { id: "C-203", name: "Elena & Jorge Castillo", source: "Open house", stage: "Touring", budget: 950000, interest: "Travis Heights, single story", created: "2026-10-24", note: "Toured 611 W Monroe St twice. Concerned about foundation history." },
  { id: "C-204", name: "Sam Whitaker", source: "Website", stage: "New", budget: 420000, interest: "Starter home, South Austin", created: "2026-11-04", note: "First-time buyer. Needs lender introductions." },
  { id: "C-205", name: "Dr. Naomi Feld", source: "Referral", stage: "Offer", budget: 2400000, interest: "Westlake Hills estate", created: "2026-10-12", note: "Offer in on 1820 Cedar Ridge Cv at 2.31M, waiting on seller response." },
  { id: "C-206", name: "Tyrell Jackson", source: "Instagram", stage: "Contacted", budget: 650000, interest: "Modern townhome, Mueller or East Austin", created: "2026-11-02", note: "Responded to the Mueller reel. Prefers evening calls." },
  { id: "C-207", name: "Hannah Lindqvist", source: "Zillow", stage: "Touring", budget: 600000, interest: "Mueller townhome", created: "2026-10-29", note: "Tour booked for Saturday at 10:30." },
  { id: "C-208", name: "Wes & Dolores Park", source: "Sign call", stage: "Closed", budget: 925000, interest: "Rosedale ranch", created: "2026-09-25", note: "Closed 1119 Rosedale Ter on Nov 3. Send closing gift." },
  { id: "C-209", name: "Isaiah Moreno", source: "Open house", stage: "Contacted", budget: 750000, interest: "East Austin, 3 bed", created: "2026-11-06", note: "Met at the Rosewood open house. Asked about the price history." },
  { id: "C-210", name: "Carolyn Voss", source: "Website", stage: "Touring", budget: 1800000, interest: "Tarrytown, 4 bed, pool optional", created: "2026-10-18", note: "Touring 5102 Tarrytown Pl on Tuesday. Comparing with two off-market homes." },
  { id: "C-211", name: "Andre Nakamura", source: "Instagram", stage: "New", budget: 500000, interest: "Circle C family home", created: "2026-11-06", note: "Two kids, wants zoned for Kiker Elementary." },
  { id: "C-212", name: "Bridget O'Connell", source: "Referral", stage: "Offer", budget: 1300000, interest: "Clarksville cottage", created: "2026-09-30", note: "Second offer drafted after losing the first to a cash buyer." },
];

// Monthly closed sales for Keystone, Jan 1 to Nov 6 2026 (Nov is partial).
// Oct includes the 1407 Clarksville Row (Oct 9) and 3809 Brentwood St (Oct 28)
// closings; Nov includes 1119 Rosedale Ter (Nov 3, $941,500).
export const monthlySales = [
  { month: "Jan", closed: 3, volume: 1.92 },
  { month: "Feb", closed: 2, volume: 1.35 },
  { month: "Mar", closed: 4, volume: 2.6 },
  { month: "Apr", closed: 5, volume: 3.4 },
  { month: "May", closed: 6, volume: 4.1 },
  { month: "Jun", closed: 7, volume: 4.9 },
  { month: "Jul", closed: 6, volume: 4.2 },
  { month: "Aug", closed: 5, volume: 3.3 },
  { month: "Sep", closed: 4, volume: 2.7 },
  { month: "Oct", closed: 3, volume: 2.9 },
  { month: "Nov*", closed: 1, volume: 0.94, partial: true },
];

export const AGENT = { name: "Dana Whitfield", brokerage: "Keystone Realty Group", city: "Austin, TX" };

export const fmtUSD = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const fmtCompact = (n) => {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, "")}M`;
  return `$${Math.round(n / 1000)}K`;
};

export function computeKpis() {
  const open = listings.filter((l) => l.status !== "Sold");
  const volumeYtd = monthlySales.reduce((a, m) => a + m.volume, 0);
  const closedYtd = monthlySales.reduce((a, m) => a + m.closed, 0);
  return {
    active: listings.filter((l) => l.status === "Active").length,
    pending: listings.filter((l) => l.status === "Pending").length,
    volumeYtd,
    closedYtd,
    avgDom: Math.round(open.reduce((a, l) => a + l.dom, 0) / open.length),
    activeValue: listings.filter((l) => l.status === "Active").reduce((a, l) => a + l.price, 0),
  };
}

// Apply stage overrides (id -> stage) on top of the seed leads.
export function applyStages(overrides) {
  if (!overrides) return leads;
  return leads.map((l) => (LEAD_STAGES.includes(overrides[l.id]) ? { ...l, stage: overrides[l.id] } : l));
}
