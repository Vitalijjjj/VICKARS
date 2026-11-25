/**
 * In-page navigation registry.
 * Sections that live inside pinned/scrubbed stages register how to reach their "resting" scroll position;
 * everything else falls back to a regular smooth scroll to the element.
 */
type Resolver = () => number;

declare global {
  interface Window { __wikarsScrollTargets?: Map<string, Resolver> }
}

const registry = (window.__wikarsScrollTargets ??= new Map<string, Resolver>());

export function registerScrollTarget(id: string, resolve: Resolver) {
  registry.set(id, resolve);
}

export function scrollToSection(id: string) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';
  const resolve = registry.get(id);
  if (resolve) {
    window.scrollTo({ top: resolve(), behavior });
  } else {
    document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
  }
  history.replaceState(null, '', `#${id}`);
}
