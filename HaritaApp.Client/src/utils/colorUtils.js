// Altın oran (golden ratio conjugate) ile HSL renk üretimi
const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;

export const getRouteColor = (id) => {
  const n = Math.abs(id);
  const hue = ((n * GOLDEN_RATIO_CONJUGATE) % 1) * 360;
  const saturation = 82 + (n % 5) * 3;
  const lightness = 48 + (n % 7) * 1.5;
  return `hsl(${hue.toFixed(1)}, ${saturation}%, ${lightness.toFixed(1)}%)`;
};
