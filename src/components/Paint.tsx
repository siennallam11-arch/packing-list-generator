import type { CoverColour } from "@/lib/store/types";

/** A painted band, like the trip covers. Fills its box. */
export function Paint({ colour, className, style }: { colour: CoverColour; className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
      <rect x="-12" y="-14" width="424" height="128" style={{ fill: `var(--cover-${colour})` }} filter="url(#cb-paint)" />
    </svg>
  );
}
