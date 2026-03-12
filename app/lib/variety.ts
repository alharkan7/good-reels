import { ReelStyle, MotionPreset, FilterPreset } from './types';

export const MOTION_PRESETS: MotionPreset[] = [
  { name: 'Zoom In', animation: 'kb-zoom-in', duration: 10 },
  { name: 'Zoom Out', animation: 'kb-zoom-out', duration: 9 },
  { name: 'Pan Left', animation: 'kb-pan-left', duration: 11 },
  { name: 'Pan Right', animation: 'kb-pan-right', duration: 11 },
  { name: 'Pan Up', animation: 'kb-pan-up', duration: 10 },
  { name: 'Pan Down', animation: 'kb-pan-down', duration: 10 },
  { name: 'Diagonal TL', animation: 'kb-diagonal-tl', duration: 12 },
  { name: 'Diagonal BR', animation: 'kb-diagonal-br', duration: 12 },
];

export const FILTER_PRESETS: FilterPreset[] = [
  { name: 'natural', css: 'brightness(1.05) contrast(1.05) saturate(1.1)' },
  { name: 'warm', css: 'brightness(1.08) contrast(1.02) saturate(1.2) sepia(0.15)' },
  { name: 'cool', css: 'brightness(1.05) contrast(1.08) saturate(0.9) hue-rotate(10deg)' },
  { name: 'vivid', css: 'brightness(1.02) contrast(1.12) saturate(1.4)' },
  { name: 'muted', css: 'brightness(1.1) contrast(0.95) saturate(0.7)' },
  { name: 'golden', css: 'brightness(1.1) contrast(1.05) saturate(1.15) sepia(0.2) hue-rotate(-10deg)' },
  { name: 'dreamy', css: 'brightness(1.12) contrast(0.98) saturate(1.05) blur(0.3px)' },
  { name: 'vintage', css: 'brightness(0.95) contrast(1.1) saturate(0.85) sepia(0.25)' },
  { name: 'crisp', css: 'brightness(1.02) contrast(1.15) saturate(1.05)' },
  { name: 'oceanic', css: 'brightness(1.05) contrast(1.05) saturate(1.1) hue-rotate(15deg)' },
];

const NUM_MOTIONS = MOTION_PRESETS.length;
const NUM_FILTERS = FILTER_PRESETS.length;

export function assignReelStyle(
  index: number,
  totalTracks: number,
  prevStyle?: ReelStyle
): ReelStyle {
  let motion = index % NUM_MOTIONS;
  let filter = (index * 3 + 1) % NUM_FILTERS;
  let track = totalTracks > 0 ? index % totalTracks : 0;

  if (prevStyle) {
    if (motion === prevStyle.motionPreset) motion = (motion + 1) % NUM_MOTIONS;
    if (filter === prevStyle.filterPreset) filter = (filter + 1) % NUM_FILTERS;
    if (totalTracks > 1 && track === prevStyle.trackIndex)
      track = (track + 1) % totalTracks;
  }

  return { motionPreset: motion, filterPreset: filter, trackIndex: track };
}
