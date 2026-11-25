import type { UIKey } from '@/i18n/ui';
import { futurePages } from './site';

/**
 * Geometry of the approved render — v3 (materials/approved/v3/04_VIKCARS_render_v3_1633x963.png):
 * building per drawings 3425-22 (flat roof, ground floor 5.50 m, first floor 3.75 m), glazed car-wash doors,
 * entrance door, solid concrete core (car lift behind it), 1.5 m overhang on the right.
 * All coordinates are in the render's own pixels, so overlays stay locked to the architecture
 * at any viewport size and zoom.
 */
export const RENDER = { width: 1633, height: 963 } as const;

/** The intro video is 1634×964: the approved frame plus a 1 px edge on the right/bottom (H.264 needs even sizes). */
export const VIDEO = { width: 1634, height: 964, handoffAt: 3.5 } as const;

/**
 * Portrait plate for tall viewports (phones, portrait tablets): the approved render's band X 249–1401 sits
 * pixel-identical at (0, 480) inside a 1152×2048 (9:16) plate whose sky and foreground were outpainted
 * (materials/approved/v3/mobile/). It lies under the render frame in render-pixel units, so every overlay stays
 * locked to the architecture; the matching 9:16 sketch → photo intro plays on it instead of the 16:9 one.
 * `media` must equal the <source media> of the portrait video (CinemaStage).
 */
export const MOBILE_PLATE = {
  src: '/media/vikcars-plate-mobile-v1.webp',
  video: '/media/vikcars-intro-mobile-v1.mp4',
  media: '(max-aspect-ratio: 1/1)',
  x0: 249, y0: 480, w: 1152, h: 2048,
} as const;

/** Area that must never be cropped (building, planters, a little air around it). */
export const SAFE_BOX = { x: 400, y: 300, w: 850, h: 470 } as const;

/** Point the scroll camera zooms towards (centre of the facade). */
export const FOCUS = { x: 825, y: 525 } as const;

/** The building itself: slab end to slab end, core-tower top to the pavement (used to size the zoom). */
export const BUILDING = { x: 438, y: 332, w: 774, h: 373, base: 705 } as const;

/** X-ray of the underground car park (shown while −01 is hovered/selected), placed in render pixels. */
export const XRAY = { src: '/media/vikcars-xray-v3-2.webp', x: 290, y: 700, w: 1160, h: 254 } as const;

/** Level markers sit at the left edge of the core: +01 on the showroom glass, 00 on the concrete. */
export const MARKERS = { up1: { x: 905, y: 425 }, ground: { x: 905, y: 610 } } as const;

/**
 * Depth word in the sky, behind the building (render pixels): exactly as wide as the roof (438–1212) —
 * `w` is applied as SVG textLength, so the width holds whatever the font rendering. Baseline just under the
 * roof top (332): the roof slab overlaps the letters' foot. Lives in the depth stack between sky and scene.
 */
export const WORD = { text: 'DETAILING', x: 825, baseline: 350, size: 160, w: 774 } as const;

export interface Level {
  id: 'up1' | 'ground' | 'down1';
  code: string;          // "+01", "00", "−01"
  name: string;          // brand name of the direction (kept in English by design)
  text: UIKey;           // localized descriptor
  page: string;          // future page path
  /** Clickable / highlight zone in render pixels. Underground uses a marker instead of a facade zone. */
  zone?: { x: number; y: number; w: number; h: number; r: number };
  marker?: { x: number; y: number };
  /** Where the leader line + label attach (right edge of the zone). */
  anchor: { x: number; y: number };
  /** Level landing: URL slug, interior image, and the "window" on the facade the transition opens through (render px). */
  slug: string;
  image: string;
  window: { x: number; y: number; w: number; h: number };
  /** Signature move of the building → level transition. */
  move: 'glass' | 'doors' | 'dive';
}

export const levels: Level[] = [
  {
    id: 'up1',
    code: '+01',
    name: 'Lounge & Showroom',
    text: 'level.up1.text',
    page: futurePages.levelLounge.path,
    zone: { x: 438, y: 334, w: 774, h: 149, r: 4 },
    anchor: { x: 1212, y: 410 },
    slug: 'lounge-showroom',
    image: '/media/level-lounge-showroom-v2.webp',
    window: { x: 705, y: 372, w: 393, h: 110 },   // the long glass curtain wall
    move: 'glass',
  },
  {
    id: 'ground',
    code: '00',
    name: 'Hand Wash',
    text: 'level.ground.text',
    page: futurePages.levelWash.path,
    zone: { x: 438, y: 483, w: 774, h: 222, r: 4 },
    anchor: { x: 1212, y: 600 },
    slug: 'car-wash',
    image: '/media/level-car-wash-v2.webp',
    window: { x: 570, y: 516, w: 252, h: 189 },   // the two glazed car-wash doors
    move: 'doors',
  },
  {
    id: 'down1',
    code: '−01',
    name: 'Detailing Studio',
    text: 'level.down1.text',
    page: futurePages.levelStudio.path,
    marker: { x: 905, y: 778 },
    anchor: { x: 1212, y: 706 },
    slug: 'detailing-studio',
    image: '/media/level-detailing-studio-v2.webp',
    window: { x: 333, y: 711, w: 977, h: 202 },   // the x-ray section
    move: 'dive',
  },
];

/**
 * Mouse-parallax depth stack (layers built by `materials/working/build_depth_layers.py` from the approved
 * render, which is not modified). Amplitudes are in render px at full cursor deflection — converted to CSS px
 * with the current fit scale, so the motion is proportional on every screen and always smaller than the
 * mirrored overscan. ≈ CSS px at a 1440 px viewport: sky 6/4 · word 9/6 · scene 17/9 · near 28/15.
 */
export const DEPTH = {
  overscan: 48,
  layers: {
    sky: { x: 6, y: 4 },
    word: { x: 10, y: 6 },
    scene: { x: 18, y: 10 },
    near: { x: 30, y: 16 },
  },
} as const;
export type DepthLayer = keyof typeof DEPTH.layers;
