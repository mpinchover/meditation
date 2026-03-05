import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

export type MeditationTrack = {
  title: string;
  media_url: string;
  uuid: string;
  media_type: string;
};

type CachedTrack = {
  title: string;
  uuid: string;
  media_type: string;
  remote_url: string;
  local_uri: string;
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
const CACHE_DIR = `${FileSystem.documentDirectory ?? ''}sound-library/`;
const CACHE_INDEX_PATH = `${CACHE_DIR}index.json`;

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
    .filter((track) => track.title.length > 0 && track.media_url.length > 0 && track.uuid.length > 0);
}

function byTitle(a: MeditationTrack, b: MeditationTrack) {
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
}

function splitTracks(tracks: MeditationTrack[]) {
  const soundscapes = tracks.filter((track) => track.media_type === 'SOUNDSCAPE').sort(byTitle);
  const endingBells = tracks.filter((track) => track.media_type === 'BELL').sort(byTitle);
  return { soundscapes, endingBells };
}

async function ensureCacheDir() {
  if (!FileSystem.documentDirectory) return false;
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
  return true;
}

async function deleteFileIfExists(uri: string) {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore cache cleanup failures
  }
}

async function persistCacheIndex(entries: CachedTrack[]) {
  const canWrite = await ensureCacheDir();
  if (!canWrite) return;
  await FileSystem.writeAsStringAsync(CACHE_INDEX_PATH, JSON.stringify(entries));
}

function guessFileExtension(mediaUrl: string) {
  try {
    const parsed = new URL(mediaUrl);
    const path = parsed.pathname.toLowerCase();
    if (path.endsWith('.wav')) return '.wav';
    if (path.endsWith('.m4a')) return '.m4a';
    if (path.endsWith('.aac')) return '.aac';
    if (path.endsWith('.ogg')) return '.ogg';
    if (path.endsWith('.opus')) return '.opus';
    if (path.endsWith('.webm')) return '.webm';
  } catch {
    // fallback to default extension
  }
  return '.mp3';
}

function buildCacheFilePath(uuid: string, mediaUrl: string) {
  return `${CACHE_DIR}${encodeURIComponent(uuid)}${guessFileExtension(mediaUrl)}`;
}

async function loadCacheIndex() {
  if (!FileSystem.documentDirectory) return [];
  const info = await FileSystem.getInfoAsync(CACHE_INDEX_PATH);
  if (!info.exists) return [];

  try {
    const content = await FileSystem.readAsStringAsync(CACHE_INDEX_PATH);
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];

    const validEntries: CachedTrack[] = [];
    for (const entry of parsed) {
      const uuid = String(entry?.uuid ?? '');
      const title = String(entry?.title ?? '');
      const mediaType = String(entry?.media_type ?? '').toUpperCase();
      const remoteUrl = String(entry?.remote_url ?? '');
      const localUri = String(entry?.local_uri ?? '');
      if (!uuid || !title || !mediaType || !localUri) continue;
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) continue;
      validEntries.push({
        uuid,
        title,
        media_type: mediaType,
        remote_url: remoteUrl,
        local_uri: localUri,
      });
    }

    if (validEntries.length !== parsed.length) {
      await persistCacheIndex(validEntries);
    }
    return validEntries;
  } catch {
    return [];
  }
}

function cachedEntriesToTracks(entries: CachedTrack[]) {
  return entries.map((entry) => ({
    title: entry.title,
    uuid: entry.uuid,
    media_type: entry.media_type,
    media_url: entry.local_uri,
  }));
}

async function downloadTrackToCache(track: MeditationTrack) {
  const canWrite = await ensureCacheDir();
  if (!canWrite) return null;

  const localPath = buildCacheFilePath(track.uuid, track.media_url);
  try {
    const result = await FileSystem.downloadAsync(track.media_url, localPath);
    if (!result?.uri) return null;
    return {
      title: track.title,
      uuid: track.uuid,
      media_type: track.media_type,
      remote_url: track.media_url,
      local_uri: result.uri,
    } satisfies CachedTrack;
  } catch {
    return null;
  }
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
      const applyTracks = (tracks: MeditationTrack[]) => {
        const { soundscapes, endingBells } = splitTracks(tracks);
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
      };

      const cachedEntries = await loadCacheIndex();
      const cachedTracks = cachedEntriesToTracks(cachedEntries);
      const hasCachedTracks = cachedTracks.length > 0;

      if (hasCachedTracks) {
        applyTracks(cachedTracks);
      }

      setIsTracksLoading(!hasCachedTracks);
      try {
        const fetchedTracks = await fetchTracksFromServer();
        const fetchedByUuid = new Map(fetchedTracks.map((track) => [track.uuid, track]));

        const nextCacheEntries: CachedTrack[] = [];
        for (const entry of cachedEntries) {
          if (!fetchedByUuid.has(entry.uuid)) {
            await deleteFileIfExists(entry.local_uri);
          }
        }

        const hydratedTracks: MeditationTrack[] = [];
        for (const track of fetchedTracks) {
          const cached = cachedEntries.find((entry) => entry.uuid === track.uuid);
          if (cached) {
            const fileInfo = await FileSystem.getInfoAsync(cached.local_uri);
            if (fileInfo.exists) {
              nextCacheEntries.push({
                ...cached,
                title: track.title,
                media_type: track.media_type,
                remote_url: track.media_url,
              });
              hydratedTracks.push({ ...track, media_url: cached.local_uri });
              continue;
            }
          }

          const downloaded = await downloadTrackToCache(track);
          if (downloaded) {
            nextCacheEntries.push(downloaded);
            hydratedTracks.push({ ...track, media_url: downloaded.local_uri });
          } else {
            hydratedTracks.push(track);
          }
        }

        await persistCacheIndex(nextCacheEntries);
        applyTracks(hydratedTracks);
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
