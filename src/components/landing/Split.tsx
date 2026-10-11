/* eslint-disable @next/next/no-img-element */
import { CircleButton, VineB } from "./primitives";

/** The ember panel: everything Luna does to get your eyes off the glass. */
export function Split() {
  return (
    <section className="relative grid grid-cols-12 bg-paper text-ink max-lg:grid-cols-1">
      <div data-bg="ember" className="relative col-span-5 min-h-[120vh] overflow-hidden bg-ember text-star max-lg:col-span-1 max-lg:min-h-[90vh]">
        <div data-drift="50" className="pointer-events-none absolute -right-[10vw] -top-[4vw] z-10 w-[30vw] max-lg:w-[60vw]">
          <VineB tone="dark" className="h-auto w-full" />
        </div>
        <div className="absolute left-1/2 top-[18vh] aspect-[3/4] w-[58%] -translate-x-1/2 overflow-hidden" data-parallax="w" data-reveal="ctn">
          <img src="/art/tent-stars.webp" alt="A lit tent beneath the Milky Way" data-parallax="img" data-amount="9" className="absolute inset-0 h-[118%] w-full -translate-y-[8%] object-cover" />
        </div>
        <div className="absolute bottom-[8vh] left-[calc(var(--gutter)+130px)] max-lg:left-6" data-reveal-group>
          <p data-reveal="ctn" className="t-label mb-3 text-star/60">In pocket mode</p>
          <ul className="t-label grid gap-1.5" data-reveal="ctn">
            <li>· The screen goes black</li>
            <li>· Answers are spoken</li>
            <li>· Red light only</li>
          </ul>
        </div>
      </div>

      <div data-bg="light" className="relative col-span-7 flex flex-col justify-center gap-[6vh] px-[6vw] py-[20vh] max-lg:col-span-1 max-lg:px-6 max-lg:py-[14vh]" data-reveal-group>
        <div className="absolute right-0 top-[16vh] aspect-[16/10] w-[38%] overflow-hidden max-lg:hidden" data-parallax="w">
          <img src="/art/lake-dusk.webp" alt="" data-parallax="img" data-amount="8" className="absolute inset-0 h-[116%] w-full -translate-y-[7%] object-cover" />
        </div>
        <h2 data-reveal="h" className="t-display t-h5 mt-[30vh] max-w-[20ch] max-lg:mt-0">
          Every detail is there so you look at the sky, not the screen
        </h2>
        <p data-reveal="p" className="t-body max-w-[42ch] text-ink/70">
          A red-light screen that protects the twenty minutes your eyes need to adjust to the dark. Answers spoken aloud, so the phone can stay in your pocket. Tonight&rsquo;s sky as a lock screen you read without unlocking.
        </p>
        <div data-reveal="ctn">
          <CircleButton href="/get" size={150}>Get Luna tonight</CircleButton>
        </div>
      </div>
    </section>
  );
}
