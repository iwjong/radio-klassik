import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import type { Station } from "../lib/types";
import { countryName } from "../lib/geo";

type Tab = "favorites" | "recent" | "top" | "byCountry";

interface Props {
  onClose: () => void;
}

export function Library({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>("favorites");
  const stations = useStore((s) => s.stations);
  const favorites = useStore((s) => s.favorites);
  const recent = useStore((s) => s.recent);
  const currentId = useStore((s) => s.currentStationId);
  const selectStation = useStore((s) => s.selectStation);

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

  const byId = useMemo(() => {
    const m = new Map<string, Station>();
    for (const s of stations) m.set(s.id, s);
    return m;
  }, [stations]);

  const list: Station[] = useMemo(() => {
    switch (tab) {
      case "favorites":
        return favorites
          .map((id) => byId.get(id))
          .filter((s): s is Station => !!s);
      case "recent":
        return recent.map((id) => byId.get(id)).filter((s): s is Station => !!s);
      case "top":
        return [...stations].sort((a, b) => b.votes - a.votes).slice(0, 50);
      case "byCountry": {
        const groups = new Map<string, Station[]>();
        for (const s of stations) {
          const code = s.countryCode || "??";
          if (!groups.has(code)) groups.set(code, []);
          groups.get(code)!.push(s);
        }
        const sorted = Array.from(groups.entries()).sort(
          (a, b) => b[1].length - a[1].length,
        );
        return sorted.flatMap(([, arr]) =>
          arr.sort((a, b) => b.votes - a.votes),
        );
      }
      default: {
        const _exhaustive: never = tab;
        throw new Error(`Unhandled tab: ${String(_exhaustive)}`);
      }
    }
  }, [tab, favorites, recent, stations, byId]);

  return (
    <div
      className="fixed top-0 right-0 bottom-0 w-[min(420px,92vw)] z-30 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Station library"
    >
      <div className="h-full glass-strong border-l border-white/[0.07] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-gold-400/80 uppercase">
              Library
            </div>
            <div className="font-display text-2xl leading-tight text-white">
              Your Klassik
            </div>
          </div>
          <button
            className="text-white/60 hover:text-white text-xl w-8 h-8 grid place-items-center rounded hover:bg-white/5"
            onClick={onClose}
            title="Close (L)"
          >
            ×
          </button>
        </div>
        <div className="px-5 pb-3 flex flex-wrap gap-1 text-xs">
          {(
            [
              ["favorites", "Favorites"],
              ["recent", "Recent"],
              ["top", "Top voted"],
              ["byCountry", "By country"],
            ] as [Tab, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={
                "px-3 py-1.5 rounded-md transition " +
                (tab === k
                  ? "bg-gold-400/90 text-ink-950"
                  : "text-white/60 hover:text-white hover:bg-white/5")
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {list.length === 0 ? (
            <EmptyState tab={tab} />
          ) : tab === "byCountry" ? (
            <GroupedByCountry
              list={list}
              currentId={currentId}
              onSelect={selectStation}
            />
          ) : (
            list.map((s) => (
              <StationRow
                key={s.id}
                s={s}
                active={s.id === currentId}
                onClick={() => selectStation(s.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function GroupedByCountry({
  list,
  currentId,
  onSelect,
}: {
  list: Station[];
  currentId: string | null;
  onSelect: (id: string) => void;
}) {
  const groups: { country: string; code: string; stations: Station[] }[] = [];
  const seen = new Map<string, number>();
  for (const s of list) {
    const key = s.countryCode || "??";
    let idx = seen.get(key);
    if (idx === undefined) {
      idx = groups.length;
      seen.set(key, idx);
      groups.push({
        country: s.country || countryName(s.countryCode) || "Unknown",
        code: key,
        stations: [],
      });
    }
    groups[idx].stations.push(s);
  }
  return (
    <div>
      {groups.map((g) => (
        <div key={g.code}>
          <div className="px-5 py-2 text-[10px] tracking-[0.25em] uppercase text-white/[0.38] sticky top-0 bg-ink-900/50 backdrop-blur">
            {g.country}
            <span className="ml-2 text-white/25">{g.stations.length}</span>
          </div>
          {g.stations.map((s) => (
            <StationRow
              key={s.id}
              s={s}
              active={s.id === currentId}
              onClick={() => onSelect(s.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function StationRow({
  s,
  active,
  onClick,
}: {
  s: Station;
  active: boolean;
  onClick: () => void;
}) {
  const toggleFavorite = useStore((st) => st.toggleFavorite);
  const isFav = useStore((st) => st.favorites.includes(s.id));

  return (
    <div
      className={
        "group flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.025] cursor-pointer transition " +
        (active ? "bg-white/[0.045]" : "hover:bg-white/[0.025]")
      }
      onClick={onClick}
    >
      <span className="marker-dot w-1 h-1 rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{s.name}</div>
        <div className="text-[11px] text-white/40 truncate">
          {stationSubtitle(s)}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(s.id);
        }}
        className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-gold-400"
        title={isFav ? "Remove favorite" : "Add to favorites"}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={isFav ? "#e9c46a" : "none"}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>
  );
}

function stationSubtitle(station: Station): string {
  if (station.editorialDescription) return station.editorialDescription;
  if (station.listeningMood) return station.listeningMood;
  return [
    station.country,
    station.bitrate ? `${station.bitrate}kbps` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function EmptyState({ tab }: { tab: Tab }) {
  const msg: Record<Tab, string> = {
    favorites: "Tap the heart icon next to a station to save it here.",
    recent: "Stations you play will appear here.",
    top: "Top stations are loading…",
    byCountry: "Loading stations by country…",
  };
  return (
    <div className="px-6 py-16 text-center text-white/40 text-sm">
      {msg[tab]}
    </div>
  );
}
