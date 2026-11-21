/**
 * Landing sections from the warm-paper redesign: a hero whose hands
 * fingerspell greetings, a phrase marquee, three-step how-it-works cards,
 * "spell your name", phrase posters and the two directions.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, AudioLines, Camera } from "lucide-react";
import { LetterTiles, SignHands, cleanWord, useFingerspell } from "@/components/brand/SignHands";
import { applyPose, spell } from "@/lib/fingerspell";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Reveal } from "./Reveal";
import "./landing.css";

/* ------------------------------------------------------------------ hero -- */

const GREETINGS: [word: string, said: string][] = [
  ["NAMASTE", "namaste"],
  ["HI", "hi!"],
  ["THANKS", "thanks"],
];

export function HandsHero() {
  const reduced = useReducedMotion();
  const hands = useRef<SVGSVGElement>(null);
  const [round, setRound] = useState(0);
  const [active, setActive] = useState(-1);
  const [letter, setLetter] = useState("–");
  const [confidence, setConfidence] = useState(0.9);
  const [said, setSaid] = useState("namaste");
  const [word, spoken] = GREETINGS[round % GREETINGS.length]!;

  useEffect(() => {
    if (reduced) return;
    let next: number | undefined;
    let cancel = () => {};
    const start = window.setTimeout(() => {
      cancel = spell(hands.current, word, {
        interval: 640,
        onLetter: (l, i) => {
          setActive(i);
          if (l) {
            setLetter(l);
            setConfidence(0.82 + Math.random() * 0.17);
          }
        },
        onDone: () => {
          setSaid(spoken);
          next = window.setTimeout(() => {
            applyPose(hands.current, "REST");
            setActive(-1);
            window.setTimeout(() => setRound((r) => r + 1), 500);
          }, 1300);
        },
      });
    }, round === 0 ? 900 : 0);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(next);
      cancel();
    };
  }, [round, word, spoken, reduced]);

  return (
    <section className="hs-hero container-wide" aria-labelledby="hero-title">
      <div className="hs-hero__copy">
        <Reveal>
          <span className="hs-chip">
            <span className="hs-dot" /> Live interpreter · Indian Sign Language
          </span>
        </Reveal>
        <h1 id="hero-title" className="hs-hero__title">
          <Reveal as="span" delay={90} className="block">
            Hands talk.
          </Reveal>
          <Reveal as="span" delay={180} className="block">
            <em>We listen.</em>
          </Reveal>
        </h1>
        <Reveal delay={270}>
          <p className="hs-lede">
            Sign to your camera and Parlance turns ISL into words and speech. Speak or type in English or Hindi, and
            the signer answers in ISL.
          </p>
        </Reveal>
        <Reveal delay={360} className="hs-actions">
          <Link to="/app/speech-to-sign" className="hs-btn">
            <AudioLines className="size-[1.1rem]" aria-hidden /> Speech <span aria-hidden>→</span>
            <span className="sr-only">to</span> Sign
          </Link>
          <Link to="/app/sign-to-text" className="hs-btn hs-btn--ghost">
            <Camera className="size-[1.1rem]" aria-hidden /> Sign <span aria-hidden>→</span>
            <span className="sr-only">to</span> Text
          </Link>
        </Reveal>
        <Reveal delay={450}>
          <dl className="hs-stats">
            <div>
              <dt>ISL</dt>
              <dd>Indian Sign Language</dd>
            </div>
            <div>
              <dt>2</dt>
              <dd>ways: sign ⇄ speech</dd>
            </div>
            <div>
              <dt>EN · HI</dt>
              <dd>English and Hindi</dd>
            </div>
          </dl>
        </Reveal>
      </div>

      <div className="hs-hero__art" aria-hidden>
        <div className="hs-disc" />
        <div className="hs-hero__hands">
          <SignHands ref={hands} letter="HELLO" size="clamp(240px, 30vw, 380px)" />
        </div>
        <LetterTiles word={word} active={active} className="hs-hero__tiles" />
        <div className="hs-float hs-float--a">
          <span className="hs-mono">detected</span>
          <strong>{letter}</strong>
          <span className="hs-bar">
            <i style={{ width: `${confidence * 100}%` }} />
          </span>
        </div>
        <div className="hs-float hs-float--b">
          <svg viewBox="0 0 24 24" className="hs-speaker">
            <path d="M4 9v6h4l5 4V5L8 9H4z" />
            <path className="w1" d="M16 9a4 4 0 0 1 0 6" />
            <path className="w2" d="M18.5 6.5a8 8 0 0 1 0 11" />
          </svg>
          <span>“{said}”</span>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- marquee -- */

const PHRASES = ["namaste", "thank you", "nice to meet you", "chai or coffee?", "say it again?", "see you soon", "kaise ho?"];
const MARQUEE_LETTERS = ["H", "A", "X", "V", "W", "B", "Y"];

export function PhraseMarquee() {
  return (
    <section className="hs-marquee" aria-label="Everyday phrases">
      <div className="hs-marquee__track">
        {[0, 1].map((dup) => (
          <div key={dup} className="hs-marquee__group" aria-hidden={dup === 1 || undefined}>
            {PHRASES.map((p, i) => (
              <span key={p} className="hs-marquee__item">
                <span className="hs-marquee__word">{p}</span>
                <SignHands
                  letter={MARQUEE_LETTERS[i % MARQUEE_LETTERS.length]}
                  size="72px"
                  fill="var(--color-navy)"
                  ink="var(--color-paper)"
                  sleeve="var(--color-tomato-400)"
                />
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- how it works -- */

const LANDMARKS: [number, number][] = [
  [100, 222], [58, 184], [83, 168], [66, 132], [54, 87], [42, 41], [89, 128], [101, 77], [112, 27], [112, 131], [112, 106], [134, 140], [134, 121],
];

export function HowItWorksCards() {
  return (
    <section id="how-it-works" className="hs-section container-wide" aria-labelledby="how-title">
      <header className="hs-head">
        <Reveal>
          <p className="hs-eyebrow">How it works</p>
        </Reveal>
        <Reveal delay={90}>
          <h2 id="how-title" className="hs-h2">
            Three steps. <em>No gloves.</em>
          </h2>
        </Reveal>
      </header>
      <div className="hs-cards">
        <Reveal className="hs-card" delay={0}>
          <div className="hs-card__in" style={{ "--bg": "var(--color-royal)", "--fg": "#fffaf2", "--tilt": "-4deg" } as React.CSSProperties}>
            <span className="hs-card__num">01</span>
            <div className="hs-card__art">
              <svg className="hs-viewfinder" viewBox="0 0 200 200" aria-hidden>
                <path d="M20 60 V30 a10 10 0 0 1 10-10 H60 M140 20 H170 a10 10 0 0 1 10 10 V60 M180 140 V170 a10 10 0 0 1-10 10 H140 M60 180 H30 a10 10 0 0 1-10-10 V140" />
              </svg>
              <SignHands letter="FLAT" crop size="110px" sleeve="var(--color-gold)" />
            </div>
            <h3>Show</h3>
            <p>Hold your hands up to the camera. Good light and a plain background help most.</p>
          </div>
        </Reveal>
        <Reveal className="hs-card" delay={90}>
          <div className="hs-card__in" style={{ "--bg": "var(--color-gold)", "--fg": "var(--color-navy)", "--tilt": "2deg" } as React.CSSProperties}>
            <span className="hs-card__num">02</span>
            <div className="hs-card__art">
              <SignHands letter="V2" crop size="110px" sleeve="var(--color-tomato-400)" />
              <svg className="hs-landmarks" viewBox="0 0 200 270" aria-hidden>
                <path d="M100 222 L58 184 L83 168 M100 222 L66 132 L54 87 L42 41 M66 132 L89 128 L112 131 L134 140 L100 222 M89 128 L101 77 L112 27 M112 131 L112 106 M134 140 L134 121" />
                {LANDMARKS.map(([x, y]) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r="5" />
                ))}
              </svg>
            </div>
            <h3>Read</h3>
            <p>Hand and body landmarks are tracked in your browser, frame by frame, and matched to signs.</p>
          </div>
        </Reveal>
        <Reveal className="hs-card" delay={180}>
          <div className="hs-card__in" style={{ "--bg": "var(--color-tomato-400)", "--fg": "#fffaf2", "--tilt": "-1.5deg" } as React.CSSProperties}>
            <span className="hs-card__num">03</span>
            <div className="hs-card__art">
              <svg className="hs-bubble" viewBox="0 0 220 160" aria-hidden>
                <path d="M30 20 H190 a20 20 0 0 1 20 20 V96 a20 20 0 0 1-20 20 H92 L58 146 L64 116 H30 a20 20 0 0 1-20-20 V40 a20 20 0 0 1 20-20z" />
                <text x="110" y="80" textAnchor="middle">
                  hi there!
                </text>
              </svg>
            </div>
            <h3>Say</h3>
            <p>Words land on screen as you sign. Tap once and they’re spoken aloud; reply by voice and the signer answers.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- spell your name -- */

const QUICK = ["Aarav", "Priya", "Meera", "Kabir"];

export function SpellYourName() {
  const hands = useRef<SVGSVGElement>(null);
  const { ref, inView } = useInView<HTMLDivElement>();
  const [value, setValue] = useState("Namaste");
  const [word, setWord] = useState("");
  const [run, setRun] = useState(0);
  const active = useFingerspell(hands, word, { run, interval: 560 });

  useEffect(() => {
    if (inView && !word) {
      setWord(value);
      setRun(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const go = (name: string) => {
    setWord(name);
    setRun((r) => r + 1);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    go(value);
  };

  return (
    <section id="try-it" className="hs-section container-wide" aria-labelledby="try-title">
      <Reveal>
        <div className="hs-try" ref={ref}>
          <div className="hs-try__copy">
            <p className="hs-eyebrow">Try it right here</p>
            <h2 id="try-title" className="hs-h2">
              Spell your <em>name.</em>
            </h2>
            <p className="hs-lede">Type anything and watch it fingerspelled in ISL, one letter at a time.</p>
            <form className="hs-try__form" onSubmit={submit}>
              <label className="sr-only" htmlFor="try-name">
                Your name
              </label>
              <input
                id="try-name"
                value={value}
                maxLength={18}
                autoComplete="off"
                placeholder="Your name"
                onChange={(e) => setValue(e.target.value)}
              />
              <button className="hs-btn" type="submit">
                Spell it <ArrowRight className="size-4" aria-hidden />
              </button>
            </form>
            <div className="hs-try__quick">
              <span className="text-ink-3">or try</span>
              {QUICK.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="hs-chip hs-chip--btn"
                  onClick={() => {
                    setValue(n);
                    go(n);
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="hs-try__stage">
            <div className="hs-try__hands">
              <div className="hs-ring" aria-hidden />
              <SignHands ref={hands} letter="REST" size="clamp(240px, 32vw, 340px)" sleeve="var(--color-tomato-400)" />
            </div>
            <div aria-live="polite" className="sr-only">
              {word ? `Fingerspelling ${cleanWord(word).toLowerCase()}` : ""}
            </div>
            <LetterTiles word={word} active={active} className="hs-try__tiles" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* --------------------------------------------------------------- posters -- */

const POSTERS = [
  { bg: "var(--color-tomato-400)", fg: "#fffaf2", lines: ["Chai", "or", "coffee?"], hands: ["C", "C"], sleeve: "var(--color-gold)" },
  { bg: "var(--color-gold)", fg: "var(--color-navy)", lines: ["Nice to", "meet", "you"], hands: ["N", "M", "Y"], sleeve: "var(--color-royal)" },
  { bg: "var(--color-royal)", fg: "#fffaf2", lines: ["Say it", "again?"], hands: ["S", "A"], sleeve: "var(--color-tomato-400)" },
];

export function PhrasePosters() {
  return (
    <section className="hs-section container-wide" aria-labelledby="posters-title">
      <header className="hs-head hs-head--row">
        <div>
          <Reveal>
            <p className="hs-eyebrow">Everyday phrases</p>
          </Reveal>
          <Reveal delay={90}>
            <h2 id="posters-title" className="hs-h2">
              Small talk, <em>big hands.</em>
            </h2>
          </Reveal>
        </div>
        <Reveal delay={180}>
          <p className="hs-lede">Every word starts with a shape. These are the first letters, fingerspelled in ISL.</p>
        </Reveal>
      </header>
      <div className="hs-posters">
        {POSTERS.map((p, k) => (
          <Reveal key={p.lines.join(" ")} delay={k * 90}>
            <article className="hs-poster" style={{ "--bg": p.bg, "--fg": p.fg } as React.CSSProperties}>
              <div className="hs-poster__words">
                {p.lines.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </div>
              <div className="hs-poster__hands">
                {p.hands.map((h, j) => (
                  <figure key={`${h}${j}`} style={{ "--j": j } as React.CSSProperties}>
                    <SignHands letter={h} size="110px" sleeve={p.sleeve} />
                    <figcaption>{h}</figcaption>
                  </figure>
                ))}
              </div>
              <span className="hs-mono">Parlance · {String(k + 1).padStart(2, "0")}</span>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ two ways --- */

export function TwoWays() {
  const cycle = useRef<SVGSVGElement>(null);
  useFingerspell(cycle, "SEE YOU SOON", { interval: 900, loop: true, pause: 900 });
  return (
    <section className="hs-section container-wide" aria-labelledby="two-title">
      <header className="hs-head">
        <Reveal>
          <p className="hs-eyebrow">Both directions</p>
        </Reveal>
        <Reveal delay={90}>
          <h2 id="two-title" className="hs-h2">
            Sign to text. <em>Speech to sign.</em>
          </h2>
        </Reveal>
      </header>
      <div className="hs-two">
        <Reveal>
          <Link to="/app/sign-to-text" className="hs-mock">
            <div className="hs-mock__top">
              <span />
              <span />
              <span />
              <b className="hs-mono">sign → text</b>
            </div>
            <div className="hs-mock__body">
              <div className="hs-mock__cam">
                <SignHands letter="Y" size="160px" sleeve="var(--color-gold)" />
                <span className="hs-mock__scan" />
              </div>
              <div className="hs-mock__out">
                <span className="hs-mono text-ink-3">transcript</span>
                <p>
                  nice to meet <em>y</em>
                  <span className="hs-caret" />
                </p>
                <span className="hs-mock__go">
                  Open Sign → Text <ArrowRight className="size-4" aria-hidden />
                </span>
              </div>
            </div>
          </Link>
        </Reveal>
        <Reveal delay={90}>
          <Link to="/app/speech-to-sign" className="hs-mock">
            <div className="hs-mock__top">
              <span />
              <span />
              <span />
              <b className="hs-mono">speech → sign</b>
            </div>
            <div className="hs-mock__body">
              <div className="hs-mock__out">
                <span className="hs-mono text-ink-3">you said</span>
                <p>see you soon</p>
                <span className="hs-mock__go">
                  Open Speech → Sign <ArrowRight className="size-4" aria-hidden />
                </span>
              </div>
              <div className="hs-mock__cam hs-mock__cam--sun">
                <SignHands ref={cycle} letter="S" size="160px" sleeve="var(--color-tomato-400)" />
              </div>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
