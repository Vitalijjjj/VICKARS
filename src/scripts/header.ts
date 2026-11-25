import { gsap } from 'gsap';
import { scrollToSection } from './navigation';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Chromium is the only engine that renders SVG filters inside backdrop-filter. */
function supportsBackdropUrl() {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands;
  return !!brands?.some((b) => /Chromium|Google Chrome|Microsoft Edge/i.test(b.brand));
}

/**
 * Displacement map for a capsule: pixels near the rim are pulled towards the centre,
 * which reads as the thick, convex edge of a glass lens.
 */
function capsuleMap(w: number, h: number, radius = h / 2, band = 14) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(w, h);
  const r = Math.min(radius, h / 2, w / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      // rounded rectangle: nearest point of the inner (r-inset) rectangle, then distance to the rim
      const cx = Math.min(Math.max(px, r), w - r);
      const cy = Math.min(Math.max(py, r), h - r);
      let vx = px - cx;
      let vy = py - cy;
      let len = Math.hypot(vx, vy);
      let inside: number;
      if (len > 0) {
        inside = r - len; // corner zone
      } else {
        // straight edges: push towards the closest side
        const d = [px, w - px, py, h - py];
        const k = d.indexOf(Math.min(...d));
        vx = k === 0 ? -1 : k === 1 ? 1 : 0;
        vy = k === 2 ? -1 : k === 3 ? 1 : 0;
        len = 1;
        inside = d[k];
      }
      let dx = 0;
      let dy = 0;
      if (inside < band) {
        const k = Math.pow(1 - Math.max(inside, 0) / band, 2.2);
        dx = (-vx / len) * k;
        dy = (-vy / len) * k;
      }
      const i = (y * w + x) * 4;
      img.data[i] = 128 + dx * 127;
      img.data[i + 1] = 128 + dy * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

export function initLiquidGlassHeader() {
  const root = document.querySelector<HTMLElement>('[data-lgh]');
  if (!root) return;
  const capsule = root.querySelector<HTMLElement>('[data-lgh-capsule]')!;
  const pill = root.querySelector<HTMLElement>('[data-lgh-pill]')!;
  const moreBtn = root.querySelector<HTMLButtonElement>('[data-lgh-more]');
  const drop = root.querySelector<HTMLElement>('[data-lgh-drop]');
  const burger = root.querySelector<HTMLButtonElement>('[data-lgh-burger]')!;
  const sheet = root.querySelector<HTMLElement>('[data-lgh-sheet]')!;

  /* ------------------------------------------------ edge refraction */
  if (supportsBackdropUrl()) {
    const feImage = root.querySelector<SVGFEImageElement>('[data-lgh-map]')!;
    const filter = root.querySelector<SVGFilterElement>('#lgh-refract')!;
    let last = '';
    const update = () => {
      const w = Math.round(capsule.offsetWidth);
      const h = Math.round(capsule.offsetHeight);
      const key = `${w}x${h}`;
      if (!w || !h || key === last) return;
      last = key;
      filter.setAttribute('width', String(w));
      filter.setAttribute('height', String(h));
      feImage.setAttribute('width', String(w));
      feImage.setAttribute('height', String(h));
      const radius = parseFloat(getComputedStyle(capsule).borderTopLeftRadius) || h / 2;
      feImage.setAttribute('href', capsuleMap(w, h, radius));
      root.classList.add('is-refract');
    };
    new ResizeObserver(update).observe(capsule);
    update();
  }

  /* ------------------------------------------------ cursor light */
  if (canHover() && !reduced()) {
    capsule.addEventListener('pointermove', (e) => {
      const b = capsule.getBoundingClientRect();
      capsule.style.setProperty('--lx', `${e.clientX - b.left}px`);
      capsule.style.setProperty('--ly', `${e.clientY - b.top}px`);
      capsule.style.setProperty('--shine', '1');
    });
    capsule.addEventListener('pointerleave', () => capsule.style.setProperty('--shine', '0'));
  }

  /* ------------------------------------------------ gliding hover pill */
  const hoverables = Array.from(capsule.querySelectorAll<HTMLElement>('[data-lgh-hover]'));
  const pillTo = (el: HTMLElement | null) => {
    if (!el || !canHover()) {
      gsap.to(pill, { opacity: 0, duration: 0.35, ease: 'power2.out' });
      return;
    }
    const c = capsule.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const first = Number(gsap.getProperty(pill, 'opacity')) < 0.05;
    gsap.to(pill, {
      x: b.left - c.left,
      width: b.width,
      opacity: 1,
      duration: first ? 0 : 0.55,
      ease: 'expo.out',
      overwrite: 'auto',
    });
    if (first) gsap.fromTo(pill, { opacity: 0 }, { opacity: 1, duration: 0.3 });
  };
  hoverables.forEach((el) => {
    if (el.closest('.lgh__lang')) return; // language switch has its own active state
    el.addEventListener('pointerenter', () => pillTo(el));
    el.addEventListener('focus', () => pillTo(el));
    el.addEventListener('blur', () => pillTo(null));
  });
  capsule.addEventListener('pointerleave', () => pillTo(null));

  /* ------------------------------------------------ "soon" items: explain on tap */
  root.querySelectorAll<HTMLElement>('[aria-disabled="true"]').forEach((el) => {
    const poke = () => {
      if (!el.hasAttribute('data-soon')) return;
      el.classList.add('is-poked');
      window.setTimeout(() => el.classList.remove('is-poked'), 1400);
    };
    el.addEventListener('click', (e) => { e.preventDefault(); poke(); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } });
  });

  /* ------------------------------------------------ in-page navigation */
  root.querySelectorAll<HTMLAnchorElement>('a[data-scroll-to]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.dataset.scrollTo!;
      if (!document.getElementById(id)) return;
      e.preventDefault();
      closeAll();
      scrollToSection(id);
    });
  });

  /* ------------------------------------------------ "More" dropdown */
  const openDrop = (open: boolean) => {
    if (!moreBtn || !drop) return;
    if (open === (moreBtn.getAttribute('aria-expanded') === 'true')) return;
    moreBtn.setAttribute('aria-expanded', String(open));
    gsap.killTweensOf(drop);
    if (open) {
      drop.hidden = false;
      gsap.fromTo(drop, { opacity: 0, y: -8, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: reduced() ? 0 : 0.55, ease: 'expo.out', xPercent: -50 });
      gsap.fromTo(drop.querySelectorAll('li'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out', delay: 0.05 });
    } else {
      gsap.to(drop, { opacity: 0, y: -6, duration: reduced() ? 0 : 0.3, ease: 'power2.in', xPercent: -50, onComplete: () => { drop.hidden = true; } });
    }
  };
  if (moreBtn && drop) {
    let hoverTimer = 0;
    let hoverOpenedAt = 0;
    moreBtn.addEventListener('click', () => {
      // a click right after hover-intent opened it should not immediately close it
      if (canHover() && performance.now() - hoverOpenedAt < 600) return;
      openDrop(moreBtn.getAttribute('aria-expanded') !== 'true');
    });
    const wrap = moreBtn.parentElement!;
    wrap.addEventListener('pointerenter', () => {
      if (!canHover()) return;
      clearTimeout(hoverTimer);
      if (moreBtn.getAttribute('aria-expanded') !== 'true') hoverOpenedAt = performance.now();
      openDrop(true);
    });
    wrap.addEventListener('pointerleave', () => { if (canHover()) hoverTimer = window.setTimeout(() => openDrop(false), 220); });
  }

  /* ------------------------------------------------ sheet (tablet / mobile) */
  const sheetItems = () => sheet.querySelectorAll<HTMLElement>('[data-sheet-item]');
  const label = burger.querySelector<HTMLElement>('.lgh__burger-label')!;
  const openSheet = (open: boolean) => {
    if (open === (burger.getAttribute('aria-expanded') === 'true')) return;
    burger.setAttribute('aria-expanded', String(open));
    label.textContent = open ? label.dataset.close! : label.dataset.open!;
    gsap.killTweensOf([sheet, ...sheetItems()]);
    window.dispatchEvent(new CustomEvent('wikars:overlay', { detail: { open } }));
    if (open) {
      sheet.hidden = false;
      const d = reduced() ? 0 : 1;
      gsap.fromTo(sheet, { opacity: 0, y: -10, scaleY: 0.94, filter: 'blur(6px)' }, { opacity: 1, y: 0, scaleY: 1, filter: 'blur(0px)', duration: 0.7 * d, ease: 'expo.out' });
      gsap.fromTo(sheetItems(), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 * d, stagger: 0.06 * d, ease: 'power3.out', delay: 0.08 * d });
      sheet.querySelector<HTMLElement>('a, [tabindex="0"]')?.focus({ preventScroll: true });
    } else {
      gsap.to(sheet, { opacity: 0, y: -8, duration: reduced() ? 0 : 0.35, ease: 'power2.in', onComplete: () => { sheet.hidden = true; } });
    }
  };
  burger.addEventListener('click', () => openSheet(burger.getAttribute('aria-expanded') !== 'true'));

  function closeAll() {
    openDrop(false);
    openSheet(false);
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const sheetOpen = burger.getAttribute('aria-expanded') === 'true';
    closeAll();
    if (sheetOpen) burger.focus();
  });
  document.addEventListener('pointerdown', (e) => {
    if (!root.contains(e.target as Node)) closeAll();
  });
  window.matchMedia('(min-width: 1180px)').addEventListener('change', closeAll);

  /* ------------------------------------------------ denser glass once content scrolls under it */
  const onScroll = () => root.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------ entrance */
  if (!reduced()) {
    gsap.from(capsule, { opacity: 0, y: -14, duration: 1.1, ease: 'expo.out', delay: 0.25 });
  }
}
