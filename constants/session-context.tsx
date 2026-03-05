import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

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
  isTracksLoading: boolean;
  fetchTracks: () => Promise<void>;
};

const DEFAULT_ENDING_BELL = '';
const DEFAULT_ENDING_BELLS: MeditationTrack[] = [];

const SessionStateContext = createContext<SessionStateContextValue | null>(null);

async function fetchTracksFromServer() {
  const response = await fetch('http://127.0.0.1:5000/sounds');
  if (!response.ok) {
    throw new Error('Failed to fetch sounds');
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
  const [currentSound, setCurrentSound] = useState('');
  const [currentEndingBell, setCurrentEndingBell] = useState(DEFAULT_ENDING_BELL);
  const [currentDurationMinutes, setCurrentDurationMinutes] = useState(1);
  const [availableTracks, setAvailableTracks] = useState<MeditationTrack[]>([]);
  const [availableEndingBells, setAvailableEndingBells] = useState<MeditationTrack[]>(DEFAULT_ENDING_BELLS);
  const [isTracksLoading, setIsTracksLoading] = useState(false);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);

  const fetchTracks = useCallback(async () => {
    if (fetchPromiseRef.current) {
      await fetchPromiseRef.current;
      return;
    }

    const request = (async () => {
      setIsTracksLoading(true);
      try {
        const tracks = await fetchTracksFromServer();
        const byTitle = (a: MeditationTrack, b: MeditationTrack) =>
          a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        const soundscapes = tracks.filter((track) => track.media_type === 'SOUNDSCAPE').sort(byTitle);
        const endingBells = tracks.filter((track) => track.media_type === 'BELL').sort(byTitle);

        setAvailableTracks(soundscapes);
        setAvailableEndingBells(endingBells);

        setCurrentSound((previousSound) => {
          return soundscapes.some((track) => track.title === previousSound)
            ? previousSound
            : (soundscapes[0]?.title ?? '');
        });
        setCurrentEndingBell((previousBell) => {
          return endingBells.some((track) => track.title === previousBell)
            ? previousBell
            : (endingBells[0]?.title ?? '');
        });
      } catch {
        // keep current state when backend is unavailable
      } finally {
        setIsTracksLoading(false);
      }
    })();

    fetchPromiseRef.current = request;
    try {
      await request;
    } finally {
      fetchPromiseRef.current = null;
    }
  }, []);

  useEffect(() => {
    void fetchTracks();
  }, [fetchTracks]);

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
      isTracksLoading,
      fetchTracks,
    }),
    [
      availableEndingBells,
      availableTracks,
      currentDurationMinutes,
      currentEndingBell,
      currentSound,
      fetchTracks,
      isTracksLoading,
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
