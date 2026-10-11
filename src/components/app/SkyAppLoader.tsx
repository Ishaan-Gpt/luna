"use client";

import dynamic from "next/dynamic";

/** The app reads the clock, sensors and local storage, so it renders only in the browser. */
export const SkyAppLoader = dynamic(() => import("./SkyApp").then((m) => m.SkyApp), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 grid place-items-center bg-night">
      <p className="t-label text-star/50">Opening the sky…</p>
    </div>
  ),
});
