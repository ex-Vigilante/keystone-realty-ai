// Server-only helpers: rate limiting, validation, context building, streaming.
import { listings, leads, monthlySales, applyStages, LEAD_STAGES, AS_OF } from "./data";

export const MAX_TOKENS = 600;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
export const FALLBACK_PREFIX = "Live AI is unavailable right now, so this is a demo answer.\n\n";
export const INTERRUPTED = "\n\n[Response was interrupted. Try again.]";

/* ---------- rate limit (in-memory, per instance) ---------- */
const WINDOW_MS = 60_000;
const MAX_REQ = 10;
const GLOBAL_MAX = 60;
const hits = new Map();
let globalHits = [];

export function getIp(req) {
  const real = req.headers.get("x-real-ip");
  if (real && real.trim()) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0].trim();
    if (first) return first;
  }
  return "local";
}

export function rateLimited(ip) {
  const now = Date.now();
  globalHits = globalHits.filter((t) => now - t < WINDOW_MS);
  if (globalHits.length >= GLOBAL_MAX) return true;
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_REQ) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  globalHits.push(now);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return false;
}

export const tooMany = () =>
  Response.json(
    { error: "You're sending requests faster than the demo allows. Wait a few seconds and try again." },
    { status: 429, headers: { "Retry-After": "30" } }
  );

export const bad = (msg, status = 400) => Response.json({ error: msg }, { status });

export async function readJson(req, maxBytes = 20_000) {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > maxBytes) return { error: "Request is too large." };
  try {
    const text = await req.text();
    if (text.length > maxBytes) return { error: "Request is too large." };
    return { value: JSON.parse(text) };
  } catch {
    return { error: "Request body must be valid JSON." };
  }
}

/* ---------- validation ---------- */
const TYPES = ["Single-family home", "Condo", "Townhome", "Duplex", "Bungalow"];
const TONES = ["Warm", "Luxury", "Concise"];
const LENGTHS = ["Short", "Standard", "Long"];
const USER_MAX = 1000;
const ASSISTANT_MAX = 4000;

const clean = (s, max) =>
  String(s).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

export function validateWriter(b) {
  if (!b || typeof b !== "object" || Array.isArray(b)) return { error: "Invalid request." };
  if (!TYPES.includes(b.propertyType) || !TONES.includes(b.tone) || !LENGTHS.includes(b.length))
    return { error: "Choose a property type, tone and length." };
  const { beds, baths, sqft } = b;
  if (typeof beds !== "number" || !Number.isInteger(beds) || beds < 0 || beds > 12)
    return { error: "Bedrooms must be a whole number from 0 to 12." };
  if (typeof baths !== "number" || !Number.isInteger(baths * 2) || baths < 0.5 || baths > 12)
    return { error: "Bathrooms must be between 0.5 and 12, in steps of 0.5." };
  if (typeof sqft !== "number" || !Number.isFinite(sqft) || sqft < 200 || sqft > 30000)
    return { error: "Square footage must be between 200 and 30,000." };
  if (typeof b.neighborhood !== "string" || !clean(b.neighborhood, 60)) return { error: "Enter a neighborhood." };
  if (!Array.isArray(b.features) || b.features.length > 12 || b.features.some((f) => typeof f !== "string"))
    return { error: "Use at most 12 key features." };
  const features = b.features.map((f) => clean(f, 50)).filter(Boolean);
  return {
    value: {
      propertyType: b.propertyType, tone: b.tone, length: b.length, beds, baths,
      sqft: Math.round(sqft), neighborhood: clean(b.neighborhood, 60), features,
    },
  };
}

export function validateChat(b) {
  if (!b || typeof b !== "object" || !Array.isArray(b.messages)) return { error: "Invalid request." };
  if (b.messages.length === 0) return { error: "Ask a question first." };
  if (b.messages.length > 12) return { error: "Conversation is too long. Start a new chat." };
  const msgs = [];
  for (const m of b.messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return { error: "Invalid message." };
    const max = m.role === "user" ? USER_MAX : ASSISTANT_MAX;
    if (m.content.length > max)
      return { error: m.role === "user" ? "Messages are limited to 1,000 characters." : "A previous reply is too long. Start a new chat." };
    const content = m.content.trim();
    if (!content) return { error: "Messages cannot be empty." };
    msgs.push({ role: m.role, content });
  }
  if (msgs[0].role !== "user" || msgs[msgs.length - 1].role !== "user")
    return { error: "Conversation must start and end with a user message." };
  for (let i = 1; i < msgs.length; i++)
    if (msgs[i].role === msgs[i - 1].role) return { error: "Messages must alternate between user and assistant." };

  let stages = null;
  if (b.leadStages !== undefined && b.leadStages !== null) {
    if (typeof b.leadStages !== "object" || Array.isArray(b.leadStages)) return { error: "Invalid lead stages." };
    stages = {};
    for (const [id, st] of Object.entries(b.leadStages)) {
      if (!leads.some((l) => l.id === id) || !LEAD_STAGES.includes(st)) return { error: "Invalid lead stages." };
      stages[id] = st;
    }
  }
  return { value: { messages: msgs, stages } };
}

/* ---------- prompts ---------- */
export function writerPrompt(v) {
  const words = { Short: "about 70 words", Standard: "about 120 words", Long: "about 180 words" }[v.length];
  const toneNote = {
    Warm: "warm and inviting, speaking to a family picturing daily life in the home",
    Luxury: "polished and understated, for a high-end buyer; no cliches or exclamation marks",
    Concise: "brief and factual, in compact sentences",
  }[v.tone];
  return {
    system:
      "You write MLS-style listing descriptions for a real estate agent. Use only the facts supplied; never invent amenities, school names, or measurements. No emoji, no headings, no bullet lists. Avoid cliches like 'must see' and 'dream home'. Output only the description text.",
    messages: [
      {
        role: "user",
        content: `Write a listing description, ${words}, tone: ${toneNote}.\nProperty type: ${v.propertyType}\nBedrooms: ${v.beds === 0 ? "studio" : v.beds}\nBathrooms: ${v.baths}\nSquare feet: ${v.sqft}\nNeighborhood: ${v.neighborhood}, Austin TX\nKey features: ${v.features.length ? v.features.join("; ") : "none supplied"}`,
      },
    ],
  };
}

export function buildContext(stages) {
  const L = listings.map((l) => ({
    id: l.id, addr: l.address, hood: l.neighborhood, price: l.price, bd: l.beds, ba: l.baths,
    sf: l.sqft, st: l.status, dom: l.dom, listed: l.listDate,
    ...(l.soldPrice ? { sold: l.soldPrice, closed: l.closeDate } : {}),
  }));
  const C = applyStages(stages).map((c) => ({
    id: c.id, name: c.name, src: c.source, stage: c.stage, budget: c.budget, wants: c.interest, created: c.created, note: c.note,
  }));
  return JSON.stringify({ asOf: AS_OF, listings: L, leads: C, monthlyClosed: monthlySales });
}

export function chatSystem(stages) {
  return (
    "You are the pipeline assistant inside Keystone, a dashboard for Dana Whitfield, a real estate agent at Keystone Realty Group in Austin, TX. " +
    "Answer questions using only the JSON data below. Be specific: cite addresses, prices, and counts. If the data does not contain the answer, say so. " +
    "Keep answers under 180 words, plain text, short lines or hyphen lists, no markdown headings, no emoji. " +
    "'This week' means the week starting 2026-11-02. DOM means days on market. Lead stages in the data are the agent's current stages.\n\nDATA:\n" +
    buildContext(stages)
  );
}

/* ---------- streaming ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function* paced(text) {
  const parts = text.match(/\S+\s*|\s+/g) || [];
  for (const p of parts) {
    yield p;
    await sleep(18 + Math.random() * 28);
  }
}

// Parses an OpenAI-style SSE stream, calling onText for each delta.
// Resolves true if "[DONE]" was seen, false if the stream ended without it.
async function readGroqStream(body, onText) {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let done = false;

  const handle = (raw) => {
    const line = raw.trim();
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (payload === "[DONE]") {
      done = true;
      return;
    }
    try {
      const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
      if (delta) onText(delta);
    } catch {
      /* ignore malformed lines */
    }
  };

  while (!done) {
    const { value, done: end } = await reader.read();
    if (end) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const l of lines) {
      handle(l);
      if (done) break;
    }
  }
  if (!done && buf) handle(buf);
  try {
    await reader.cancel();
  } catch {}
  return done;
}

export function streamAI({ system, messages, demo, signal }) {
  const enc = new TextEncoder();
  const key = process.env.GROQ_API_KEY;
  const live = Boolean(key);
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const upstream = new AbortController();
  let cancelled = false;
  let closed = false;

  const stop = () => {
    cancelled = true;
    upstream.abort();
  };
  if (signal) {
    if (signal.aborted) stop();
    else signal.addEventListener("abort", stop, { once: true });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (t) => {
        if (cancelled || closed) return;
        try {
          controller.enqueue(enc.encode(t));
        } catch {
          cancelled = true;
        }
      };
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {}
      };

      let sent = false;
      let prefix = false;

      if (live) {
        // Give up on a stalled upstream so the demo fallback can run instead of hanging.
        const timer = setTimeout(() => upstream.abort(), 25000);
        try {
          const res = await fetch(GROQ_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              messages: [{ role: "system", content: system }, ...messages],
              max_tokens: MAX_TOKENS,
              temperature: 0.7,
              stream: true,
            }),
            signal: upstream.signal,
          });
          if (!res.ok || !res.body) {
            res.body?.cancel().catch(() => {});
            throw new Error(`Groq responded with status ${res.status}`);
          }
          const finished = await readGroqStream(res.body, (t) => {
            sent = true;
            send(t);
          });
          if (cancelled) return close();
          if (!sent) throw new Error("Groq returned no text");
          if (!finished) send(INTERRUPTED);
          return close();
        } catch (err) {
          if (cancelled) return close();
          console.error("Groq request failed:", err?.message || err);
          if (sent) {
            send(INTERRUPTED);
            return close();
          }
          prefix = true;
        } finally {
          clearTimeout(timer);
        }
      }

      try {
        if (prefix) send(FALLBACK_PREFIX);
        for await (const chunk of paced(demo())) {
          if (cancelled) break;
          send(chunk);
        }
      } finally {
        close();
      }
    },
    cancel() {
      stop();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
