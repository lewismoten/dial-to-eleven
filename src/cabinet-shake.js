export function cabinetShake(samples, level, playing, reducedMotion = false) {
  if (level !== 11 || !playing || reducedMotion || samples.length === 0) return 0;
  let energy = 0;
  for (const sample of samples) {
    const centered = (sample - 128) / 128;
    energy += centered * centered;
  }
  return Math.min(3, Math.sqrt(energy / samples.length) * 4);
}

export function cabinetMotion(samples, level, playing, reducedMotion = false) {
  const energy = cabinetShake(samples, level, playing, reducedMotion);
  const still = { textX: 0, textY: 0, cabinetX: 0, cabinetY: 0, blur: 0 };
  if (energy === 0) return still;
  const sample = (fraction) => (samples[Math.floor(samples.length * fraction)] - 128) / 128;
  return {
    textX: sample(.25) * energy,
    textY: sample(.5) * energy * .6,
    cabinetX: sample(.75) * energy * .45,
    cabinetY: sample(0) * energy * .35,
    blur: energy > 2 ? (energy - 2) * .65 : 0,
  };
}

