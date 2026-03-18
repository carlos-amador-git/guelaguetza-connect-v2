# model-viewer Safari/WebKit Research

Date: 2026-03-17
Researched: GitHub issues, model-viewer source code, WebKit bug tracker

---

## 1. Safari WebGL Context Limit

**Hard limit: 16 WebGL contexts per page in Safari/WebKit.**
(Chrome ~32 with LRU eviction; Firefox evicts oldest with no hard limit.)

model-viewer creates **1 WebGL context per instance** via Three.js `WebGLRenderer`. So if you put 17+ `<model-viewer>` elements in the DOM simultaneously, Safari will silently lose contexts (error: `WebGL: CONTEXT_LOST_WEBGL`).

Source: https://bugs.webkit.org/show_bug.cgi?id=216290

---

## 2. The "Shared Context" Architecture — The Key Safari Problem

model-viewer has a **critical performance optimization**: it shares a SINGLE WebGL context across ALL instances on a page and uses `canvas2D.drawImage()` to "blit" the rendered frame into each instance's `<canvas>`.

This has **two distinct Safari failure modes**:

### Failure Mode A: iOS 17.0–17.3 Privacy Throttle (Issue #4587)
- Safari's "Advanced Tracking and Fingerprinting Protection" (on by default in Private Tabs) adds noise to Canvas2D, WebGL, and WebAudio.
- The `drawImage()` copy operation is throttled — makes all instances sluggish when >1 model-viewer on page.
- **Fixed in iOS 17.4** via WebKit bug https://bugs.webkit.org/show_bug.cgi?id=266181.
- No workaround needed if you target iOS 17.4+. For older iOS 17: nothing you can do from JS.

### Failure Mode B: WebGL Context Lost (Issues #2307, #4868, #5100)
- iOS/Safari 18.7.2 RC had a regression where ALL WebGL content threw `context lost` immediately.
- Confirmed closed/fixed: it was a Safari beta regression, not a model-viewer bug.
- Ongoing issue: too many simultaneous instances → context loss from the 16-context limit.

---

## 3. Official model-viewer Loading Attributes

From source (`packages/model-viewer/src/features/loading.ts`):

```typescript
export type RevealAttributeValue = 'auto' | 'manual';
export type LoadingAttributeValue = 'auto' | 'lazy' | 'eager';
```

### `loading` attribute
- `loading="auto"` (default) — loads when near viewport (uses IntersectionObserver internally)
- `loading="lazy"` — defers loading until the element is near the viewport
- `loading="eager"` — loads immediately regardless of viewport

### `reveal` attribute
- `reveal="auto"` (default) — reveals model when loaded
- `reveal="manual"` — keeps poster visible; you call `dismissPoster()` programmatically

### `poster` attribute
- YES, confirmed: `poster` is a real attribute. Shows a static image until the model loads (or until `dismissPoster()` is called with `reveal="manual"`).
- Usage: `<model-viewer poster="./thumb.webp" reveal="manual" loading="lazy" src="./model.glb">`

---

## 4. Does `loading="lazy"` Actually Help Safari?

**Partially.** The `loading="lazy"` attribute uses `IntersectionObserver` to defer loading the GLB file. It reduces memory and bandwidth.

**BUT:** model-viewer still creates its internal renderer infrastructure at registration time, not at load time. The shared WebGL context is created once. The real problem (16-context limit) only applies if model-viewer uses separate contexts — with the shared-context architecture, you only need 1 context total, so the 16-context limit should NOT be your immediate problem.

The actual bottleneck is **GPU memory + canvas2D drawImage frequency** for many simultaneous visible instances.

---

## 5. Recommended Solutions for Galleries with Many Models

### Solution 1: `loading="lazy"` + `poster` (Built-in, Best First Step)

```html
<model-viewer
  src="./model.glb"
  poster="./model-thumb.webp"
  loading="lazy"
  reveal="auto"
  alt="Product name">
</model-viewer>
```

- Defers GLB fetch until near viewport.
- Shows static image until loaded.
- Safari-safe: uses IntersectionObserver, universally supported.

### Solution 2: `reveal="manual"` + IntersectionObserver (Viewport-controlled)

```html
<model-viewer
  src="./model.glb"
  poster="./model-thumb.webp"
  loading="lazy"
  reveal="manual"
  alt="Product name">
</model-viewer>
```

```javascript
const observers = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.dismissPoster(); // starts rendering
      observers.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('model-viewer').forEach(mv => observers.observe(mv));
```

### Solution 3: Dynamic `src` injection (Most Safari-safe for galleries)

Don't put the `src` attribute at all until the user interacts or the item scrolls into view. This ensures no GLB is loaded and no canvas rendering happens:

```html
<!-- No src attribute initially -->
<model-viewer
  poster="./model-thumb.webp"
  data-src="./model.glb"
  reveal="manual"
  alt="Product name">
</model-viewer>
```

```javascript
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const mv = entry.target;
      if (!mv.src) {
        mv.src = mv.dataset.src;
        mv.reveal = 'auto';
      }
      io.unobserve(mv);
    }
  });
}, { rootMargin: '200px' }); // pre-load 200px before visible

document.querySelectorAll('model-viewer[data-src]').forEach(el => io.observe(el));
```

### Solution 4: Limit simultaneous active renderers (Advanced)

For a carousel/grid: only keep N model-viewers with active `src` at any time. When one scrolls out, remove its `src`:

```javascript
const MAX_ACTIVE = 6; // safe for Safari
let active = [];

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const mv = entry.target;
    if (entry.isIntersecting) {
      if (!active.includes(mv)) active.push(mv);
      if (!mv.src) mv.src = mv.dataset.src;
    } else {
      active = active.filter(x => x !== mv);
      // Optional: release GPU memory for off-screen models
      // mv.src = ''; // aggressive, causes re-fetch on scroll back
    }
  });
});
```

---

## 6. Version Recommendation

**Latest stable: 4.2.0** (npm as of research date).
You're loading **4.0.0** from CDN — this is fine. The Safari shared-context drawImage fix was in place before v4.

If you're using unpkg CDN:
```html
<script type="module" src="https://unpkg.com/@google/model-viewer@4.2.0/dist/model-viewer.min.js"></script>
```

Upgrading to 4.2.0 from 4.0.0 should be safe and picks up any threejs upstream fixes.

---

## 7. `poster` Attribute — Confirmed Yes

```html
<model-viewer
  poster="https://your-cdn.com/model-thumb.webp"
  src="./model.glb"
  loading="lazy"
  reveal="auto">
</model-viewer>
```

- Shows static image immediately (no WebGL required).
- WebGL only activates when the GLB is loaded (`reveal="auto"`) or when `dismissPoster()` is called (`reveal="manual"`).
- This is the **primary Safari-safe pattern** for galleries.

---

## Summary Table

| Problem | Cause | Fix |
|---|---|---|
| `WebGL: context lost` on old iOS | iOS 17.0–17.3 privacy throttle | Update to iOS 17.4+ (fixed in WebKit) |
| `WebGL: context lost` crash | Too many simultaneous rendering | Use `loading="lazy"` + `poster`, limit active instances |
| Sluggish with multiple models | `drawImage` throttled in private mode | No JS workaround for private browsing; use `poster` fallback |
| GLB loads but no 3D visible | Context lost from overload | Inject `src` via IntersectionObserver, max 4-6 active |
| iOS Safari 18.7.2 RC broken | WebKit regression | Fixed in 18.7.2 stable release |

---

## Key GitHub Issues

- #4587: iOS 17 privacy throttle — resolved in iOS 17.4
- #2307: context lost (general) — closed
- #4868: iOS crashing with context lost — ongoing for some devices
- #5100: Safari 18.7.2 RC complete breakage — closed (regression fixed)
- #2124: GPU crash from heavy models — model complexity issue
