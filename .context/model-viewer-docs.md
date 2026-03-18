# @google/model-viewer — Attribute Reference & Best Practices
# Source: Context7 /google/model-viewer + GitHub issue tracker
# Date: 2026-03-17

---

## 1. `loading` Attribute

Controls when the 3D model file is fetched.

| Value | Behavior |
|-------|----------|
| `auto` (default) | Browser decides — typically eager when visible in viewport |
| `eager` | Fetch immediately on parse, regardless of visibility |
| `lazy` | Defer fetch until element is near the viewport (IntersectionObserver) |

```html
<!-- Lazy-load until scrolled near viewport -->
<model-viewer src="model.glb" loading="lazy" poster="poster.webp"></model-viewer>

<!-- Force immediate load -->
<model-viewer src="model.glb" loading="eager"></model-viewer>
```

**Gallery recommendation:** Always use `loading="lazy"` for off-screen cards. Combine with `poster` so the placeholder renders immediately.

---

## 2. `reveal` Attribute

Controls when the rendered 3D scene is shown (replaces the poster).

| Value | Behavior |
|-------|----------|
| `auto` (default) | Poster dismissed automatically once model is ready |
| `interaction` | Poster stays until the user first interacts (click/drag) |
| `manual` | Poster stays until `dismissPoster()` is called programmatically |

```html
<!-- Hold poster until user clicks -->
<model-viewer src="model.glb" poster="poster.webp" reveal="interaction" camera-controls>
</model-viewer>

<!-- Programmatic control — e.g., reveal after a carousel selection -->
<model-viewer id="mv" src="model.glb" poster="poster.webp" reveal="manual" camera-controls>
</model-viewer>
<script>
  const mv = document.getElementById('mv');
  mv.addEventListener('load', () => mv.dismissPoster());
</script>
```

---

## 3. `poster` Attribute

Shows a static image while the model loads or before reveal.

```html
<model-viewer
  src="model.glb"
  poster="poster.webp"       <!-- URL to fallback image -->
  loading="lazy"
  reveal="auto"
  camera-controls>
</model-viewer>
```

- Accepts any image URL (WebP recommended for size).
- Displayed until the model is fully loaded AND `reveal` condition is met.
- Works as a slot-based custom element too: `<img slot="poster" src="...">` for richer markup.
- Critical for galleries — prevents blank boxes during model load.

---

## 4. Gallery / Multiple Instances Best Practices

### WebGL context limit (most important constraint)
Browsers cap concurrent WebGL contexts at **~8–16** (varies by browser/GPU). Each `<model-viewer>` with an active render loop consumes one context. Exceeding this causes **"WebGL: context lost"** errors — a well-documented issue (issues #2307, #2124, #2554).

### Recommended gallery pattern

```html
<!-- All gallery items start as poster-only, load lazily -->
<model-viewer
  src="model-A.glb"
  poster="poster-A.webp"
  loading="lazy"
  reveal="interaction"   <!-- only activates WebGL on first interaction -->
  camera-controls>
</model-viewer>
```

**Strategy options:**

1. **Lazy + interaction reveal** — safest for large galleries. WebGL context only opens when user interacts.
2. **One active viewer** — show a single full `<model-viewer>` in a modal/lightbox on click; all grid items are static `<img>` posters.
3. **IntersectionObserver swap** — keep `src` empty, set it only when element enters viewport, clear it when it exits (frees context).

```javascript
// Pattern 3: dynamic src swap
const observers = document.querySelectorAll('model-viewer[data-src]');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const mv = entry.target;
    if (entry.isIntersecting) {
      mv.src = mv.dataset.src;
    } else {
      mv.src = '';        // releases WebGL context
      mv.poster = mv.dataset.poster;
    }
  });
}, { rootMargin: '200px' });

observers.forEach(mv => io.observe(mv));
```

```html
<!-- HTML for pattern 3 -->
<model-viewer
  data-src="model.glb"
  data-poster="poster.webp"
  poster="poster.webp"
  loading="lazy"
  camera-controls>
</model-viewer>
```

### Library lazy-load (Lighthouse pattern)
Only inject the model-viewer script bundle after first user interaction:

```javascript
let loaded = false;
const loadMV = () => {
  if (loaded) return;
  loaded = true;
  const s = document.createElement('script');
  s.type = 'module';
  s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
  document.body.appendChild(s);
};
['mouseover','touchmove','scroll','keydown'].forEach(e =>
  document.body.addEventListener(e, loadMV, { once: true })
);
```

---

## 5. Safari / WebKit / iOS Guidance

### Known issues (from GitHub tracker)

| Issue | Status | Notes |
|-------|--------|-------|
| #5100 | closed | WebGL context lost in Safari 18.7.2 RC — fixed upstream |
| #4868 | open | model-viewer crashing on iOS (memory pressure) |
| #4587 | closed | iOS 17 Safari Privacy Protections slow down rendering with multiple instances |
| #2124 | closed | GPU crash on iOS/Android — mitigated by limiting active instances |
| #3560 | closed | Context lost when navigating between pages with/without model-viewer |

### iOS-specific recommendations

1. **Limit concurrent instances to ≤3 on iOS.** iOS Safari has stricter WebGL context limits and lower GPU memory.
2. **Use `ios-src` for native AR.** Provide a `.usdz` or `.reality` file for Quick Look AR on iOS — WebXR is not available in Safari.
   ```html
   <model-viewer src="model.glb" ios-src="model.usdz" ar ar-modes="quick-look webxr scene-viewer">
   ```
3. **`reveal="interaction"` on mobile** prevents automatic WebGL initialization on scroll, reducing crashes.
4. **Avoid `auto-rotate`** on galleries — it keeps the render loop running and drains battery/GPU on mobile.
5. **iOS 17+ Privacy Protections** throttle canvas rendering on inactive tabs. Use `model-visibility` event to pause work when hidden.
   ```javascript
   mv.addEventListener('model-visibility', e => {
     if (!e.detail.visible) mv.autoRotate = false;
   });
   ```
6. **Test with `loading="lazy"` + `poster`** as a baseline — if poster shows correctly but model never renders, check WebGL context count first.

### WKWebView (in-app browsers)
- `canActivateAR` returns false positives in WKWebView (#3526) — always gate AR button visibility on `ar-status` event.
- WebXR is blocked in WKWebView; Quick Look is the only AR path.

---

## Quick Reference — Recommended defaults for a gallery

```html
<model-viewer
  src="model.glb"
  poster="poster.webp"
  alt="Description of model"
  loading="lazy"
  reveal="interaction"
  camera-controls
  shadow-intensity="1">
</model-viewer>
```

For iOS/AR support, add:
```html
  ar
  ar-modes="quick-look webxr scene-viewer"
  ios-src="model.usdz"
```
