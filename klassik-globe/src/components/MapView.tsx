import { useStore } from "../store/useStore";
import { GoogleMapBackground } from "./map/GoogleMapBackground";

export function MapView() {
  const stations = useStore((s) => s.stations);
  const currentId = useStore((s) => s.currentStationId);
  const playbackStatus = useStore((s) => s.playbackStatus);
  const focusMode = useStore((s) => s.focusMode);
  const selectStation = useStore((s) => s.selectStation);

  return (
    <GoogleMapBackground
      stations={stations}
      currentId={currentId}
      playbackStatus={playbackStatus}
      focusMode={focusMode}
      onSelectStation={selectStation}
    />
  );
}
