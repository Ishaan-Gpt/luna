import type { Metadata, Viewport } from "next";
import { Archivo, Mrs_Saint_Delafield, Noto_Serif_Display } from "next/font/google";
import "./globals.css";

// Towering condensed Didone for display, a formal script for the turn, an expanded grotesk for labels and body.
const display = Noto_Serif_Display({ variable: "--font-display", subsets: ["latin"], axes: ["wdth"], style: ["normal", "italic"], display: "swap" });
const script = Mrs_Saint_Delafield({ variable: "--font-script", subsets: ["latin"], weight: "400", display: "swap" });
const sans = Archivo({ variable: "--font-sans", subsets: ["latin"], axes: ["wdth"], display: "swap" });

export const metadata: Metadata = {
  title: "Luna · The night sky, named. Even with no signal.",
  description:
    "Luna is a night-sky guide that runs on an open model inside your phone. Point it at the sky, ask what you're seeing, then put it away. Works offline.",
  openGraph: { title: "Luna", description: "Look up. Luna knows who's there, even with no signal.", type: "website" },
};

export const viewport: Viewport = { themeColor: "#081115", colorScheme: "dark" };

// Before first paint: decide whether the moonrise preloader plays (once per session, never with reduced motion),
// and mark that JS is running so reveal targets can start hidden. A timer unhides them if motion never boots.
// An installed Luna (home-screen app or the Android APK) opens straight into the sky, never the landing page.
const boot = `(function(){var d=document.documentElement;try{if(location.pathname==='/'&&(matchMedia('(display-mode: standalone)').matches||navigator.standalone||document.referrer.indexOf('android-app://')===0)){location.replace('/sky');return}}catch(e){}d.classList.add('js');try{var r=matchMedia('(prefers-reduced-motion: reduce)').matches;d.dataset.intro=(r||/[?&]shot=/.test(location.search))?'none':(sessionStorage.getItem('luna-intro')?'short':'long')}catch(e){d.dataset.intro='none'}setTimeout(function(){d.classList.add('motion-fallback')},6000)})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${script.variable} ${sans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
