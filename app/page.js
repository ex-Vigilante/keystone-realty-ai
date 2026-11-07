"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { loadStageOverrides } from "@/lib/leadStages";
import StatusChip from "@/components/StatusChip";
import { computeKpis, listings, leads, applyStages, fmtUSD, AGENT } from "@/lib/data";

const chartLoading = () => <div className="sk chart-sk" aria-hidden="true" />;
const SalesChart = dynamic(() => import("@/components/Charts").then((m) => m.SalesChart), { ssr: false, loading: chartLoading });
const SourceChart = dynamic(() => import("@/components/Charts").then((m) => m.SourceChart), { ssr: false, loading: chartLoading });
const DomChart = dynamic(() => import("@/components/Charts").then((m) => m.DomChart), { ssr: false, loading: chartLoading });

export default function Overview() {
  const [overrides, setOverrides] = useState({});
  useEffect(() => setOverrides(loadStageOverrides()), []);

  const k = computeKpis();
  const kpis = [
    { label: "Active listings", value: k.active, sub: `${fmtUSD(k.activeValue)} on market` },
    { label: "Pending", value: k.pending, sub: "Under contract" },
    { label: "Closed volume YTD", value: `$${k.volumeYtd.toFixed(1)}M`, sub: `${k.closedYtd} closings, Jan 1 to Nov 6` },
    { label: "Avg days on market", value: k.avgDom, sub: "Active and pending" },
  ];
  const aging = listings.filter((l) => l.status !== "Sold").sort((a, b) => b.dom - a.dom).slice(0, 5);
  const openLeads = applyStages(overrides).filter((l) => l.stage !== "Closed").length;

  return (
    <>
      <section className="card intro" aria-labelledby="intro-h">
        <div>
          <h2 id="intro-h">A dashboard for a real-estate agent, with AI built in</h2>
          <p className="muted">Track listings and leads in one place. The AI writes listing copy from a few facts and answers questions about your pipeline. Try it with the sample data below.</p>
        </div>
        <div className="intro-actions">
          <Link href="/writer" className="btn btn-primary">Write a listing with AI</Link>
          <Link href="/assistant" className="btn btn-ghost">Ask the AI about your pipeline</Link>
        </div>
      </section>

      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <p className="muted">{AGENT.name}, as of Nov 6, 2026. {openLeads} open leads across {listings.length} listings.</p>
        </div>
      </div>

      <section aria-label="Key figures" className="kpis">
        {kpis.map((x) => (
          <div className="card kpi" key={x.label}>
            <div className="kpi-label">{x.label}</div>
            <div className="kpi-value num">{x.value}</div>
            <div className="kpi-sub">{x.sub}</div>
          </div>
        ))}
      </section>

      <div className="grid-charts">
        <section className="card span-2" aria-labelledby="h-sales">
          <h2 id="h-sales">Monthly closed volume</h2>
          <SalesChart />
          <p className="muted small chart-note">* November through Nov 6.</p>
        </section>
        <section className="card" aria-labelledby="h-src">
          <h2 id="h-src">Lead sources</h2>
          <SourceChart />
        </section>
        <section className="card span-2" aria-labelledby="h-dom">
          <h2 id="h-dom">List price vs days on market</h2>
          <DomChart />
        </section>
        <section className="card" aria-labelledby="h-age">
          <h2 id="h-age">Longest on market</h2>
          <ul className="plain-list">
            {aging.map((l) => (
              <li key={l.id}>
                <div>
                  <div className="strong">{l.address}</div>
                  <div className="muted small">{l.neighborhood} <StatusChip status={l.status} /></div>
                </div>
                <div className="num right">
                  <div>{l.dom}d</div>
                  <div className="muted small">{fmtUSD(l.price)}</div>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/listings" className="text-link">View all listings</Link>
        </section>
      </div>
    </>
  );
}
