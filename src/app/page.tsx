import { Chrome } from "@/components/landing/Chrome";
import { Credits, Footer } from "@/components/landing/Close";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { Horizon } from "@/components/landing/Horizon";
import { LunaMotion } from "@/components/landing/LunaMotion";
import { Moonrise } from "@/components/landing/Moonrise";
import { PlanisphereChapter } from "@/components/landing/PlanisphereChapter";
import { Preloader } from "@/components/landing/Preloader";
import { Principles } from "@/components/landing/Principles";
import { Reasons } from "@/components/landing/Reasons";
import { SkyPins } from "@/components/landing/SkyPins";
import { Split } from "@/components/landing/Split";
import { Concept, Darker, Quote } from "@/components/landing/Story";

export default function Home() {
  return (
    <>
      <Preloader />
      <Chrome />
      <main className="relative">
        <Hero />
        <Moonrise />
        <Reasons />
        <Quote />
        <Concept />
        <Darker />
        <Horizon />
        <SkyPins />
        <Features />
        <Principles />
        <Split />
        <PlanisphereChapter />
        <Credits />
      </main>
      <Footer />
      {/* last, so every section has registered its own scroll work first */}
      <LunaMotion />
    </>
  );
}
