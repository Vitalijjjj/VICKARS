# VIK Cars — website

Astro + GSAP (ScrollTrigger). Languages: UA (default, `/`), RU (`/ru/`), EL (`/el/`).

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # astro check + static build → dist/
```

## Approved materials — do not edit

**Current — v3** (`materials/approved/v3/`, approved 2026-11-18 against drawings 3425-22 and the site video):

| File | Role |
|---|---|
| `04_VIKCARS_render_v3_1633x963.png` | Render per the drawings: flat roof (no tower), ground floor 5.50 m / first floor 3.75 m, two car-wash bays with automatic glazed sectional doors, entrance door, solid concrete core, 1.5 m right overhang with the driveway; first floor = veranda + continuous glass (office, showroom) + A/C niche. Served as `public/media/vikcars-render-v3-1.png`. |
| `02_sketch_START_FRAME_v3_aligned_1633x963.png` | Intro start frame (v1 sketch surroundings + new building sketch). |
| `VIKCARS_intro_v3_sketch_to_photo.mp4` | Intro, 4 s, 1634×964 (`materials/approved/v3/render_transition.py … 30 4`). Served as `public/media/vikcars-intro-v3-3.mp4`. |

How v3 was made (`materials/working/client-edit/`): geometry block-out drawn from the drawings (`blockout.py`)
→ Nano Banana Pro → building fitted to the drawing box and pasted into the original scene (`fit_building.py`)
→ glazed car-wash doors edited in and pasted by region (`region_paste.py`); a car-lift door variant was tried and rejected
(`client-edit/v5/rejected_*`) → sketch generated from the
render, aligned and merged (`sketch_align.py`, `sketch_merge.py`). Client inputs: `materials/source/client/`
(drawings PDF + plan crops, site photo, site video + Ukrainian transcript, comments).

**X-ray of −01** (`public/media/vikcars-xray-v3-2.webp`): the underground car park per basement plan 101 and a geometry guide tied to the building (`xray_guide.py`), generated
by Nano Banana Pro on the v3 render, region pasted locally aligned and cut with a feathered edge; shown while −01 is
hovered/selected (`.cinema.is-xray`). Sources and the alternative wireframe variant: `materials/working/client-edit/xray/`.

**Archive — v2** (`materials/approved/v2/`): compact building with a core tower — superseded by the drawings.

**Archive — v1** (`materials/approved/*` top level): the first approved render, sketch and intro.

`materials/working/` — intermediate files; `materials/source/` — the original brief materials.

## Structure

```
src/
  config/site.ts        site map: home sections, nav groups, future pages ('live' | 'planned')
  config/building.ts    render geometry (v3): building box, markers, level zones, zoom focus, DETAILING (= roof width), depth
  i18n/ui.ts            UA / RU / EL dictionaries (RU, EL: review with a native speaker)
  layouts/BaseLayout.astro
  components/header/LiquidGlassHeader.astro   floating glass capsule, dropdown, mobile sheet
  components/home/HomePage.astro              page composition (future sections go here)
  components/home/CinemaStage.astro           Block 01 hero + Block 02 interactive building
  scripts/header.ts     glass refraction map, cursor light, hover pill, menus
  scripts/cinema.ts     layout, video → still handoff, scroll camera, levels
  scripts/navigation.ts in-page navigation registry (pinned sections)
```

### Adding a section
1. Build the component and add it to `HomePage.astro` with the id from `config/site.ts`.
2. Flip its `status` to `'live'` — header, dropdown and mobile sheet start linking to it.

### Depth stack + mouse parallax
Above the still sits a stack that recomposes it exactly at rest (≤ 7/255 on 99.9 % of pixels, WebP rounding):
`depth-sky.webp` → DETAILING (`<svg data-word>`) → `depth-scene.webp` (building, ground, planters, hills) →
`depth-near.webp` (road from the kerb line + the large tree). Built from the approved render, which is only read:
`python3 materials/working/build_depth_layers.py public/media/vikcars-render-v3-1.png <out> [--preview]`
(building geometry constants `BX0`, `BX1`, `ROOF` at the top of the script; output → `depth-*-v3.webp`).
No generation/inpainting: the sky behind the scene and tree is filled from the surrounding sky (push-pull),
the pavement under the road is the pavement mirrored about the kerb, edge pixels are colour-unmixed, and every
layer carries a 48 px mirrored overscan so a shifted layer never shows an edge.

Mouse parallax (`DEPTH` in `config/building.ts`, `cinema.ts`): `gsap.quickTo` on the layer *wrappers* only —
the scroll timeline keeps sole ownership of the camera and the word's svg. Desktop fine pointers only (off for
touch, reduced motion, Save-Data); armed after the intro hands over to the still; returns to rest when the
cursor leaves the window or the hero scrolls away; settles to rest between 30 % and 55 % of the zoom so the
level outlines, hit areas and markers stay locked to the facade.

### Level landings + building → level transition
Pages: `/levels/{lounge-showroom,car-wash,underground-parking}/` (+ `/ru/`, `/el/`), component
`components/levels/LevelPage.astro`, copy in `i18n/levels.ts` (facts from drawings 3425-22). Interiors:
`materials/approved/v3/interiors/` (Nano Banana Pro, prompts in `materials/working/client-edit/interiors/`).

Transition (`cinema.ts → goToLevel`, ~2.3 s): UI steps back → the camera pushes in on the floor → signature move
(00 glazed doors roll up in five sections cut from the facade · +01 light sweeps the glass · −01 the x-ray turns
into the colour interior) → the facade "window" (`window` in `config/building.ts`) opens to full screen → navigate.
Cross-document view transitions (`@view-transition` in `global.css`) carry `level-window` (overlay → hero image)
and `level-title` (marker label → h1); the header keeps `site-header` so it never flickers. Browsers without them
get a plain navigation from an already full-screen interior; reduced motion navigates directly. Back/forward
cache: `pageshow` restores the building exactly as it was.

### Level hero slider
Four photos per level (`level-<slug>-v2.webp` + `-v2-s1..s3`; sources in `materials/approved/v3/slides-v2/`, hand wash + detailing studio regenerated to the brief), captions in
`i18n/levels.ts → slides`. The active thumbnail's progress line is the clock (CSS animation, 6 s); `animationend`
advances; hover / hidden tab pauses; reduced motion: manual only.

### Home sections + business data
Client brief: `materials/source/client/2026-11-18_brief_vik_cars.txt` (00 = hand wash, 6 posts; −01 = detailing
studio: PPF, ceramic, tint, tuning; +01 = lounge). Layout after vonder.ai, in Inter Tight: centred statement
(words light up, inline glyphs) · hand-wash full bleed · three floor cards · detailing studio list with a sticky
image · lounge full bleed · visit rows · rotating "why" quotes · prices + booking form · Limassol full bleed.
`components/home/HomeSections.astro`, dark footer with the embossed wordmark `components/SiteFooter.astro`.
**Draft copy** in `i18n/home.ts` for the client to edit. **All real facts go into `config/business.ts`** (phone,
address, map, hours, prices, client logos, reviews); clients/reviews are `planned` in `config/site.ts` until data
arrives. Forms validate locally and send nothing until a backend is connected.

### Video → still handoff
Video and render share one frame with the render's exact aspect ratio; the video's extra
1 px column/row falls outside it, so both layers are pixel-aligned. From `VIDEO.handoffAt` (3.5 s) the video shows the
approved frame; the still is placed underneath and the video dissolves out on `ended` (0.6 s), which
also hides H.264 compression differences (~2/255 per channel, measured in Chrome).
Fallbacks: reduced motion, Save-Data, autoplay refusal, load error, >4 s without playback, or a page
opened mid-scroll → the still is shown directly.
