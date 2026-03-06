import { Audio, AVPlaybackStatus } from 'expo-av';

/** Must match the baked-in fade duration in the audio files. */
const FADE_DURATION_MS = 5_000;
/**
 * Start the next track this far before the current track ends.
 * Set to 2 * FADE_DURATION_MS so the incoming fade-in completes before
 * the outgoing fade-out begins — the two fades never overlap and there
 * is no loudness dip. A small lead covers async playAsync() latency.
 */
const HANDOFF_BEFORE_END_MS = FADE_DURATION_MS * 2 + 300;
// const HANDOFF_BEFORE_END_MS = 10_500;

async function createSound(uri: string): Promise<Audio.Sound> {
  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: false, isLooping: false, volume: 1 }
  );
  await sound.setVolumeAsync(1, 0);
  return sound;
}

export class MeditationLooper {
  private sounds: [Audio.Sound | null, Audio.Sound | null] = [null, null];
  private activeSlot: 0 | 1 = 0;
  private stopped = false;
  private handoffTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly uri: string) {}

  async load(): Promise<void> {
    const [a, b] = await Promise.all([createSound(this.uri), createSound(this.uri)]);
    this.sounds = [a, b];
    this.attachCleanup(0);
    this.attachCleanup(1);
  }

  private clearHandoffTimer(): void {
    if (this.handoffTimer) {
      clearTimeout(this.handoffTimer);
      this.handoffTimer = null;
    }
  }

  /** Schedule the next handoff based on the active slot's current position. */
  private async scheduleHandoff(slot: 0 | 1): Promise<void> {
    this.clearHandoffTimer();
    const sound = this.sounds[slot];
    if (!sound || this.stopped) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded || !status.durationMillis) return;
    const remaining = status.durationMillis - (status.positionMillis ?? 0);
    const delay = remaining - HANDOFF_BEFORE_END_MS;
    if (delay <= 0) {
      this.doHandoff(slot);
      return;
    }
    this.handoffTimer = setTimeout(() => {
      this.handoffTimer = null;
      if (!this.stopped) this.doHandoff(slot);
    }, delay);
  }

  private doHandoff(currentSlot: 0 | 1): void {
    const next: 0 | 1 = currentSlot === 0 ? 1 : 0;
    const nextSound = this.sounds[next];
    if (!nextSound || this.stopped) return;
    this.activeSlot = next;
    nextSound
      .setPositionAsync(0)
      .then(() => nextSound.setVolumeAsync(1, 0))
      .then(() => nextSound.playAsync())
      .then(() => {
        if (!this.stopped) this.scheduleHandoff(next);
      })
      .catch(() => {});
  }

  /**
   * When a non-active slot finishes playing, pause it and reset to position 0
   * so it's ready for the next cycle. Uses the default status update interval
   * (~500ms) to keep bridge traffic minimal.
   */
  private attachCleanup(slot: 0 | 1): void {
    this.sounds[slot]?.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (this.stopped || !status.isLoaded) return;
      if (slot === this.activeSlot) return;
      if (status.didJustFinish) {
        const s = this.sounds[slot];
        if (s) {
          s.pauseAsync()
            .catch(() => {})
            .finally(() => {
              s.setPositionAsync(0).catch(() => {});
            });
        }
      }
    });
  }

  async play(): Promise<void> {
    if (this.stopped) return;
    const sound = this.sounds[this.activeSlot];
    if (!sound) return;
    await sound.setPositionAsync(0);
    await sound.setVolumeAsync(1, 0);
    await sound.playAsync();
    await this.scheduleHandoff(this.activeSlot);
  }

  async pause(): Promise<void> {
    this.clearHandoffTimer();
    await Promise.allSettled(this.sounds.map((s) => s?.pauseAsync()));
  }

  async resume(): Promise<void> {
    if (this.stopped) return;
    const sound = this.sounds[this.activeSlot];
    if (!sound) return;
    await sound.setVolumeAsync(1, 0);
    await sound.playAsync();
    await this.scheduleHandoff(this.activeSlot);
  }

  async unload(): Promise<void> {
    this.stopped = true;
    this.clearHandoffTimer();
    await Promise.allSettled(
      this.sounds.map(async (s) => {
        if (!s) return;
        try { await s.pauseAsync(); } catch { /* ignore */ }
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

export async function resumeMeditationSound(looper: MeditationLooper | null): Promise<void> {
  if (!looper) return;
  try {
    await looper.resume();
  } catch {
    // ignore resume errors
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
