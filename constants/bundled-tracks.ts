import { Asset } from 'expo-asset';

import { MeditationTrack } from './session-context';

type BundledTrackDef = {
  title: string;
  uuid: string;
  media_type: 'SOUNDSCAPE' | 'BELL';
  module: number;
};

const SOUNDSCAPE_DEFS: BundledTrackDef[] = [
  { title: 'Alpha Waves', uuid: 'alpha-waves', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Alpha Waves.mp3') },
  { title: 'Anxiety Relief', uuid: 'anxiety-relief', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Anxiety relief.mp3') },
  { title: 'Chakra Cleansing', uuid: 'chakra-cleansing', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Chakra cleansing.mp3') },
  { title: 'Circle of Oneness', uuid: 'circle-of-oneness', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Circle of oneness.mp3') },
  { title: 'Clear All Negative Energy', uuid: 'clear-all-negative-energy', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Clear all negative energy.mp3') },
  { title: 'Deep Meditation 1', uuid: 'deep-meditation-1', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Deep Meditation 1.mp3') },
  { title: 'Deep Meditation 2', uuid: 'deep-meditation-2', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Deep Meditation 2.mp3') },
  { title: 'Delta Waves 1', uuid: 'delta-waves-1', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Delta waves 1.mp3') },
  { title: 'Delta Waves 2', uuid: 'delta-waves-2', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Delta waves 2.mp3') },
  { title: 'Didgeridoo 1', uuid: 'didgeridoo-1', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Didgeridoo 1.mp3') },
  { title: 'Didgeridoo 2', uuid: 'didgeridoo-2', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Didgeridoo 2.mp3') },
  { title: 'Didgeridoo 3', uuid: 'didgeridoo-3', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Didgeridoo 3.mp3') },
  { title: 'Drone', uuid: 'drone', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Drone.mp3') },
  { title: 'Drone 1', uuid: 'drone-1', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Drone 1.mp3') },
  { title: 'Drone 2', uuid: 'drone-2', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Drone 2.mp3') },
  { title: 'Energy Cleanse', uuid: 'energy-cleanse', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Energy cleanse.mp3') },
  { title: 'Fireplace', uuid: 'fireplace', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Fireplace.mp3') },
  { title: 'Gamma Waves', uuid: 'gamma-waves', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Gamma waves.mp3') },
  { title: 'Healing Bowls', uuid: 'healing-bowls', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Healing bowls.mp3') },
  { title: 'Heart Chakra Healing', uuid: 'heart-chakra-healing', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Heart chakra healing.mp3') },
  { title: 'Icy Rain', uuid: 'icy-rain', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Icy rain.mp3') },
  { title: 'Lucid Dreaming 1', uuid: 'lucid-dreaming-1', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Lucid dreaming 1.mp3') },
  { title: 'Lucid Dreaming 2', uuid: 'lucid-dreaming-2', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Lucid dreaming 2.mp3') },
  { title: 'Ocean Waves 1', uuid: 'ocean-waves-1', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Ocean waves 1.mp3') },
  { title: 'Ocean Waves 2', uuid: 'ocean-waves-2', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Ocean waves 2.mp3') },
  { title: 'Ohm 1', uuid: 'ohm-1', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Ohm 1.mp3') },
  { title: 'Ohm 2', uuid: 'ohm-2', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Ohm 2.mp3') },
  { title: 'Ohm 3', uuid: 'ohm-3', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Ohm 3.mp3') },
  { title: 'Ohm 4', uuid: 'ohm-4', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Ohm 4.mp3') },
  { title: 'Oneness', uuid: 'oneness', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Oneness.mp3') },
  { title: 'Peruvian Flute', uuid: 'peruvian-flute', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Peruvian flute.mp3') },
  { title: 'Pure', uuid: 'pure', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Pure.mp3') },
  { title: 'Relaxing Fireplace', uuid: 'relaxing-fireplace', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Relaxing fireplace.mp3') },
  { title: 'Relaxing Meditation', uuid: 'relaxing-meditation', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Relaxing meditation.mp3') },
  { title: 'River in the Rain', uuid: 'river-in-the-rain', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/River in the rain.mp3') },
  { title: 'Silver Moon Serenity', uuid: 'silver-moon-serenity', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Silver moon serenity.mp3') },
  { title: 'Singing Bowls & Flute', uuid: 'singing-bowls-and-flute', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Singing bowls & flute.mp3') },
  { title: 'Singing Bowls Sound Bath', uuid: 'singing-bowls-sound-bath', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Singing bowls sound bath.mp3') },
  { title: 'Stillness Within 1', uuid: 'stillness-within-1', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Stillness within 1.mp3') },
  { title: 'Stillness Within 2', uuid: 'stillness-within-2', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Stillness within 2.mp3') },
  { title: 'Temple Bells 1', uuid: 'temple-bells-1', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Temple bells 1.mp3') },
  { title: 'Temple Bells 2', uuid: 'temple-bells-2', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Temple bells 2.mp3') },
  { title: 'Theta Wave with Brown Noise', uuid: 'theta-wave-with-brown-noise', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Theta Wave with brown noise.mp3') },
  { title: 'Tibetan Bowls 1', uuid: 'tibetan-bowls-1', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Tibetan bowls 1.mp3') },
  { title: 'Tibetan Bowls 2', uuid: 'tibetan-bowls-2', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Tibetan bowls 2.mp3') },
  { title: 'Tibetan Bowls 3', uuid: 'tibetan-bowls-3', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Tibetan bowls 3.mp3') },
  { title: 'Tibetan Bowls 4', uuid: 'tibetan-bowls-4', media_type: 'SOUNDSCAPE', module: require('../assets/audio/soundscapes/Tibetan bowls 4.mp3') },
];

const BELL_DEFS: BundledTrackDef[] = [
  { title: 'Chinese Gong 1', uuid: 'chinese-gong-1', media_type: 'BELL', module: require('../assets/audio/bells/Chinese gong 1.wav') },
  { title: 'Chinese Gong 2', uuid: 'chinese-gong-2', media_type: 'BELL', module: require('../assets/audio/bells/Chinese gong 2.wav') },
  { title: 'Chinese Gong 3', uuid: 'chinese-gong-3', media_type: 'BELL', module: require('../assets/audio/bells/Chinese gong 3.wav') },
  { title: 'Tibetan Bell 1', uuid: 'tibetan-bell-1', media_type: 'BELL', module: require('../assets/audio/bells/Tibetan bell 1.wav') },
  { title: 'Tibetan Bell 2', uuid: 'tibetan-bell-2', media_type: 'BELL', module: require('../assets/audio/bells/Tibetan bell 2.wav') },
  { title: 'Tibetan Bell 3', uuid: 'tibetan-bell-3', media_type: 'BELL', module: require('../assets/audio/bells/Tibetan bell 3.wav') },
  { title: 'Zen Bell 1', uuid: 'zen-bell-1', media_type: 'BELL', module: require('../assets/audio/bells/Zen bell 1.wav') },
  { title: 'Zen Bell 2', uuid: 'zen-bell-2', media_type: 'BELL', module: require('../assets/audio/bells/Zen bell 2.wav') },
];

const ALL_DEFS: BundledTrackDef[] = [...SOUNDSCAPE_DEFS, ...BELL_DEFS];

export async function loadBundledTracks(): Promise<MeditationTrack[]> {
  const assets = await Asset.loadAsync(ALL_DEFS.map((def) => def.module));
  return ALL_DEFS.map((def, i) => ({
    title: def.title,
    uuid: def.uuid,
    media_type: def.media_type,
    media_url: assets[i].localUri ?? assets[i].uri,
  }));
}
