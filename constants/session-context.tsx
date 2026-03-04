import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type MeditationTrack = {
  title: string;
  media_url: string;
  uuid: string;
  media_type: string;
};

type SessionStateContextValue = {
  currentSound: string;
  setCurrentSound: React.Dispatch<React.SetStateAction<string>>;
  currentEndingBell: string;
  setCurrentEndingBell: React.Dispatch<React.SetStateAction<string>>;
  currentDurationMinutes: number;
  setCurrentDurationMinutes: React.Dispatch<React.SetStateAction<number>>;
  availableTracks: MeditationTrack[];
  availableEndingBells: MeditationTrack[];
};

const DEFAULT_SOUND = 'Soft rain';
const DEFAULT_ENDING_BELL = '';
const DEFAULT_TRACKS: MeditationTrack[] = [
  {
    title: DEFAULT_SOUND,
    media_url: '',
    uuid: 'local-default',
    media_type: 'SOUNDSCAPE',
  },
];
const DEFAULT_ENDING_BELLS: MeditationTrack[] = [];

const SessionStateContext = createContext<SessionStateContextValue | null>(null);

async function fetchTracksFromServer() {
  const response = await fetch('http://127.0.0.1:5000/tracks');
  if (!response.ok) {
    throw new Error('Failed to fetch tracks');
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) return [];

  return payload
    .map((track: any) => ({
      title: String(track?.title ?? ''),
      media_url: String(track?.media_url ?? ''),
      uuid: String(track?.uuid ?? track?.title ?? ''),
      media_type: String(track?.media_type ?? '').toUpperCase(),
    }))
    .filter((track) => track.title.length > 0 && track.media_url.length > 0);
}

export function SessionStateProvider({ children }: { children: React.ReactNode }) {
  const [currentSound, setCurrentSound] = useState(DEFAULT_SOUND);
  const [currentEndingBell, setCurrentEndingBell] = useState(DEFAULT_ENDING_BELL);
  const [currentDurationMinutes, setCurrentDurationMinutes] = useState(1);
  const [availableTracks, setAvailableTracks] = useState<MeditationTrack[]>(DEFAULT_TRACKS);
  const [availableEndingBells, setAvailableEndingBells] = useState<MeditationTrack[]>(DEFAULT_ENDING_BELLS);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const tracks = await fetchTracksFromServer();
        if (!isMounted || tracks.length === 0) return;

        const soundscapes = tracks.filter((track) => track.media_type === 'SOUNDSCAPE');
        const endingBells = tracks.filter((track) => track.media_type === 'BELL');

        if (soundscapes.length > 0) {
          setAvailableTracks(soundscapes);
        }
        if (endingBells.length > 0) {
          setAvailableEndingBells(endingBells);
        }

        setCurrentSound((previousSound) => {
          return soundscapes.some((track) => track.title === previousSound)
            ? previousSound
            : (soundscapes[0]?.title ?? previousSound);
        });
        setCurrentEndingBell((previousBell) => {
          return endingBells.some((track) => track.title === previousBell)
            ? previousBell
            : (endingBells[0]?.title ?? previousBell);
        });
      } catch {
        // Keep local defaults when backend is unavailable.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      currentSound,
      setCurrentSound,
      currentEndingBell,
      setCurrentEndingBell,
      currentDurationMinutes,
      setCurrentDurationMinutes,
      availableTracks,
      availableEndingBells,
    }),
    [
      availableEndingBells,
      availableTracks,
      currentDurationMinutes,
      currentEndingBell,
      currentSound,
    ]
  );

  return <SessionStateContext.Provider value={value}>{children}</SessionStateContext.Provider>;
}

export function useSessionState() {
  const context = useContext(SessionStateContext);
  if (!context) {
    throw new Error('useSessionState must be used within a SessionStateProvider');
  }
  return context;
}
