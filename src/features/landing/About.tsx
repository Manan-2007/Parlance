import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FlaskConical, Languages, Minus, Plus, ShieldCheck } from "lucide-react";
import { SectionIndex } from "@/components/brand/Arcs";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

/** From the team's submission deck. Add roles or links here when they are ready. */
const TEAM = [
  { slot: "M1", name: "Manan Kochhar" },
  { slot: "M2", name: "Bhavika Bakshi" },
  { slot: "M3", name: "Maulik Sharma" },
  { slot: "M4", name: "Khushi" },
  { slot: "M5", name: "Jaisgurnoor" },
];

const BELIEF_ICONS = [Languages, FlaskConical, ShieldCheck];

const BELIEFS = [
  ["ISL first", "English and Hindi messages are converted to a sequence of ISL gloss tokens."],
  ["Measured, not assumed", "The camera service reports acceptance and confidence. The avatar signs still need linguistic review."],
  ["Private by default", "History stays in your browser. Optional online translation sends the submitted message to Parlance's server."],
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0]![0]! + parts[parts.length - 1]![0]! : name.slice(0, 2)).toUpperCase();
}

export function About() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <section id="about" aria-labelledby="about-title" className="relative scroll-mt-20 overflow-hidden bg-paper-50 py-24 sm:py-32">
      <div className="container-wide relative">
        <Reveal>
          <SectionIndex index="04" label="About us" />
          <h2 id="about-title" className="sr-only">
            About Parlance
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-x-10">
          <Reveal className="lg:col-span-8">
            <p className="text-[1.625rem] leading-[1.25] font-semibold tracking-[-0.03em] text-navy sm:text-[2.25rem] sm:leading-[1.2]">
              Parlance pairs the original Parlance interface with a 3D signer. The project is built around one idea:{" "}
              <span className="box-decoration-clone bg-[linear-gradient(transparent_62%,var(--color-sun-100)_62%,var(--color-sun-100)_94%,transparent_94%)]">
                two people should be able to take turns on the same screen
              </span>
              , each in
              their own language, without waiting for help to arrive.
            </p>
            <p className="mt-8 max-w-[60ch] text-[1.0625rem] leading-[1.7] text-ink-2">
              It is a hackathon project with a serious purpose. We would rather Parlance do a few things reliably than
              many things unreliably, so every screen is designed to make it clear what the system knows, what it is
              unsure of, and what it cannot do yet.
            </p>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-4">
            <ul className="grid gap-3">
              {BELIEFS.map(([title, body], i) => {
                const Icon = BELIEF_ICONS[i]!;
                return (
                  <li key={title} className="flex gap-4 rounded-[1.5rem] border border-line bg-surface p-5">
                    <span
                      className={cn(
                        "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
                        ["bg-tangerine-50 text-tangerine-800", "bg-sun-100 text-sun-800", "bg-forest-50 text-forest-800"][i],
                      )}
                      aria-hidden
                    >
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold tracking-[-0.015em]">{title}</h3>
                      <p className="mt-1.5 text-[0.9375rem] leading-6 text-ink-2">{body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>

        {/* The people: the wireframe's "About Us" reveal */}
        <div className="mt-16 rounded-[2rem] border border-line bg-surface px-5 sm:mt-20 sm:px-8">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
            className="group flex w-full items-center justify-between gap-6 py-7 text-left"
          >
            <span>
              <span className="block text-[1.625rem] leading-tight font-bold tracking-[-0.03em] text-navy sm:text-[2.125rem]">
                The people who built it
              </span>
              <span className="mt-1 block text-[0.9375rem] text-ink-3">Team APX_GP · The Builder&rsquo;s Theory 1.0</span>
            </span>
            <span
              className={cn(
                "inline-flex size-12 shrink-0 items-center justify-center rounded-full border transition-colors",
                open ? "border-navy bg-navy text-white" : "border-line-strong bg-surface text-navy group-hover:border-navy/40",
              )}
              aria-hidden
            >
              {open ? <Minus className="size-5" /> : <Plus className="size-5" />}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                id={panelId}
                role="region"
                aria-label="The people who built Parlance"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <ol className="pb-4">
                  {TEAM.map((member, i) => (
                    <motion.li
                      key={member.slot}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-t border-line py-5 sm:grid-cols-[4rem_3.5rem_1fr_auto] sm:gap-6"
                    >
                      <span className="text-sm font-semibold text-ink-3 tabular-nums">{member.slot}</span>
                      <span
                        aria-hidden
                        className={cn(
                          "hidden size-12 items-center justify-center rounded-full text-sm font-semibold sm:inline-flex",
                          ["bg-cobalt-50 text-cobalt-800", "bg-sun-100 text-sun-800", "bg-tangerine-50 text-tangerine-800", "bg-forest-50 text-forest-800", "bg-paper-2 text-navy"][i],
                        )}
                      >
                        {initials(member.name)}
                      </span>
                      <span className="text-[1.25rem] leading-tight font-semibold tracking-[-0.02em] text-navy sm:text-[1.5rem]">
                        {member.name}
                      </span>
                      <span className="text-sm text-ink-3">Team APX_GP</span>
                    </motion.li>
                  ))}
                </ol>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
