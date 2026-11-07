"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "./Icon";
import AiMark from "./AiMark";
import { AGENT } from "@/lib/data";

const AppCtx = createContext({ theme: "light", toggleTheme: () => {}, live: null });
export const useApp = () => useContext(AppCtx);

const NAV = [
  { href: "/", label: "Overview", icon: "grid" },
  { href: "/listings", label: "Listings", icon: "home" },
  { href: "/leads", label: "Leads", icon: "users" },
  { href: "/writer", label: "Listing Writer", short: "Writer", icon: "pen", ai: true },
  { href: "/assistant", label: "Assistant", icon: "chat", ai: true },
];

const THEME_COLORS = { light: "#F6F2EA", dark: "#0B1320" };

function applyThemeColor(theme) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.removeAttribute("media");
    m.setAttribute("content", THEME_COLORS[theme]);
  });
}

export function ModeBadge() {
  const { live } = useApp();
  if (live === null) return <span className="badge badge-muted" aria-hidden="true">AI status</span>;
  return (
    <span className={`badge ${live ? "badge-live" : "badge-demo"}`} title={live ? "Responses come from Groq (GPT-OSS 120B)" : "No API key set. Responses are pre-written and generated from the demo data."}>
      <span className="dot" aria-hidden="true" />
      {live ? "Live AI" : "Demo mode"}
    </span>
  );
}

export default function Shell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [live, setLive] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setTheme(t);
    applyThemeColor(t);
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setLive(Boolean(d.live)))
      .catch(() => setLive(false));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      applyThemeColor(next);
      try {
        localStorage.setItem("ks-theme", next);
      } catch {}
      return next;
    });
  }, []);

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/listings?q=${encodeURIComponent(term)}` : "/listings");
  };

  return (
    <AppCtx.Provider value={{ theme, toggleTheme, live }}>
      <div className="app">
        <aside className="sidebar" aria-label="Primary">
          <Link href="/" className="brand">
            <span className="brand-mark" aria-hidden="true">K</span>
            <span>
              <span className="brand-name">Keystone</span>
              <span className="brand-sub">{AGENT.brokerage}</span>
            </span>
          </Link>
          <nav aria-label="Main">
            <ul className="nav-list">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="nav-link" aria-current={isActive(n.href) ? "page" : undefined}>
                    <Icon name={n.icon} />
                    {n.label}
                    {n.ai && <AiMark />}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="sidebar-foot">
            <div className="demo-note">
              <strong>Demo data</strong>
              Fictional brokerage, listings and clients. Nothing here is real.
            </div>
            <div className="agent">
              <span className="avatar" aria-hidden="true">DW</span>
              <span>
                <span className="agent-name">{AGENT.name}</span>
                <span className="agent-sub">{AGENT.city}</span>
              </span>
            </div>
          </div>
        </aside>

        <div className="main-col">
          <header className="topbar">
            <Link href="/" className="brand brand-compact" aria-label="Keystone home">
              <span className="brand-mark" aria-hidden="true">K</span>
            </Link>
            <form className="search" role="search" onSubmit={onSearch}>
              <label htmlFor="global-search" className="sr-only">Search listings by address, neighborhood or status</label>
              <Icon name="search" />
              <input id="global-search" type="search" placeholder="Search listings" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
            </form>
            <span className="demo-pill">Demo data</span>
            <ModeBadge />
            <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </button>
          </header>
          <main id="main" tabIndex={-1} className="content">
            {children}
          </main>
        </div>

        <nav className="bottom-nav" aria-label="Main (mobile)">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={isActive(n.href) ? "page" : undefined}>
                  <Icon name={n.icon} />
                  <span>{n.short || n.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </AppCtx.Provider>
  );
}
