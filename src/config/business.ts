/**
 * Business data — the ONLY place to fill in real facts. `null` = not provided yet: the site shows a clear
 * "coming soon" state instead of inventing anything. Replace values as the client sends them.
 */
export const business = {
  phone: '+357 99 571407' as string | null,
  email: null as string | null,
  address: null as string | null,        // official street address — not issued yet
  city: { uk: 'Лімасол, Кіпр', ru: 'Лимасол, Кипр', el: 'Λεμεσός, Κύπρος' },
  /** pin from the client (Google Maps) */
  geo: { lat: 34.7224344, lng: 33.0291954 },
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=34.7224344,33.0291954' as string | null,
  hours: '08:00–18:00' as string | null,  // preliminary (brief: «ще не вирішили»)
  hoursPreliminary: true,
  website: 'https://vikcars-limassol.com/',
  instagram: null as string | null,

  /** prices per service (EUR) — null shows "price on request / soon" */
  prices: {
    handWash: null as number | null,
    detailing: null as number | null,
    ceramic: null as number | null,
    ppf: null as number | null,
    tint: null as number | null,
    tuning: null as number | null,
  },

  /** client / partner logos: { name, src } — empty shows placeholder slots */
  clients: [] as { name: string; src: string }[],

  /** reviews: { author, text, rating } — empty shows the "after opening" state */
  reviews: [] as { author: string; text: string; rating: number }[],
} as const;

export type ServiceKey = keyof typeof business.prices;
