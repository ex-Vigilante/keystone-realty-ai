"use client";

import { useEffect, useState } from "react";
import { Bar, Doughnut, Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, Tooltip, Legend,
} from "chart.js";
import { useApp } from "./Shell";
import { listings, leads, monthlySales } from "@/lib/data";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, Tooltip, Legend);

const THEMES = {
  light: {
    text: "#566273", grid: "#E4DCCB", surface: "#FFFDF8", tipBg: "#14202F", tipText: "#F6F2EA",
    brass: "#9A7436", slate: "#5E7A99", teal: "#3F7F70", rust: "#A65E4A", stone: "#8C8573",
  },
  dark: {
    text: "#A3AEBD", grid: "#22344D", surface: "#111E31", tipBg: "#E8E4DA", tipText: "#0F1A2B",
    brass: "#C9A468", slate: "#8AA4C2", teal: "#5FB09C", rust: "#D98B73", stone: "#A39C88",
  },
};

// next/font renames its families, so read the real name from the CSS variable.
function fonts() {
  const read = (v, fb) => (getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb);
  return {
    sans: `${read("--nf-sans", "")}, system-ui, sans-serif`.replace(/^, /, ""),
    mono: `${read("--nf-mono", "")}, ui-monospace, monospace`.replace(/^, /, ""),
  };
}

function base(c) {
  const f = fonts();
  const monoFont = { family: f.mono, size: 11 };
  return {
    monoFont,
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { labels: { color: c.text, boxWidth: 10, boxHeight: 10, font: { family: f.sans, size: 12 } } },
      tooltip: { backgroundColor: c.tipBg, titleColor: c.tipText, bodyColor: c.tipText, padding: 10, cornerRadius: 2, displayColors: true, bodyFont: monoFont },
    },
  };
}

export function SalesChart() {
  const { theme } = useApp();
  const c = THEMES[theme];
  const o = base(c);
  const monoFont = o.monoFont;
  const peak = monthlySales.reduce((a, m) => (m.volume > a.volume ? m : a));
  return (
    <div className="chart-box" role="img" aria-label={`Bar chart of monthly closed volume in millions of dollars, January through November 6 2026. Peak is ${peak.month} at ${peak.volume} million.`}>
      <Bar
        data={{
          labels: monthlySales.map((m) => m.month),
          datasets: [{ label: "Closed volume ($M)", data: monthlySales.map((m) => m.volume), backgroundColor: c.brass, borderRadius: 1, maxBarThickness: 34 }],
        }}
        options={{
          ...o,
          plugins: {
            ...o.plugins,
            legend: { display: false },
            tooltip: { ...o.plugins.tooltip, callbacks: { label: (i) => ` $${i.parsed.y.toFixed(2)}M`, afterLabel: (i) => ` ${monthlySales[i.dataIndex].closed} closings` } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: c.text, font: monoFont }, border: { color: c.grid } },
            y: { grid: { color: c.grid }, border: { display: false }, ticks: { color: c.text, font: monoFont, callback: (v) => `$${v}M` } },
          },
        }}
      />
    </div>
  );
}

export function SourceChart() {
  const { theme } = useApp();
  const c = THEMES[theme];
  const counts = {};
  leads.forEach((l) => (counts[l.source] = (counts[l.source] || 0) + 1));
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const o = base(c);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 600px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return (
    <div className="chart-box" role="img" aria-label={`Doughnut chart of lead sources: ${entries.map(([s, n]) => `${s} ${n}`).join(", ")}.`}>
      <Doughnut
        data={{
          labels: entries.map((e) => e[0]),
          datasets: [{ data: entries.map((e) => e[1]), backgroundColor: [c.brass, c.slate, c.teal, c.rust, c.stone], borderColor: c.surface, borderWidth: 2 }],
        }}
        options={{ ...o, cutout: "62%", plugins: { ...o.plugins, legend: { ...o.plugins.legend, position: narrow ? "bottom" : "right" } } }}
      />
    </div>
  );
}

export function DomChart() {
  const { theme } = useApp();
  const c = THEMES[theme];
  const o = base(c);
  const monoFont = o.monoFont;
  const mk = (status, color) => ({
    label: status,
    data: listings.filter((l) => l.status === status).map((l) => ({ x: l.dom, y: l.price / 1000, a: l.address })),
    backgroundColor: color, borderColor: color, pointRadius: 5, pointHoverRadius: 7,
  });
  return (
    <div className="chart-box" role="img" aria-label="Scatter chart of list price in thousands of dollars against days on market for each listing, grouped by status.">
      <Scatter
        data={{ datasets: [mk("Active", c.brass), mk("Pending", c.teal), mk("Sold", c.slate)] }}
        options={{
          ...o,
          plugins: {
            ...o.plugins,
            tooltip: { ...o.plugins.tooltip, callbacks: { title: (i) => i[0].raw.a, label: (i) => ` $${Math.round(i.raw.y).toLocaleString("en-US")}K, ${i.raw.x} days` } },
          },
          scales: {
            x: { title: { display: true, text: "Days on market", color: c.text, font: monoFont }, grid: { color: c.grid }, border: { display: false }, ticks: { color: c.text, font: monoFont } },
            y: { title: { display: true, text: "List price", color: c.text, font: monoFont }, grid: { color: c.grid }, border: { display: false }, ticks: { color: c.text, font: monoFont, callback: (v) => `$${v}K` } },
          },
        }}
      />
    </div>
  );
}
