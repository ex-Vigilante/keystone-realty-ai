"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import StatusChip from "@/components/StatusChip";
import { listings, fmtUSD } from "@/lib/data";

const COLS = [
  { key: "address", label: "Address" },
  { key: "neighborhood", label: "Neighborhood" },
  { key: "price", label: "Price", num: true },
  { key: "beds", label: "Bd", num: true },
  { key: "baths", label: "Ba", num: true },
  { key: "sqft", label: "Sq ft", num: true },
  { key: "status", label: "Status" },
  { key: "dom", label: "DOM", num: true },
  { key: "listDate", label: "Listed" },
];

const fmtDate = (s) => new Date(s + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function ListingsView() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [status, setStatus] = useState("All");
  const [hood, setHood] = useState("All");
  const [sort, setSort] = useState({ key: "dom", dir: "desc" });

  useEffect(() => {
    setQ(params.get("q") || "");
  }, [params]);

  const hoods = useMemo(() => [...new Set(listings.map((l) => l.neighborhood))].sort(), []);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const r = listings.filter(
      (l) =>
        (status === "All" || l.status === status) &&
        (hood === "All" || l.neighborhood === hood) &&
        (!t || `${l.address} ${l.neighborhood} ${l.zip} ${l.status} ${l.id}`.toLowerCase().includes(t))
    );
    const { key, dir } = sort;
    r.sort((a, b) => {
      const A = a[key], B = b[key];
      const c = typeof A === "number" ? A - B : String(A).localeCompare(String(B));
      return dir === "asc" ? c : -c;
    });
    return r;
  }, [q, status, hood, sort]);

  const setSortKey = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Listings</h1>
          <p className="muted"><span className="num">{rows.length}</span> of {listings.length} listings shown</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="field grow">
          <label htmlFor="lq">Search</label>
          <input id="lq" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Address, neighborhood, ZIP" />
        </div>
        <div className="field">
          <label htmlFor="ls">Status</label>
          <select id="ls" value={status} onChange={(e) => setStatus(e.target.value)}>
            {["All", "Active", "Pending", "Sold"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="lh">Neighborhood</label>
          <select id="lh" value={hood} onChange={(e) => setHood(e.target.value)}>
            <option>All</option>
            {hoods.map((h) => <option key={h}>{h}</option>)}
          </select>
        </div>
        <div className="field sort-mobile">
          <label htmlFor="lsort">Sort by</label>
          <select id="lsort" value={`${sort.key}:${sort.dir}`} onChange={(e) => { const [key, dir] = e.target.value.split(":"); setSort({ key, dir }); }}>
            {COLS.flatMap((c) => [
              <option key={`${c.key}:asc`} value={`${c.key}:asc`}>{c.label}, {c.num ? "low to high" : "A to Z"}</option>,
              <option key={`${c.key}:desc`} value={`${c.key}:desc`}>{c.label}, {c.num ? "high to low" : "Z to A"}</option>,
            ])}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card empty">No listings match those filters. <button type="button" className="text-link" onClick={() => { setQ(""); setStatus("All"); setHood("All"); }}>Clear filters</button></div>
      ) : (
        <>
          <div className="card table-card">
            <div className="table-wrap" tabIndex={0} role="region" aria-label="Listings table, scrolls horizontally on narrow screens">
              <table>
                <caption className="sr-only">Listings, sortable by column</caption>
                <thead>
                  <tr>
                    {COLS.map((c) => (
                      <th key={c.key} scope="col" className={c.num ? "right" : ""} aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                        <button type="button" className="th-btn" onClick={() => setSortKey(c.key)}>
                          {c.label}
                          <span className="sort-ind" aria-hidden="true">{sort.key === c.key ? <Icon name={sort.dir === "asc" ? "up" : "down"} size={12} /> : null}</span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div className="addr-cell">
                          <img src={l.photo} alt={l.alt} width="64" height="44" loading="lazy" />
                          <div><div className="strong">{l.address}</div><div className="muted small num">{l.id} · {l.zip}</div></div>
                        </div>
                      </td>
                      <td>{l.neighborhood}</td>
                      <td className="num right">{fmtUSD(l.price)}</td>
                      <td className="num right">{l.beds}</td>
                      <td className="num right">{l.baths}</td>
                      <td className="num right">{l.sqft.toLocaleString("en-US")}</td>
                      <td><StatusChip status={l.status} /></td>
                      <td className="num right">{l.dom}</td>
                      <td className="num nowrap">{fmtDate(l.listDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="cards" aria-label="Listings">
            {rows.map((l) => (
              <li key={l.id} className="card listing-card">
                <img src={l.photo} alt={l.alt} width="640" height="420" loading="lazy" />
                <div className="lc-body">
                  <div className="lc-top">
                    <span className="num lc-price">{fmtUSD(l.price)}</span>
                    <StatusChip status={l.status} />
                  </div>
                  <div className="strong">{l.address}</div>
                  <div className="muted small">{l.neighborhood}, Austin {l.zip}</div>
                  <dl className="lc-stats num">
                    <div><dt>Bd</dt><dd>{l.beds}</dd></div>
                    <div><dt>Ba</dt><dd>{l.baths}</dd></div>
                    <div><dt>Sq ft</dt><dd>{l.sqft.toLocaleString("en-US")}</dd></div>
                    <div><dt>DOM</dt><dd>{l.dom}</dd></div>
                  </dl>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="sk" style={{ height: 240 }} aria-hidden="true" />}>
      <ListingsView />
    </Suspense>
  );
}
