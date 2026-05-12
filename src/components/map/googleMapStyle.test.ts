import { describe, expect, it } from "vitest";
import {
  getGoogleMapsScriptUrl,
  getMapAtmosphereClass,
  minZoomToAvoidHorizontalWorldRepeat,
} from "./googleMapStyle";

describe("google map style", () => {
  it("uses the quiet map atmosphere states", () => {
    expect(
      getMapAtmosphereClass({ playbackStatus: "playing" }),
    ).toBe("google-map-playing");
    expect(
      getMapAtmosphereClass({ playbackStatus: "paused" }),
    ).toBe("google-map-idle");
    expect(
      getMapAtmosphereClass({ playbackStatus: "idle" }),
    ).toBe("google-map-idle");
  });

  it("raises minimum zoom on wide viewports to avoid repeated world strips", () => {
    expect(minZoomToAvoidHorizontalWorldRepeat(400)).toBe(1);
    expect(minZoomToAvoidHorizontalWorldRepeat(900)).toBe(2);
    expect(minZoomToAvoidHorizontalWorldRepeat(5000)).toBe(5);
  });

  it("builds a scoped Google Maps script URL", () => {
    const url = new URL(getGoogleMapsScriptUrl("test-key"));

    expect(url.origin).toBe("https://maps.googleapis.com");
    expect(url.searchParams.get("key")).toBe("test-key");
    expect(url.searchParams.get("callback")).toBe("initRadioKlassikMaps");
  });
});
