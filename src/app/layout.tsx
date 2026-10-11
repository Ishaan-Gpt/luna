import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Hanken_Grotesk, Martian_Mono } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({ variable: "--font-bodoni", subsets: ["latin"], style: ["normal", "italic"], display: "swap" });
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"], display: "swap" });
const martian = Martian_Mono({ variable: "--font-martian", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Luna · Know every star above you, even with no signal",
  description:
    "Luna names the stars, planets and constellations over your head from GPS and your phone's sensors, works fully offline, and tells you when and where the sky is darkest.",
  openGraph: {
    title: "Luna",
    description: "Look up. Luna knows who's there. A sky guide that works with no signal.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#0a1211", colorScheme: "dark" };

// Decide before first paint whether the intro plays (once per session, never with reduced motion).
const introScript = `(function(){var d=document.documentElement;try{var r=matchMedia('(prefers-reduced-motion: reduce)').matches;d.dataset.intro=(r||sessionStorage.getItem('luna-intro'))?'done':'playing'}catch(e){d.dataset.intro='done'}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${bodoni.variable} ${hanken.variable} ${martian.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
