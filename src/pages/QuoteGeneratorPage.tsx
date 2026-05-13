import { useCallback, useMemo, useState } from "react";
import {
  MUSIC_QUOTES,
  formatMusicQuote,
  pickRandomMusicQuote,
  type MusicQuote,
} from "../lib/musicQuotes";

export function QuoteGeneratorPage() {
  const [current, setCurrent] = useState<MusicQuote>(() => pickRandomMusicQuote());
  const [copied, setCopied] = useState<string | null>(null);

  const formatted = useMemo(() => formatMusicQuote(current), [current]);

  const shuffle = useCallback(() => {
    setCurrent(pickRandomMusicQuote());
  }, []);

  const copy = useCallback(async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied("error");
    }
  }, []);

  const tsExport = useMemo(() => {
    const lines = MUSIC_QUOTES.map(
      (q) =>
        `  { text: ${JSON.stringify(q.text)}, author: ${JSON.stringify(q.author)} },`,
    );
    return `export const MUSIC_QUOTES = [\n${lines.join("\n")}\n] as const;\n`;
  }, []);

  const homeHref = import.meta.env.BASE_URL;

  return (
    <div className="min-h-full bg-[#1b1f28] text-[#eef0f4] px-4 py-10">
      <div className="mx-auto max-w-2xl panel-modal p-8 shadow-soft">
        <p className="text-[10px] tracking-[0.3em] text-gold-400/80 uppercase">
          Radio Klassik
        </p>
        <h1 className="font-display text-2xl text-white mt-1">Music quote pool</h1>
        <p className="text-white/55 text-sm mt-2">
          {MUSIC_QUOTES.length} quotes · shuffle for a random line · copy for reuse
        </p>

        <blockquote className="mt-8 border-l-2 border-gold-400/50 pl-5 font-serif text-base leading-relaxed">
          <span className="block not-italic text-white/85">“{current.text}”</span>
          <span className="mt-1 block italic text-white/60">{current.author}</span>
        </blockquote>

        <div className="mt-8 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={shuffle}>
            Next quote
          </button>
          <button
            type="button"
            className="btn-ghost border border-white/10"
            onClick={() => void copy("formatted", formatted)}
          >
            Copy quote
          </button>
          <button
            type="button"
            className="btn-ghost border border-white/10"
            onClick={() => void copy("ts", tsExport)}
          >
            Copy as TypeScript array
          </button>
        </div>

        {copied && copied !== "error" && (
          <p className="mt-3 text-xs text-emerald-400/90">Copied: {copied}</p>
        )}
        {copied === "error" && (
          <p className="mt-3 text-xs text-amber-400/90">Clipboard unavailable in this context.</p>
        )}

        <p className="mt-10 text-[11px] text-white/40">
          <a href={homeHref} className="underline hover:text-gold-400">
            ← Back to Radio Klassik
          </a>
        </p>
      </div>
    </div>
  );
}
