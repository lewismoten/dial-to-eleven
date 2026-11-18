export function elevenSettings(level) {
  if (!Number.isFinite(level) || level < 0 || level > 11) {
    throw new RangeError('The knob only travels from 0 to 11.');
  }

  const intensity = level / 11;
  return {
    preGainDb: intensity * 24,
    drive: intensity * 420,
    compressorThresholdDb: -6 - intensity * 24,
    compressorRatio: 2 + intensity * 18,
    outputGain: 1 - intensity * 0.26,
    presenceDb: intensity * 8,
  };
}
