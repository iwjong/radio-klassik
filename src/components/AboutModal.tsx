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
      className="fixed inset-0 z-40 grid place-items-center animate-fade-in p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="About Radio Klassik"
    >
      <div
        className="panel-modal p-8 w-[min(520px,92vw)] shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[10px] tracking-[0.3em] text-gold-400/80 uppercase">
          About
        </div>
        <h2 className="font-display text-3xl text-white mt-1">Radio Klassik</h2>
        <p className="text-white/75 text-sm leading-relaxed mt-4">
          A classical radio station explorer, built by a designer who loves
          classical music.
        </p>
        <ul className="mt-5 space-y-2.5 text-sm">
          <li>
            <a
              href="https://www.threads.com/@iwjong"
              target="_blank"
              rel="noreferrer"
              className="text-white/80 underline decoration-white/25 underline-offset-2 hover:text-gold-400 hover:decoration-gold-400/60 break-all"
            >
              https://www.threads.com/@iwjong
            </a>
          </li>
          <li>
            <span className="text-white/45">Bug reports: </span>
            <a
              href="mailto:inwon@freninc.com"
              className="text-white/80 underline decoration-white/25 underline-offset-2 hover:text-gold-400 hover:decoration-gold-400/60"
            >
              inwon@freninc.com
            </a>
          </li>
          <li>
            <a
              href={`${import.meta.env.BASE_URL}quote-generator.html`}
              className="text-white/80 underline decoration-white/25 underline-offset-2 hover:text-gold-400 hover:decoration-gold-400/60"
            >
              Music quote pool (preview & export)
            </a>
          </li>
        </ul>
        <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-white/60">
          <Shortcut k="Space" v="Play / pause" />
          <Shortcut k="← / →" v="Prev / next" />
          <Shortcut k="↑ / ↓" v="Volume" />
          <Shortcut k="M" v="Focus mode" />
          <Shortcut k="/  or  S" v="Search" />
          <Shortcut k="L" v="Library" />
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="btn-primary">
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
