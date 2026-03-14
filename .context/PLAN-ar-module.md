# Plan de Desarrollo: Modulo AR Guelaguetza Connect

**Fecha:** 2026-03-13
**Estado:** Aprobado para inicio
**Origen:** ZIP `Guelaguetza AR.zip` + analisis de gaps
**Decision arquitectural:** INTEGRAR al stack actual (React 19 + Vite + Fastify + Prisma), NO migrar a Next.js

---

## Resumen Ejecutivo

El ZIP contiene ~40% del modulo AR completo. La BD es la pieza mas madura (~90%).
El frontend tiene componentes solidos pero le faltan 5 paginas y la logica de negocio.
Este plan completa el modulo en 4 fases / 8 sprints cortos.

---

## Fase 0: Integracion al Stack Actual
> **Prerequisito obligatorio** — Sin esto, nada del ZIP funciona en el proyecto

### Sprint 0.1 — Migracion de BD y Adaptacion de Capa de Datos (3-4 dias)

**Objetivo:** Tener la BD AR corriendo y accesible desde Fastify+Prisma

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Ejecutar `ar_migration_complete.sql` | Crea schema `ar` con 18 tablas, vistas, funciones, triggers, seed data |
| 2 | Configurar Prisma para schema `ar` | Agregar `@@schema("ar")` o usar `$queryRawUnsafe` para queries PostGIS complejas |
| 3 | Adaptar `db.ts` | Reusar el pool existente de Prisma (`prisma.$queryRaw`) en vez de crear pool `pg` separado |
| 4 | Portar `points.service.ts` | Adaptar queries de `pg` raw a `prisma.$queryRaw` manteniendo PostGIS helpers |
| 5 | Portar `vestimentas.service.ts` | Igual que anterior |
| 6 | Crear rutas Fastify | Convertir 3 Next.js API routes a Fastify: `GET /api/ar/nearby`, `GET /api/ar/points`, `GET|POST /api/ar/collection` |
| 7 | Tests de integracion BD | Verificar que `get_nearby_points()`, `collect_point()` y vistas funcionan |

**Criterios de aceptacion:**
- [ ] `SELECT * FROM ar.get_nearby_points(17.0617, -96.7245, 500)` retorna datos
- [ ] `GET /api/ar/nearby?lat=17.06&lng=-96.72&radius=500` responde 200 con puntos
- [ ] `POST /api/ar/collection` registra coleccion y retorna puntos ganados
- [ ] Tests: minimo 10 tests de integracion pasando

### Sprint 0.2 — Porteo de Componentes y Hooks (2-3 dias)

**Objetivo:** Todos los componentes React del ZIP funcionando en Vite

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Copiar types/index.ts | Fusionar con `types.ts` existente, resolver conflictos de nombres |
| 2 | Portar hooks | Copiar 7 hooks, quitar dependencias de Next.js, ajustar rutas de API |
| 3 | Portar ModelViewer | Quitar `'use client'`, funciona igual — es web component |
| 4 | Portar ARPointCard + ARPointsList | Reemplazar `next/link` por navegacion interna |
| 5 | Portar VestimentaViewer | Sin cambios necesarios |
| 6 | Portar ARPointsMapPreview | Evaluar si fusionar con ARMapView existente (Leaflet) |
| 7 | Integrar en navegacion | Agregar ViewStates AR al sistema de navegacion actual |
| 8 | Tests de componentes | Smoke tests de renderizado para cada componente portado |

**Criterios de aceptacion:**
- [ ] `ModelViewer` renderiza con un modelo .glb de prueba
- [ ] `ARPointCard` muestra datos de un punto seed
- [ ] Hooks `useGeolocation` y `useNearbyPoints` funcionan en dev
- [ ] Navegacion a vistas AR funciona desde la app principal
- [ ] Tests: minimo 8 tests de componentes pasando

---

## Fase 1: Core AR Experience
> **La experiencia minima viable** — Explorar, descubrir, colectar

### Sprint 1.1 — Home AR + Mapa Integrado (1 semana)

**Objetivo:** Pantalla principal AR con mapa real y puntos geolocalizados

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Crear `ARHomeView.tsx` | Adaptar `page.tsx` del ZIP al sistema de vistas actual |
| 2 | Integrar mapa Leaflet real | Reemplazar `ARPointsMapPreview` (placeholder) con mapa Leaflet real mostrando puntos AR del schema `ar` |
| 3 | Geolocation + nearby | Conectar `useGeolocation` + `useNearbyPoints` al mapa |
| 4 | Cards de puntos cercanos | Lista scrolleable debajo del mapa con distancia en tiempo real |
| 5 | Tab "Mi Coleccion" | Grid de items colectados con progreso por region |
| 6 | Indicador offline | Banner cuando no hay conexion |
| 7 | Deep link desde nav principal | Boton AR en navegacion principal abre ARHomeView |

**Criterios de aceptacion:**
- [ ] Mapa muestra los 12 puntos AR del seed centrado en Oaxaca
- [ ] Puntos cambian de color cuando el usuario esta dentro del radio de activacion
- [ ] Tab coleccion muestra progreso 0/N al inicio
- [ ] Funciona en mobile (touch, zoom, pan)

### Sprint 1.2 — Detalle de Punto + ModelViewer + Coleccion (1 semana)

**Objetivo:** Ver un punto AR en 3D y poder colectarlo

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Crear `ARPointDetailView.tsx` | Vista de detalle con info completa del punto, narrativa, region |
| 2 | Integrar ModelViewer | Mostrar modelo 3D del punto (con placeholder .glb inicialmente) |
| 3 | Boton "Ver en AR" | Activar `<model-viewer>` en modo AR (WebXR/Scene Viewer/Quick Look) |
| 4 | Logica de coleccion | Boton "Colectar" activo solo si `isWithinActivation`, llama a API, muestra confetti/feedback |
| 5 | Modelos placeholder | Obtener 4-6 modelos .glb open-source tematicos (artesanias, figuras) de Sketchfab/Poly Haven |
| 6 | Poblar `ar.assets` | INSERT en BD con URLs de modelos placeholder |
| 7 | Screenshot de coleccion | Captura de pantalla automatica al colectar (canvas.toBlob) |

**Criterios de aceptacion:**
- [ ] Al tocar un punto en el mapa/lista, se abre detalle con modelo 3D rotable
- [ ] En dispositivos compatibles, "Ver en AR" abre experiencia AR nativa
- [ ] Colectar funciona: API retorna puntos, UI actualiza progreso
- [ ] Minimo 4 puntos tienen modelo 3D placeholder visible

**Dependencias:** Sprint 0.1, 0.2

---

## Fase 2: Gamificacion + Quests
> **Engagement** — Lo que hace que la gente siga jugando

### Sprint 2.1 — Quest de Donaji + Motor de Quests (1 semana)

**Objetivo:** Primera quest jugable end-to-end

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Crear `QuestView.tsx` | Vista de quest con mapa de items, progreso, narrativa |
| 2 | Crear `QuestCard.tsx` | Componente de quest para listas |
| 3 | Motor de quest | Logica que verifica progreso, detecta items encontrados, marca completado |
| 4 | API routes quest | `GET /api/ar/quests`, `GET /api/ar/quests/:id/progress`, `POST /api/ar/quests/:id/start` |
| 5 | Narrativa interactiva | Mostrar fragmentos de la historia de Donaji al encontrar cada lirio |
| 6 | Quest completion | Animacion/feedback al completar, reward de puntos |
| 7 | Crear `QuestListView.tsx` | Lista de quests disponibles (inicialmente solo Donaji) |

**Criterios de aceptacion:**
- [ ] Usuario puede iniciar quest de Donaji
- [ ] Al colectar un quest_item, progreso se actualiza (1/4, 2/4...)
- [ ] Al completar 4/4, quest se marca como completada con reward
- [ ] Narrativa se muestra progresivamente

### Sprint 2.2 — Logros + Perfil + Leaderboard (1 semana)

**Objetivo:** Sistema de logros visible y perfil del usuario

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Crear `ProfileView.tsx` | Perfil con avatar, stats, progreso por region, puntos totales |
| 2 | Crear `AchievementsView.tsx` | Grid de logros (locked/unlocked) con progreso |
| 3 | Crear `AchievementCard.tsx` | Componente con badge, titulo, progreso, estado |
| 4 | Notificaciones de logros | Toast/modal cuando se desbloquea un logro |
| 5 | API routes | `GET /api/ar/achievements`, `GET /api/ar/user/profile`, `GET /api/ar/leaderboard` |
| 6 | Leaderboard | Top 10 usuarios con puntos y coleccion |
| 7 | Verificacion automatica | Trigger que checa logros despues de cada coleccion |

**Criterios de aceptacion:**
- [ ] Perfil muestra stats reales del usuario
- [ ] 10 logros visibles con estado locked/unlocked
- [ ] Al colectar primer punto, logro "Primer Descubrimiento" se desbloquea con notificacion
- [ ] Leaderboard muestra ranking (al menos con datos mock)

**Dependencias:** Sprint 1.2 (coleccion funcional)

---

## Fase 3: Vestimentas + Experiencias Premium
> **Features diferenciadores** — Lo que hace unica a la app

### Sprint 3.1 — Catalogo de Vestimentas + Visor 3D (1 semana)

**Objetivo:** Explorar y ver vestimentas tradicionales en 3D

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Crear `VestimentasView.tsx` | Catalogo con filtros por region, categoria, genero |
| 2 | Crear `VestimentaCard.tsx` | Card con preview, nombre, region, boton favorito |
| 3 | Crear `VestimentaDetailView.tsx` | Detalle con VestimentaViewer (modelo 3D), info cultural, artesano |
| 4 | API routes vestimentas | `GET /api/ar/vestimentas`, `GET /api/ar/vestimentas/:id`, favoritos CRUD |
| 5 | Sistema de favoritos | Heart toggle, persistencia, vista de favoritos |
| 6 | Modelos placeholder | 3-4 modelos de ropa/accesorios .glb open-source |
| 7 | Sets de vestimenta | Vista de set completo (cabeza + torso + falda + accesorios) |

**Criterios de aceptacion:**
- [ ] Catalogo muestra 10 vestimentas del seed con filtros funcionales
- [ ] Detalle muestra modelo 3D rotable (con placeholder)
- [ ] Favoritos persisten entre sesiones
- [ ] Sets muestran items agrupados

### Sprint 3.2 — Crea tu Alebrije (Image-to-3D) (1-2 semanas)

**Objetivo:** Dibujar un alebrije y verlo en 3D

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Crear `AlebrijeView.tsx` | Pantalla con canvas de dibujo + galeria de creaciones |
| 2 | Integrar `react-sketch-canvas` | Canvas de dibujo con colores vibrantes, brushes, undo/redo |
| 3 | Servicio Image-to-3D | Integracion con API externa (Meshy.ai, Tripo3D, o similar) |
| 4 | API route | `POST /api/ar/alebrije/generate` (recibe imagen base64, retorna task_id) |
| 5 | Polling de resultado | `GET /api/ar/alebrije/status/:taskId` con estados pending/processing/completed |
| 6 | Galeria de creaciones | Grid de alebrijes creados por el usuario con ModelViewer |
| 7 | Compartir | Boton para compartir screenshot del alebrije 3D |
| 8 | Fallback sin API | Si no hay API de 3D disponible, mostrar el dibujo en un marco decorativo |

**Criterios de aceptacion:**
- [ ] Canvas de dibujo funcional con 6+ colores y 3 grosores
- [ ] Al enviar dibujo, se muestra estado de generacion
- [ ] Modelo 3D generado se puede ver y rotar
- [ ] Galeria muestra creaciones anteriores
- [ ] Fallback funciona sin conexion a API de 3D

**Dependencias:** Sprint 0.2 (ModelViewer portado)
**Nota:** La API de Image-to-3D tiene costo. Evaluar Meshy.ai (free tier: 5/mes) o Tripo3D.

### Sprint 3.3 — Try-On de Vestimentas (2 semanas) [PREMIUM]

**Objetivo:** Probarse vestimentas con camara y tracking

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Crear `TryOnView.tsx` | Vista de camara con overlay de vestimenta |
| 2 | Integracion MediaPipe | Face/body tracking con @mediapipe/tasks-vision |
| 3 | Overlay de vestimentas | Posicionar modelo/imagen sobre landmarks detectados |
| 4 | Captura de foto | Boton para tomar foto con vestimenta |
| 5 | Selector de vestimenta | Carousel horizontal para cambiar vestimenta sin salir de camara |
| 6 | UI de camara | Controles: flip camera, flash, timer |
| 7 | Compartir foto | Share API o download |

**Criterios de aceptacion:**
- [ ] Camara frontal muestra rostro del usuario
- [ ] Al seleccionar vestimenta tipo "cabeza", se posiciona sobre la cabeza
- [ ] Foto se puede capturar y compartir
- [ ] Funciona en iOS Safari y Android Chrome

**Dependencias:** Sprint 3.1
**Riesgo:** MediaPipe tracking puede ser impreciso en dispositivos low-end. Plan B: overlay estatico posicionado manualmente.

---

## Fase 4: Offline + Polish + Production
> **Lo que lo hace robusto** — Funcionar en la Guelaguetza real

### Sprint 4.1 — Offline Support + Service Worker (1 semana)

**Objetivo:** La app funciona sin internet en el cerro del Fortin

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Service Worker con Workbox | Cache de assets estaticos, modelos 3D, datos de puntos |
| 2 | API caching | Cache-first para catalogo de puntos/vestimentas, network-first para coleccion |
| 3 | Sync de colecciones | Queue de colecciones pendientes, sync cuando hay conexion |
| 4 | Offline bundles | Descargar paquete de modelos 3D por region cuando hay WiFi |
| 5 | Zonas WiFi | Mostrar mapa de zonas WiFi (5 del seed) para descarga |
| 6 | IndexedDB | Cache local de datos del usuario (coleccion, favoritos, progreso) |
| 7 | Indicadores UX | Iconos de estado: descargado, pendiente de sync, error |

**Criterios de aceptacion:**
- [ ] Con WiFi cortado, la app abre y muestra datos cacheados
- [ ] Colecciones hechas offline se sincronizan al reconectar
- [ ] Modelos 3D descargados se ven sin conexion
- [ ] Mapa de zonas WiFi visible

### Sprint 4.2 — Analytics + Metricas + Tests Finales (1 semana)

**Objetivo:** Instrumentar la app y cubrir tests

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Event tracking | Registrar eventos en `ar.analytics_events`: open_ar, collect_point, view_model, start_quest, try_vestimenta |
| 2 | API de analytics | `POST /api/ar/analytics` (batch insert) |
| 3 | Dashboard basico | Vista admin con metricas: puntos colectados, usuarios activos, quests completadas |
| 4 | Tests unitarios | Services, hooks, utils — minimo 30 tests |
| 5 | Tests de integracion | API routes — minimo 15 tests |
| 6 | Tests de componentes | Render + interaccion — minimo 15 tests |
| 7 | Test E2E | 1 flujo completo: abrir AR > ver mapa > seleccionar punto > ver 3D > colectar |

**Criterios de aceptacion:**
- [ ] Eventos se registran en BD
- [ ] 60+ tests nuevos pasando
- [ ] E2E del flujo principal pasa
- [ ] 0 errores en consola en flujo principal

---

## Resumen de Fases

| Fase | Sprints | Duracion Est. | Entregable |
|------|---------|---------------|------------|
| **0: Integracion** | 0.1, 0.2 | 1 semana | ZIP funcionando en stack actual |
| **1: Core AR** | 1.1, 1.2 | 2 semanas | Explorar mapa, ver 3D, colectar |
| **2: Gamificacion** | 2.1, 2.2 | 2 semanas | Quests, logros, perfil, leaderboard |
| **3: Premium** | 3.1, 3.2, 3.3 | 4-5 semanas | Vestimentas, alebrije, try-on |
| **4: Production** | 4.1, 4.2 | 2 semanas | Offline, analytics, tests |
| **TOTAL** | 8 sprints | ~11-12 semanas | Modulo AR completo |

---

## Dependencias Criticas

```
Sprint 0.1 (BD) ─────────┐
                          ├── Sprint 1.1 (Home AR)
Sprint 0.2 (Componentes) ─┤
                          ├── Sprint 1.2 (Detalle + Coleccion)
                          │        │
                          │        ├── Sprint 2.1 (Quests)
                          │        ├── Sprint 2.2 (Logros)
                          │        │
                          │        └── Sprint 3.1 (Vestimentas)
                          │                 │
                          │                 └── Sprint 3.3 (Try-On)
                          │
                          └── Sprint 3.2 (Alebrije) [independiente]

Sprint 4.1 (Offline) ── despues de Fase 1 minimo
Sprint 4.2 (Tests) ──── paralelo con cualquier fase
```

---

## Decisiones Tecnicas Clave

| Decision | Opcion Elegida | Alternativa Descartada | Razon |
|----------|---------------|----------------------|-------|
| Framework | Mantener React+Vite | Migrar a Next.js | 5 sprints de trabajo existente, riesgo alto |
| BD AR | Schema `ar` separado | Extender schema principal con Prisma | Migracion SQL ya lista, queries PostGIS complejas |
| Queries PostGIS | `prisma.$queryRaw` | Pool `pg` separado | Un solo pool, consistencia con el resto del proyecto |
| Visor 3D | Google `<model-viewer>` | Three.js + R3F | model-viewer tiene AR nativo built-in, menor complejidad |
| Modelos 3D | Placeholders open-source | Esperar modelos reales | No bloquear desarrollo por assets |
| Try-on tracking | MediaPipe | TensorFlow.js | MediaPipe es mas rapido en mobile, API mas simple |
| Image-to-3D | API externa (Meshy/Tripo) | Generacion local | No hay solucion local viable para mobile |
| Offline | Workbox + IndexedDB | Custom SW | Workbox es el estandar, bien integrado con Vite |

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| MediaPipe tracking impreciso en low-end | Alta | Medio | Plan B: overlay estatico sin tracking |
| API Image-to-3D costosa o lenta | Media | Medio | Free tier + fallback a galeria de alebrijes pre-hechos |
| Modelos 3D pesados en mobile | Media | Alto | Comprimir con glTF-Transform, LOD, lazy loading |
| PostGIS queries lentas sin indices | Baja | Alto | Indices GIST ya incluidos en migracion |
| AR no soportado en navegador | Media | Bajo | Fallback a visor 3D sin AR (model-viewer lo maneja) |
| Offline sync conflicts | Media | Medio | Last-write-wins + cola de operaciones idempotentes |

---

## Assets y Recursos Necesarios

### Modelos 3D (Placeholders)
- Sketchfab: Buscar "mexican folk art", "alebrije", "oaxaca" (licencia CC)
- Poly Haven: Modelos gratis con licencia CC0
- Google Poly (archive): Modelos tematicos

### APIs Externas
- **Meshy.ai** — Image-to-3D (free tier: 5 generaciones/mes, plan basico ~$10/mes)
- **Tripo3D** — Alternativa (free tier: 3/dia)
- **MediaPipe** — Face/body tracking (gratis, client-side)

### Dependencias NPM Nuevas
```
@google/model-viewer     # Ya en ZIP
react-sketch-canvas      # Ya en ZIP
@mediapipe/tasks-vision  # Sprint 3.3
workbox-*                # Sprint 4.1
idb                      # Ya en ZIP
```

---

*Plan generado: 2026-03-13*
*Proxima revision: Al completar Fase 0*
