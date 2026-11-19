// Quick facts shown under each city: plugs, money, and whether to carry cash.
// Home is assumed to be the US (type A/B plugs, US dollars).

export interface CountryFacts {
  plugs: string[];
  currency: string;
  cash?: string;
}

export const HOME_COUNTRY = "US";
const HOME_PLUGS = ["A", "B"];

const CARDS = "Cards work almost everywhere";
const SOME_CASH = "Carry some cash for small shops";

export const FACTS: Record<string, CountryFacts> = {
  US: { plugs: ["A", "B"], currency: "US dollars" },
  PR: { plugs: ["A", "B"], currency: "US dollars" },
  CA: { plugs: ["A", "B"], currency: "Canadian dollars", cash: CARDS },
  MX: { plugs: ["A", "B"], currency: "Mexican pesos", cash: SOME_CASH },
  GB: { plugs: ["G"], currency: "British pounds", cash: CARDS },
  IE: { plugs: ["G"], currency: "euros", cash: CARDS },
  FR: { plugs: ["C", "E"], currency: "euros" },
  DE: { plugs: ["C", "F"], currency: "euros", cash: SOME_CASH },
  IT: { plugs: ["C", "F", "L"], currency: "euros", cash: SOME_CASH },
  ES: { plugs: ["C", "F"], currency: "euros" },
  PT: { plugs: ["C", "F"], currency: "euros" },
  NL: { plugs: ["C", "F"], currency: "euros", cash: CARDS },
  BE: { plugs: ["C", "E"], currency: "euros" },
  CH: { plugs: ["C", "J"], currency: "Swiss francs" },
  AT: { plugs: ["C", "F"], currency: "euros", cash: SOME_CASH },
  GR: { plugs: ["C", "F"], currency: "euros", cash: SOME_CASH },
  HR: { plugs: ["C", "F"], currency: "euros" },
  IS: { plugs: ["C", "F"], currency: "Icelandic krónur", cash: CARDS },
  NO: { plugs: ["C", "F"], currency: "Norwegian kroner", cash: CARDS },
  SE: { plugs: ["C", "F"], currency: "Swedish kronor", cash: CARDS },
  DK: { plugs: ["C", "E", "F", "K"], currency: "Danish kroner", cash: CARDS },
  FI: { plugs: ["C", "F"], currency: "euros", cash: CARDS },
  PL: { plugs: ["C", "E"], currency: "Polish złoty" },
  CZ: { plugs: ["C", "E"], currency: "Czech koruna" },
  HU: { plugs: ["C", "F"], currency: "Hungarian forints" },
  TR: { plugs: ["C", "F"], currency: "Turkish lira", cash: SOME_CASH },
  JP: { plugs: ["A", "B"], currency: "Japanese yen", cash: "Lots of places are cash only" },
  KR: { plugs: ["C", "F"], currency: "South Korean won", cash: CARDS },
  CN: { plugs: ["A", "C", "I"], currency: "Chinese yuan", cash: "Mobile pay is everywhere; cards less so" },
  HK: { plugs: ["G"], currency: "Hong Kong dollars" },
  TW: { plugs: ["A", "B"], currency: "Taiwan dollars", cash: SOME_CASH },
  TH: { plugs: ["A", "B", "C", "O"], currency: "Thai baht", cash: SOME_CASH },
  VN: { plugs: ["A", "C", "D"], currency: "Vietnamese dong", cash: "Cash is king" },
  SG: { plugs: ["G"], currency: "Singapore dollars", cash: CARDS },
  MY: { plugs: ["G"], currency: "Malaysian ringgit" },
  ID: { plugs: ["C", "F"], currency: "Indonesian rupiah", cash: SOME_CASH },
  PH: { plugs: ["A", "B", "C"], currency: "Philippine pesos", cash: SOME_CASH },
  IN: { plugs: ["C", "D", "M"], currency: "Indian rupees", cash: SOME_CASH },
  AE: { plugs: ["G", "C", "D"], currency: "UAE dirhams", cash: CARDS },
  IL: { plugs: ["C", "H", "M"], currency: "Israeli shekels" },
  EG: { plugs: ["C", "F"], currency: "Egyptian pounds", cash: SOME_CASH },
  MA: { plugs: ["C", "E"], currency: "Moroccan dirhams", cash: "Cash is king" },
  ZA: { plugs: ["C", "D", "M", "N"], currency: "South African rand" },
  KE: { plugs: ["G"], currency: "Kenyan shillings", cash: "Mobile money (M-Pesa) is everywhere" },
  AU: { plugs: ["I"], currency: "Australian dollars", cash: CARDS },
  NZ: { plugs: ["I"], currency: "New Zealand dollars", cash: CARDS },
  BR: { plugs: ["C", "N"], currency: "Brazilian reais" },
  AR: { plugs: ["C", "I"], currency: "Argentine pesos", cash: SOME_CASH },
  CL: { plugs: ["C", "L"], currency: "Chilean pesos" },
  PE: { plugs: ["A", "C"], currency: "Peruvian soles", cash: SOME_CASH },
  CO: { plugs: ["A", "B"], currency: "Colombian pesos", cash: SOME_CASH },
  CR: { plugs: ["A", "B"], currency: "Costa Rican colones" },
};

export function factsFor(countryCode?: string): CountryFacts | undefined {
  return countryCode ? FACTS[countryCode.toUpperCase()] : undefined;
}

export function samePlugsAsHome(plugs: string[]): boolean {
  return plugs.every((p) => HOME_PLUGS.includes(p));
}

/** "Type A plugs · Japanese yen · Lots of places are cash only" (home-country details left out) */
export function describeFacts(countryCode?: string): string | null {
  const f = factsFor(countryCode);
  if (!f || countryCode?.toUpperCase() === HOME_COUNTRY) return null;
  const plugs = samePlugsAsHome(f.plugs)
    ? "Same plugs as home"
    : `Type ${f.plugs.join("/")} plugs`;
  return [plugs, f.currency, f.cash].filter(Boolean).join(" · ");
}

/** Leaving the country if any stop is outside the home country. Unknown countries count as abroad. */
export function isInternational(countryCodes: (string | undefined)[]): boolean {
  return countryCodes.some((c) => !c || c.toUpperCase() !== HOME_COUNTRY);
}

/** An adapter is needed if any stop uses plugs that don't fit US sockets (unknown: assume yes). */
export function needsAdapter(countryCodes: (string | undefined)[]): boolean {
  return countryCodes.some((c) => {
    const f = factsFor(c);
    return !f || !samePlugsAsHome(f.plugs);
  });
}

/** "Type C/F plugs" for the adapter's note, across all stops. */
export function plugNote(countryCodes: (string | undefined)[]): string | null {
  const plugs = new Set<string>();
  for (const c of countryCodes) factsFor(c)?.plugs.forEach((p) => plugs.add(p));
  const foreign = [...plugs].filter((p) => !HOME_PLUGS.includes(p));
  return foreign.length ? `You'll need type ${foreign.join("/")}` : null;
}
