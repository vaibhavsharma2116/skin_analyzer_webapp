const products = [
  { id: "p1", title: "Vitamin C Radiance Repair Face Serum – 30 ml", handle: "vitamin-c-radiance-repair-face-serum-30-ml" },
  { id: "p2", title: "Barrier Repair Moisturizer – 50 g", handle: "barrier-repair-moisturizer-50-g" },
  { id: "p3", title: "2% Salicylic Acid + Mandelic Acid Clear Skin Foaming Facewash – 100 ml", handle: "2-salicylic-acid-mandelic-acid-clear-skin-foaming-facewash-100-ml" },
  { id: "p4", title: "Alpha Glow Polish Scrub – 50 ml", handle: "alpha-glow-polish-scrub-50-ml" },
  { id: "p5", title: "Glow Reset De-Tan Soap", handle: "glow-reset-de-tan-soap" },
  { id: "p6", title: "Pigmentation & Uneven Tone Face Serum - 30ml", handle: "pigmentation-uneven-tone-face-serum" },
  { id: "p7", title: "Dark Spot & Uneven Tone Face Serum - 30ml", handle: "dark-spot-uneven-tone-face-serum-30ml" },
  { id: "p8", title: "Anti-Aging & Skin Renewal Face Serum - 30ml", handle: "anti-aging-skin-renewal-face-serum-30ml" },
  { id: "p9", title: "Firming & Anti-Aging Face Serum - 30ml", handle: "firming-anti-aging-face-serum-30ml" },
  { id: "p10", title: "Acne & Redness Control Face Serum - 30ml", handle: "acne-redness-control-face-serum-30ml" },
  { id: "p11", title: "Skin Barrier Repair & Hydration Serum - 30ml", handle: "skin-barrier-repair-hydration-serum-30ml" },
  { id: "p12", title: "SPF 60 Gel Sunscreen", handle: "spf-60-gel-sunscreen" }
];

function matchProductToStep(title, products) {
  if (!products || products.length === 0) return null;
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("barrier repair moisturizer") || (lowerTitle.includes("moisturizer") && !lowerTitle.includes("serum"))) {
    const p = products.find((p) => p.handle.includes("barrier-repair-moisturizer") || p.title.toLowerCase().includes("barrier repair moisturizer") || p.title.toLowerCase().includes("moisturizer"));
    if (p) return p;
  }
  if (lowerTitle.includes("spf") || lowerTitle.includes("sunscreen")) {
    const p = products.find((p) => p.handle.includes("spf-60") || p.title.toLowerCase().includes("sunscreen") || p.title.toLowerCase().includes("spf"));
    if (p) return p;
  }
  if (lowerTitle.includes("salicylic") || lowerTitle.includes("mandelic") || lowerTitle.includes("facewash") || lowerTitle.includes("cleanse")) {
    const p = products.find((p) => p.handle.includes("salicylic") || p.title.toLowerCase().includes("foaming facewash") || p.title.toLowerCase().includes("facewash"));
    if (p) return p;
  }
  if (lowerTitle.includes("scrub") || lowerTitle.includes("polish") || lowerTitle.includes("exfoliat")) {
    const p = products.find((p) => p.handle.includes("polish-scrub") || p.title.toLowerCase().includes("polish scrub"));
    if (p) return p;
  }
  if (lowerTitle.includes("de-tan") || lowerTitle.includes("tan soap") || lowerTitle.includes("glow reset")) {
    const p = products.find((p) => p.handle.includes("de-tan") || p.title.toLowerCase().includes("de-tan"));
    if (p) return p;
  }

  if (lowerTitle.includes("copper peptide") || lowerTitle.includes("firming")) {
    const p = products.find((p) => p.handle.includes("firming-anti-aging") || p.title.toLowerCase().includes("firming"));
    if (p) return p;
  }
  if (lowerTitle.includes("retinal") || lowerTitle.includes("skin renewal") || (lowerTitle.includes("anti-aging") && !lowerTitle.includes("firming"))) {
    const p = products.find((p) => p.handle.includes("anti-aging-skin-renewal") || p.title.toLowerCase().includes("anti-aging & skin renewal"));
    if (p) return p;
  }
  if (lowerTitle.includes("azelaic") || lowerTitle.includes("acne & redness") || lowerTitle.includes("redness control")) {
    const p = products.find((p) => p.handle.includes("acne-redness-control") || p.title.toLowerCase().includes("acne & redness"));
    if (p) return p;
  }
  if (lowerTitle.includes("skin barrier repair & hydration") || lowerTitle.includes("barrier repair & hydration") || lowerTitle.includes("ceramide") || lowerTitle.includes("hydration serum") || lowerTitle.includes("barrier serum")) {
    const p = products.find((p) => p.handle.includes("skin-barrier-repair-hydration") || p.title.toLowerCase().includes("skin barrier repair & hydration"));
    if (p) return p;
  }
  if (lowerTitle.includes("dark spot") || lowerTitle.includes("tranexamic") || lowerTitle.includes("licorice")) {
    const p = products.find((p) => p.handle.includes("dark-spot-uneven-tone") || p.title.toLowerCase().includes("dark spot & uneven tone"));
    if (p) return p;
  }
  if (lowerTitle.includes("pigmentation") || lowerTitle.includes("arbutin") || lowerTitle.includes("niacinamide")) {
    const p = products.find((p) => p.handle.includes("pigmentation-uneven-tone") || p.title.toLowerCase().includes("pigmentation & uneven tone"));
    if (p) return p;
  }
  if (lowerTitle.includes("vitamin c") || lowerTitle.includes("radiance repair") || lowerTitle.includes("radiance")) {
    const p = products.find((p) => p.handle.includes("vitamin-c-radiance-repair") || p.title.toLowerCase().includes("vitamin c radiance"));
    if (p) return p;
  }

  const words = lowerTitle.split(/[\s,()|/-]+/).filter((w) => w.length > 3);
  for (const w of words) {
    const p = products.find((p) => p.title.toLowerCase().includes(w));
    if (p) return p;
  }
  return null;
}

const testCases = [
  "2% Salicylic Acid + Mandelic Acid Clear Skin Foaming Facewash – 100 ml",
  "Vitamin C Radiance Repair Face Serum – 30 ml",
  "Barrier Repair Moisturizer – 50 g",
  "SPF 60 Gel Sunscreen",
  "Acne & Redness Control Face Serum - 30ml",
  "Skin Barrier Repair & Hydration Serum - 30ml",
  "Dark Spot & Uneven Tone Face Serum - 30ml",
  "Pigmentation & Uneven Tone Face Serum - 30ml",
  "Firming & Anti-Aging Face Serum - 30ml",
  "Anti-Aging & Skin Renewal Face Serum - 30ml",
  "Alpha Glow Polish Scrub – 50 ml",
  "Glow Reset De-Tan Soap",
  "Gentle Cleanser",
  "Moisturizer",
  "Sunscreen SPF 50+"
];

let allPassed = true;
for (const tc of testCases) {
  const match = matchProductToStep(tc, products);
  if (!match) {
    console.error(`FAIL: No match for "${tc}"`);
    allPassed = false;
  } else {
    console.log(`PASS: "${tc}" -> "${match.title}"`);
  }
}

if (allPassed) {
  console.log("=== ALL 15 MATCH TESTS PASSED SUCCESSFULLY ===");
} else {
  process.exit(1);
}

