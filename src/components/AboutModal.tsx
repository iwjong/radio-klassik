import { useEffect } from "react";

interface Props {
  onClose: () => void;
}

export function AboutModal({ onClose }: Props) {
  useEffect(() => {
    const previousFocus = document.activeElement;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-[3px] grid place-items-center animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="About Radio Klassik"
    >
      <div
        className="glass-strong rounded-lg p-8 w-[min(520px,92vw)] shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[10px] tracking-[0.3em] text-gold-400/80 uppercase">
          About
        </div>
        <h2 className="font-display text-3xl text-white mt-1">
          Radio Klassik
        </h2>
        <p className="text-white/70 text-sm leading-relaxed mt-4">
          Spin the world and tune into classical music broadcasters
          everywhere — from Mozart at dawn in Vienna to late-night
          chamber music in Tokyo. Built as an homage to{" "}
          <a
            href="https://radio.garden/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-gold-400"
          >
            radio.garden
          </a>
          , dedicated entirely to the classical canon.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-white/60">
          <Shortcut k="Space" v="Play / pause" />
          <Shortcut k="← / →" v="Prev / next" />
          <Shortcut k="↑ / ↓" v="Volume" />
          <Shortcut k="F" v="Favorite" />
          <Shortcut k="/  or  S" v="Search" />
          <Shortcut k="L" v="Library" />
        </div>
        <p className="text-white/40 text-[11px] mt-6">
          Stations are sourced live from{" "}
          <a
            href="https://www.radio-browser.info/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-gold-400"
          >
            Radio Browser
          </a>{" "}
          and curated by tag. Streams are served directly from each
          broadcaster — please respect their terms.
        </p>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Shortcut({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-md bg-white/[0.03] border border-white/[0.04]">
      <kbd className="font-mono text-[11px] text-white/80">{k}</kbd>
      <span>{v}</span>
    </div>
  );
}
