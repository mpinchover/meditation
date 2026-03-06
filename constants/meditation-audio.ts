import { Audio, AVPlaybackStatus } from 'expo-av';

const HANDOFF_THRESHOLD_MS = 5_000;

async function createSound(uri: string): Promise<Audio.Sound> {
  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: false, isLooping: false }
  );
  return sound;
}

export class MeditationLooper {
  private sounds: [Audio.Sound | null, Audio.Sound | null] = [null, null];
  private activeSlot: 0 | 1 = 0;
  private handoffPending = false;
  private stopped = false;

  constructor(private readonly uri: string) {}

  async load(): Promise<void> {
    const [a, b] = await Promise.all([createSound(this.uri), createSound(this.uri)]);
    this.sounds = [a, b];
    this.attachStatusUpdate(0);
    this.attachStatusUpdate(1);
  }

  private attachStatusUpdate(slot: 0 | 1): void {
    this.sounds[slot]?.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (this.stopped || !status.isLoaded || !status.isPlaying) return;
      if (slot !== this.activeSlot || this.handoffPending) return;

      const remaining = (status.durationMillis ?? 0) - status.positionMillis;
      if (remaining > 0 && remaining <= HANDOFF_THRESHOLD_MS) {
        this.handoffPending = true;
        const next: 0 | 1 = slot === 0 ? 1 : 0;
        const nextSound = this.sounds[next];
        if (!nextSound) {
          this.handoffPending = false;
          return;
        }
        nextSound
          .setPositionAsync(0)
          .then(() => nextSound.playAsync())
          .then(() => {
            if (!this.stopped) {
              this.activeSlot = next;
            }
            this.handoffPending = false;
          })
          .catch(() => {
            this.handoffPending = false;
          });
      }
    });
  }

  async play(): Promise<void> {
    if (this.stopped) return;
    const sound = this.sounds[this.activeSlot];
    if (!sound) return;
    try {
      await sound.playAsync();
    } catch {
      // ignore play errors
    }
  }

  async pause(): Promise<void> {
    await Promise.allSettled(this.sounds.map((s) => s?.pauseAsync()));
  }

  async unload(): Promise<void> {
    this.stopped = true;
    this.handoffPending = false;
    await Promise.allSettled(
      this.sounds.map(async (s) => {
        if (!s) return;
        try { await s.stopAsync(); } catch { /* ignore */ }
        try { await s.unloadAsync(); } catch { /* ignore */ }
      })
    );
    this.sounds = [null, null];
  }
}

const looperCache = new Map<string, MeditationLooper>();
const inFlightLoads = new Map<string, Promise<MeditationLooper>>();

async function getOrCreateLooper(cacheKey: string, mediaUrl: string): Promise<MeditationLooper> {
  const existing = looperCache.get(cacheKey);
  if (existing) return existing;

  const inFlight = inFlightLoads.get(cacheKey);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const looper = new MeditationLooper(mediaUrl);
    await looper.load();
    looperCache.set(cacheKey, looper);
    return looper;
  })();

  inFlightLoads.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    inFlightLoads.delete(cacheKey);
  }
}

export async function prewarmMeditationSound(cacheKey: string, mediaUrl: string): Promise<void> {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    await getOrCreateLooper(cacheKey, mediaUrl);
  } catch {
    // Best-effort preload; playback path retries as needed.
  }
}

export async function playMeditationSound(cacheKey: string, mediaUrl: string): Promise<MeditationLooper> {
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  const looper = await getOrCreateLooper(cacheKey, mediaUrl);
  await looper.play();
  return looper;
}

export async function pauseMeditationSound(looper: MeditationLooper | null): Promise<void> {
  if (!looper) return;
  try {
    await looper.pause();
  } catch {
    // ignore pause errors while toggling playback
  }
}

export async function stopMeditationSound(looper: MeditationLooper | null): Promise<void> {
  if (!looper) return;
  for (const [key, cached] of looperCache) {
    if (cached === looper) {
      looperCache.delete(key);
      break;
    }
  }
  await looper.unload();
}
