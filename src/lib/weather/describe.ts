// Turns a weather summary into the short blurb shown under each city.

import type { WeatherSummary } from "./openMeteo";

export type TempUnit = "F" | "C";

export function toFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

/** 3 → "37°F" */
export function formatTemp(celsius: number, unit: TempUnit = "F"): string {
  return unit === "F" ? `${toFahrenheit(celsius)}°F` : `${Math.round(celsius)}°C`;
}

/** "37–55°F" */
export function formatRange(lowC: number, highC: number, unit: TempUnit = "F"): string {
  const lo = unit === "F" ? toFahrenheit(lowC) : Math.round(lowC);
  const hi = unit === "F" ? toFahrenheit(highC) : Math.round(highC);
  return `${lo}–${hi}°${unit}`;
}

/** How a typical day feels, from the average high (°C). */
export function feel(avgHighC: number): string {
  const f = toFahrenheit(avgHighC);
  if (f < 40) return "Cold";
  if (f < 55) return "Chilly";
  if (f < 68) return "Mild";
  if (f < 80) return "Warm";
  if (f < 90) return "Hot";
  return "Very hot";
}

function rainLine(s: WeatherSummary): string {
  if (s.snowyDays > 0) {
    return s.snowyDays === 1 ? "Snow is possible on one day." : `Snow is possible on ${s.snowyDays} days.`;
  }
  if (s.rainyDays === 0) return "Looks dry.";
  if (s.rainyDays >= s.days * 0.6) return "Rain most days, so bring a proper rain jacket.";
  const days = s.rainyDays === 1 ? "one day" : `${s.rainyDays} of ${s.days} days`;
  return s.source === "last-year"
    ? `It rained on ${days}, so pack an umbrella.`
    : `Rain likely on ${days}, so keep an umbrella handy.`;
}

/**
 * Forecast:  "Chilly, with highs around 52°F and lows near 39°F. Rain likely on one day, so keep an umbrella handy."
 * Last year: "Last year around these dates it was chilly, with highs around 52°F and lows near 39°F. It rained on one day, so pack an umbrella."
 */
export function describeWeather(s: WeatherSummary, unit: TempUnit = "F"): string {
  const temps = `with highs around ${formatTemp(s.avgHigh, unit)} and lows near ${formatTemp(s.avgLow, unit)}.`;
  const mood = feel(s.avgHigh);
  const opening =
    s.source === "last-year" ? `Last year around these dates it was ${mood.toLowerCase()}, ${temps}` : `${mood}, ${temps}`;
  return `${opening} ${rainLine(s)}`;
}
