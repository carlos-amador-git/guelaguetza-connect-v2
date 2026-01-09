# Guía de Componentes UI - Guelaguetza Connect

## Resumen de Componentes de Medios

Este documento describe los componentes de medios disponibles y sus usos recomendados.

---

## Componentes Disponibles

### 1. LazyImage.tsx (RECOMENDADO para imágenes)

**Usar para:** Imágenes en listas, grids, y cualquier lugar donde el performance sea importante.

```tsx
import { LazyImage, Avatar, ImageGallery } from './ui/LazyImage';

// Imagen con lazy-loading
<LazyImage src="/foto.jpg" alt="Descripción" className="w-full rounded-xl" />

// Avatar con fallback a iniciales
<Avatar src={user.photo} name={user.name} size={48} />

// Galería simple
<ImageGallery images={[{src: '...', alt: '...'}]} columns={3} />
```

**Características:**
- Intersection Observer para lazy-loading
- Blur placeholder durante carga
- Fallback automático si la imagen falla

---

### 2. Media.tsx (Para funcionalidad avanzada)

**Usar para:** Galerías complejas, reproductores de video/audio, subida de archivos.

```tsx
import { Image, ImageGallery, VideoPlayer, AudioPlayer, AvatarUpload } from './ui/Media';

// Galería con thumbnails y lightbox avanzado
<ImageGallery images={images} showThumbnails />

// Reproductor de video con controles custom
<VideoPlayer src="/video.mp4" poster="/poster.jpg" />

// Reproductor de audio (variantes: full, compact, minimal)
<AudioPlayer src="/audio.mp3" variant="compact" />

// Subida de avatar con preview
<AvatarUpload value={avatar} onChange={setAvatar} />
```

---

### 3. MediaViewer.tsx (Para visualización fullscreen)

**Usar para:** Visor de medios fullscreen con soporte para swipe y zoom.

```tsx
import MediaViewer, { useMediaViewer } from './ui/MediaViewer';

const { isOpen, open, close, items } = useMediaViewer();

<MediaViewer
  items={items}
  isOpen={isOpen}
  onClose={close}
  enableZoom
  showThumbnails
/>
```

---

## Guía de Selección

| Necesidad | Componente Recomendado |
|-----------|----------------------|
| Imagen simple en lista | `LazyImage` |
| Avatar de usuario | `Avatar` (de LazyImage) |
| Galería simple | `ImageGallery` (de LazyImage) |
| Galería con thumbnails | `ImageGallery` (de Media) |
| Visor fullscreen con zoom | `MediaViewer` |
| Reproductor de video | `VideoPlayer` (de Media) |
| Reproductor de audio | `AudioPlayer` (de Media) |
| Subir avatar | `AvatarUpload` (de Media) |

---

## Duplicación Conocida (Para Futura Consolidación)

### Componentes Duplicados:

1. **ImageGallery** existe en:
   - `Media.tsx` - Versión avanzada con thumbnails
   - `LazyImage.tsx` - Versión simple

2. **VideoPlayer** existe en:
   - `Media.tsx` - Con controles custom
   - `MediaViewer.tsx` - Versión simplificada

3. **Lightbox** existe en:
   - `Media.tsx` - Componente separado
   - `LazyImage.tsx` - Integrado en ImageGallery
   - `MediaViewer.tsx` - Versión avanzada

### Plan de Consolidación Recomendado:

1. Unificar `Image` + `LazyImage` en un solo componente con lazy-loading opcional
2. Consolidar `ImageGallery` usando la versión de Media.tsx con lazy-loading
3. Mantener `MediaViewer` como visor fullscreen principal
4. Mantener `VideoPlayer` de Media.tsx como único reproductor

---

## Design Tokens Disponibles

Los siguientes tokens están disponibles en Tailwind:

### Colores
- `oaxaca-pink` - Primary (#D9006C)
- `oaxaca-purple` - Secondary (#6A0F49)
- `oaxaca-yellow` - Accent (#FFD100)
- `oaxaca-sky` - Info (#00AEEF)

### Border Radius
- `rounded-card` - 16px (cards)
- `rounded-button` - 12px (botones)
- `rounded-input` - 12px (inputs)
- `rounded-modal` - 24px (modales)
- `rounded-pill` - Full (pills/tags)

### Sombras
- `shadow-card` - Sombra suave para cards
- `shadow-card-hover` - Sombra en hover
- `shadow-modal` - Sombra para modales

### Espaciado
- `p-card` - 16px (padding interno)
- `p-section` - 24px (entre secciones)
- `p-page` - 32px (padding de página)
