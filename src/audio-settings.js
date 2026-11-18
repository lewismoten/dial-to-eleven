export function elevenSettings(level) {
  if (!Number.isFinite(level) || level < 0 || level > 11) {
    throw new RangeError('The knob only travels from 0 to 11.');
  }

  const intensity = level / 10;
  const isEleven = level === 11;
  return {
    preGainDb: isEleven ? 26 : intensity * 8,
    drive: isEleven ? 800 : intensity * 110,
    compressorThresholdDb: isEleven ? -30 : -6 - intensity * 12,
    compressorRatio: isEleven ? 20 : 2 + intensity * 8,
    outputGain: level === 0 ? 0 : isEleven ? 0.65 : 1 - intensity * 0.2,
    presenceDb: isEleven ? 8 : intensity * 4,
  };
}
