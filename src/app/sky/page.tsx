import type { Metadata, Viewport } from "next";
import { SkyAppLoader } from "@/components/app/SkyAppLoader";

export const metadata: Metadata = {
  title: "Luna · Tonight",
  description: "Point at the sky, ask what you're seeing, find darker places. Runs on an open model inside your browser and works offline.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Luna", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#081115", colorScheme: "dark", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function SkyPage() {
  return <SkyAppLoader />;
}
