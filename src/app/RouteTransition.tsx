/**
 * Full-screen overlay that fingerspells where you're going.
 * - first visit per session: the hand waves hello, then spells "HI"
 * - every page change: opens from the click point, spells the destination's
 *   word (routeGate.signFor) while the root loader holds the swap,
 *   then closes over the new page.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigation } from "react-router-dom";
import { LetterTiles, SignHands, cleanWord } from "@/components/brand/SignHands";
import { applyPose, spell } from "@/lib/fingerspell";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { LETTER_MS, shouldSpell, signFor } from "./routeGate";

type Phase = "idle" | "in" | "out";
const INTRO_KEY = "parlance-intro-seen";

export function RouteTransition() {
  const navigation = useNavigation();
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const hands = useRef<SVGSVGElement>(null);
  const cancel = useRef<() => void>(() => {});
  const point = useRef({ x: "50%", y: "50%" });
  const [phase, setPhase] = useState<Phase>(() => {
    try {
      return sessionStorage.getItem(INTRO_KEY) ? "idle" : "in";
    } catch {
      return "idle";
    }
  });
  const [word, setWord] = useState("HELLO");
  const [active, setActive] = useState(-1);
  const [origin, setOrigin] = useState(point.current);

  // remember where the click happened so the overlay opens from there
  useEffect(() => {
    const onDown = (e: PointerEvent) => (point.current = { x: `${e.clientX}px`, y: `${e.clientY}px` });
    document.addEventListener("pointerdown", onDown, { capture: true });
    return () => document.removeEventListener("pointerdown", onDown, { capture: true });
  }, []);

  const spellWord = (w: string, interval = LETTER_MS) => {
    cancel.current();
    setWord(w);
    setActive(-1);
    cancel.current = spell(hands.current, cleanWord(w), { interval, onLetter: (_l, i) => setActive(i) });
  };

  const close = () => {
    setPhase("out");
    window.setTimeout(() => {
      setPhase((p) => (p === "out" ? "idle" : p));
      cancel.current();
      applyPose(hands.current, "REST");
    }, 600);
  };

  // first-visit intro
  useEffect(() => {
    if (phase !== "in" || word !== "HELLO") return;
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* private mode */
    }
    if (reduced) {
      close();
      return;
    }
    const t1 = window.setTimeout(() => spellWord("HI", 380), 900);
    const t2 = window.setTimeout(close, 1900);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // page changes
  const nextPath = navigation.state === "loading" ? navigation.location.pathname : null;
  const loadingPath = nextPath && shouldSpell(pathname, nextPath) ? nextPath : null;
  const shownFor = useRef<string | null>(null);
  useEffect(() => {
    if (reduced) return;
    if (loadingPath && shownFor.current !== loadingPath) {
      shownFor.current = loadingPath;
      setOrigin(point.current);
      setPhase("in");
      spellWord(signFor(loadingPath));
    } else if (!loadingPath && shownFor.current) {
      shownFor.current = null;
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingPath, reduced]);

  useEffect(() => () => cancel.current(), []);

  return (
    <>
      <div
        className="rt"
        data-phase={phase}
        style={{ "--x": origin.x, "--y": origin.y } as React.CSSProperties}
        aria-hidden
      >
        <div className="rt__stage">
          <SignHands ref={hands} letter="HELLO" size="min(70vw, 320px)" />
          <LetterTiles word={word === "HELLO" ? "" : word} active={active} className="rt__tiles" />
          <p className="rt__caption">
            fingerspelling <span>{word.toLowerCase()}</span>
          </p>
        </div>
      </div>
      <div className="sr-only" role="status" aria-live="polite">
        {phase === "in" && word !== "HELLO" ? `Loading ${word.toLowerCase()}` : ""}
      </div>
    </>
  );
}
