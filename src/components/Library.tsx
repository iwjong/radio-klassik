import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import type { Station } from "../lib/types";
import { countryName } from "../lib/geo";

type Tab = "recent" | "top" | "byCountry";

interface Props {
  onClose: () => void;
}

export function Library({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>("recent");
  const stations = useStore((s) => s.stations);
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
  }, [tab, recent, stations, byId]);

  return (
    <div
      className="fixed inset-0 z-40 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Station library"
    >
      <div
        className="absolute top-[max(5.5rem,env(safe-area-inset-top)+4.5rem)] sm:top-24 left-1/2 -translate-x-1/2 w-[min(660px,92vw)] max-h-[min(75vh,calc(100dvh-7rem))] panel-modal shadow-soft overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-white/[0.06] shrink-0">
          <div className="min-w-0">
            <div className="text-[10px] tracking-[0.3em] text-gold-400/90 uppercase">
              Library
            </div>
            <div className="font-display text-2xl leading-tight text-white truncate">
              Stations
            </div>
          </div>
          <button
            className="text-white/60 hover:text-white text-xl w-9 h-9 shrink-0 grid place-items-center rounded-lg hover:bg-white/5"
            onClick={onClose}
            title="Close (Esc)"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-3 flex flex-wrap gap-1 text-xs border-b border-white/[0.045] shrink-0">
          {(
            [
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
                  : "text-white/65 hover:text-white hover:bg-white/5")
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
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
          <div className="library-section-header px-5 py-2 text-[10px] tracking-[0.25em] uppercase text-white/55 sticky top-0 z-10 border-b border-white/[0.06]">
            {g.country}
            <span className="ml-2 text-white/35">{g.stations.length}</span>
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
  return (
    <div
      className={
        "flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.06] cursor-pointer transition " +
        (active ? "bg-white/[0.06]" : "hover:bg-white/[0.04]")
      }
      onClick={onClick}
    >
      <span className="marker-dot w-1 h-1 rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white/95 truncate">{s.name}</div>
        <div className="text-[11px] text-white/50 truncate">
          {stationSubtitle(s)}
        </div>
      </div>
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
    recent: "Stations you play will appear here.",
    top: "Top stations are loading…",
    byCountry: "Loading stations by country…",
  };
  return (
    <div className="px-6 py-16 text-center text-white/50 text-sm leading-relaxed">
      {msg[tab]}
    </div>
  );
}
