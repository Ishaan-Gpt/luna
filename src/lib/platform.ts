/** What kind of device Luna is open on, decided in the browser only. */
export type Platform = {
  os: "android" | "ios" | "desktop";
  /** Already running as an installed app (home-screen web app or the Android APK). */
  installed: boolean;
  /** iOS only: Safari is the only browser that can add Luna to the home screen. */
  safari: boolean;
};

export const APK = { href: "/download/luna.apk", version: "1.0.0" };

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; touch points give it away.
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const installed =
    matchMedia("(display-mode: standalone)").matches ||
    matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.startsWith("android-app://");
  const safari = ios && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua);
  return { os: ios ? "ios" : android ? "android" : "desktop", installed, safari };
}

const PREVIEW = "luna-desktop-preview";
export function desktopPreviewChosen() {
  try {
    return localStorage.getItem(PREVIEW) === "1" || new URLSearchParams(location.search).has("preview");
  } catch {
    return false;
  }
}
export function chooseDesktopPreview() {
  try {
    localStorage.setItem(PREVIEW, "1");
  } catch {}
}
