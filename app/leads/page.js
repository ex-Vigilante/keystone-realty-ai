"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { leads as seed, LEAD_STAGES, fmtUSD } from "@/lib/data";

import { STAGE_KEY as KEY } from "@/lib/leadStages";

export default function LeadsPage() {
  const [stages, setStages] = useState(() => Object.fromEntries(seed.map((l) => [l.id, l.stage])));
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");
  const focusId = useRef(null);

  useEffect(() => {
    if (focusId.current) {
      document.getElementById(`mv-${focusId.current}`)?.focus();
      focusId.current = null;
    }
  }, [stages]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved && typeof saved === "object") {
        setStages((s) => {
          const next = { ...s };
          for (const id of Object.keys(next)) if (LEAD_STAGES.includes(saved[id])) next[id] = saved[id];
          return next;
        });
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(stages));
    } catch {}
  }, [stages, loaded]);

  const move = (lead, stage) => {
    if (!LEAD_STAGES.includes(stage) || stages[lead.id] === stage) return;
    focusId.current = lead.id;
    setStages((s) => ({ ...s, [lead.id]: stage }));
    setMsg(`${lead.name} moved to ${stage}.`);
  };

  const reset = () => {
    setStages(Object.fromEntries(seed.map((l) => [l.id, l.stage])));
    setMsg("Pipeline reset to the original demo stages.");
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Leads</h1>
          <p className="muted">{seed.length} leads. Stage changes are saved in this browser.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={reset}>Reset demo</button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{msg}</p>

      <div className="board">
        {LEAD_STAGES.map((stage, si) => {
          const items = seed.filter((l) => stages[l.id] === stage);
          return (
            <section key={stage} className="col" aria-labelledby={`col-${stage}`}>
              <h2 id={`col-${stage}`} className="col-head">
                {stage} <span className="count num">{items.length}</span>
              </h2>
              <ul className="col-list">
                {items.length === 0 && <li className="col-empty">No leads in this stage</li>}
                {items.map((l) => (
                  <li key={l.id} className="card lead">
                    <div className="lead-top">
                      <span className="strong">{l.name}</span>
                      <span className="num muted small">{fmtUSD(l.budget)}</span>
                    </div>
                    <div className="small">{l.interest}</div>
                    <div className="muted small lead-note">{l.note}</div>
                    <div className="muted small">{l.source} · added {new Date(l.created + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    <div className="lead-actions">
                      <button type="button" className="icon-btn sm" disabled={si === 0} onClick={() => move(l, LEAD_STAGES[si - 1])} aria-label={`Move ${l.name} back to ${LEAD_STAGES[si - 1] || "previous stage"}`}>
                        <Icon name="left" size={14} />
                      </button>
                      <label className="sr-only" htmlFor={`mv-${l.id}`}>Stage for {l.name}</label>
                      <select id={`mv-${l.id}`} value={stage} onChange={(e) => move(l, e.target.value)}>
                        {LEAD_STAGES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                      <button type="button" className="icon-btn sm" disabled={si === LEAD_STAGES.length - 1} onClick={() => move(l, LEAD_STAGES[si + 1])} aria-label={`Move ${l.name} forward to ${LEAD_STAGES[si + 1] || "next stage"}`}>
                        <Icon name="right" size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
