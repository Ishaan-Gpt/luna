"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Where is the phone pointing? From the device orientation (alpha, beta, gamma) we rotate the
 * back-camera axis (0, 0, -1) into East-North-Up and read its azimuth and altitude.
 * Android gives an absolute alpha via `deviceorientationabsolute`; iOS gives `webkitCompassHeading`.
 */

export type Pointing = { az: number; alt: number };
type IOSOrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };
type PermissionCapable = { requestPermission?: () => Promise<"granted" | "denied"> };

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export function pointingFrom(alphaDeg: number, betaDeg: number, gammaDeg: number): Pointing {
  const a = alphaDeg * D2R, b = betaDeg * D2R, g = gammaDeg * D2R;
  const cA = Math.cos(a), sA = Math.sin(a), cB = Math.cos(b), sB = Math.sin(b), cG = Math.cos(g), sG = Math.sin(g);
  // minus the third column of R = Rz(alpha)·Rx(beta)·Ry(gamma)
  const x = -(cA * sG + cG * sA * sB);
  const y = -(sA * sG - cA * cG * sB);
  const z = -(cB * cG);
  const az = (Math.atan2(x, y) * R2D + 360) % 360;
  const alt = Math.asin(Math.max(-1, Math.min(1, z))) * R2D;
  return { az, alt };
}

export type SensorState = "unsupported" | "needs-permission" | "denied" | "waiting" | "live";

/** Live pointing direction, smoothed. `request()` must be called from a tap on iOS. */
export function usePointing(enabled: boolean) {
  const [state, setState] = useState<SensorState>("waiting");
  const [pointing, setPointing] = useState<Pointing | null>(null);
  const [heading, setHeading] = useState<number | null>(null); // where the top of a flat-held phone faces
  const smooth = useRef<Pointing | null>(null);
  const absolute = useRef(false);

  const handler = useCallback((e: DeviceOrientationEvent, isAbs: boolean) => {
    if (e.alpha == null || e.beta == null || e.gamma == null) return;
    if (isAbs) absolute.current = true;
    else if (absolute.current) return; // prefer the absolute stream once it exists
    let alpha = e.alpha;
    const ios = (e as IOSOrientationEvent).webkitCompassHeading;
    if (typeof ios === "number" && !Number.isNaN(ios)) alpha = (360 - ios) % 360;
    else if (!isAbs && !e.absolute) {
      // relative only: still usable for tilt, heading will drift; mark as live anyway
    }
    const p = pointingFrom(alpha, e.beta, e.gamma);
    setHeading((360 - alpha) % 360);
    const s = smooth.current;
    if (!s) smooth.current = p;
    else {
      let d = p.az - s.az;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      smooth.current = { az: (s.az + d * 0.22 + 360) % 360, alt: s.alt + (p.alt - s.alt) * 0.22 };
    }
    setPointing({ ...smooth.current! });
    setState("live");
  }, []);

  const attach = useCallback(() => {
    const abs = (e: Event) => handler(e as DeviceOrientationEvent, true);
    const rel = (e: Event) => handler(e as DeviceOrientationEvent, false);
    window.addEventListener("deviceorientationabsolute", abs);
    window.addEventListener("deviceorientation", rel);
    return () => {
      window.removeEventListener("deviceorientationabsolute", abs);
      window.removeEventListener("deviceorientation", rel);
    };
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setTimeout(() => setState("unsupported"), 0);
      return;
    }
    const needsPerm = typeof (DeviceOrientationEvent as unknown as PermissionCapable).requestPermission === "function";
    if (needsPerm) {
      setTimeout(() => setState((s) => (s === "live" ? s : "needs-permission")), 0);
      return;
    }
    const detach = attach();
    // Desktops expose the API but never fire; call it unsupported after a short wait.
    const t = setTimeout(() => setState((s) => (s === "live" ? s : "unsupported")), 1500);
    return () => {
      detach();
      clearTimeout(t);
    };
  }, [enabled, attach]);

  const request = useCallback(async () => {
    const api = DeviceOrientationEvent as unknown as PermissionCapable;
    if (typeof api.requestPermission !== "function") return;
    try {
      const r = await api.requestPermission();
      if (r === "granted") {
        setState("waiting");
        attach();
      } else setState("denied");
    } catch {
      setState("denied");
    }
  }, [attach]);

  return { state, pointing, heading, request };
}

/** Live GPS position (watchPosition). Starts only when asked. */
export function useWatchPosition(active: boolean) {
  const [pos, setPos] = useState<{ lat: number; lon: number; acc: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!active || !("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }),
      (e) => setError(e.message || "Location unavailable"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [active]);
  return { pos, error };
}
