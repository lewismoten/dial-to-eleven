const warnings = [
  'THE WARRANTY HAS LEFT THE ROOM',
  'THE TROUSERS HAVE FILED A COMPLAINT',
  'THE WALLS ARE REQUESTING EARPLUGS',
  'THE ROAD CREW DENIES EVERYTHING',
];

export function stageLine(level, beat) {
  if (level === 0) return 'THE DRUMMER CAN HEAR HIMSELF THINK';
  if (level !== 11) return 'LOUDER THAN NECESSARY';
  return warnings[Math.floor(beat) % warnings.length];
}
