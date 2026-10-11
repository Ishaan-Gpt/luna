import type { Metadata } from "next";
import { PrintPlanisphere } from "@/components/app/PrintPlanisphere";

export const metadata: Metadata = { title: "Luna · Printable planisphere" };

export default function PrintPage() {
  return <PrintPlanisphere />;
}
