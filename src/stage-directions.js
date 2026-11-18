const warnings = [
  'THE WARRANTY HAS LEFT THE ROOM',
  'THE TROUSERS HAVE FILED A COMPLAINT',
  'THE WALLS ARE REQUESTING EARPLUGS',
  'THE ROAD CREW DENIES EVERYTHING',
];

const tourBus = [
  'The dial has no indoor voice.',
  'Please keep all trousers inside the venue.',
  'The sound engineer has asked for a moment.',
  'We have mistaken confidence for calibration.',
  'A modest volume incident is now in progress.',
  'This amplifier was raised by wolves.',
  'The road crew says the smoke is normal.',
  'Somewhere, a sensible knob stops at ten.',
  'No riffs were harmed. Several walls were.',
  'The neighbors have requested a set list.',
  'A quiet rehearsal was briefly considered.',
  'Our insurance agent has gone home.',
  'The drummer would like the floor back.',
  'This is not what the warranty meant.',
  'The stage has developed an opinion.',
  'Please do not feed the amplifier.',
  'Every cable is now a dramatic entrance.',
  'The mixer is making a face.',
  'This setting has its own dressing room.',
  'The bass has been promoted to structural engineer.',
  'The curtains have requested earplugs.',
  'The fog machine is unionizing.',
  'A polite note from the fire marshal is pending.',
  'The guitar solo has booked a second encore.',
  'The meter is pretending not to know us.',
  'The monitors are negotiating hazard pay.',
  'The stage manager has written an apology.',
  'This cabinet contains excessive confidence.',
  'A tiny amp with very large ambitions.',
  'The exit sign is looking nervous.',
];

const elevenOnly = [
  'The volume is now a weather event.',
  'The pyro crew has mistaken this for permission.',
  'The ceiling has asked to be excused.',
  'We have entered the trousers-on-fire portion.',
  'The warranty has become a smoke signal.',
  'The roadies are speaking in hand gestures.',
  'This is not a rehearsal. It is a zoning issue.',
  'The front row has developed new hairstyles.',
  'The fire marshal is tapping a foot. Nervously.',
  'The speakers have requested separate dressing rooms.',
  'Please applaud the surviving floorboards.',
  'The dial has left the building. It took the building.',
];

export const messageCount = tourBus.length;

export function rollingMessage(level, tick) {
  const messages = level === 11 ? elevenOnly : tourBus;
  return messages[Math.floor(tick) % messages.length];
}

export function pyroVisible(level, reducedMotion) {
  return level === 11 && !reducedMotion;
}

export function stageLine(level, beat) {
  if (level === 0) return 'THE DRUMMER CAN HEAR HIMSELF THINK';
  if (level !== 11) return 'LOUDER THAN NECESSARY';
  return warnings[Math.floor(beat) % warnings.length];
}
