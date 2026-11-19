// Hand-drawn landmark skylines for well-known cities, in the doodle style.
// Drawn on a 1200 × 240 canvas, ground at y = 212, landmark centred near x = 600
// (phones show roughly x 300–900). Shapes use classes the banner colours by time of day:
//   b / b2 building fills · p pink · g green · u blue · t tan · n outline only · w lit window

export const GROUND = 212;

const R = (x: number, y: number, w: number, h: number, c = "b") => `<rect class="${c}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
const P = (pts: string, c = "b") => `<polygon class="${c}" points="${pts}"/>`;
const D = (d: string, c = "b") => `<path class="${c}" d="${d}"/>`;
const C = (x: number, y: number, r: number, c = "b") => `<circle class="${c}" cx="${x}" cy="${y}" r="${r}"/>`;
const L = (d: string) => `<path class="n" d="${d}"/>`;

/** A grid of small windows (lit at night). */
export function windows(x: number, y: number, cols: number, rows: number, gx = 10, gy = 14, w = 4, h = 6): string {
  let s = "";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += `<rect class="w" x="${x + c * gx}" y="${y + r * gy}" width="${w}" height="${h}"/>`;
  return s;
}

export function palm(x: number, h = 70): string {
  const top = GROUND - h;
  return (
    D(`M${x} ${GROUND} Q${x - 6} ${GROUND - h / 2} ${x + 4} ${top}`, "n") +
    D(`M${x + 4} ${top} q-22 -4 -34 12 M${x + 4} ${top} q22 -6 34 10 M${x + 4} ${top} q-12 -16 -30 -14 M${x + 4} ${top} q14 -16 30 -12 M${x + 4} ${top} q2 -14 -2 -24`, "n")
  );
}

export function tree(x: number, r = 14, c = "g"): string {
  return L(`M${x} ${GROUND} V${GROUND - r}`) + C(x, GROUND - r - r * 0.6, r, c);
}

function pagoda(cx: number, tiers: number, base: number): string {
  let s = R(cx - base / 2 - 6, GROUND - 8, base + 12, 8, "b2");
  let top = GROUND - 8;
  for (let i = 0; i < tiers; i++) {
    const w = base - i * 14;
    const bottom = top;
    top = bottom - 28;
    s += R(cx - (w - 34) / 2, top + 4, w - 34, 24, "b");
    s += D(`M${cx - w / 2} ${top + 6} Q${cx} ${top - 10} ${cx + w / 2} ${top + 6} L${cx + w / 2 - 10} ${top + 11} L${cx - w / 2 + 10} ${top + 11}Z`, "b2");
  }
  return s + L(`M${cx} ${top - 2} V${top - 36} M${cx - 5} ${top - 12} H${cx + 5} M${cx - 4} ${top - 20} H${cx + 4} M${cx - 3} ${top - 28} H${cx + 3}`);
}

function onion(x: number, y: number, c: string): string {
  return R(x - 8, y, 16, 150 - y, "b") + D(`M${x - 12} ${y} Q${x - 15} ${y - 16} ${x} ${y - 30} Q${x + 15} ${y - 16} ${x + 12} ${y}Z`, c) + L(`M${x} ${y - 30} V${y - 42}`);
}

function houseRow(x0: number, n: number, seed: number[], fills: string[]): string {
  let s = "";
  let x = x0;
  for (let i = 0; i < n; i++) {
    const w = 40 + (seed[i % seed.length] % 3) * 4;
    const h = 90 + (seed[(i + 2) % seed.length] % 5) * 12;
    const top = GROUND - h;
    const c = fills[i % fills.length];
    const kind = i % 3;
    if (kind === 0) s += P(`${x},${GROUND} ${x},${top} ${x + 6},${top} ${x + 6},${top - 8} ${x + 12},${top - 8} ${x + 12},${top - 16} ${x + w - 12},${top - 16} ${x + w - 12},${top - 8} ${x + w - 6},${top - 8} ${x + w - 6},${top} ${x + w},${top} ${x + w},${GROUND}`, c);
    else if (kind === 1) s += D(`M${x} ${GROUND} V${top} Q${x + 4} ${top - 10} ${x + 12} ${top - 12} Q${x + w / 2} ${top - 30} ${x + w - 12} ${top - 12} Q${x + w - 4} ${top - 10} ${x + w} ${top} V${GROUND}Z`, c);
    else s += P(`${x},${GROUND} ${x},${top} ${x + w / 2},${top - 22} ${x + w},${top} ${x + w},${GROUND}`, c);
    s += windows(x + 8, top + 6, 3, Math.floor((h - 26) / 22), 11, 22, 6, 10);
    s += R(x + w / 2 - 6, GROUND - 18, 12, 18, "b2");
    x += w + 2;
  }
  return s;
}

export interface LandmarkSpec {
  draw?: () => string;
  /** Mountains behind the city */
  mountains?: boolean;
  /** Water along the bottom */
  water?: boolean;
  /** How tall the surrounding buildings are */
  skyline: "tall" | "mid" | "low";
  trees?: boolean;
  /** Keep generated buildings out of this x range so the landmark stands clear */
  clear?: [number, number];
}

export const LANDMARKS: Record<string, LandmarkSpec> = {
  "tokyo|JP": {
    skyline: "tall",
    clear: [500, 740],
    draw: () =>
      P("526,212 594,212 571,96 549,96", "p") + L("M532 186H588 M538 160H582 M544 132H576 M533 212Q560 182 587 212") + R(536, 124, 48, 10) +
      P("549,96 571,96 563,52 557,52", "p") + R(549, 84, 22, 8) + L("M560 52V18") +
      P("694,212 718,212 709,86 703,86", "b2") + R(695, 100, 22, 10) + R(699, 74, 14, 9) + L("M706 74V12 M698 182H714 M700 150H712") + windows(700, 120, 2, 3, 8, 16, 3, 5),
  },
  "kyoto|JP": {
    skyline: "low",
    trees: true,
    clear: [520, 820],
    draw: () =>
      pagoda(600, 5, 112) +
      R(756, 146, 7, 66, "p") + R(797, 146, 7, 66, "p") + D("M740 142 Q780 130 820 142 L817 151 L743 151Z", "p") + R(750, 160, 60, 6, "p"),
  },
  "osaka|JP": {
    skyline: "mid",
    trees: true,
    clear: [520, 680],
    draw: () =>
      P("538,212 662,212 650,174 550,174", "b2") + L("M546 194H654 M560 174V212 M600 174V212 M640 174V212") +
      R(558, 148, 84, 26) + D("M544 151 Q600 134 656 151 L648 158 L552 158Z", "g") + windows(568, 160, 6, 1, 12, 10, 5, 7) +
      R(570, 118, 60, 30) + D("M558 121 Q600 104 642 121 L634 128 L566 128Z", "g") + windows(580, 132, 4, 1, 12, 10, 5, 7) +
      R(582, 92, 36, 26) + D("M574 96 Q600 66 626 96Z", "g") + C(586, 70, 3, "t") + C(614, 70, 3, "t"),
  },
  "seoul|KR": {
    skyline: "tall",
    mountains: true,
    clear: [460, 900],
    draw: () =>
      D("M430 212 Q520 126 600 116 Q690 120 790 212Z", "g") +
      tree(470, 10) + tree(500, 12) + tree(700, 11) + tree(740, 9) +
      R(596, 62, 8, 56) + R(585, 76, 30, 9) + R(590, 64, 20, 12) + L("M600 64V20") +
      P("846,212 874,212 866,52 860,34 854,52", "b2") + L("M850 120H870 M852 90H868") + windows(853, 140, 2, 4, 9, 16, 3, 6),
  },
  "busan|KR": { skyline: "tall", mountains: true, water: true },
  "beijing|CN": {
    skyline: "mid",
    trees: true,
    clear: [520, 680],
    draw: () =>
      R(526, 200, 148, 12) + R(542, 188, 116, 12) +
      R(566, 160, 68, 28, "p") + D("M548 163 Q600 142 652 163Z", "u") +
      R(574, 140, 52, 20, "p") + D("M556 142 Q600 122 644 142Z", "u") +
      R(582, 120, 36, 20, "p") + D("M566 122 Q600 94 634 122Z", "u") + C(600, 91, 5, "t"),
  },
  "shanghai|CN": {
    skyline: "tall",
    water: true,
    clear: [520, 800],
    draw: () =>
      P("536,212 546,212 552,150 548,150") + P("574,212 584,212 572,150 568,150") + R(556, 64, 8, 86) +
      C(560, 140, 22, "p") + C(560, 84, 15, "p") + C(560, 58, 7, "p") + L("M560 51V14") +
      D("M686 212 L689 66 Q700 40 716 50 L722 212Z", "u") + L("M692 120 Q705 112 720 120 M690 170 Q705 162 721 170") +
      R(762, 92, 28, 120, "b2") + P("762,92 790,92 776,60") + L("M776 60V40") + windows(766, 104, 2, 6, 12, 16, 4, 7),
  },
  "hong kong|HK": {
    skyline: "tall",
    mountains: true,
    water: true,
    clear: [520, 720],
    draw: () =>
      P("540,212 584,212 580,62 544,62", "u") + L("M546 62V46 M552 62V40 M572 62V40 M578 62V46 M542 140H582") +
      P("656,212 704,212 704,92 680,40 656,92") + L("M656 150 L704 110 M656 110 L704 150 M656 190 L704 150 M680 40 L680 20"),
  },
  "taipei|TW": {
    skyline: "mid",
    mountains: true,
    clear: [560, 640],
    draw: () => {
      let s = R(578, 170, 44, 42);
      for (let i = 0; i < 8; i++) {
        const y = 170 - (i + 1) * 14;
        s += P(`580,${y + 14} 620,${y + 14} 625,${y} 575,${y}`, "u");
      }
      return s + R(590, 42, 20, 16) + L("M600 42V8") + windows(584, 180, 4, 2, 9, 14, 4, 6);
    },
  },
  "singapore|SG": {
    skyline: "tall",
    water: true,
    clear: [470, 880],
    draw: () =>
      [520, 600, 680].map((x) => P(`${x - 18},212 ${x + 18},212 ${x + 14},88 ${x - 14},88`) + windows(x - 10, 100, 3, 6, 8, 18, 4, 7)).join("") +
      D("M476 88 Q600 72 744 88 L742 78 Q600 62 478 78Z", "b2") +
      [820, 852].map((x) => L(`M${x} 212 V150`) + D(`M${x - 18} 130 Q${x} 160 ${x + 18} 130Z`, "p")).join(""),
  },
  "bangkok|TH": {
    skyline: "mid",
    water: true,
    clear: [480, 720],
    draw: () => {
      const prang = (x: number, top: number, w: number) =>
        D(`M${x - w} 212 L${x - w * 0.7} ${top + 90} L${x - w * 0.4} ${top + 50} Q${x} ${top - 20} ${x + w * 0.4} ${top + 50} L${x + w * 0.7} ${top + 90} L${x + w} 212Z`) +
        L(`M${x - w * 0.8} ${top + 110}H${x + w * 0.8} M${x - w * 0.55} ${top + 76}H${x + w * 0.55} M${x - w * 0.35} ${top + 48}H${x + w * 0.35}`) + L(`M${x} ${top + 2} V${top - 22}`);
      return prang(520, 120, 18) + prang(680, 120, 18) + prang(600, 44, 28);
    },
  },
  "dubai|AE": {
    skyline: "tall",
    water: true,
    clear: [560, 860],
    draw: () =>
      R(586, 150, 28, 62) + R(590, 110, 20, 40) + R(593, 74, 14, 36) + R(596, 44, 8, 30) + L("M600 44V6") + windows(590, 160, 3, 3, 8, 14, 3, 6) +
      D("M790 212 L790 96 Q852 120 848 212Z") + L("M790 96V78 M796 130 Q826 140 838 170 M796 170 Q820 176 842 200"),
  },
  "abu dhabi|AE": { skyline: "tall", water: true },
  "delhi|IN": {
    skyline: "low",
    trees: true,
    clear: [530, 670],
    draw: () => D("M548 212 V122 H652 V212 H624 V162 Q600 134 576 162 V212Z", "t") + R(556, 106, 88, 16, "t") + D("M584 106 Q600 86 616 106Z", "t") + L("M560 140H572 M628 140H640"),
  },
  "new delhi|IN": { skyline: "low", trees: true, draw: () => LANDMARKS["delhi|IN"].draw!(), clear: [530, 670] },
  "agra|IN": {
    skyline: "low",
    trees: true,
    clear: [500, 700],
    draw: () =>
      R(520, 188, 160, 24) + R(552, 140, 96, 48) + D("M586 188 V160 Q600 144 614 160 V188", "n") +
      D("M566 142 Q558 92 600 72 Q642 92 634 142Z") + L("M600 72V50") + C(562, 134, 8) + C(638, 134, 8) +
      [512, 688].map((x) => R(x - 4, 104, 8, 108) + C(x, 102, 7) + R(x - 6, 140, 12, 4) + R(x - 6, 170, 12, 4)).join(""),
  },
  "mumbai|IN": {
    skyline: "mid",
    water: true,
    clear: [520, 680],
    draw: () =>
      D("M540 212 V124 H660 V212 H624 V164 Q600 136 576 164 V212Z", "t") +
      [544, 640].map((x) => R(x, 98, 16, 26, "t") + D(`M${x - 2} 98 Q${x + 8} 82 ${x + 18} 98Z`, "t")).join("") + R(576, 112, 48, 12, "t") + windows(552, 140, 2, 2, 10, 20, 4, 8) + windows(632, 140, 2, 2, 10, 20, 4, 8),
  },
  "istanbul|TR": {
    skyline: "mid",
    water: true,
    clear: [460, 740],
    draw: () =>
      R(520, 160, 160, 52) + D("M520 162 Q546 132 572 162Z", "b2") + D("M628 162 Q654 132 680 162Z", "b2") + D("M556 162 Q600 98 644 162Z") + L("M600 118V100") +
      [480, 500, 700, 720].map((x, i) => {
        const top = i === 0 || i === 3 ? 84 : 66;
        return R(x - 3, top, 6, 212 - top) + P(`${x - 5},${top} ${x + 5},${top} ${x},${top - 26}`, "b2") + R(x - 6, top + 34, 12, 4);
      }).join(""),
  },
  "athens|GR": {
    skyline: "low",
    clear: [440, 780],
    draw: () => {
      let s = D("M440 212 Q470 152 540 146 L680 146 Q740 150 776 212Z", "t") + R(520, 134, 160, 12);
      for (let i = 0; i < 9; i++) s += R(528 + i * 18, 104, 8, 30);
      return s + R(518, 96, 164, 8) + P("518,96 682,96 600,74");
    },
  },
  "rome|IT": {
    skyline: "low",
    trees: true,
    clear: [460, 740],
    draw: () => {
      let s = D("M470 212 V108 H650 L660 118 H690 L700 130 H730 V212Z");
      for (let row = 0; row < 3; row++) {
        const y = 204 - row * 32;
        for (let x = 480; x < (row === 2 ? 640 : 720); x += 22) s += D(`M${x} ${y} V${y - 12} Q${x + 7} ${y - 22} ${x + 14} ${y - 12} V${y}`, "b2");
        s += L(`M470 ${y - 26}H${row === 2 ? 650 : 730}`);
      }
      return s;
    },
  },
  "florence|IT": {
    skyline: "low",
    mountains: true,
    clear: [500, 760],
    draw: () =>
      R(510, 166, 180, 46) + R(560, 126, 80, 40) + D("M556 128 Q560 70 600 60 Q640 70 644 128Z", "t") +
      L("M600 60V128 M580 68 Q570 96 572 128 M620 68 Q630 96 628 128") + R(594, 44, 12, 16) + P("594,44 606,44 600,34") +
      R(716, 72, 28, 140) + R(712, 64, 36, 8) + windows(722, 90, 2, 5, 12, 22, 4, 10) + windows(520, 178, 8, 1, 20, 0, 8, 12),
  },
  "venice|IT": {
    skyline: "low",
    water: true,
    clear: [540, 760],
    draw: () =>
      R(560, 62, 24, 150, "p") + R(556, 54, 32, 10) + P("556,54 588,54 572,24") + windows(566, 80, 2, 4, 8, 24, 4, 12) +
      R(640, 150, 120, 62) + [656, 700, 744].map((x) => D(`M${x - 16} 150 Q${x} 120 ${x + 16} 150Z`, "u")).join("") +
      D("M470 226 Q520 236 570 226 L566 230 Q520 240 474 230Z") + L("M560 226 L572 210"),
  },
  "milan|IT": {
    skyline: "mid",
    clear: [500, 700],
    draw: () => {
      let s = P("500,212 500,140 600,96 700,140 700,212");
      for (let x = 506; x <= 694; x += 14) s += L(`M${x} ${x < 600 ? 140 - (x - 500) * 0.44 : 140 - (700 - x) * 0.44} V${x < 600 ? 116 - (x - 500) * 0.44 : 116 - (700 - x) * 0.44}`);
      return s + L("M600 96V40") + C(600, 36, 4, "t") + windows(520, 160, 9, 2, 20, 22, 6, 12);
    },
  },
  "paris|FR": {
    skyline: "low",
    trees: true,
    clear: [530, 670],
    draw: () =>
      D("M546 212 Q570 172 584 122 L590 82 L596 36 L604 36 L610 82 L616 122 Q630 172 654 212 L632 212 Q614 178 600 178 Q586 178 568 212Z", "b2") +
      R(572, 118, 56, 6, "b2") + R(585, 78, 30, 5, "b2") + L("M600 36V14 M584 122 L600 82 L616 122 M590 82 L600 52 L610 82"),
  },
  "london|GB": {
    skyline: "mid",
    water: true,
    clear: [480, 880],
    draw: () => {
      let s = R(540, 150, 140, 62, "t") + windows(550, 162, 10, 2, 13, 20, 5, 9);
      for (let x = 552; x <= 668; x += 29) s += P(`${x - 4},150 ${x + 4},150 ${x},134`, "t");
      s += R(500, 82, 40, 130, "t") + C(520, 102, 13) + L("M520 102 V94 M520 102 H527") + P("498,82 542,82 520,32", "b2") + L("M520 32V16");
      s += C(800, 138, 64, "n") + C(800, 138, 6);
      for (let a = 0; a < 12; a++) {
        const r = (a / 12) * Math.PI * 2;
        const x = 800 + Math.cos(r) * 64;
        const y = 138 + Math.sin(r) * 64;
        s += L(`M800 138 L${x.toFixed(1)} ${y.toFixed(1)}`) + C(+x.toFixed(1), +y.toFixed(1), 5, "p");
      }
      return s + L("M800 138 L772 212 M800 138 L828 212");
    },
  },
  "edinburgh|GB": {
    skyline: "low",
    clear: [440, 780],
    draw: () =>
      D("M440 212 L470 152 Q520 122 600 126 L720 132 L776 212Z", "b2") + R(500, 100, 200, 28, "t") +
      [500, 560, 640, 690].map((x, i) => R(x, i % 2 ? 84 : 76, 18, 30, "t") + L(`M${x} ${i % 2 ? 84 : 76} h4 v-5 h4 v5 h4 v-5 h4 v5 h2`)).join("") + windows(520, 110, 8, 1, 22, 0, 5, 8),
  },
  "dublin|IE": { skyline: "low", water: true, trees: true },
  "amsterdam|NL": {
    skyline: "low",
    water: true,
    clear: [400, 800],
    draw: () => houseRow(410, 9, [3, 7, 2, 9, 4, 6, 1, 8, 5], ["b", "p", "u", "t", "b2", "g", "b", "p", "t"]),
  },
  "barcelona|ES": {
    skyline: "mid",
    water: true,
    clear: [500, 700],
    draw: () => {
      let s = R(530, 150, 140, 62, "t");
      [[548, 72], [572, 52], [628, 52], [652, 72], [600, 26]].forEach(([x, top]) => {
        const w = x === 600 ? 9 : 10;
        s += D(`M${x - w} 150 L${x - w + 3} ${top + 16} Q${x} ${top} ${x + w - 3} ${top + 16} L${x + w} 150Z`, "t") + L(`M${x - 3} ${top + 40} h6 M${x - 4} ${top + 60} h8 M${x - 4} ${top + 80} h8`);
      });
      return s + L("M600 26V14 M596 18H604") + windows(546, 176, 6, 1, 20, 0, 6, 14);
    },
  },
  "madrid|ES": { skyline: "mid", trees: true },
  "lisbon|PT": {
    skyline: "low",
    water: true,
    clear: [540, 1200],
    draw: () =>
      R(560, 150, 80, 62) + R(576, 98, 48, 52) + L("M576 98 h6 v-6 h6 v6 h6 v-6 h6 v6 h6 v-6 h6 v6 h6") +
      [560, 636].map((x) => R(x - 2, 136, 10, 14) + D(`M${x - 4} 136 Q${x + 3} 124 ${x + 10} 136Z`, "t")).join("") + windows(586, 112, 3, 2, 12, 16, 5, 8) +
      R(820, 86, 12, 126, "p") + R(1010, 86, 12, 126, "p") + D("M700 170 Q760 166 826 88 Q920 160 1016 88 Q1080 166 1200 170", "n") + L("M660 170H1200 M660 175H1200"),
  },
  "porto|PT": { skyline: "low", water: true },
  "berlin|DE": {
    skyline: "mid",
    trees: true,
    clear: [520, 830],
    draw: () => {
      let s = P("553,212 567,212 563,82 557,82") + C(560, 74, 16) + R(556, 50, 8, 10, "b2") + L("M560 50V12 M556 40H564 M557 28H563") + windows(550, 70, 3, 1, 7, 0, 3, 4);
      for (let i = 0; i < 6; i++) s += R(716 + i * 18, 150, 8, 62);
      return s + R(708, 136, 104, 14) + R(730, 124, 60, 12) + D("M748 124 Q760 108 772 124Z", "g");
    },
  },
  "munich|DE": { skyline: "low", mountains: true, trees: true },
  "prague|CZ": {
    skyline: "low",
    water: true,
    clear: [380, 700],
    draw: () =>
      R(550, 140, 100, 72) + D("M552 140 V98 L568 50 L584 98 V140Z", "b2") + D("M616 140 V98 L632 50 L648 98 V140Z", "b2") +
      L("M556 98 L556 86 M580 98 L580 86 M620 98 L620 86 M644 98 L644 86") + windows(566, 156, 4, 2, 20, 22, 6, 12) +
      D("M380 200 H540 V212 H520 Q508 200 496 212 H476 Q464 200 452 212 H432 Q420 200 408 212 H388Z", "b2"),
  },
  "budapest|HU": {
    skyline: "low",
    water: true,
    clear: [430, 770],
    draw: () => {
      let s = R(440, 150, 320, 62) + D("M570 150 Q570 106 600 96 Q630 106 630 150Z", "p") + L("M600 96V58") + windows(452, 164, 14, 2, 22, 22, 6, 10);
      for (let x = 452; x <= 748; x += 37) if (Math.abs(x - 600) > 30) s += P(`${x - 5},150 ${x + 5},150 ${x},122`, "b2");
      return s;
    },
  },
  "vienna|AT": { skyline: "low", trees: true },
  "moscow|RU": {
    skyline: "mid",
    clear: [530, 680],
    draw: () =>
      R(540, 150, 120, 62) + P("588,150 612,150 600,58", "g") + L("M600 58V44") +
      onion(556, 116, "u") + onion(644, 116, "p") + onion(576, 104, "g") + onion(624, 104, "t") + windows(552, 168, 6, 2, 18, 20, 5, 9),
  },
  "reykjavik|IS": {
    skyline: "low",
    mountains: true,
    water: true,
    clear: [510, 690],
    draw: () =>
      P("520,212 520,190 532,190 532,170 544,170 544,150 556,150 556,128 568,128 568,104 580,104 580,72 592,72 600,30 608,72 620,72 620,104 632,104 632,128 644,128 644,150 656,150 656,170 668,170 668,190 680,190 680,212") +
      L("M600 30V18") + windows(594, 84, 1, 4, 0, 26, 12, 8),
  },
  "new york|US": {
    skyline: "tall",
    water: true,
    clear: [520, 710],
    draw: () =>
      R(536, 122, 48, 90) + R(544, 92, 32, 30) + R(550, 72, 20, 20) + R(555, 56, 10, 16) + L("M560 56V16") + windows(542, 132, 4, 5, 10, 15, 4, 7) +
      R(664, 98, 32, 114, "b2") + D("M664 98 Q680 58 696 98Z") + L("M668 98 Q680 70 692 98 M672 98 Q680 80 688 98 M680 66V26") + windows(668, 110, 3, 6, 9, 16, 4, 7),
  },
  "san francisco|US": {
    skyline: "mid",
    water: true,
    mountains: true,
    clear: [300, 1000],
    draw: () =>
      D("M300 160 H1000 V166 H300Z", "p") +
      [516, 760].map((x) => R(x - 12, 48, 8, 164, "p") + R(x + 4, 48, 8, 164, "p") + R(x - 12, 70, 24, 6, "p") + R(x - 12, 112, 24, 6, "p")).join("") +
      D("M300 158 Q420 150 508 52 Q640 150 768 52 Q860 150 1000 158", "n") +
      [560, 600, 640, 680, 720, 400, 440, 470, 810, 850, 900].map((x) => L(`M${x} 160 V${x < 516 ? 150 - (516 - x) * 0.15 : x > 760 ? 150 - (x - 760) * 0.12 : 112 + Math.abs(638 - x) * 0.45}`)).join(""),
  },
  "los angeles|US": {
    skyline: "low",
    mountains: true,
    clear: [340, 900],
    draw: () =>
      D("M420 212 Q540 122 700 132 Q780 150 840 212Z", "g") + R(560, 106, 80, 26) + D("M584 106 Q600 84 616 106Z", "b2") +
      D("M558 108 Q566 96 574 108Z", "b2") + D("M626 108 Q634 96 642 108Z", "b2") + palm(360, 80) + palm(392, 64) + palm(860, 84) + palm(892, 66),
  },
  "las vegas|US": { skyline: "tall", mountains: true },
  "seattle|US": {
    skyline: "tall",
    mountains: true,
    water: true,
    clear: [560, 1040],
    draw: () =>
      D("M700 212 L860 92 L1020 212Z", "b2") + P("832,113 860,92 888,113 874,108 860,117 846,108", "b") +
      D("M584 212 Q598 152 596 112 L604 112 Q602 152 616 212Z") + D("M566 106 Q600 92 634 106 L622 114 H578Z") + R(590, 92, 20, 8, "b2") + L("M600 92V38"),
  },
  "chicago|US": {
    skyline: "tall",
    water: true,
    clear: [520, 730],
    draw: () =>
      R(536, 92, 48, 120, "b2") + R(542, 62, 36, 30, "b2") + R(550, 46, 20, 16, "b2") + L("M554 46V14 M566 46V18") + windows(540, 100, 4, 7, 11, 15, 4, 7) +
      P("684,212 716,212 710,72 690,72") + L("M686 200 L714 160 M686 160 L713 120 M714 200 L686 160 M714 160 L688 120 M688 120 L711 82 M711 120 L690 82 M694 72V40 M706 72V44"),
  },
  "washington|US": {
    skyline: "low",
    trees: true,
    clear: [490, 840],
    draw: () => {
      let s = R(500, 170, 200, 42) + R(560, 140, 80, 30) + R(574, 112, 52, 28) + D("M572 114 Q574 78 600 70 Q626 78 628 114Z") + L("M600 70V56") + R(596, 52, 8, 6);
      for (let x = 578; x <= 622; x += 8) s += L(`M${x} 114 V138`);
      return s + windows(508, 182, 8, 1, 24, 0, 6, 10) + P("812,212 828,212 824,46 816,46") + P("816,46 824,46 820,34");
    },
  },
  "boston|US": { skyline: "tall", water: true },
  "miami|US": { skyline: "tall", water: true, draw: () => palm(420, 80) + palm(460, 64) + palm(760, 78) + palm(800, 60) },
  "honolulu|US": {
    skyline: "mid",
    water: true,
    clear: [500, 860],
    draw: () => D("M520 212 Q600 112 700 122 Q780 142 846 212Z", "t") + L("M560 170 Q600 150 640 160 M690 150 Q730 160 770 190") + palm(470, 80) + palm(880, 70),
  },
  "toronto|CA": {
    skyline: "tall",
    water: true,
    clear: [560, 760],
    draw: () =>
      P("592,212 608,212 603,76 597,76") + D("M582 86 Q600 70 618 86 Q600 98 582 86Z") + R(596, 54, 8, 22) + L("M600 54V8") +
      D("M660 212 Q700 172 740 212Z", "b2"),
  },
  "vancouver|CA": { skyline: "tall", mountains: true, water: true },
  "montreal|CA": { skyline: "mid", mountains: true },
  "mexico city|MX": {
    skyline: "mid",
    mountains: true,
    clear: [560, 640],
    draw: () => R(576, 190, 48, 22) + R(584, 178, 32, 12) + R(596, 72, 8, 106) + R(592, 68, 16, 6) + D("M588 62 Q600 40 612 62 L606 58 L600 66 L594 58Z", "t") + L("M600 44V34"),
  },
  "rio de janeiro|BR": {
    skyline: "mid",
    water: true,
    clear: [360, 900],
    draw: () =>
      D("M370 212 L520 72 L650 212Z", "g") + R(518, 46, 4, 26) + R(506, 52, 28, 4) + C(520, 43, 3) +
      D("M760 212 Q770 122 820 102 Q862 112 872 212Z", "g") + D("M680 212 Q700 160 740 170 Q760 180 770 212Z", "g") + D("M740 164 Q780 120 818 104", "n"),
  },
  "buenos aires|AR": { skyline: "mid", clear: [580, 620], draw: () => P("590,212 610,212 606,62 594,62") + P("594,62 606,62 600,46") + windows(597, 80, 1, 3, 0, 16, 6, 5) },
  "sydney|AU": {
    skyline: "tall",
    water: true,
    clear: [460, 1000],
    draw: () =>
      R(470, 196, 170, 16, "t") +
      D("M478 196 Q494 150 532 140 Q522 170 532 196Z") + D("M520 196 Q536 140 580 128 Q568 166 578 196Z") + D("M568 196 Q586 150 626 140 Q614 172 622 196Z") +
      D("M720 196 Q840 86 960 196", "n") + D("M736 196 Q840 106 944 196", "n") + L("M700 172H980 M700 177H980") +
      R(718, 150, 18, 46, "t") + R(944, 150, 18, 46, "t") + [780, 810, 840, 870, 900].map((x) => L(`M${x} 172 V${120 + Math.abs(840 - x) * 0.55}`)).join(""),
  },
  "melbourne|AU": { skyline: "tall", water: true },
  "auckland|NZ": {
    skyline: "mid",
    water: true,
    mountains: true,
    clear: [570, 630],
    draw: () => P("594,212 606,212 603,92 597,92") + D("M584 98 Q600 82 616 98 Q600 110 584 98Z") + R(592, 72, 16, 18) + L("M600 72V14"),
  },
  "cairo|EG": {
    skyline: "low",
    clear: [460, 900],
    draw: () =>
      P("470,212 560,120 650,212", "t") + L("M560 120 L580 212") + P("580,212 680,100 780,212", "t") + L("M680 100 L702 212") + P("764,212 822,150 880,212", "t") + palm(420, 70) + palm(920, 60),
  },
  "giza|EG": { skyline: "low", draw: () => LANDMARKS["cairo|EG"].draw!(), clear: [460, 900] },
  "marrakesh|MA": {
    skyline: "low",
    clear: [560, 640],
    draw: () => R(578, 72, 44, 140, "t") + R(588, 48, 24, 24, "t") + L("M600 48V32") + C(600, 30, 3, "t") + windows(590, 96, 2, 4, 14, 26, 6, 12) + palm(500, 70) + palm(700, 64),
  },
  "cape town|ZA": {
    skyline: "mid",
    water: true,
    clear: [290, 1050],
    draw: () => D("M300 212 L382 122 L422 92 H820 L860 122 L940 212Z", "g") + D("M950 212 Q990 120 1020 110 Q1050 120 1080 212Z", "g") + L("M440 100 H800"),
  },
  "kuala lumpur|MY": {
    skyline: "tall",
    clear: [530, 670],
    draw: () =>
      [560, 640].map((x) => R(x - 16, 112, 32, 100) + R(x - 12, 82, 24, 30) + R(x - 8, 60, 16, 22) + L(`M${x} 60 V14`) + windows(x - 12, 122, 3, 5, 10, 16, 4, 7)).join("") + R(576, 120, 48, 6, "b2"),
  },
};

/** Spelling variants and neighbourhoods that should share a landmark. */
const ALIASES: Record<string, string> = {
  "new york city|US": "new york|US",
  "manhattan|US": "new york|US",
  "brooklyn|US": "new york|US",
  "washington, d.c.|US": "washington|US",
  "washington dc|US": "washington|US",
  "marrakech|MA": "marrakesh|MA",
  "rio|BR": "rio de janeiro|BR",
  "firenze|IT": "florence|IT",
  "roma|IT": "rome|IT",
  "venezia|IT": "venice|IT",
  "lisboa|PT": "lisbon|PT",
  "praha|CZ": "prague|CZ",
  "wien|AT": "vienna|AT",
  "münchen|DE": "munich|DE",
  "reykjavík|IS": "reykjavik|IS",
  "ciudad de méxico|MX": "mexico city|MX",
  "bombay|IN": "mumbai|IN",
};

export function landmarkFor(name: string, countryCode?: string): LandmarkSpec | undefined {
  const key = `${name.trim().toLowerCase()}|${(countryCode ?? "").toUpperCase()}`;
  return LANDMARKS[key] ?? LANDMARKS[ALIASES[key] ?? ""];
}

export const LANDMARK_CITIES = Object.keys(LANDMARKS);
