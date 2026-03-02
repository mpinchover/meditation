let currentSound = 'Soft rain';
let currentDurationMinutes = 10;

export function getCurrentSound() {
  return currentSound;
}

export function setCurrentSound(name: string) {
  currentSound = name;
}

export function getCurrentDurationMinutes() {
  return currentDurationMinutes;
}

export function setCurrentDurationMinutes(minutes: number) {
  currentDurationMinutes = minutes;
}

