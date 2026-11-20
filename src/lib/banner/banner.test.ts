import { describe, expect, it } from "vitest";
import { LANDMARK_CITIES, landmarkFor } from "./landmarks";
import { renderBanner, type BannerInput } from "./render";
import { clockText, localMinutesIn, phaseAt, skyBody, weatherOf } from "./sky";

const base: BannerInput = { name: "Tokyo", countryCode: "JP", minutes: 720, sunrise: 390, sunset: 1000, weather: "clear", cloudCover: 0 };

describe("sky", () => {
  it("knows the part of the day", () => {
    expect(phaseAt(300, 390, 1000)).toBe("night");
    expect(phaseAt(400, 390, 1000)).toBe("dawn");
    expect(phaseAt(720, 390, 1000)).toBe("day");
    expect(phaseAt(980, 390, 1000)).toBe("dusk");
    expect(phaseAt(1100, 390, 1000)).toBe("night");
  });

  it("puts the sun high at midday and the moon out at night", () => {
    const noon = skyBody(695, 390, 1000);
    expect(noon.kind).toBe("sun");
    expect(noon.height).toBeGreaterThan(0.99);
    expect(skyBody(60, 390, 1000).kind).toBe("moon");
  });

  it("reads weather codes", () => {
    expect([weatherOf(0), weatherOf(3), weatherOf(61), weatherOf(73), weatherOf(45), weatherOf(95)]).toEqual(["clear", "cloudy", "rain", "snow", "fog", "storm"]);
  });

  it("tells local time in another time zone", () => {
    const now = new Date("2026-12-10T10:42:00Z");
    expect(localMinutesIn("Asia/Tokyo", now)).toBe(19 * 60 + 42);
    expect(clockText(19 * 60 + 42)).toBe("7:42 pm");
    expect(clockText(5)).toBe("12:05 am");
  });
});

describe("landmarks", () => {
  it("finds cities by name, country and common spellings", () => {
    expect(landmarkFor("Tokyo", "JP")?.draw).toBeDefined();
    expect(landmarkFor("New York City", "US")).toBe(landmarkFor("New York", "US"));
    expect(landmarkFor("Paris", "US")).toBeUndefined(); // Paris, Texas gets a generated skyline
  });

  it("draws every landmark city without errors", () => {
    for (const key of LANDMARK_CITIES) {
      const [name, cc] = key.split("|");
      const b = renderBanner({ ...base, name, countryCode: cc });
      expect(b.svg.length, key).toBeGreaterThan(500);
      expect(b.svg, key).not.toMatch(/NaN|undefined/);
    }
  });
});

describe("renderBanner", () => {
  it("is the same picture for the same city and time", () => {
    expect(renderBanner(base).svg).toBe(renderBanner(base).svg);
  });

  it("changes with the time of day and weather", () => {
    const night = renderBanner({ ...base, minutes: 1300 });
    expect(night.phase).toBe("night");
    expect(night.svg).toContain('class="star"');
    expect(night.svg).toContain('class="moon"');
    expect(renderBanner({ ...base, weather: "rain" }).svg).toContain('class="rain"');
    expect(renderBanner({ ...base, minutes: 1300, weather: "rain" }).svg).not.toContain('class="moon"');
    expect(renderBanner({ ...base, weather: "snow" }).svg).toContain('class="snow"');
  });

  it("makes a skyline for cities without a landmark, sized by population", () => {
    const village = renderBanner({ ...base, name: "Hallstatt", countryCode: "AT", population: 800, elevation: 511 });
    const metro = renderBanner({ ...base, name: "Lagos", countryCode: "NG", population: 9_000_000 });
    expect(village.hasLandmark).toBe(false);
    expect(metro.svg).toContain('class="far"');
    expect(village.svg).not.toContain('class="far"');
    expect(renderBanner({ ...base, name: "Zermatt", countryCode: "CH", elevation: 1600 }).svg).toContain('class="snowcap"');
  });
});

describe("wide banners", () => {
  it("widens the scene and keeps the landmark centred", () => {
    const wide = renderBanner({ ...base, width: 2000 });
    expect(wide.svg).toContain('transform="translate(400 0)"');
    expect(wide.svg).not.toMatch(/NaN|undefined/);
  });
});
