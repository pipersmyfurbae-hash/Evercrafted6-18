import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type Rgb = [number, number, number];

function linearSrgbFromOklch(lightness: number, chroma: number, hue: number): Rgb {
  const angle = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(angle);
  const b = chroma * Math.sin(angle);
  const lRoot = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;
  return [
    Math.min(1, Math.max(0, 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    Math.min(1, Math.max(0, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    Math.min(1, Math.max(0, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  ];
}

function rgbFromHex(hex: string): Rgb {
  const value = hex.replace("#", "");
  return [0, 2, 4].map(index => {
    const channel = Number.parseInt(value.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
}

function luminance([red, green, blue]: Rgb) { return 0.2126 * red + 0.7152 * green + 0.0722 * blue; }
function contrastRatio(foreground: Rgb, background: Rgb) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function readOklchToken(styles: string, token: string): Rgb {
  const match = styles.match(new RegExp(`${token}: oklch\\(([^)]+)\\)`));
  if (!match) throw new Error(`Missing ${token} token`);
  const [lightness, chroma, hue] = match[1].replace("/", " ").trim().split(/\s+/).slice(0, 3).map(Number);
  return linearSrgbFromOklch(lightness, chroma, hue);
}

describe("experience contrast token evidence", () => {
  const styles = readFileSync(path.resolve(import.meta.dirname, "../client/src/index.css"), "utf8");

  it("keeps the semantic light and dark token pairs above WCAG AA normal-text contrast", () => {
    const pairs = [
      ["light foreground on background", readOklchToken(styles, "--foreground"), readOklchToken(styles, "--background")],
      ["light card foreground on card", readOklchToken(styles, "--card-foreground"), readOklchToken(styles, "--card")],
      ["light primary foreground on primary", readOklchToken(styles, "--primary-foreground"), readOklchToken(styles, "--primary")],
      ["dark foreground on background", readOklchToken(styles.slice(styles.indexOf(".dark")), "--foreground"), readOklchToken(styles.slice(styles.indexOf(".dark")), "--background")],
      ["dark card foreground on card", readOklchToken(styles.slice(styles.indexOf(".dark")), "--card-foreground"), readOklchToken(styles.slice(styles.indexOf(".dark")), "--card")],
      ["dark primary foreground on primary", readOklchToken(styles.slice(styles.indexOf(".dark")), "--primary-foreground"), readOklchToken(styles.slice(styles.indexOf(".dark")), "--primary")],
    ] as const;
    pairs.forEach(([label, foreground, background]) => expect(contrastRatio(foreground, background), label).toBeGreaterThanOrEqual(4.5));
  });

  it("keeps direct Evercrafted, Client, administration, and Personal text/alert pairs above WCAG AA normal-text contrast", () => {
    const pairs = [
      ["Evercrafted body", "#251f1b", "#faf8f5"],
      ["Client body", "#17202b", "#f7f9fc"],
      ["Administration success", "#405c4c", "#ffffff"],
      ["Administration alert", "#9e3e32", "#ffffff"],
      ["Personal foreground", "#f6f0e5", "#262422"],
      ["Personal action", "#3e5d49", "#f6f0e5"],
    ] as const;
    pairs.forEach(([label, foreground, background]) => expect(contrastRatio(rgbFromHex(foreground), rgbFromHex(background)), label).toBeGreaterThanOrEqual(4.5));
  });
});
