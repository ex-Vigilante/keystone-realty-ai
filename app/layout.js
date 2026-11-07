import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import Shell from "@/components/Shell";
import "./globals.css";

const sans = Space_Grotesk({ subsets: ["latin"], variable: "--nf-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--nf-mono", display: "swap" });

export const metadata = {
  title: { default: "Keystone | Pipeline dashboard", template: "%s | Keystone" },
  description:
    "Listings, leads and an AI writing assistant for a real estate agent. Demo built with fictional data for Keystone Realty Group, Austin TX.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F2EA" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1320" },
  ],
};

const themeScript = `try{var t=localStorage.getItem('ks-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">Skip to main content</a>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
