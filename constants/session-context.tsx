import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type MeditationTrack = {
  title: string;
  media_url: string;
  uuid: string;
};

type SessionStateContextValue = {
  currentSound: string;
  setCurrentSound: React.Dispatch<React.SetStateAction<string>>;
  currentDurationMinutes: number;
  setCurrentDurationMinutes: React.Dispatch<React.SetStateAction<number>>;
  availableTracks: MeditationTrack[];
};

const DEFAULT_SOUND = 'Soft rain';
const DEFAULT_TRACKS: MeditationTrack[] = [
  {
    title: DEFAULT_SOUND,
    media_url: '',
    uuid: 'local-default',
  },
];

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
      uuid: String(track?.uuid ?? ''),
    }))
    .filter((track) => track.title.length > 0);
}

export function SessionStateProvider({ children }: { children: React.ReactNode }) {
  const [currentSound, setCurrentSound] = useState(DEFAULT_SOUND);
  const [currentDurationMinutes, setCurrentDurationMinutes] = useState(10);
  const [availableTracks, setAvailableTracks] = useState<MeditationTrack[]>(DEFAULT_TRACKS);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const tracks = await fetchTracksFromServer();
        if (!isMounted || tracks.length === 0) return;

        setAvailableTracks(tracks);
        setCurrentSound((previousSound) => {
          return tracks.some((track) => track.title === previousSound)
            ? previousSound
            : tracks[0].title;
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
      currentDurationMinutes,
      setCurrentDurationMinutes,
      availableTracks,
    }),
    [availableTracks, currentDurationMinutes, currentSound]
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
