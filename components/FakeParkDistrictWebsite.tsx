"use client";

import { useState } from "react";

export function FakeParkDistrictWebsite() {
  const [open, setOpen] = useState(true);

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="relative overflow-hidden rounded-lg border border-[#d8ddd4] bg-white shadow-soft">
        <div className="flex items-center gap-2 border-b border-[#d8ddd4] bg-[#eef3f0] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d96a5c]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d9ad45]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#6f9f80]" />
          <div className="ml-3 flex-1 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
            meadowridgeparks.gov
          </div>
        </div>

        <div className="relative h-[540px] overflow-hidden bg-white">
          <div className="bg-[#e85145] px-5 py-1.5 text-xs font-bold text-white">
            Weather update: indoor programs running as scheduled
          </div>
          <div className="bg-[#f4c84f] px-5 py-1.5 text-xs font-bold text-[#172421]">
            Lakefront pool closes early Friday for maintenance
          </div>

          <header className="border-b border-[#d8ddd4] bg-white">
            <div className="flex items-center justify-between px-5 py-2.5 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-3">
                <span>f</span>
                <span>ig</span>
                <span>(847) 555-6100</span>
              </div>
              <div className="hidden gap-4 sm:flex">
                <span>Newsroom</span>
                <span>Employment</span>
                <span>Contact</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#d8ddd4] px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#2f7763] text-base font-black text-white">
                  MR
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2f7763]">Meadow Ridge</p>
                  <h2 className="text-2xl font-black leading-none text-[#172421]">Park District</h2>
                </div>
              </div>
              <nav className="hidden gap-4 text-xs font-black uppercase tracking-[0.08em] text-[#172421] lg:flex">
                <span>Ways to Play</span>
                <span>Parks & Facilities</span>
                <span>Information</span>
              </nav>
            </div>

            <div className="grid grid-cols-4 border-t border-[#d8ddd4] text-center text-xs font-black text-[#172421]">
              {["Rainout Line", "Search", "Program Guide", "Registration"].map((item) => (
                <div key={item} className="border-r border-[#d8ddd4] bg-[#f7f4ed] px-2 py-2.5 last:border-r-0">
                  {item}
                </div>
              ))}
            </div>
          </header>

          <section className="grid h-[230px] border-b border-[#d8ddd4] bg-white lg:grid-cols-[.86fr_1.14fr]">
            <div className="flex flex-col justify-center px-6 py-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2f7763]">Summer 2026</p>
              <h3 className="mt-2 text-4xl font-black leading-[0.98] text-[#172421]">
                Summer Programs
                <span className="block text-[#2f7763]">Are Still Available!</span>
              </h3>
              <p className="mt-3 max-w-xs text-sm font-semibold leading-5 text-slate-700">
                Sunshine, splashes, fun, games, camps, concerts, and classes.
              </p>
              <div className="mt-4 w-fit rounded-md bg-[#2f7763] px-4 py-2 text-sm font-bold text-white">
                View programs
              </div>
            </div>

            <div className="relative overflow-hidden bg-[#cfe6ed]">
              <div className="absolute inset-0 bg-[linear-gradient(145deg,#cfe6ed_0%,#eff7f1_42%,#f3d892_100%)]" />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-[#247457]" />
              <div className="absolute bottom-20 left-8 h-16 w-16 rounded-full bg-[#79a875]" />
              <div className="absolute bottom-16 left-24 h-24 w-24 rounded-full bg-[#4f8d68]" />
              <div className="absolute bottom-14 right-16 h-20 w-20 rounded-full bg-[#86b97c]" />
              <div className="absolute bottom-7 left-16 h-14 w-40 rounded-t-full bg-white/90" />
              <div className="absolute right-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black text-[#2f7763] shadow-sm">
                Play Pause
              </div>
            </div>
          </section>

          <div className="grid grid-cols-3 border-b border-[#d8ddd4] bg-[#2f7763] text-center text-xs font-black uppercase tracking-[0.12em] text-white">
            {["Upcoming Events", "Bulletin Board", "Get Outdoors"].map((tab) => (
              <div key={tab} className="border-r border-white/20 px-2 py-3 last:border-r-0">
                {tab}
              </div>
            ))}
          </div>

          <section className="grid lg:grid-cols-[1fr_220px]">
            <div className="bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-[#172421]">Upcoming Events</h3>
                <span className="rounded-full border border-[#d8ddd4] px-3 py-1 text-xs font-bold text-[#2f7763]">
                  See Full Calendar
                </span>
              </div>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {[
                  ["Jul 15", "Sounds of Summer - Imaginary Band", "10:00 am", "Mallinckrodt Park"],
                  ["Jul 16", "Green Team Park Workday", "9:00 am", "North Garden"],
                  ["Jul 17", "Ageless Grace Pop-Up Class", "11:30 am", "Community Center"],
                  ["Jul 21", "Early Fall Programs Posted", "Online", "Registration portal"]
                ].map(([date, title, time, place]) => (
                  <div key={title} className="rounded-md border border-[#d8ddd4] bg-[#fbfaf6] p-2.5">
                    <div className="flex gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-[#dcebf1] text-center text-[11px] font-black leading-4 text-[#172421]">
                        {date}
                      </div>
                      <div>
                        <p className="text-xs font-black leading-5 text-[#172421]">{title}</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-600">{time}</p>
                        <p className="text-[11px] font-semibold text-slate-600">{place}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="hidden border-l border-[#d8ddd4] bg-[#f7f4ed] p-4 lg:block">
              <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#172421]">Show me all</h3>
              <div className="mt-3 space-y-2">
                {["Pool Schedules", "Outdoor Concerts", "Tennis & Pickleball", "Picnic Shelter Rentals"].map((link) => (
                  <div key={link} className="rounded-md bg-white px-3 py-2 text-xs font-bold text-[#2f7763]">
                    {link}
                  </div>
                ))}
              </div>
            </aside>
          </section>

          {open ? (
            <div className="absolute bottom-20 right-5 z-10 w-[min(310px,calc(100%-40px))] overflow-hidden rounded-lg border border-[#cbd4cb] bg-white shadow-soft">
              <div className="flex items-start justify-between gap-3 bg-[#2f7763] px-4 py-3 text-white">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#dcebf1]">Harvello Assistant</p>
                  <h3 className="text-base font-bold">Resident Assistant</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close resident assistant"
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-lg leading-none text-white hover:bg-white/25"
                >
                  x
                </button>
              </div>
              <div className="space-y-2.5 p-3">
                <div className="rounded-md bg-[#f7f4ed] p-2.5 text-xs leading-5 text-[#172421]">
                  Hi, I can help with information from this park district website.
                </div>
                <div className="ml-auto rounded-md bg-[#2f7763] p-2.5 text-xs leading-5 text-white">
                  What time are the kids concerts?
                </div>
                <div className="rounded-md bg-[#f7f4ed] p-2.5 text-xs leading-5 text-[#172421]">
                  Kids concerts are listed for Wednesday mornings. I can show the event pages used for the answer.
                </div>
                <div className="border-t border-[#d8ddd4] pt-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Sources</p>
                  <p className="mt-1.5 text-[11px] font-bold leading-5 text-[#2f7763]">Sounds of Summer event page</p>
                  <p className="text-[11px] font-bold leading-5 text-[#2f7763]">Program calendar</p>
                </div>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Close resident assistant" : "Open resident assistant"}
            className="absolute bottom-5 right-5 z-20 grid h-12 w-12 place-items-center rounded-full bg-[#2f7763] text-white shadow-soft transition hover:bg-[#172421] focus:outline-none focus:ring-4 focus:ring-[#6f9f80]/30"
          >
            {open ? (
              <span className="text-xl leading-none">x</span>
            ) : (
              <span className="relative h-6 w-7 rounded-lg bg-white text-[#2f7763]">
                <span className="absolute left-1.5 top-2 h-1.5 w-1.5 rounded-full bg-[#2f7763]" />
                <span className="absolute right-1.5 top-2 h-1.5 w-1.5 rounded-full bg-[#2f7763]" />
                <span className="absolute bottom-1 left-2.5 h-1 w-2 rounded-full bg-[#2f7763]" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
