import { SkyProvider } from "@/lib/sky-context";
import { SkyBackdrop } from "@/components/SkyBackdrop";
import { Intro } from "@/components/Intro";
import { Nav } from "@/components/Nav";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Hero } from "@/components/sections/Hero";
import { Story } from "@/components/sections/Story";
import { Offline } from "@/components/sections/Offline";
import { Tonight } from "@/components/sections/Tonight";
import { Places } from "@/components/sections/Places";
import { Yours } from "@/components/sections/Yours";
import { AnyNight } from "@/components/sections/AnyNight";
import { Planisphere } from "@/components/sections/Planisphere";
import { Dawn } from "@/components/sections/Dawn";

export default function Home() {
  return (
    <SkyProvider>
      <Intro />
      <SmoothScroll />
      <SkyBackdrop />
      <div className="grain" aria-hidden />
      <Nav />
      <main className="relative z-10 overflow-x-clip">
        <Hero />
        <Story />
        <Offline />
        <Tonight />
        <Places />
        <Yours />
        <AnyNight />
        <Planisphere />
        <Dawn />
      </main>
    </SkyProvider>
  );
}
