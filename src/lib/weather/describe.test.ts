import { describe, expect, it } from "vitest";
import { describeWeather, feel, formatRange, formatTemp, toFahrenheit } from "./describe";
import type { WeatherSummary } from "./openMeteo";

const tokyo: WeatherSummary = {
  low: 2, high: 13, avgHigh: 11, avgLow: 3, days: 4, rainyDays: 1, snowyDays: 0,
  tags: ["cold", "cool", "rain"], partial: false, source: "forecast",
};

describe("temperatures", () => {
  it("converts to Fahrenheit", () => {
    expect(toFahrenheit(0)).toBe(32);
    expect(toFahrenheit(11)).toBe(52);
    expect(formatTemp(3)).toBe("37°F");
    expect(formatTemp(3, "C")).toBe("3°C");
    expect(formatRange(2, 13)).toBe("36–55°F");
  });

  it("names how a day feels", () => {
    expect([0, 8, 15, 22, 29, 35].map(feel)).toEqual(["Cold", "Chilly", "Mild", "Warm", "Hot", "Very hot"]);
  });
});

describe("describeWeather", () => {
  it("describes a forecast", () => {
    expect(describeWeather(tokyo)).toBe(
      "Chilly, with highs around 52°F and lows near 37°F. Rain likely on one day, so keep an umbrella handy.",
    );
  });

  it("describes last year's weather", () => {
    expect(describeWeather({ ...tokyo, source: "last-year", rainyDays: 2 })).toBe(
      "Last year around these dates it was chilly, with highs around 52°F and lows near 37°F. It rained on 2 of 4 days, so pack an umbrella.",
    );
  });

  it("covers dry, wet and snowy trips", () => {
    expect(describeWeather({ ...tokyo, rainyDays: 0 })).toMatch(/Looks dry\.$/);
    expect(describeWeather({ ...tokyo, rainyDays: 4 })).toMatch(/proper rain jacket/);
    expect(describeWeather({ ...tokyo, snowyDays: 2 })).toMatch(/Snow is possible on 2 days/);
  });
});
