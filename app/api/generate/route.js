import { bad, getIp, rateLimited, readJson, streamAI, tooMany, validateWriter, writerPrompt } from "@/lib/server";
import { demoWriter } from "@/lib/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (rateLimited(getIp(req))) return tooMany();
  const parsed = await readJson(req);
  if (parsed.error) return bad(parsed.error);
  const v = validateWriter(parsed.value);
  if (v.error) return bad(v.error);
  const { system, messages } = writerPrompt(v.value);
  return streamAI({ system, messages, demo: () => demoWriter(v.value), signal: req.signal });
}
