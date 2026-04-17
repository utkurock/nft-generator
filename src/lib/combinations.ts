import type { AntiRule, Layer } from "./types";

/**
 * Theoretical maximum of unique random combinations from the given layers,
 * factoring in optional "None" slots and subtracting a loose estimate of
 * anti-rule eliminations (ignores overlapping-rule double counting, so this
 * is a lower bound when multiple rules interact).
 */
export function calculateMaxRandomCombinations(
  layers: Layer[],
  antiRules: AntiRule[] = []
): number {
  if (layers.length === 0) return 0;

  const sizes = new Map<number, number>();
  for (const l of layers) {
    const size = l.assets.length + (l.optional ? 1 : 0);
    if (size === 0) return 0;
    sizes.set(l.id, size);
  }

  const rawMax = [...sizes.values()].reduce((a, b) => a * b, 1);
  if (antiRules.length === 0) return rawMax;

  let forbidden = 0;
  for (const rule of antiRules) {
    let count = 1;
    for (const [lid, size] of sizes) {
      if (lid === rule.layer1Id || lid === rule.layer2Id) continue;
      count *= size;
    }
    forbidden += count;
  }
  return Math.max(rawMax - forbidden, 0);
}
