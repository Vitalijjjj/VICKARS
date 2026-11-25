import type { UIKey, Locale } from '@/i18n/ui';

/**
 * Single source of truth for the site structure.
 *
 * `status: 'live'`    → rendered as a working link.
 * `status: 'planned'` → rendered as a non-interactive item marked "soon" (no fake links).
 * When a section or page is built, flip its status to 'live' — navigation updates everywhere.
 */
export type Status = 'live' | 'planned';

export interface HomeSection {
  id: string;            // DOM id on the home page (anchor target)
  label: UIKey;
  status: Status;
  group: 'space' | 'service' | 'trust' | 'contact';
  primary?: boolean;     // shown directly in the desktop capsule; others go to "More"
  /** only on these locales' home pages (UA runs the new design, RU/EL still the previous sections) */
  locales?: Locale[];
}

/** Home page sections in page order (block 01 hero has no nav entry). */
export const homeSections: HomeSection[] = [
  { id: 'complex',   label: 'nav.complex',   status: 'live', group: 'space',   primary: true }, // hero + interactive building
  { id: 'self-wash', label: 'nav.selfWash',  status: 'live', group: 'space',   primary: true, locales: ['uk'] }, // «Скрол = хвилини»
  { id: 'services',  label: 'nav.services',  status: 'live', group: 'space',   primary: true, locales: ['ru', 'el'] },
  { id: 'process',   label: 'nav.process',   status: 'live', group: 'service', locales: ['ru', 'el'] },
  { id: 'clients',   label: 'nav.clients',   status: 'live', group: 'trust',   locales: ['uk'] },   // «Гараж VIK» (photos are placeholders)
  { id: 'pricing',   label: 'nav.pricing',   status: 'live', group: 'service', primary: true }, // CTA form + packages
  { id: 'benefits',  label: 'nav.benefits',  status: 'live', group: 'service' },              // what you get
  { id: 'reviews',   label: 'nav.reviews',   status: 'live', group: 'trust',   locales: ['uk'] },   // Google reviews (sample copy until opening)
  { id: 'contacts',  label: 'nav.contacts',  status: 'live', group: 'contact', primary: true }, // CTA + contacts + map
];
/** sections that exist on this locale's home page */
export const homeSectionsFor = (locale: Locale) => homeSections.filter((s) => !s.locales || s.locales.includes(locale));

/** Booking target for the header CTA (lives inside the pricing / CTA-form section). */
export const booking = { id: 'booking', status: 'live' as Status };

export const navGroups = ['space', 'service', 'trust', 'contact'] as const;
export const navGroupLabel: Record<(typeof navGroups)[number], UIKey> = {
  space: 'nav.group.space',
  service: 'nav.group.service',
  trust: 'nav.group.trust',
  contact: 'nav.group.contact',
};

/** Future standalone pages (paths are locale-relative; see localePath()). */
export const futurePages = {
  levelLounge: { path: '/levels/lounge-showroom/', status: 'live' as Status },
  levelWash: { path: '/levels/car-wash/', status: 'live' as Status },
  levelStudio: { path: '/levels/detailing-studio/', status: 'live' as Status },
  selfWash: { path: '/self-wash/', status: 'planned' as Status },
  contacts: { path: '/contacts/', status: 'planned' as Status },
};
