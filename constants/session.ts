let currentSound = 'Soft rain';
let currentDurationMinutes = 10;
let hasAttemptedSoundsLoad = false;

type Listener = () => void;
const listeners = new Set<Listener>();

type MeditationTrack = {
  title: string;
  media_url: string;
  uuid: string;
};

let availableTracks: MeditationTrack[] = [
  {
    title: currentSound,
    media_url: '',
    uuid: 'local-default',
  },
];

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function getCurrentSound() {
  return currentSound;
}

export function setCurrentSound(name: string) {
  currentSound = name;
  notifyListeners();
}

export function getCurrentDurationMinutes() {
  return currentDurationMinutes;
}

export function setCurrentDurationMinutes(minutes: number) {
  currentDurationMinutes = minutes;
}

export function getAvailableSounds() {
  const sounds = availableTracks.map((track) => track.title).filter(Boolean);
  return sounds.length > 0 ? sounds : [currentSound];
}

export function getTrackMediaUrlByTitle(name: string) {
  return availableTracks.find((track) => track.title === name)?.media_url;
}

export function subscribeToSessionChanges(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function fetchTracksFromServer() {

  try {
    const response = await fetch(`${'http://127.0.0.1:5000'}/sounds`);
    if (!response.ok) throw new Error('Failed to fetch sounds');

    const payload = await response.json();
    const tracks = payload.map((track: any) => {
      return {
        title: track.title,
        media_url: track.media_url,
        uuid: track.uuid,
      };
    });
    
    if (tracks.length > 0) {
      availableTracks = tracks;
      if (!availableTracks.some((track) => track.title === currentSound)) {
        currentSound = availableTracks[0].title;
      }

      notifyListeners();
      return;
    }
  } catch {
    // try next URL
  }
 
}

export async function loadAvailableSoundsOnAppStart() {
  if (hasAttemptedSoundsLoad) return;
  hasAttemptedSoundsLoad = true;
  await fetchTracksFromServer();
}

