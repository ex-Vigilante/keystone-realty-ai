import { applyStages } from "@/lib/data";
import { bad, chatSystem, getIp, rateLimited, readJson, streamAI, tooMany, validateChat } from "@/lib/server";
import { demoChat } from "@/lib/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (rateLimited(getIp(req))) return tooMany();
  const parsed = await readJson(req, 40_000);
  if (parsed.error) return bad(parsed.error);
  const v = validateChat(parsed.value);
  if (v.error) return bad(v.error);
  const { messages, stages } = v.value;
  const last = messages[messages.length - 1].content;
  return streamAI({
    system: chatSystem(stages),
    messages,
    demo: () => demoChat(last, applyStages(stages)),
    signal: req.signal,
  });
}
