"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { ModeBadge } from "@/components/Shell";
import { streamText } from "@/lib/streamClient";
import { loadStageOverrides } from "@/lib/leadStages";

const CHIPS = [
  "Which listings have been on market over 30 days?",
  "Summarize this week's leads",
  "Which deals are pending?",
  "How many closings do we have year to date?",
  "Break down the lead pipeline by stage",
];

const INTERRUPTED = "[Response was interrupted";
const ASSISTANT_MAX = 4000;

// Build a valid alternating history: complete user/assistant pairs plus the new user turn, max 12 messages.
function buildHistory(msgs, content) {
  const pairs = [];
  for (let i = 0; i + 1 < msgs.length; i += 2) {
    const u = msgs[i], a = msgs[i + 1];
    if (u.role === "user" && a.role === "assistant" && !a.error && a.content && !a.content.includes(INTERRUPTED))
      pairs.push([{ role: "user", content: u.content }, { role: "assistant", content: a.content.slice(0, ASSISTANT_MAX) }]);
  }
  return [...pairs.slice(-5).flat(), { role: "user", content }];
}

export default function AssistantPage() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const endRef = useRef(null);
  const abort = useRef(null);
  const inputRef = useRef(null);
  const inFlight = useRef(false);

  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || inFlight.current) return;
    inFlight.current = true;
    const history = buildHistory(msgs, content);
    setMsgs((m) => [...m, { role: "user", content }, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setStatus("");
    const ctl = new AbortController();
    abort.current = ctl;
    const patch = (fn) => setMsgs((m) => { const c = m.slice(); c[c.length - 1] = fn(c[c.length - 1]); return c; });
    let full = "";
    try {
      await streamText(
        "/api/chat",
        { messages: history, leadStages: loadStageOverrides() },
        (chunk) => {
          full += chunk;
          patch((last) => ({ ...last, content: last.content + chunk }));
        },
        ctl.signal
      );
      setStatus(full.includes(INTERRUPTED) ? "The response was interrupted." : `Assistant answered: ${full}`);
    } catch (ex) {
      if (ex.name !== "AbortError") {
        patch(() => ({ role: "assistant", content: ex.message, error: true }));
        setStatus(`Error: ${ex.message}`);
      }
    } finally {
      // A newer request (after "New chat") owns the busy state now; leave it alone.
      if (abort.current === ctl) {
        inFlight.current = false;
        setBusy(false);
        inputRef.current?.focus();
      }
    }
  };

  const newChat = () => {
    abort.current?.abort();
    inFlight.current = false;
    setMsgs([]);
    setInput("");
    setBusy(false);
    setStatus("Started a new chat.");
    inputRef.current?.focus();
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Assistant</h1>
          <p className="muted">Ask about listings, leads and closings. Answers draw on the demo data only.</p>
        </div>
        <div className="head-actions">
          <ModeBadge />
          <button type="button" className="btn btn-ghost" onClick={newChat} disabled={msgs.length === 0 && !busy}>New chat</button>
        </div>
      </div>

      <div className="chat card">
        <div className="chat-log" role="log" aria-live="off" aria-busy={busy} aria-label="Conversation" tabIndex={0}>
          {msgs.length === 0 && (
            <div className="chat-empty">
              <p className="strong">Start with a question</p>
              <p className="muted">The assistant sees a compact summary of 14 listings, 12 leads (with your current stages) and monthly closings.</p>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`msg msg-${m.role}${m.error ? " msg-error" : ""}`}>
              <div className="msg-who">{m.role === "user" ? "You" : "Assistant"}</div>
              <div className="msg-text">
                {m.content || (busy && i === msgs.length - 1 ? (
                  <span className="typing"><span className="sr-only">Assistant is typing</span><i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" /></span>
                ) : "")}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <p className="sr-only" role="status" aria-live="polite">{status}</p>

        <div className="chips" aria-label="Suggested questions">
          {CHIPS.map((c) => (
            <button key={c} type="button" className="chip-btn" disabled={busy} onClick={() => send(c)}>{c}</button>
          ))}
        </div>

        <form className="composer" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <label htmlFor="chat-in" className="sr-only">Ask about your pipeline</label>
          <textarea id="chat-in" ref={inputRef} rows={2} maxLength={1000} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} placeholder="Ask about your pipeline" />
          <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}><Icon name="send" size={15} /> Send</button>
        </form>
        <div className="muted small composer-foot"><span className="num">{input.length}</span>/1000 · Enter to send, Shift+Enter for a new line</div>
      </div>
    </>
  );
}
