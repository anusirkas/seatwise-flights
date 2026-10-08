import { useEffect, useRef, useState } from "react";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const STEP_MS = 45;

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Text that clatters into place like an old Solari departure board: each letter spins through
 * random characters and settles a little after the one before it. It waits until it scrolls
 * into view, so rows further down the board flip as you reach them.
 */
export default function SplitFlap({ text, delay = 0, className = "" }: { text: string; delay?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(() => (reducedMotion() ? text : text.replace(/\S/g, " ")));

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const chars = [...text];
    // each letter settles a few steps after the previous one
    const settleAt = chars.map((_, i) => 4 + i * 2 + Math.floor(Math.random() * 4));
    let step = 0;
    let timer = 0;
    let start = 0;

    const run = () => {
      start = window.setTimeout(() => {
        timer = window.setInterval(() => {
          step++;
          setShown(
            chars
              .map((ch, i) => (ch === " " || step >= settleAt[i] ? ch : CHARSET[Math.floor(Math.random() * CHARSET.length)]))
              .join(""),
          );
          if (step >= Math.max(...settleAt)) window.clearInterval(timer);
        }, STEP_MS);
      }, delay);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.9 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [text, delay]);

  return (
    <span ref={ref} className={`flap ${className}`} aria-label={text}>
      {[...shown].map((ch, i) => (
        <span key={i} className={ch === " " ? "flap-gap" : "flap-tile"} aria-hidden="true">
          {ch}
        </span>
      ))}
    </span>
  );
}
