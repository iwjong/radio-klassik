import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import type { Station } from "../lib/types";

interface Props {
  onClose: () => void;
}

export function SearchPanel({ onClose }: Props) {
  const stations = useStore((s) => s.stations);
  const query = useStore((s) => s.searchQuery);
  const setQuery = useStore((s) => s.setSearchQuery);
  const selectStation = useStore((s) => s.selectStation);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const previousFocus = document.activeElement;
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stations.slice(0, 50);
    const tokens = q.split(/\s+/);
    return stations
      .map((s) => ({ s, score: scoreStation(s, tokens) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 60)
      .map((r) => r.s);
  }, [stations, query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (results.length ? Math.min(results.length - 1, i + 1) : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        const s = results[activeIdx];
        if (s) {
          selectStation(s.id);
          onClose();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, activeIdx, onClose, selectStation]);

  return (
    <div
      className="fixed inset-0 z-40 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search classical stations"
    >
      <div
        className="absolute top-24 left-1/2 -translate-x-1/2 w-[min(660px,92vw)] panel-modal overflow-hidden shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.045]">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search stations, countries, genres…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            className="flex-1 bg-transparent outline-none text-white placeholder-white/35 text-[1.05rem]"
          />
          <kbd className="text-[10px] text-white/40 px-2 py-1 rounded border border-white/10">
            Esc
          </kbd>
        </div>
        <div className="max-h-[55vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-5 py-10 text-center text-white/40 text-sm">
              No stations match “{query}”
            </div>
          ) : (
            results.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  selectStation(s.id);
                  onClose();
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className={
                  "w-full text-left px-5 py-3 flex items-center gap-4 border-b border-white/[0.025] transition " +
                  (i === activeIdx ? "bg-white/[0.045]" : "hover:bg-white/[0.025]")
                }
              >
                <span className="marker-dot w-1 h-1 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white truncate">{s.name}</div>
                  <div className="text-xs text-white/40 truncate">
                    {stationSubtitle(s)}
                  </div>
                </div>
                <span className="text-[10px] tracking-wider text-white/30">
                  {s.countryCode}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="px-5 py-2 text-[10px] text-white/35 border-t border-white/[0.06] flex justify-between">
          <span>{results.length} of {stations.length}</span>
          <span>↑ ↓ to navigate · Enter to play</span>
        </div>
      </div>
    </div>
  );
}

function stationSubtitle(station: Station): string {
  if (station.editorialDescription) return station.editorialDescription;
  if (station.listeningMood) return station.listeningMood;
  if (station.regionDescription) return station.regionDescription;
  return [
    station.country,
    station.tags.length ? station.tags.slice(0, 3).join(", ") : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function scoreStation(s: Station, tokens: string[]): number {
  const name = s.name.toLowerCase();
  const country = s.country.toLowerCase();
  const tags = s.tags.join(" ").toLowerCase();
  let score = 0;
  for (const t of tokens) {
    let local = 0;
    if (name.startsWith(t)) local += 50;
    else if (name.includes(t)) local += 20;
    if (country.includes(t)) local += 12;
    if (s.countryCode.toLowerCase() === t) local += 30;
    if (tags.includes(t)) local += 6;
    if (local === 0) return 0;
    score += local;
  }
  return score + Math.min(15, s.votes / 200);
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-white/50"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
