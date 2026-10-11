/* eslint-disable @next/next/no-img-element */
import { Mark, QuoteMark, VineA, VineB } from "./primitives";

/** Full-bleed night with a line from 1868. Public domain; the poem is quoted, not paraphrased. */
export function Quote() {
  return (
    <section data-bg="dark" className="relative h-[110vh] overflow-hidden bg-night text-star max-lg:h-[90vh]" data-parallax="w">
      <img src="/art/ridge-milkyway.webp" alt="The Milky Way rising over Himalayan ridges, a lit tent below" data-parallax="img" data-amount="10" className="absolute inset-0 h-[120%] w-full -translate-y-[8%] object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/45" />
      <figure className="absolute left-[50%] top-1/2 w-[34vw] -translate-y-1/2 max-lg:left-6 max-lg:right-6 max-lg:top-auto max-lg:bottom-[10vh] max-lg:w-auto max-lg:translate-y-0" data-reveal-group>
        <span data-reveal="ctn" className="mb-6 block text-star/80"><QuoteMark size={30} /></span>
        <blockquote data-reveal="p" className="t-display t-h6 max-lg:!text-[7vw]">
          Though my soul may set in darkness, it will rise in perfect light; I have loved the stars too fondly to be fearful of the night.
        </blockquote>
        <figcaption data-reveal="ctn" className="mt-8 flex flex-col gap-1">
          <span className="t-label">Sarah Williams</span>
          <span className="t-label text-star/60">The Old Astronomer, 1868</span>
        </figcaption>
      </figure>
    </section>
  );
}

/** What Luna is, said once, plainly, between moonflowers. */
export function Concept() {
  return (
    <section data-bg="light" className="relative overflow-hidden bg-paper pb-[18vh] pt-[24vh] text-ink max-lg:pt-[22vh]">
      <div data-drift="70" className="pointer-events-none absolute -left-[6vw] top-[16vh] w-[30vw] max-lg:-left-[14vw] max-lg:-top-[4vh] max-lg:w-[40vw] max-lg:opacity-70">
        <VineA className="h-auto w-full" />
      </div>
      <div data-drift="-60" className="pointer-events-none absolute -bottom-[8vw] -right-[6vw] w-[36vw] max-lg:w-[64vw]">
        <VineB className="h-auto w-full" />
      </div>
      <div className="gut relative mx-auto flex max-w-[78vw] flex-col items-center text-center max-lg:max-w-none" data-reveal-group>
        <h2 data-reveal="h" className="t-display t-statement">
          Luna is a night-sky guide that runs on an open model inside your phone, so it keeps working where the signal ends and the dark begins
        </h2>
        <p data-reveal="p" className="t-body mt-[6vh] max-w-[34ch] text-ink/70">
          Made for city terraces and mountain passes alike. Luna names what is above you, tells you when the sky is darkest, and then asks you to put the phone away.
        </p>
        <span data-reveal="ctn" className="mt-[7vh] block"><Mark size={34} /></span>
      </div>
    </section>
  );
}

/** Three staggered words and a city terrace: you can see more than you think. */
export function Darker() {
  return (
    <section data-bg="light" className="relative overflow-hidden bg-paper pb-[20vh] text-ink">
      <div className="gut grid grid-cols-12 items-center gap-4 max-lg:grid-cols-1">
        <div className="relative col-span-7 col-start-2 max-lg:col-span-1 max-lg:col-start-1" data-reveal-group>
          <h2 className="t-display text-[13vw] leading-[0.84] max-lg:text-[21vw]">
            <span data-reveal="h" className="block pl-[8vw] max-lg:pl-0">Darker</span>
            <span data-reveal="h" className="block pl-[22vw] max-lg:pl-[12vw]">than you</span>
            <span data-reveal="h" className="block pl-[2vw] max-lg:pl-[4vw]">think</span>
          </h2>
          <p data-reveal="ctn" className="t-label absolute left-0 top-[44%] tracking-[0.6em] max-lg:static max-lg:mt-6">From your roof</p>
          <p data-reveal="p" className="t-body ml-[22vw] mt-[6vh] max-w-[36ch] text-ink/70 max-lg:ml-0">
            Most of us live under orange skies and assume the stars are gone. They are not. Jupiter, Sirius and Orion&rsquo;s belt cut through almost any city glow, and Luna starts with the ones your sky can actually show.
          </p>
        </div>
        <div className="col-span-4 col-start-9 max-lg:col-span-1 max-lg:col-start-1 max-lg:mt-10">
          <div className="relative aspect-[3/4] overflow-hidden bg-ink" data-parallax="w" data-reveal="ctn">
            <img src="/art/rooftop-city.webp" alt="A city terrace at night, water tanks and string lights, a few bright stars above" data-parallax="img" data-amount="8" className="absolute inset-0 h-[116%] w-full -translate-y-[7%] object-cover" />
          </div>
          <p className="t-label mt-4 text-ink/55">Bortle 8 · a city terrace · still worth it</p>
        </div>
      </div>
    </section>
  );
}
