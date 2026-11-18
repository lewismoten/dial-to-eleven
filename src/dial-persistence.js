export const DIAL_STORAGE_KEY = 'dial-to-eleven:level';
export const MORE_ELEVEN_STORAGE_KEY = 'dial-to-eleven:more-eleven';

export function initialMoreEleven(savedValue) {
  return savedValue === 'true';
}

export function initialDialLevel(savedValue) {
  if (typeof savedValue === 'string' && /^(?:[0-9]|10|11)$/.test(savedValue)) {
    return Number(savedValue);
  }
  return 3;
}
