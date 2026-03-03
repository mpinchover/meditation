import { Audio } from 'expo-av';

const meditationSoundCache = new Map<string, Audio.Sound>();
const inFlightLoads = new Map<string, Promise<Audio.Sound>>();

async function loadMeditationSound(cacheKey: string, mediaUrl: string) {
  const existing = meditationSoundCache.get(cacheKey);
  if (existing) return existing;

  const loading = inFlightLoads.get(cacheKey);
  if (loading) return loading;

  const promise = (async () => {
    const { sound } = await Audio.Sound.createAsync(
      { uri: mediaUrl },
      { shouldPlay: false, isLooping: true }
    );
    meditationSoundCache.set(cacheKey, sound);
    return sound;
  })();

  inFlightLoads.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    inFlightLoads.delete(cacheKey);
  }
}

export async function prewarmMeditationSound(cacheKey: string, mediaUrl: string) {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    await loadMeditationSound(cacheKey, mediaUrl);
  } catch {
    // Best-effort preload; playback path retries as needed.
  }
}

export async function playMeditationSound(cacheKey: string, mediaUrl: string) {
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  const sound = await loadMeditationSound(cacheKey, mediaUrl);
  await sound.playAsync();
  return sound;
}

export async function pauseMeditationSound(sound: Audio.Sound | null) {
  if (!sound) return;
  try {
    await sound.pauseAsync();
  } catch {
    // ignore pause errors while toggling playback
  }
}

export async function stopMeditationSound(sound: Audio.Sound | null) {
  if (!sound) return;
  try {
    await sound.stopAsync();
  } catch {
    // ignore stop errors while cleaning up
  }
  try {
    await sound.setPositionAsync(0);
  } catch {
    // ignore reset errors while cleaning up
  }
}
