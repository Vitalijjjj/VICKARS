import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RENDER, SAFE_BOX, FOCUS, BUILDING, DEPTH, MOBILE_PLATE, type DepthLayer } from '@/config/building';
import { registerScrollTarget, scrollToSection } from './navigation';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

type LevelId = 'up1' | 'ground' | 'down1';
interface Rect { x: number; y: number; w: number; h: number }
interface LevelInfo {
  id: LevelId; code: string; name: string; text: string; page: string;
  image: string; window: Rect; move: 'glass' | 'doors' | 'dive';
}


const mq = (q: string) => window.matchMedia(q).matches;

export function initCinemaStage() {
  const found = document.querySelector<HTMLElement>('[data-cinema]');
  if (!found) return;
  const section: HTMLElement = found;

  const pin = section.querySelector<HTMLElement>('[data-pin]')!;
  const camera = section.querySelector<HTMLElement>('[data-camera]')!;
  const frame = section.querySelector<HTMLElement>('[data-frame]')!;
  const still = section.querySelector<HTMLElement>('[data-still]')!;
  const word = section.querySelector<SVGSVGElement>('[data-word]');
  const wordInner = section.querySelector<SVGGElement>('[data-word-inner]');
  const depthStack = section.querySelector<HTMLElement>('[data-depth-stack]');
  const depthLayers = Array.from(section.querySelectorAll<HTMLElement>('[data-depth]'));
  const video = section.querySelector<HTMLVideoElement>('[data-video]')!;
  const underlay = section.querySelector<HTMLElement>('[data-underlay]');
  const underStill = underlay?.querySelector<HTMLElement>('[data-underlay-still]') ?? null;
  // everything that turns visible at the handoff: the frame's plate + (tall viewports) the portrait plate
  const stills: HTMLElement[] = underStill ? [still, underStill] : [still];
  // tall viewport: the browser picked the 9:16 intro (<source media>) — it plays on the portrait plate
  const portraitVideo = !!underlay && mq(MOBILE_PLATE.media);
  if (portraitVideo) underlay!.append(video);
  const zonesSvg = section.querySelector<SVGSVGElement>('[data-zones]')!;
  const ui = section.querySelector<HTMLElement>('.cinema__ui')!;
  const veil = section.querySelector<HTMLElement>('[data-veil]');
  const levelsTitle = section.querySelector<HTMLElement>('[data-levels-title]')!;
  const sw = section.querySelector<HTMLElement>('[data-switch]')!;
  const markers = Array.from(section.querySelectorAll<HTMLButtonElement>('.marker'));
  const options = Array.from(section.querySelectorAll<HTMLButtonElement>('.levels__opt'));
  const hits = Array.from(section.querySelectorAll<HTMLElement>('[data-hit]'));
  const zones = Array.from(section.querySelectorAll<SVGGElement>('[data-zone]'));
  const scans = Array.from(section.querySelectorAll<SVGRectElement>('.zone__scan'));
  const preview = section.querySelector<HTMLElement>('[data-preview]')!;
  const levelInfo: LevelInfo[] = JSON.parse(document.getElementById('levels-data')?.textContent || '[]');

  const reduced = mq('(prefers-reduced-motion: reduce)');
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

  /* ================================================================ layout
   * Fit the render so the building (safe box) is never cropped, cover the viewport when that is
   * possible, and compute where the scroll camera should end up. */
  const L = { s: 1, left: 0, top: 0, fw: 0, fh: 0, zoom: 1.2, tx: 0, ty: 0, compact: false, contained: false };

  function layout() {
    const vw = pin.clientWidth;
    const vh = pin.clientHeight;
    const touch = !mq('(hover: hover) and (pointer: fine)');

    const sCover = Math.max(vw / RENDER.width, vh / RENDER.height);
    const sFit = Math.min(vw / SAFE_BOX.w, vh / (SAFE_BOX.h * 1.45));
    const s = Math.min(sCover, sFit);
    const fw = RENDER.width * s;
    const fh = RENDER.height * s;
    const narrow = vw < 720;

    const safeCx = (SAFE_BOX.x + SAFE_BOX.w / 2) * s;
    const safeCy = (SAFE_BOX.y + SAFE_BOX.h / 2) * s;
    let left = fw > vw ? Math.min(0, Math.max(vw - fw, vw / 2 - safeCx)) : (vw - fw) / 2;
    let top = vh * (narrow ? 0.47 : 0.52) - safeCy;
    top = fh > vh ? Math.min(0, Math.max(vh - fh, top)) : Math.max(0, Math.min(vh - fh, top));

    // zoom: bring the facade closer while keeping all of it in frame
    const bw = BUILDING.w * s;
    const bh = BUILDING.h * s;
    const maxZ = narrow ? 1.12 : 1.4;
    const zoom = Math.max(1.04, Math.min(maxZ, (vw * (narrow ? 0.96 : 0.86)) / bw, (vh * (narrow ? 0.5 : 0.64)) / bh));

    const fx = left + FOCUS.x * s;
    const fy = top + FOCUS.y * s;
    let tx = vw / 2 - zoom * fx;
    let ty = vh * (narrow ? 0.44 : 0.53) - zoom * fy;
    if (fw * zoom >= vw) tx = Math.min(-zoom * left, Math.max(vw - zoom * (left + fw), tx));
    if (fh * zoom >= vh) ty = Math.min(-zoom * top, Math.max(vh - zoom * (top + fh), ty));

    Object.assign(L, {
      s, left, top, fw, fh, zoom, tx, ty,
      contained: fh < vh - 1,
      // markers need room on the facade; otherwise use the bottom selector
      compact: touch || bw * zoom < 640,
    });

    Object.assign(frame.style, { left: `${left}px`, top: `${top}px`, width: `${fw}px`, height: `${fh}px` });
    // portrait plate: plate px (0, y0) = render px (x0, 0), so its band lands exactly on the frame;
    // the outpainted sky / foreground fill the screen above and below
    const portrait = !!underlay && (L.contained || mq(MOBILE_PLATE.media));
    if (underlay && portrait) {
      Object.assign(underlay.style, {
        left: `${left + MOBILE_PLATE.x0 * s}px`, top: `${top - MOBILE_PLATE.y0 * s}px`,
        width: `${MOBILE_PLATE.w * s}px`, height: `${MOBILE_PLATE.h * s}px`,
      });
    }
    section.classList.toggle('is-portrait', portrait);
    section.classList.add('is-laid-out');
    section.classList.toggle('is-contained', L.contained);
    section.classList.toggle('is-compact', L.compact);
    syncScale();
  }

  function syncScale() {
    const z = Number(gsap.getProperty(camera, 'scale')) || 1;
    camera.style.setProperty('--z', String(z));
    zonesSvg.style.setProperty('--sw', String(1.3 / (L.s * z)));
  }

  layout();

  /* ================================================================ intro video → still */
  let handedOver = false;
  let uiShown = false;

  // DETAILING rises from behind the roof once the approved frame is on screen
  const revealWord = () => {
    if (!wordInner) return;
    if (reduced) { gsap.set(wordInner, { opacity: 1 }); return; }
    gsap.fromTo(wordInner, { opacity: 0, y: 150 }, { opacity: 1, duration: 1.4, ease: 'power2.out', delay: 0.15 });
    gsap.fromTo(wordInner, { y: 150 }, { y: 0, duration: 2.2, ease: 'expo.out', delay: 0.15, immediateRender: false });
  };

  // set up by the mouse-parallax block below (desktop only); armed once the still is on screen
  let armParallax = () => {};

  const showHeroUI = () => {
    if (uiShown) return;
    uiShown = true;
    section.classList.add('is-ready');
    revealWord();
    // after the video's 0.6 s dissolve / the still's fade — never while the intro is playing
    window.setTimeout(() => armParallax(), 700);
  };

  const showStill = (fade: number) => {
    handedOver = true;
    gsap.to(stills, { opacity: 1, duration: fade, ease: 'power1.out', overwrite: true });
  };

  const retireVideo = (fade: number) => {
    gsap.to(video, {
      opacity: 0,
      duration: fade,
      ease: 'power1.inOut',
      onComplete: () => {
        video.pause();
        video.style.visibility = 'hidden';
      },
    });
  };

  const fallback = () => {
    if (handedOver) return;
    showStill(reduced ? 0 : 1.1);
    retireVideo(reduced ? 0 : 0.6);
    showHeroUI();
  };

  if (reduced || saveData) {
    video.removeAttribute('preload');
    video.style.visibility = 'hidden';
    gsap.set(stills, { opacity: 1 });
    handedOver = true;
    showHeroUI();
  } else {
    const handoffAt = Number(video.dataset.handoff) || 3.5;
    let started = false;

    // From handoffAt the video shows the approved frame; put the identical still underneath.
    video.addEventListener('timeupdate', () => {
      if (!handedOver && video.currentTime >= handoffAt) {
        handedOver = true;
        gsap.set(stills, { opacity: 1 });
      }
    });
    video.addEventListener('playing', () => { started = true; }, { once: true });
    video.addEventListener('ended', () => {
      if (!handedOver) { handedOver = true; gsap.set(stills, { opacity: 1 }); }
      // pixel-aligned layers — a soft dissolve only hides H.264 compression differences
      retireVideo(0.6);
      showHeroUI();
    });
    video.addEventListener('error', fallback);
    // only the last <source> failing means no intro at all (a failed portrait file falls through to the 16:9 one)
    Array.from(video.querySelectorAll('source')).pop()?.addEventListener('error', fallback);

    const tryPlay = () => { if (!handedOver) video.play().catch(fallback); };
    if (video.readyState >= 2) {
      // already buffered (browser cache) — play straight away; calling load() now would reset it to frame 0
      tryPlay();
    } else {
      video.addEventListener('loadeddata', tryPlay, { once: true });
      if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) video.load();
    }

    // never hold the visitor hostage to a slow network
    window.setTimeout(() => { if (!started) fallback(); }, 4000);

    // page restored mid-scroll (reload, back/forward, #complex): the intro would play behind the levels — skip it
    const skipIfScrolled = () => { if (window.scrollY > 40 && !handedOver) fallback(); };
    skipIfScrolled();
    window.addEventListener('load', () => requestAnimationFrame(skipIfScrolled), { once: true });
    // the visitor scrolls away before the intro ends: hand over early so the zoom always shows the building
    window.addEventListener('scroll', () => {
      if (!handedOver && window.scrollY > window.innerHeight * 0.35) fallback();
    }, { passive: true });
  }

  /* ================================================================ hero foot links → resting point of the levels */
  section.querySelectorAll<HTMLAnchorElement>('a[data-scroll-to]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToSection(a.dataset.scrollTo!);
    });
  });

  /* ================================================================ depth stack
   * Three layers that recompose the approved still exactly at rest. Swap them in only once all are decoded;
   * if any fails, the plain still stays (and the word, which needs the occluding layers, goes with the stack). */
  let depthReady = false;
  let onDepthReady = () => {};
  if (depthStack) {
    const imgs = Array.from(depthStack.querySelectorAll('img'));
    Promise.all(imgs.map((img) => img.decode()))
      .then(() => {
        depthReady = true;
        still.classList.add('is-depth-ready');
        onDepthReady();
      })
      .catch(() => depthStack.remove());
  }

  /* ================================================================ levels interaction */
  let opened: LevelId | null = null;
  let interactive = false;

  /* −01 x-ray: lift the whole frame (not the camera — the scroll timeline owns it) just enough for the
   * underground section to clear the bottom UI, never pushing the roof under the header */
  const xray = section.querySelector<HTMLElement>('.cinema__xray');
  const header = document.querySelector<HTMLElement>('[data-lgh-capsule]');
  let lifted = false;
  // hover only reveals the x-ray; the lift happens when −01 is opened (moving the frame under a hovering
  // cursor would make the marker slip away from it and flicker)
  function xrayFocus(on: boolean, lift: boolean) {
    section.classList.toggle('is-xray', on);
    if (!xray || (on && lift) === lifted) return;
    lifted = on && lift;
    const movers = underlay ? [frame, underlay] : [frame];   // the portrait plate moves with the frame
    if (!lifted) { gsap.to(movers, { y: 0, duration: reduced ? 0 : 0.9, ease: 'expo.out', overwrite: 'auto' }); return; }
    const z = Number(gsap.getProperty(camera, 'scale')) || 1;
    const curY = Number(gsap.getProperty(frame, 'y')) || 0;
    const fr = frame.getBoundingClientRect();
    const xr = xray.getBoundingClientRect();
    const baseBottom = xr.bottom - curY * z;
    const swr = sw.getBoundingClientRect();
    const limit = swr.height > 0 && swr.top > window.innerHeight * 0.5 ? swr.top - 14 : window.innerHeight - 76;
    const need = Math.max(0, baseBottom - limit);
    const roofTop = fr.top - curY * z + BUILDING.y * (fr.height / RENDER.height);
    const room = Math.max(0, roofTop - ((header?.getBoundingClientRect().bottom ?? 0) + 18));
    const shift = Math.min(need, room);
    gsap.to(movers, { y: -shift / z, duration: reduced ? 0 : 0.9, ease: 'expo.out', overwrite: 'auto' });
  }

  function setActive(id: LevelId | null) {
    xrayFocus(id === 'down1', opened === 'down1');
    zones.forEach((z) => z.classList.toggle('is-active', z.dataset.zone === id));
    markers.forEach((m) => {
      m.classList.toggle('is-active', m.dataset.level === id);
      m.classList.toggle('is-dim', !!id && m.dataset.level !== id);
      m.setAttribute('aria-pressed', String(m.dataset.level === opened));
    });
    options.forEach((o) => o.setAttribute('aria-pressed', String(o.dataset.level === (opened ?? id))));
  }

  const pCode = preview.querySelector<HTMLElement>('[data-p-code]')!;
  const pName = preview.querySelector<HTMLElement>('[data-p-name]')!;
  const pText = preview.querySelector<HTMLElement>('[data-p-text]')!;
  const pGo = preview.querySelector<HTMLElement>('[data-p-go]')!;

  function openPreview(id: LevelId) {
    const info = levelInfo.find((l) => l.id === id);
    if (!info) return;
    const wasOpen = !preview.hidden;
    opened = id;
    setActive(id);
    pCode.textContent = info.code;
    pName.textContent = info.name;
    pText.textContent = info.text;
    (pGo as HTMLAnchorElement).href = info.page;
    const parts = preview.querySelectorAll('.preview__code, .preview__name, .preview__text, .preview__go');
    gsap.killTweensOf([preview, ...parts]);
    preview.hidden = false;
    if (!wasOpen) {
      gsap.fromTo(preview, { opacity: 0, y: 16, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: reduced ? 0 : 0.8, ease: 'expo.out' });
    }
    gsap.fromTo(parts, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: reduced ? 0 : 0.6, stagger: 0.05, ease: 'power3.out', delay: wasOpen ? 0 : 0.08 });
  }

  function closePreview() {
    if (preview.hidden) { opened = null; setActive(null); return; }   // a hover highlight alone must clear too
    opened = null;
    gsap.to(preview, {
      opacity: 0,
      y: 10,
      duration: reduced ? 0 : 0.35,
      ease: 'power2.in',
      onComplete: () => { preview.hidden = true; },
    });
    setActive(null);
  }

  const hoverable = () => mq('(hover: hover) and (pointer: fine)');

  const bindLevel = (el: HTMLElement, id: LevelId) => {
    el.addEventListener('pointerenter', () => { if (interactive && hoverable()) setActive(id); });
    el.addEventListener('pointerleave', () => { if (interactive && hoverable()) setActive(opened); });
    el.addEventListener('focus', () => { if (interactive) setActive(id); });
    el.addEventListener('blur', () => setActive(opened));
    // a click goes straight into the level (no intermediate card)
    el.addEventListener('click', () => { if (interactive) goToLevel(id); });
  };
  markers.forEach((m) => bindLevel(m, m.dataset.level as LevelId));
  hits.forEach((h) => bindLevel(h, h.dataset.hit as LevelId));
  options.forEach((o) => bindLevel(o, o.dataset.level as LevelId));

  preview.querySelector('[data-p-close]')!.addEventListener('click', closePreview);
  pGo.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || !opened) return; // new tab etc.: plain link
    e.preventDefault();
    goToLevel(opened);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePreview(); });
  // the header menu takes the stage: step the level preview aside
  window.addEventListener('wikars:overlay', (e) => { if ((e as CustomEvent<{ open: boolean }>).detail.open) closePreview(); });

  // hero foot rows: jump to the levels and open the chosen one once the stage is interactive
  let pendingLevel: LevelId | null = null;
  section.querySelectorAll<HTMLAnchorElement>('[data-goto-level]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const id = a.dataset.gotoLevel as LevelId;
      scrollToSection('complex');
      if (interactive) goToLevel(id);    // reduced motion: the levels are already live
      else pendingLevel = id;
    });
  });

  function setInteractive(on: boolean) {
    if (on === interactive) return;
    interactive = on;
    section.classList.toggle('is-interactive', on);
    if (on && pendingLevel) { const id = pendingLevel; pendingLevel = null; window.setTimeout(() => goToLevel(id), 350); }
    if (!on) {
      // leaving the levels (scrolling back towards the hero): drop the preview and any hover/focus highlight —
      // the pointer may still rest on a hit area, so pointerleave would never clear it
      closePreview();
      setActive(null);
      if (section.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    }
  }

  /* ================================================================ building → level transition
   * 1 · focus   the UI steps back, the camera pushes in on the chosen floor (scroll stays where it is)
   * 2 · signature  00: the glazed sectional doors roll up · +01: light sweeps the glass · −01: dive into the x-ray
   * 3 · window  the facade opening grows to fill the screen, revealing the level interior
   * 4 · arrive  navigate; the cross-document view transition hands the window + title to the level page */
  const lvt = document.querySelector<HTMLElement>('[data-lvt]');
  let leaving = false;
  let restore: (() => void) | null = null;

  function windowRect(w: Rect) {
    const fr = frame.getBoundingClientRect();
    const k = fr.width / RENDER.width;
    return { x: fr.left + w.x * k, y: fr.top + w.y * k, w: w.w * k, h: w.h * k, fr };
  }
  const clipTo = (el: HTMLElement, r: { x: number; y: number; w: number; h: number }, rad = 4) => {
    el.style.setProperty('--t', `${r.y}px`);
    el.style.setProperty('--l', `${r.x}px`);
    el.style.setProperty('--r', `${window.innerWidth - r.x - r.w}px`);
    el.style.setProperty('--b', `${window.innerHeight - r.y - r.h}px`);
    el.style.setProperty('--rad', `${rad}px`);
  };

  function goToLevel(id: LevelId) {
    const info = levelInfo.find((l) => l.id === id);
    if (!info || leaving || !lvt) return;
    leaving = true;
    setActive(id);   // zone highlight; −01 reveals the x-ray
    const go = () => window.location.assign(info.page);
    if (reduced) { go(); return; }

    const win = lvt.querySelector<HTMLElement>('[data-lvt-win]')!;
    const img = lvt.querySelector<HTMLImageElement>('[data-lvt-img]')!;
    const doors = lvt.querySelector<HTMLElement>('[data-lvt-doors]')!;
    const glare = lvt.querySelector<HTMLElement>('[data-lvt-glare]')!;
    const title = lvt.querySelector<HTMLElement>('[data-lvt-title]')!;
    lvt.querySelector('[data-lvt-code]')!.textContent = info.code;
    lvt.querySelector('[data-lvt-name]')!.textContent = info.name;
    img.src = info.image;
    doors.replaceChildren();

    // the marker label becomes the page title (view-transition-name: level-title)
    const mk = markers.find((m) => m.dataset.level === id);
    const shown = mk && getComputedStyle(mk).display !== 'none' && mk.getBoundingClientRect().width > 0;
    const anchor = shown ? mk!.getBoundingClientRect() : options.find((o) => o.dataset.level === id)?.getBoundingClientRect();
    const tx = anchor ? anchor.left + (shown ? 28 : 12) : 24, ty = anchor ? anchor.top + anchor.height / 2 - 16 : window.innerHeight * 0.7;
    Object.assign(title.style, { left: `${tx}px`, top: `${ty}px`, opacity: '0' });

    const cam0 = { x: gsap.getProperty(camera, 'x'), y: gsap.getProperty(camera, 'y'), scale: gsap.getProperty(camera, 'scale') };
    const fy0 = gsap.getProperty(frame, 'y');
    restore = () => {
      gsap.set(camera, cam0); gsap.set(underlay ? [frame, underlay] : frame, { y: fy0 }); syncScale();
      gsap.set([...markers, ...levelsUI], { autoAlpha: 1 });
      lvt.hidden = true; gsap.set([img, doors, glare, title], { clearProps: 'all' }); doors.replaceChildren();
      closePreview(); setActive(null); leaving = false;
    };

    // 1 · push in: window centre → viewport centre, window grows to ~70 % of the viewport
    const r0 = windowRect(info.window);
    const vw = window.innerWidth, vh = window.innerHeight;
    const f = gsap.utils.clamp(1.05, 3, Math.min((vw * 0.7) / r0.w, (vh * 0.6) / r0.h));
    const pr = pin.getBoundingClientRect();
    const O = { x: pr.left, y: pr.top };   // the camera scales from its top-left corner (see layout(): screen = t + zoom · p)
    const X = Number(cam0.x) || 0, Y = Number(cam0.y) || 0, Z = Number(cam0.scale) || 1;
    const wc = { x: r0.x + r0.w / 2, y: r0.y + r0.h / 2 };
    const vc = { x: vw / 2, y: vh * 0.52 };
    const push = { x: vc.x - O.x - f * (wc.x - O.x - X), y: vc.y - O.y - f * (wc.y - O.y - Y), scale: Z * f };

    const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
    tl.to([preview, ...markers, ...levelsUI], { autoAlpha: 0, duration: 0.35, ease: 'power2.out' }, 0)
      .to(camera, { ...push, duration: 0.95, onUpdate: syncScale }, 0)
      .add(() => {
        // the window as it sits on screen after the push
        const r = windowRect(info.window);
        clipTo(win, r, info.move === 'dive' ? 2 : 3);
        lvt.hidden = false;
        if (info.move === 'doors') {
          // the doors themselves, cut from the facade on screen, in five sections
          const n = 5;
          for (let i = 0; i < n; i++) {
            const s = document.createElement('i');
            const top = r.y + (r.h * i) / n;
            Object.assign(s.style, {
              top: `${top}px`, height: `${r.h / n + 0.5}px`,
              backgroundImage: `url(${still.querySelector('img')?.getAttribute('src')})`,
              backgroundSize: `${r.fr.width}px ${r.fr.height}px`,
              backgroundPosition: `${r.fr.left}px ${r.fr.top - top}px`,
            });
            doors.append(s);
          }
          gsap.set(img, { scale: 1.12, transformOrigin: `${r.x + r.w / 2}px ${r.y + r.h / 2}px` });
        } else if (info.move === 'glass') {
          gsap.set(img, { opacity: 0, scale: 1.12, transformOrigin: `${r.x + r.w / 2}px ${r.y + r.h / 2}px` });
        } else {
          gsap.set(img, { filter: 'grayscale(1) contrast(1.1)', scale: 1.1, transformOrigin: `${r.x + r.w / 2}px ${r.y + r.h / 2}px` });
        }
      }, 0.9)
      .addLabel('sig', 0.92);

    // 2 · signature
    if (info.move === 'doors') {
      tl.add(() => {
        gsap.to(doors.children, { yPercent: -102, duration: 0.7, ease: 'power2.in', stagger: { each: 0.05, from: 'end' } });
      }, 'sig');
    } else if (info.move === 'glass') {
      tl.fromTo(glare, { opacity: 0.9, xPercent: -40 }, { xPercent: 40, opacity: 0, duration: 0.8, ease: 'power2.out' }, 'sig')
        .to(img, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 'sig+=0.15');
    }

    // 3 · the window opens to the full screen, the interior settles, the building keeps moving in behind it
    const open = 0.92 + (info.move === 'doors' ? 0.55 : 0.3);
    tl.to(win, { '--t': '0px', '--l': '0px', '--r': '0px', '--b': '0px', '--rad': '0px', duration: 0.9, ease: 'expo.inOut' }, open)
      .to(img, { scale: 1, filter: 'grayscale(0) contrast(1)', duration: 1.0, ease: 'expo.out' }, open)
      .to(camera, { scale: Z * f * 1.12, duration: 0.9, ease: 'power2.in', onUpdate: syncScale }, open)
      .to(title, { opacity: 1, duration: 0.3 }, open)
      // 4 · arrive
      .add(go, open + 0.9);
  }

  // back/forward cache: the page comes back exactly as we left it — put the building back
  window.addEventListener('pageshow', (e) => { if (e.persisted && restore) restore(); });

  /* ================================================================ scroll camera */
  const levelsUI = [levelsTitle, sw];

  if (reduced) {
    gsap.set([...levelsUI, ...markers], { autoAlpha: 1 });
    setInteractive(true);
    window.addEventListener('resize', layout);
    return;
  }

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: pin,
      pin: true,
      start: 'top top',
      end: () => `+=${window.innerHeight * (L.compact ? 1.25 : 2.1)}`,
      scrub: 0.9,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: (self) => setInteractive(self.progress > 0.72),
    },
    onUpdate: syncScale,
  });

  // hero foot and the road blur leave together, slowly, over the first part of the zoom
  // (the blur shrinks its radius rather than its opacity — see .cinema__veil)
  tl.fromTo(ui, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 0)
    .fromTo(veil, { '--veil-out': 1 }, { '--veil-out': 0, duration: 0.3, ease: 'power1.in' }, 0)
    .fromTo(
      camera,
      { scale: 1, x: 0, y: 0 },
      { scale: () => L.zoom, x: () => L.tx, y: () => L.ty, duration: 0.62, ease: 'power2.inOut' },
      0,
    )
    // depth: as the camera moves in, the word sinks behind the building, then clears the stage for the levels
    .fromTo(word, { yPercent: 0, autoAlpha: 1 }, { yPercent: 4.5, duration: 0.62, ease: 'power2.inOut' }, 0)
    .to(word, { autoAlpha: 0, duration: 0.12, ease: 'power1.in' }, 0.4)
    // a quiet "survey" line runs around each level as the levels arrive
    .fromTo(scans, { opacity: 0, strokeDashoffset: 1 }, { opacity: 0.9, strokeDashoffset: 0, duration: 0.14, stagger: 0.05, ease: 'power1.inOut' }, 0.52)
    .to(scans, { opacity: 0, duration: 0.1 }, 0.74)
    .fromTo(markers, { autoAlpha: 0, filter: 'blur(4px)' }, { autoAlpha: 1, filter: 'blur(0px)', duration: 0.12, stagger: 0.05, ease: 'power2.out' }, 0.6)
    .fromTo(levelsUI, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, stagger: 0.04 }, 0.66)
    .to({}, { duration: 0.2 }); // rest: interactive hold before the next section

  const st = tl.scrollTrigger!;
  registerScrollTarget('complex', () => st.start + (st.end - st.start) * 0.86);

  /* ================================================================ mouse depth parallax
   * Independent of the scroll camera: the timeline owns `camera` (scale/x/y) and the word's <svg>; the cursor
   * only translates the depth-layer wrappers inside the frame, so no element has two writers.
   * Desktop pointers only; off for touch, reduced motion (returned above) and Save-Data. */
  if (depthStack && !saveData && mq('(hover: hover) and (pointer: fine)')) {
    const glide = { duration: 1.25, ease: 'power3.out' };
    const movers = depthLayers.map((el) => ({
      amp: DEPTH.layers[el.dataset.depth as DepthLayer],
      x: gsap.quickTo(el, 'x', glide),
      y: gsap.quickTo(el, 'y', glide),
    }));
    let armed = false;
    let inView = true;
    let nx = 0;
    let ny = 0;

    const apply = () => {
      // full depth on the hero; settles to neutral while the camera moves in (30–55 % of the zoom), so the
      // level outlines, hit areas and markers that arrive afterwards stay locked to the facade
      // progress from the scroll position itself — st.progress updates a tick later than the scroll event
      const p = gsap.utils.clamp(0, 1, (window.scrollY - st.start) / Math.max(1, st.end - st.start));
      const settle = 1 - gsap.utils.clamp(0, 1, (p - 0.3) / 0.25);
      const k = armed && inView ? settle * L.s : 0; // render px → CSS px at the current fit
      for (const m of movers) {
        m.x(-nx * m.amp.x * k);
        m.y(-ny * m.amp.y * k);
      }
    };
    const toNeutral = () => { nx = 0; ny = 0; apply(); };

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      nx = (e.clientX / window.innerWidth) * 2 - 1;
      ny = (e.clientY / window.innerHeight) * 2 - 1;
      if (armed) apply();
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', toNeutral);
    window.addEventListener('blur', toNeutral);
    window.addEventListener('scroll', () => { if (armed) apply(); }, { passive: true });
    new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; apply(); }).observe(section);

    let wanted = false;
    armParallax = () => {
      wanted = true;
      if (!depthReady) return; // arms as soon as the layers are decoded
      armed = true;
      apply(); // glides from rest to the cursor — no jump at handoff
    };
    onDepthReady = () => { if (wanted) armParallax(); };
  }

  ScrollTrigger.addEventListener('refreshInit', layout);
  // the still/video decode can change nothing in layout, but fonts can shift UI — refresh once settled
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  if (location.hash === '#complex') {
    requestAnimationFrame(() => window.scrollTo({ top: st.start + (st.end - st.start) * 0.86 }));
  }
}
