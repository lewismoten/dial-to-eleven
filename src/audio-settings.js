export function tremoloDepth(level, moreEleven) {
  return level === 11 && moreEleven ? 0.27 : 0;
}

export function elevenSettings(level, moreEleven = false) {
  if (!Number.isFinite(level) || level < 0 || level > 11) {
    throw new RangeError('The knob only travels from 0 to 11.');
  }

  const intensity = level / 10;
  const isEleven = level === 11;
  const extra = isEleven && moreEleven;
  return {
    preGainDb: extra ? 34 : isEleven ? 26 : intensity * 8,
    drive: extra ? 1900 : isEleven ? 800 : intensity * 110,
    compressorThresholdDb: extra ? -36 : isEleven ? -30 : -6 - intensity * 12,
    compressorRatio: isEleven ? 20 : 2 + intensity * 8,
    outputGain: level === 0 ? 0 : extra ? 0.52 : isEleven ? 0.65 : 1 - intensity * 0.2,
    presenceDb: extra ? 10 : isEleven ? 8 : intensity * 4,
  };
}
