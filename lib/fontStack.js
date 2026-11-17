// One font stack for every page: Inter for Latin letters, IBM Plex Sans Arabic for Arabic,
// then their metric-matched fallbacks. The order matters: "Inter Fallback" is Arial, which
// also has Arabic letters, so it must come after the Arabic web font or Plex is never used.
export function fontStack(latin, arabic) {
  const [l, lf] = latin.style.fontFamily.split(",").map((s) => s.trim());
  const [a, af] = arabic.style.fontFamily.split(",").map((s) => s.trim());
  return [l, a, lf, af, "system-ui", "sans-serif"].filter(Boolean).join(", ");
}
