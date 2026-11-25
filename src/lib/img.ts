/**
 * Responsive sources for the big full-size photos in /public/media: every `level-*` / `benefits-*` image wider than
 * 1400 px has a 1280 px twin `*-md.webp` (made from the originals kept in materials/working/originals), so phones and
 * laptops don't download the 2200 px file. Anything else returns undefined and the plain `src` is used.
 */
const HAS_MD = /\/media\/(level-[\w-]+?|benefits-[\w-]+?)(?<!-sm|-md)\.webp$/;

export const srcset = (src?: string) =>
  src && HAS_MD.test(src) ? `${src.replace(/\.webp$/, '-md.webp')} 1280w, ${src} 2200w` : undefined;
