export function playbackPresentation(name, level, playing, pending) {
  const selected = Boolean(name);
  return {
    fileText: !selected ? 'No file. No glory.' : playing ? `${name} is on stage.` : pending ? `${name} is tuning up.` : `${name} is standing by.`,
    playText: playing ? (level === 0 ? 'Playing silently' : level === 11 ? 'Playing too loud' : 'Playing loud') : pending ? 'Tuning up...' : 'Play it loud',
    playDisabled: !selected || playing || pending,
    stopDisabled: !playing && !pending,
  };
}

// A stop on a playing element queues a pause event, even if Play is clicked
// again before that event is dispatched. Media-element events keep queue order.
export function createPauseGuard() {
  let stoppedPauses = 0;
  return {
    recordStop(wasPaused) { if (!wasPaused) stoppedPauses += 1; },
    shouldHandlePause() {
      if (!stoppedPauses) return true;
      stoppedPauses -= 1;
      return false;
    },
  };
}
