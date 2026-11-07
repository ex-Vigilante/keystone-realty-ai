"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import AiMark from "@/components/AiMark";
import { ModeBadge } from "@/components/Shell";
import { streamText } from "@/lib/streamClient";

const TYPES = ["Single-family home", "Condo", "Townhome", "Duplex", "Bungalow"];
const SUGGEST = ["Updated kitchen", "Screened porch", "Oak floors", "Detached garage", "Pool", "Solar panels", "Walk-in pantry", "Corner lot"];

export default function WriterPage() {
  const [f, setF] = useState({ propertyType: TYPES[0], beds: 3, baths: 2, sqft: 1850, neighborhood: "Travis Heights", tone: "Warm", length: "Standard" });
  const [features, setFeatures] = useState(["Updated kitchen", "Screened porch"]);
  const [tag, setTag] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");
  const abort = useRef(null);
  const inFlight = useRef(false);
  const formRef = useRef(null);

  useEffect(() => () => abort.current?.abort(), []);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const addTag = (raw) => {
    const t = raw.trim().replace(/,$/, "").trim();
    if (!t) return;
    setFeatures((fs) => (fs.length >= 12 || fs.some((x) => x.toLowerCase() === t.toLowerCase()) ? fs : [...fs, t.slice(0, 50)]));
    setTag("");
  };

  const onTagKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tag);
    } else if (e.key === "Backspace" && !tag && features.length) {
      setFeatures((fs) => fs.slice(0, -1));
    }
  };

  const generate = async (e) => {
    e?.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    const pending = tag.trim().slice(0, 50);
    const dup = features.some((x) => x.toLowerCase() === pending.toLowerCase());
    const feats = pending && !dup && features.length < 12 ? [...features, pending] : features;
    if (pending) {
      setFeatures(feats);
      setTag("");
    }
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setBusy(true);
    setErr("");
    setOut("");
    setCopied(false);
    setStatus("Generating description");
    try {
      let text = "";
      await streamText(
        "/api/generate",
        { ...f, beds: Number(f.beds), baths: Number(f.baths), sqft: Number(f.sqft), features: feats },
        (c) => {
          text += c;
          setOut((o) => o + c);
        },
        ctl.signal
      );
      setStatus(text.includes("[Response was interrupted") ? "Generation was interrupted" : "Description ready");
    } catch (ex) {
      if (ex.name !== "AbortError") {
        setErr(ex.message);
        setStatus("");
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      setStatus("Copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setErr("Copy failed. Select the text and copy it manually.");
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Listing Writer <AiMark /></h1>
          <p className="muted"><strong>What the AI does:</strong> turns these facts into ready-to-post listing copy in your chosen tone. The example is filled in, so just press the button.</p>
        </div>
        <ModeBadge />
      </div>

      <div className="split">
        <form ref={formRef} className="card form" onSubmit={generate} aria-label="Listing details">
          <div className="form-grid">
            <div className="field span-all">
              <label htmlFor="w-type">Property type</label>
              <select id="w-type" value={f.propertyType} onChange={set("propertyType")}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="w-beds">Bedrooms</label>
              <input id="w-beds" type="number" min="0" max="12" step="1" required value={f.beds} onChange={set("beds")} />
            </div>
            <div className="field">
              <label htmlFor="w-baths">Bathrooms</label>
              <input id="w-baths" type="number" min="0.5" max="12" step="0.5" required value={f.baths} onChange={set("baths")} />
            </div>
            <div className="field">
              <label htmlFor="w-sqft">Square feet</label>
              <input id="w-sqft" type="number" min="200" max="30000" step="10" required value={f.sqft} onChange={set("sqft")} />
            </div>
            <div className="field">
              <label htmlFor="w-hood">Neighborhood</label>
              <input id="w-hood" type="text" maxLength={60} required value={f.neighborhood} onChange={set("neighborhood")} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="w-tag">Key features <span className="muted small">(press Enter to add)</span></label>
            <div className="tags" onClick={() => document.getElementById("w-tag")?.focus()}>
              {features.map((t) => (
                <span key={t} className="tag">
                  {t}
                  <button type="button" onClick={() => setFeatures((fs) => fs.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
                    <Icon name="x" size={12} />
                  </button>
                </span>
              ))}
              <input id="w-tag" value={tag} maxLength={50} onChange={(e) => setTag(e.target.value)} onKeyDown={onTagKey} onBlur={() => addTag(tag)} placeholder={features.length ? "" : "e.g. Original hardwood floors"} disabled={features.length >= 12 && !tag} />
            </div>
            <div className="suggest" aria-label="Suggested features">
              {SUGGEST.filter((s) => !features.includes(s)).slice(0, 5).map((s) => (
                <button type="button" key={s} className="chip-btn" onClick={() => addTag(s)}>+ {s}</button>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <fieldset className="field radios span-all">
              <legend>Tone</legend>
              {["Warm", "Luxury", "Concise"].map((t) => (
                <label key={t} className="radio"><input type="radio" name="tone" value={t} checked={f.tone === t} onChange={set("tone")} /><span>{t}</span></label>
              ))}
            </fieldset>
          </div>

          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Writing..." : "Write the listing with AI"}</button>
        </form>

        <section className="card output" aria-labelledby="out-h">
          <div className="output-head">
            <h2 id="out-h">Your listing copy</h2>
            <span className="num muted small" aria-label={`${out.length} characters`}>{out.length.toLocaleString("en-US")} chars</span>
          </div>
          <div className={`output-body${busy ? " streaming" : ""}`} aria-busy={busy}>
            {err ? <p className="error" role="alert">{err}</p> : out ? <p>{out}</p> : <p className="muted">Your listing copy will appear here. Press the button to see it, then check your board&apos;s character limit before posting.</p>}
          </div>
          <div className="output-actions">
            <button type="button" className="btn btn-ghost" onClick={copy} disabled={!out || busy}><Icon name="copy" size={15} /> {copied ? "Copied" : "Copy"}</button>
            <button type="button" className="btn btn-ghost" onClick={() => formRef.current?.requestSubmit()} disabled={busy}><Icon name="refresh" size={15} /> Regenerate</button>
          </div>
          <p className="sr-only" role="status" aria-live="polite">{status}</p>
        </section>
      </div>
    </>
  );
}
