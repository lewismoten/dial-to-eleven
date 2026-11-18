export function connectInput(sourceNode, firstEffect) {
  sourceNode.connect(firstEffect);
}

export function distortionCurve(drive, samples = 44101) {
  const curve = new Float32Array(samples);
  for (let index = 0; index < samples; index += 1) {
    const x = (index * 2) / (samples - 1) - 1;
    curve[index] = drive === 0 ? x : Math.tanh(x * (1 + drive / 24));
  }
  return curve;
}
