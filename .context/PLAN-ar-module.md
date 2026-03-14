# Plan de Desarrollo: Modulo AR Guelaguetza Connect

**Fecha:** 2026-03-13
**Actualizado:** 2026-03-13 (post cross-review Gemini)
**Estado:** Aprobado para inicio
**Origen:** ZIP `Guelaguetza AR.zip` + analisis de gaps + cross-review Gemini
**Decision arquitectural:** INTEGRAR al stack actual (React 19 + Vite + Fastify + Prisma), NO migrar a Next.js

---

## Resumen Ejecutivo

El ZIP contiene ~40% del modulo AR completo. La BD es la pieza mas madura (~90%).
El frontend tiene componentes solidos pero le faltan 5 paginas y la logica de negocio.
Este plan completa el modulo en 5 fases / 10 sprints.

**Estimacion ajustada post-review:** ~14 semanas (buffer para R&D en Try-On e Image-to-3D).

---

## Fase 0: Integracion al Stack Actual
> **Prerequisito obligatorio** — Sin esto, nada del ZIP funciona en el proyecto

### Sprint 0.1 — Migracion de BD y Adaptacion de Capa de Datos (3-4 dias)

**Objetivo:** Tener la BD AR corriendo y accesible desde Fastify+Prisma

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Ejecutar `ar_migration_complete.sql` | Crea schema `ar` con 18 tablas, vistas, funciones, triggers, seed data |
| 2 | Configurar Prisma para schema `ar` | Usar `$queryRaw` para queries PostGIS complejas |
| 3 | Crear schemas Zod para respuestas | Tipar las respuestas de `$queryRaw` con Zod (recomendacion Gemini) |
| 4 | Portar `points.service.ts` | Adaptar queries de `pg` raw a `prisma.$queryRaw` manteniendo PostGIS helpers |
| 5 | Portar `vestimentas.service.ts` | Igual que anterior |
| 6 | Crear rutas Fastify | Convertir 3 Next.js API routes a Fastify: `GET /api/ar/nearby`, `GET /api/ar/points`, `GET|POST /api/ar/collection` |
| 7 | Tests de integracion BD | Verificar que `get_nearby_points()`, `collect_point()` y vistas funcionan |

**Criterios de aceptacion:**
- [ ] `SELECT * FROM ar.get_nearby_points(17.0617, -96.7245, 500)` retorna datos
- [ ] `GET /api/ar/nearby?lat=17.06&lng=-96.72&radius=500` responde 200 con puntos
- [ ] `POST /api/ar/collection` registra coleccion y retorna puntos ganados
- [ ] Respuestas tipadas con Zod
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
| 8 | Quick win: Alebrije 3D en landing | Mostrar un modelo 3D rotando con `model-viewer` en la LandingView (impacto visual inmediato) |
| 9 | Tests de componentes | Smoke tests de renderizado para cada componente portado |

**Criterios de aceptacion:**
- [ ] `ModelViewer` renderiza con un modelo .glb de prueba
- [ ] `ARPointCard` muestra datos de un punto seed
- [ ] Hooks `useGeolocation` y `useNearbyPoints` funcionan en dev
- [ ] Navegacion a vistas AR funciona desde la app principal
- [ ] Alebrije 3D visible en landing page
- [ ] Tests: minimo 8 tests de componentes pasando

---

## Fase 1: Core AR + Offline Foundation
> **La experiencia minima viable** — Explorar, descubrir, colectar — con soporte offline desde el dia 1

### Sprint 1.0 — Offline Foundation (3-4 dias) [NUEVO — recomendacion Gemini]

**Objetivo:** Infraestructura offline que todos los sprints posteriores usan

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Workbox config para AR | Estrategias de cache: cache-first para modelos .glb y catalogo de puntos, network-first para coleccion/progreso |
| 2 | IndexedDB con `idb` | Cache local de: puntos AR, vestimentas, coleccion del usuario, progreso de quests |
| 3 | Offline queue | Cola de operaciones pendientes (colecciones, progreso) que se sincronizan al reconectar |
| 4 | Conflict resolution | Last-write-wins para colecciones, merge para progreso de quests |
| 5 | Hook `useOfflineAR` | Abstraccion que lee de IndexedDB cuando no hay red, sync automatico al reconectar |
| 6 | Indicador de estado | Componente que muestra: online, offline, sincronizando |

**Criterios de aceptacion:**
- [ ] Con WiFi cortado, la app abre y muestra puntos AR cacheados
- [ ] Colecciones hechas offline se encolan y sincronizan al reconectar
- [ ] Hook `useOfflineAR` usado por los componentes AR en vez de fetch directo

**Razon del cambio:** Gemini identifico que offline no es polish de produccion — es una decision arquitectural que afecta como se disenan los hooks de datos desde el dia 1. En la Guelaguetza real (Cerro del Fortin), la saturacion de celdas hace que offline sea obligatorio.

### Sprint 1.1 — Home AR + Mapa Integrado (1 semana)

**Objetivo:** Pantalla principal AR con mapa real y puntos geolocalizados

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Crear `ARHomeView.tsx` | Adaptar `page.tsx` del ZIP al sistema de vistas actual |
| 2 | Integrar mapa Leaflet real | Reemplazar `ARPointsMapPreview` (placeholder) con mapa Leaflet real mostrando puntos AR del schema `ar` |
| 3 | Geolocation + nearby | Conectar `useGeolocation` + `useNearbyPoints` al mapa |
| 4 | Cards de puntos cercanos | Lista scrolleable debajo del mapa con distancia en tiempo real |
| 5 | Tab "Mi Coleccion" | Grid de items colectados con progreso por region |
| 6 | Onboarding de permisos | Flujo UX para solicitar GPS y camara (especialmente iOS Safari) |
| 7 | QR fallback para GPS | Soporte para escanear QR fisicos en puntos clave cuando GPS falla en calles estrechas |
| 8 | Deep link desde nav principal | Boton AR en navegacion principal abre ARHomeView |

**Criterios de aceptacion:**
- [ ] Mapa muestra los 12 puntos AR del seed centrado en Oaxaca
- [ ] Puntos cambian de color cuando el usuario esta dentro del radio de activacion
- [ ] Tab coleccion muestra progreso 0/N al inicio
- [ ] Onboarding de permisos funciona en iOS Safari y Android Chrome
- [ ] Funciona en mobile (touch, zoom, pan)

### Sprint 1.2 — Detalle de Punto + ModelViewer + Coleccion (1 semana)

**Objetivo:** Ver un punto AR en 3D y poder colectarlo

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Crear `ARPointDetailView.tsx` | Vista de detalle con info completa del punto, narrativa, region |
| 2 | Integrar ModelViewer | Mostrar modelo 3D del punto (con placeholder .glb inicialmente) |
| 3 | Boton "Ver en AR" | Activar `<model-viewer>` en modo AR (WebXR/Scene Viewer/Quick Look) |
| 4 | Logica de coleccion | Boton "Colectar" activo solo si `isWithinActivation`, llama a API, muestra confetti/feedback |
| 5 | Asset pipeline | Script con `gltf-transform` para comprimir modelos .glb (Draco compression) antes de subir |
| 6 | Modelos placeholder | Obtener 4-6 modelos .glb open-source tematicos, comprimidos con Draco |
| 7 | Poblar `ar.assets` | INSERT en BD con URLs de modelos placeholder (CDN-ready) |
| 8 | Screenshot de coleccion | Captura de pantalla automatica al colectar (canvas.toBlob) |

**Criterios de aceptacion:**
- [ ] Al tocar un punto en el mapa/lista, se abre detalle con modelo 3D rotable
- [ ] En dispositivos compatibles, "Ver en AR" abre experiencia AR nativa
- [ ] Colectar funciona: API retorna puntos, UI actualiza progreso
- [ ] Modelos .glb comprimidos (<2MB cada uno)
- [ ] Minimo 4 puntos tienen modelo 3D placeholder visible

**Dependencias:** Sprint 0.1, 0.2, 1.0

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
| 7 | Offline quest sync | Progreso de quest se guarda en IndexedDB y sincroniza al reconectar |
| 8 | Crear `QuestListView.tsx` | Lista de quests disponibles (inicialmente solo Donaji) |

**Criterios de aceptacion:**
- [ ] Usuario puede iniciar quest de Donaji
- [ ] Al colectar un quest_item, progreso se actualiza (1/4, 2/4...)
- [ ] Al completar 4/4, quest se marca como completada con reward
- [ ] Narrativa se muestra progresivamente
- [ ] Progreso persiste offline

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
| 6 | Modelos placeholder | 3-4 modelos de ropa/accesorios .glb open-source, comprimidos |
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
| 5 | Webhook endpoint | `POST /api/ar/alebrije/webhook` para recibir modelo completado de Meshy/Tripo (async, 30-90s) |
| 6 | Push notification | Notificar al usuario via Web Push cuando su alebrije 3D esta listo |
| 7 | Galeria de creaciones | Grid de alebrijes creados por el usuario con ModelViewer |
| 8 | Compartir | Boton para compartir screenshot del alebrije 3D |
| 9 | Fallback sin API | Si no hay API de 3D disponible, mostrar el dibujo en un marco decorativo |

**Criterios de aceptacion:**
- [ ] Canvas de dibujo funcional con 6+ colores y 3 grosores
- [ ] Al enviar dibujo, se muestra estado de generacion
- [ ] Modelo 3D generado se puede ver y rotar
- [ ] Galeria muestra creaciones anteriores
- [ ] Fallback funciona sin conexion a API de 3D

**Dependencias:** Sprint 0.2 (ModelViewer portado)
**Nota:** La API de Image-to-3D tiene costo. Evaluar Meshy.ai (free tier: 5/mes) o Tripo3D.

### Sprint 3.3 — Try-On de Vestimentas (2 semanas) [PREMIUM / R&D]

**Objetivo:** Probarse vestimentas con camara y tracking

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Crear `TryOnView.tsx` | Vista de camara con overlay de vestimenta |
| 2 | Integracion MediaPipe | Face/hands tracking con @mediapipe/tasks-vision (limitar a face/hands — body tracking inestable) |
| 3 | Overlay de vestimentas | Posicionar modelo/imagen sobre landmarks detectados |
| 4 | Deteccion de gama | Si dispositivo low-end, desactivar tracking y ofrecer "Foto con marco" estatica |
| 5 | Captura de foto | Boton para tomar foto con vestimenta |
| 6 | Selector de vestimenta | Carousel horizontal para cambiar vestimenta sin salir de camara |
| 7 | UI de camara | Controles: flip camera, flash, timer |
| 8 | Compartir foto | Share API o download |

**Criterios de aceptacion:**
- [ ] Camara frontal muestra rostro del usuario
- [ ] Al seleccionar vestimenta tipo "cabeza", se posiciona sobre la cabeza
- [ ] Foto se puede capturar y compartir
- [ ] Funciona en iOS Safari y Android Chrome
- [ ] Fallback estatico en dispositivos low-end

**Dependencias:** Sprint 3.1
**Riesgo:** MediaPipe tracking puede ser impreciso en dispositivos low-end.
**Plan B:** Overlay estatico posicionado manualmente / "Foto con alebrije".

---

## Fase 4: Polish + Production
> **Lo que lo hace robusto** — Pulido final y metricas

### Sprint 4.1 — Offline Bundles + Zonas WiFi (3-4 dias)

**Objetivo:** Descarga proactiva de assets y mapa de zonas WiFi

| # | Tarea | Detalle |
|---|-------|---------|
| 1 | Offline bundles por region | Descargar paquete de modelos 3D por region cuando hay WiFi |
| 2 | Zonas WiFi | Mostrar mapa de zonas WiFi (5 del seed) para descarga proactiva |
| 3 | Progreso de descarga | UI que muestra % de descarga de cada bundle |
| 4 | Storage management | Mostrar espacio usado, permitir borrar bundles viejos |

**Criterios de aceptacion:**
- [ ] Usuario puede descargar bundle de una region completa
- [ ] Mapa de zonas WiFi visible con indicador de velocidad
- [ ] Modelos 3D descargados se ven sin conexion

### Sprint 4.2 — Analytics + Tests Finales (1 semana)

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

## Resumen de Fases (Actualizado)

| Fase | Sprints | Duracion Est. | Entregable |
|------|---------|---------------|------------|
| **0: Integracion** | 0.1, 0.2 | 1 semana | ZIP funcionando en stack actual + alebrije en landing |
| **1: Core AR + Offline** | 1.0, 1.1, 1.2 | 3 semanas | Offline foundation, mapa, 3D, coleccion |
| **2: Gamificacion** | 2.1, 2.2 | 2 semanas | Quests, logros, perfil, leaderboard |
| **3: Premium** | 3.1, 3.2, 3.3 | 4-5 semanas | Vestimentas, alebrije, try-on |
| **4: Production** | 4.1, 4.2 | 2 semanas | Offline bundles, analytics, tests |
| **TOTAL** | 10 sprints | ~14 semanas | Modulo AR completo |

---

## Dependencias Criticas (Actualizado)

```
Sprint 0.1 (BD) ─────────┐
                          ├── Sprint 1.0 (Offline Foundation) ──┐
Sprint 0.2 (Componentes) ─┤                                     │
                          │                                     ├── Sprint 1.1 (Home AR)
                          │                                     │
                          │                                     ├── Sprint 1.2 (Detalle + Coleccion)
                          │                                     │        │
                          │                                     │        ├── Sprint 2.1 (Quests)
                          │                                     │        ├── Sprint 2.2 (Logros)
                          │                                     │        │
                          │                                     │        └── Sprint 3.1 (Vestimentas)
                          │                                     │                 │
                          │                                     │                 └── Sprint 3.3 (Try-On)
                          │                                     │
                          └── Sprint 3.2 (Alebrije) [independiente]

Sprint 4.1 (Offline Bundles) ── despues de Fase 1
Sprint 4.2 (Tests) ──────────── paralelo con cualquier fase
```

---

## Decisiones Tecnicas Clave (Actualizado)

| Decision | Opcion Elegida | Alternativa Descartada | Razon |
|----------|---------------|----------------------|-------|
| Framework | Mantener React+Vite | Migrar a Next.js | 5 sprints de trabajo existente, riesgo alto |
| BD AR | Schema `ar` separado | Extender schema principal con Prisma | Migracion SQL ya lista, queries PostGIS complejas |
| Queries PostGIS | `prisma.$queryRaw` + Zod | Pool `pg` separado | Un solo pool, tipado con Zod (Gemini) |
| Visor 3D | Google `<model-viewer>` | Three.js + R3F | model-viewer tiene AR nativo built-in, menor complejidad |
| Modelos 3D | Placeholders open-source + Draco | Esperar modelos reales | No bloquear desarrollo; comprimir con gltf-transform (Gemini) |
| Try-on tracking | MediaPipe (face/hands only) | TensorFlow.js / body full | Body tracking inestable en browser (Gemini) |
| Image-to-3D | API externa (Meshy/Tripo) + webhook | Generacion local | No hay solucion local; webhook para async (Gemini) |
| Offline | Workbox + IndexedDB desde Fase 1 | Offline al final | Arquitectura, no polish — afecta hooks desde dia 1 (Gemini) |
| GPS fallback | QR fisicos en puntos clave | Solo GPS | GPS drift en calles estrechas de Oaxaca (Gemini) |
| Low-end devices | Deteccion de gama + fallback estatico | Forzar tracking | Prevenir crashes en dispositivos baratos (Gemini) |

---

## Riesgos y Mitigaciones (Actualizado)

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| MediaPipe tracking impreciso en low-end | Alta | Medio | Limitar a face/hands; fallback estatico en low-end |
| API Image-to-3D costosa o lenta | Media | Medio | Free tier + fallback a galeria pre-hecha + webhook async |
| Modelos 3D pesados en mobile (~20MB) | Alta | Alto | Draco compression con gltf-transform, CDN con cache agresivo |
| GPS drift en calles estrechas de Oaxaca | Alta | Alto | QR fisicos como fallback, radio de activacion generoso |
| iOS Safari permisos caprichosos | Alta | Medio | Onboarding de permisos dedicado antes de AR |
| PostGIS queries sin tipado TypeScript | Media | Medio | Zod schemas para todas las respuestas de $queryRaw |
| Saturacion de celdas en Guelaguetza | Alta | Critico | Offline desde dia 1, bundles descargables, zonas WiFi |
| AR no soportado en navegador | Media | Bajo | Fallback a visor 3D sin AR (model-viewer lo maneja) |
| Offline sync conflicts en quests | Media | Medio | Last-write-wins + cola idempotente + merge de progreso |
| Sprint 3.2-3.3 se extienden (R&D) | Alta | Medio | Buffer de 2 semanas en estimacion total |

---

## Assets y Recursos Necesarios

### Modelos 3D (Placeholders)
- Sketchfab: Buscar "mexican folk art", "alebrije", "oaxaca" (licencia CC)
- Poly Haven: Modelos gratis con licencia CC0
- Google Poly (archive): Modelos tematicos
- **Pipeline:** Descargar → `gltf-transform` (Draco) → CDN/storage

### APIs Externas
- **Meshy.ai** — Image-to-3D (free tier: 5 generaciones/mes, plan basico ~$10/mes)
- **Tripo3D** — Alternativa (free tier: 3/dia)
- **MediaPipe** — Face/hands tracking (gratis, client-side)

### Dependencias NPM Nuevas
```
@google/model-viewer     # Ya en ZIP
react-sketch-canvas      # Ya en ZIP
@mediapipe/tasks-vision  # Sprint 3.3
workbox-*                # Sprint 1.0 (movido de 4.1)
idb                      # Ya en ZIP
zod                      # Ya en proyecto (tipar $queryRaw)
```

### Infraestructura
- CDN (Cloudflare/Cloudfront) con cache agresivo para modelos .glb
- QR codes fisicos impresos para puntos AR en Centro Historico

---

*Plan generado: 2026-03-13*
*Cross-review: Gemini (2026-03-13)*
*Cambios post-review: Offline a Fase 1, asset pipeline, QR fallback, Zod, webhook Image-to-3D, device detection, buffer 14 sem*
*Proxima revision: Al completar Fase 0*
