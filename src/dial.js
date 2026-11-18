export function levelFromPointer(x, y) {
  const degrees = Math.atan2(x, -y) * 180 / Math.PI;
  return Math.round((Math.max(-135, Math.min(135, degrees)) + 135) * 11 / 270);
}

export function levelFromKey(key, current) {
  if (key === 'Home') return 0;
  if (key === 'End') return 11;
  if (key === 'ArrowUp' || key === 'ArrowRight') return Math.min(11, current + 1);
  if (key === 'ArrowDown' || key === 'ArrowLeft') return Math.max(0, current - 1);
  return null;
}
