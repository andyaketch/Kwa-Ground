// A small area in central Nairobi. Edit to taste.
const BOX = { south: -1.2900, west: 36.8130, north: -1.2830, east: 36.8230 };
const SLOW_MS = 10000;     // slower than this is a MAYBE
const TIMEOUT_MS = 30000;  // give up after this

const pass = (reason) => ({ verdict: "PASS", reason });
const maybe = (reason) => ({ verdict: "MAYBE", reason });
const fail = (reason) => ({ verdict: "FAIL", reason });

// ---- 1. Pure classifier: outcome in, verdict out (no network, easy to unit test later) ----
function classify({ status, data, ms, error }, countItems) {
  if (error) return fail(error);
  if (status === 429 || status === 504) return maybe(`Busy or over quota (${status}). Retry later.`);
  if (status === 401 || status === 403) return fail(`Access refused (${status}). Check your key or permissions.`);
  if (status !== 200) return fail(`Unexpected status ${status}.`);
  if (data === null) return fail("Reply was not valid JSON.");
  if (data.remark) return maybe(`Server remark: ${data.remark}`);
  const n = countItems(data);
  if (n === 0) return maybe("Worked, but returned no features.");
  if (ms > SLOW_MS) return maybe(`${n} features, but slow.`);
  return pass(`${n} features returned.`);
}

// ---- 2. One request, with timing and a timeout ----
async function timedFetch(url, options = {}) {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* not JSON: leave data as null */ }
    return { status: res.status, data, ms: Math.round(performance.now() - started) };
  } catch (err) {
    const msg = err.name === "AbortError"
      ? `No reply within ${TIMEOUT_MS / 1000}s.`
      : "Request never completed (offline, blocked, or CORS). Open the Console for details.";
    return { error: msg, ms: Math.round(performance.now() - started) };
  } finally {
    clearTimeout(timer);
  }
}

// ---- 3. The tests. run() returns null when there is nothing to test ----
const tests = [
  {
    name: "Overpass",
    run: () => {
      const q = `[out:json][timeout:25];way["building"="commercial"](${BOX.south},${BOX.west},${BOX.north},${BOX.east});out center 20;`;
      return timedFetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: new URLSearchParams({ data: q }),
      });
    },
    count: (d) => d.elements?.length ?? 0,
  },
  {
    name: "Geoapify",
    run: () => {
      const key = document.getElementById("geoKey").value.trim();
      if (!key) return null;
      // rect uses longitude first. Confirm the corner order in Geoapify's docs.
      const rect = `${BOX.west},${BOX.south},${BOX.east},${BOX.north}`;
      return timedFetch(
        `https://api.geoapify.com/v2/places?categories=commercial&filter=rect:${rect}&limit=20&apiKey=${encodeURIComponent(key)}`
      );
    },
    count: (d) => d.features?.length ?? 0,
  },
  {
    name: "Custom URL",
    run: () => {
      const url = document.getElementById("customUrl").value.trim();
      return url ? timedFetch(url) : null;
    },
    count: (d) => (Array.isArray(d) ? d.length : Object.keys(d).length),
  },
];

// ---- 4. Show results (textContent, never innerHTML, so server text can't inject markup) ----
const tbody = document.getElementById("results");

function addRow(label, { verdict, reason }, ms) {
  const tr = document.createElement("tr");
  const cells = [[label, ""], [verdict, verdict], [reason, ""], [ms ? `${ms} ms` : "-", ""]];
  for (const [text, cls] of cells) {
    const td = document.createElement("td");
    td.textContent = text;
    if (cls) td.className = cls;
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
}

document.getElementById("run").addEventListener("click", async (event) => {
  const button = event.target;
  button.disabled = true;
  const stamp = new Date().toLocaleTimeString();
  for (const t of tests) {            // one at a time, to be kind to shared servers
    const outcome = await t.run();
    const label = `${t.name} (${stamp})`;
    if (outcome === null) {
      addRow(label, { verdict: "SKIPPED", reason: "Nothing entered." });
      continue;
    }
    addRow(label, classify(outcome, t.count), outcome.ms);
  }
  button.disabled = false;
});
