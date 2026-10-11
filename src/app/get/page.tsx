import type { Metadata, Viewport } from "next";
import { GetLuna } from "@/components/get/GetLuna";

export const metadata: Metadata = {
  title: "Get Luna",
  description: "Luna for Android and iPhone: a night-sky guide you hold up to the sky. Runs an open model on your phone and works offline.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Luna", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#081115", colorScheme: "dark", viewportFit: "cover", width: "device-width", initialScale: 1 };

export default function GetPage() {
  return <GetLuna />;
}
