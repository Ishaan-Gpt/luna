import type { Metadata } from "next";
import Link from "next/link";
import { Mark } from "@/components/landing/primitives";

export const metadata: Metadata = { title: "Luna · Tonight" };

/** Holding page for the app until it ships, so every "Open Luna" link lands somewhere honest. */
export default function SkyApp() {
  return (
    <main className="grid min-h-[100svh] place-items-center bg-night px-6 text-center text-star">
      <div className="flex flex-col items-center">
        <Mark size={48} />
        <h1 className="t-display mt-10 text-[clamp(64px,14vw,220px)] leading-[0.85]">Tonight</h1>
        <p className="t-script -mt-[3vw] text-[clamp(40px,6vw,96px)]">is almost ready</p>
        <p className="t-body mt-8 max-w-[38ch] text-star/70">The Luna app is being built right now. Leave your email and we&rsquo;ll tell you the night it opens.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/#waitlist" className="pill t-label">Join the waitlist</Link>
          <Link href="/" className="pill t-label">Back to Luna</Link>
        </div>
      </div>
    </main>
  );
}
