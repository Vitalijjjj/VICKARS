/** PROTOTYPE runtime for standalone prototype pages (wrapper `[data-pt]`): light↔dark background follow,
 *  mask-rise headlines, fade-up blocks, slow photo zoom. The Delta home has its own copy in DeltaSections. */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function initProto() {
  const root = document.querySelector<HTMLElement>('[data-pt]');
  if (!root) return;
  const $ = (s: string) => Array.from(root.querySelectorAll<HTMLElement>(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let prev = getComputedStyle(root).backgroundColor;
  $(':scope > section').forEach((s) => {
    const to = s.dataset.bg; if (!to) return;
    const from = prev; prev = to;
    if (from === to) return;
    gsap.fromTo(root, { backgroundColor: from }, { backgroundColor: to, ease: 'none', immediateRender: false, scrollTrigger: { trigger: s, start: 'top 85%', end: 'top 25%', scrub: true } });
  });

  if (reduced) { gsap.set($('[data-up]'), { opacity: 1 }); return; }
  $('[data-lines]').forEach((h) => gsap.from(h.querySelectorAll('.ln > span'), { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: h, start: 'top 88%', once: true } }));
  ScrollTrigger.batch($('[data-up]'), { start: 'top 92%', once: true, onEnter: (b) => gsap.fromTo(b, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.08 }) });
  $('[data-speed]').forEach((el) => { const sp = Number(el.dataset.speed); gsap.fromTo(el, { y: 160 * sp }, { y: -220 * sp, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } }); });
  $('[data-zoom]').forEach((im) => gsap.fromTo(im, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: im.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } }));
  window.addEventListener('load', () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
}
