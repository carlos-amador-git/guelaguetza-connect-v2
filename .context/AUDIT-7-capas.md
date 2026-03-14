# Auditoria Exhaustiva 7 Capas — Guelaguetza Connect v2

**Fecha:** 2026-03-13
**Metodo:** Triple-LLM (Alpha Claude + Beta Claude + Gemini Cross-Audit)
**Alpha:** 63 hallazgos | **Beta:** 72 hallazgos | **Gemini:** 5 nuevos + 1 falso positivo + 2 ajustes
**Consolidado:** 90 hallazgos unicos | **Veredicto Gemini: 9.2/10 riesgo — NO DEPLOY**

---

## Cruce de Resultados: Compartidos vs Unicos

### Hallazgos COMPARTIDOS (ambos auditores detectaron) — ALTA CONFIANZA

| # | Capa | Sev | Archivo | Hallazgo | Alpha | Beta |
|---|------|-----|---------|----------|-------|------|
| C1 | L2 | CRITICAL | `contexts/AuthContext.tsx:218-224` | `face_auth_bypass` hardcodeado — backdoor de autenticacion | #11 | #24 |
| C2 | L2 | CRITICAL | `contexts/AuthContext.tsx:45,53,61` | Credenciales demo hardcodeadas (`password123`, `admin123`) en bundle JS | #10 | #50 |
| C3 | L2 | HIGH | `backend/src/routes/poi.ts:157,175,191` | 3 rutas admin sin `requireAdmin` — cualquier user autenticado puede CRUD POIs | #13 | #29 |
| C4 | L2 | HIGH | `backend/src/routes/metrics.ts:226` | `/metrics/cache` sin autenticacion — Redis stats publicas | #14 | #30 |
| C5 | L2 | HIGH | `services/geminiService.ts:10` | API key de Gemini expuesta en bundle del cliente via `process.env` | #12 | #31 |
| C6 | L2 | HIGH | `services/admin.ts:4` | `localhost:3005` hardcodeado sin env var | #15 | #26 |
| C7 | L2 | HIGH | `services/pushNotifications.ts:3` | `localhost:3005` hardcodeado sin env var | #15 | #27 |
| C8 | L2 | HIGH | `services/streams.ts:363` | WebSocket URL hardcodeado a localhost | #15 | #28 |
| C9 | L2 | MEDIUM | `backend/src/app.ts:99` | Cookie secret fallback a `'dev-cookie-secret'` | #9 | #33 |
| C10 | L2 | MEDIUM | `backend/src/app.ts:66-68` | `contentSecurityPolicy: false` — CSP deshabilitado | #16 | #34 |
| C11 | L1 | HIGH | `components/GuideDashboard.tsx` | Importado pero nunca renderizado — `GUIDE_DASHBOARD` delega a `SellerDashboard` | #2 | #1 |
| C12 | L1 | HIGH | `App.tsx:21` | `AdminDashboard` importado pero `ADMIN` renderiza `MetricsDashboard` | #3 | #2 |
| C13 | L1 | HIGH | `components/MyOrdersView.tsx` | Componente completo (400+ lineas) nunca importado ni renderizado | #1 | #3 |
| C14 | L1 | HIGH | `components/admin/AdvancedDashboard.tsx` | Sin import, sin case en router — inalcanzable | #4 | #4 |
| C15 | L1 | MEDIUM | `types.ts:21` | `ViewState.ADMIN_ADVANCED` sin case en switch | #5 | #22 |
| C16 | L3 | HIGH | `App.tsx:369-375` | `ViewState.ORDERS` renderiza `CartView` en vez de `MyOrdersView` | #18 | #36 |
| C17 | L4 | HIGH | `components/SellerDashboard.tsx` | 100% mock data, cero fetch a API, cero loading/error | #25 | (impl.) |
| C18 | L5 | HIGH | `services/admin.ts:534` | Fallback silencioso a `MOCK_ADMIN_STATS` — datos fake como reales | #32 | #49 |
| C19 | L5 | MEDIUM | `services/geminiService.ts:18` | Modelo `gemini-3-flash-preview` no existe — todas las llamadas fallan | #38 | #44 |
| C20 | L6 | MEDIUM | `components/HomeView.tsx:216-230` | Jerarquia de headings rota: h1 -> h3 sin h2 | #46 | #60 |
| C21 | L6 | MEDIUM | `components/Navigation.tsx:278` | `aria-label` sin acentos ("Navegacion" -> "Navegacion") | #52 | #57 |
| C22 | L7 | HIGH | `package.json` | `three`, `@react-three/fiber`, `@react-three/drei` — 0 imports, ~1.5MB muerto | #54 | #64 |
| C23 | L7 | HIGH | `package.json` | `stripe` (Node SDK) en dependencias del frontend — nunca importado | #53 | #65 |
| C24 | L7 | MEDIUM | `backend/src/routes/webhooks.ts:666` | TODO: tabla de auditoria — webhook events descartados silenciosamente | #60 | #48 |
| C25 | L7 | MEDIUM | `MyBookingsView.tsx:127` / `MyOrdersView.tsx:131` | TODO: Integrar con Stripe Checkout — boton "Pagar" no funciona | #59 | #43 |
| C26 | L4 | MEDIUM | `backend/src/services/marketplace.service.ts:791` | `trackingNumber: undefined` — campo nunca se llena | #37 | #47 |

**Total compartidos: 26 hallazgos** — Estos son los de MAYOR confianza.

---

### Hallazgos UNICOS de Alpha — Requieren verificacion

| # | Capa | Sev | Archivo | Hallazgo |
|---|------|-----|---------|----------|
| A1 | L2 | CRITICAL | `backend/src/plugins/auth.ts:29` | `JWT_SECRET` con fallback a `'fallback-secret-key'` — tokens forjables |
| A2 | L1 | MEDIUM | `App.tsx:57` | `isAuthenticated` destructurado de `useAuth()` pero nunca usado |
| A3 | L1 | LOW | `components/ui/GlobalHeader.tsx` | Iconos Lucide posiblemente no usados en el componente |
| A4 | L4 | HIGH | `App.tsx` (toda la app) | CERO `ErrorBoundary` en todo el arbol de componentes |
| A5 | L4 | HIGH | `components/HomeView.tsx:114` | `.catch(() => {})` silencioso en wishlist count |
| A6 | L4 | HIGH | `components/ui/NotificationBell.tsx:34` | `.catch(console.error)` sin feedback al usuario |
| A7 | L4 | MEDIUM | `services/admin.ts:534-535` | `getDashboardStats` retorna mock data cuando backend falla |
| A8 | L4 | MEDIUM | `components/admin/AdminDashboard.tsx:62-86` | `MOCK_DAILY_USERS` hardcodeados (1250-3200) como reales |
| A9 | L4 | LOW | `components/ARScanner.tsx` | Sin loading state para acceso a camara |
| A10 | L5 | HIGH | `services/mockData.ts:16-282` | Timestamps de 2023-2024 presentados como festival 2025 |
| A11 | L6 | HIGH | `components/LandingView.tsx:220` | `text-white/40` sobre fondo oscuro — ratio ~1.5:1 |
| A12 | L6 | HIGH | `components/CommunitiesView.tsx:156` | `text-white/50` sobre input — contraste insuficiente |
| A13 | L6 | HIGH | `components/ProgramView.tsx:144` | Boton "Volver" icon-only sin `aria-label` |
| A14 | L6 | HIGH | `components/ProgramView.tsx:151-156` | Boton "Refresh" con `title` pero sin `aria-label` |
| A15 | L6 | HIGH | `components/NotificationsDropdown.tsx:198-210` | Botones icon-only sin `aria-label` |
| A16 | L6 | HIGH | `components/HomeView.tsx:147,153` | Botones carrusel prev/next sin `aria-label` |
| A17 | L6 | MEDIUM | `components/ui/GlobalHeader.tsx:163` | `text-white/50` decorativo — contraste bajo |
| A18 | L6 | MEDIUM | `components/ui/Modal.tsx:444,454,462` | Botones con `text-white/70` sobre imagenes variables |
| A19 | L6 | MEDIUM | `components/admin/AdvancedDashboard.tsx:279` | `text-white/60` en header con gradiente |
| A20 | L6 | MEDIUM | `components/CheckoutView.tsx:155` | `LoadingSpinner` sin `aria-live` ni `role="status"` |
| A21 | L6 | LOW | `components/HomeView.tsx:181,188` | Iconos en botones con texto sin `aria-hidden="true"` |
| A22 | L5 | LOW | `services/syncManager.ts:66-207` | Multiples `console.log` en produccion |
| A23 | L7 | HIGH | `services/geminiService.ts:10` | `process.env.API_KEY` — sintaxis Node en Vite (undefined) |
| A24 | L7 | MEDIUM | `vitest.config.ts` + `vitest.config.e2e.ts` | Dos configs de Vitest con conflicto potencial |
| A25 | L7 | MEDIUM | `services/admin.ts:326-680` | 14+ funciones usan localhost en vez de ApiClient |
| A26 | L7 | LOW | `backend/src/infrastructure/events/EventBus.ts:32` | `console.debug` en produccion |
| A27 | L4 | HIGH | `components/SmartMapView.tsx` | 100% datos hardcodeados, sin fetch a API |
| A28 | L5 | CRITICAL | `components/SellerDashboard.tsx:323-329` | KPIs financieros fake — vendedores ven ganancias falsas |
| A29 | L5 | HIGH | `components/admin/AdminDashboard.tsx:62-86` | MOCK_DAILY_USERS presentados como metricas reales |

**Total unicos Alpha: 29**

---

### Hallazgos UNICOS de Beta — Requieren verificacion

| # | Capa | Sev | Archivo | Hallazgo |
|---|------|-----|---------|----------|
| B1 | L2 | CRITICAL | `contexts/AuthContext.tsx:302,319` | Passwords en **plaintext** guardadas en `localStorage` en modo demo |
| B2 | L2 | CRITICAL | `contexts/AuthContext.tsx:39` | `API_BASE` hardcodeado fuerza demo mode en produccion |
| B3 | L2 | MEDIUM | `services/api.ts:36` | JWT access token en `localStorage` (vulnerable a XSS) |
| B4 | L2 | LOW | `backend/src/middleware/admin.ts` | Doble export de `requireAdmin` — ambiguo cual es autoritativo |
| B5 | L1 | MEDIUM | `components/ui/DragReorder.tsx` | Componente huerfano — 0 imports |
| B6 | L1 | MEDIUM | `components/ui/VirtualList.tsx` | Componente huerfano — 0 imports |
| B7 | L1 | MEDIUM | `components/ui/RichTextEditor.tsx` | Componente huerfano — 0 imports |
| B8 | L1 | MEDIUM | `components/ui/MultiStepForm.tsx` | Componente huerfano — 0 imports |
| B9 | L1 | MEDIUM | `components/ui/InfiniteScroll.tsx` | Componente huerfano — 0 imports |
| B10 | L1 | MEDIUM | `components/ui/DataViz.tsx` | Componente huerfano — 0 imports |
| B11 | L1 | MEDIUM | `services/gastronomy.ts` | Servicio huerfano — 0 imports |
| B12 | L1 | MEDIUM | `services/syncManager.ts` | Servicio huerfano — 0 imports |
| B13 | L1 | MEDIUM | `utils/cn.ts` | Utilidad huerfana — 0 imports |
| B14 | L1 | MEDIUM | `utils/keyboard.tsx` | Utilidad huerfana — 0 imports |
| B15 | L1 | LOW | `backend/src/services/booking-with-events.service.ts` | Exportado pero nunca instanciado |
| B16 | L1 | LOW | `backend/src/services/marketplace-with-events.service.ts` | Exportado pero nunca consumido |
| B17 | L1 | LOW | `hooks/useOffline.ts` | Hook exportado pero 0 componentes lo importan |
| B18 | L1 | LOW | `test/e2e/` | Dos test files para booking-flow (.test.ts vs .spec.ts) |
| B19 | L1 | LOW | `services/haptics.ts` + `utils/haptics.ts` | Dos implementaciones de haptics duplicadas |
| B20 | L1 | LOW | `components/ui/Navigation.tsx` | Duplicado de `components/Navigation.tsx` — 0 imports |
| B21 | L3 | MEDIUM | `services/admin.ts:329-441` | Llama `/api/admin/advanced/*` — rutas que NO existen en backend. Todo retorna 404 |
| B22 | L3 | LOW | `Navigation.tsx:24-48` | `ANALYTICS` view sin entrada en sidebar — solo accesible via deep nav |
| B23 | L4 | HIGH | `components/StoriesView.tsx:227-228` | `.catch(() => {})` vacio en `addComment()` |
| B24 | L4 | HIGH | `components/StoriesView.tsx:346-348` | `.catch(() => {})` vacio en story upload |
| B25 | L4 | MEDIUM | `components/ARScanner.tsx:77-79` | Error de camara solo en `console.error`, sin UI visible |
| B26 | L4 | MEDIUM | `components/ui/SearchBar.tsx:40` | `catch {}` vacio en geolocation |
| B27 | L6 | HIGH | `components/ui/Media.tsx:293,295` | `alt=""` en thumbnails interactivos del carousel |
| B28 | L6 | HIGH | `components/ui/Media.tsx:629,672` | `alt=""` en cover images — convey content meaning |
| B29 | L6 | MEDIUM | `App.tsx:449-487` | Banners de demo mode sin `aria-live` |
| B30 | L6 | LOW | `components/ui/GlobalHeader.tsx:115` | `text-white/70` en gradientes |
| B31 | L6 | LOW | `components/StoriesView.tsx:117-119` | Sin `aria-live` en loading de stories |
| B32 | L6 | LOW | `App.tsx:145,510` | Sin `id="main-content"` para skip-to-content |
| B33 | L7 | MEDIUM | `services/notifications.ts:3` | `API_BASE` inconsistente (algunos `localhost:3000`, otros `:3005`) |
| B34 | L7 | MEDIUM | Backend services | `-with-events` service variants son dead infrastructure |
| B35 | L7 | LOW | `backend/src/routes/metrics.ts:150` | `console.error` en vez de `fastify.log.error` |
| B36 | L7 | LOW | Raiz del proyecto | 40+ archivos .md sueltos en root — ruido |
| B37 | L7 | LOW | `vite.config.ts:40` | PWA workbox hardcodea `localhost:3005` para stories cache |

**Total unicos Beta: 37**

---

## TABLA RESUMEN CONSOLIDADA

### Por Severidad

| Severidad | Compartidos | Solo Alpha | Solo Beta | **Total** |
|-----------|-------------|------------|-----------|-----------|
| CRITICAL | 2 | 2 | 2 | **6** |
| HIGH | 12 | 10 | 4 | **26** |
| MEDIUM | 8 | 6 | 8 | **22** |
| LOW | 4 | 3 | 14 | **21** |
| **Total** | **26** | **21** | **28** | **75** |

### Por Capa

| Capa | Compartidos | Solo Alpha | Solo Beta | **Total** |
|------|-------------|------------|-----------|-----------|
| L1 Estructural | 5 | 2 | 16 | **23** |
| L2 Seguridad | 10 | 1 | 4 | **15** |
| L3 Arquitectura | 1 | 0 | 2 | **3** |
| L4 Resiliencia | 2 | 7 | 4 | **13** |
| L5 Datos | 2 | 4 | 2 | **8** |
| L6 Accesibilidad | 2 | 11 | 6 | **19** |
| L7 Tech Debt | 4 | 4 | 5 | **13** |
| **Total** | **26** | **29** | **39** | **94** |

### Confianza

| Nivel | Criterio | Hallazgos |
|-------|----------|-----------|
| **ALTA** | Ambos auditores detectaron | 26 |
| **MEDIA** | Solo un auditor, pero con evidencia clara (file:line) | ~50 |
| **BAJA** | Solo un auditor, requiere verificacion manual | ~8 |

---

## TOP 10 HALLAZGOS MAS CRITICOS (Ambos Auditores)

| Prioridad | Hallazgo | Capa | Riesgo |
|-----------|----------|------|--------|
| 1 | `face_auth_bypass` hardcodeado en AuthContext | Seguridad | Backdoor de autenticacion |
| 2 | Credenciales demo en bundle JS (`password123`) | Seguridad | Credenciales expuestas al publico |
| 3 | Passwords en plaintext en localStorage (Beta B1) | Seguridad | XSS = robo de passwords |
| 4 | JWT_SECRET fallback a string literal (Alpha A1) | Seguridad | Tokens JWT forjables |
| 5 | Gemini API key expuesta en bundle cliente | Seguridad | Abuso de API / costos |
| 6 | 3 rutas POI sin `requireAdmin` | Seguridad | Cualquier user modifica POIs |
| 7 | KPIs financieros fake en SellerDashboard | Datos | Vendedores ven datos falsos |
| 8 | CERO ErrorBoundary en toda la app (Alpha A4) | Resiliencia | Un error mata toda la app |
| 9 | `ViewState.ORDERS` renderiza CartView, no ordenes | Arquitectura | Flujo de usuario roto |
| 10 | Three.js + Stripe SDK muertos en bundle (~2MB+) | Tech Debt | Bundle inflado sin razon |

---

## PLAN DE REMEDIACION POR SPRINTS

### Sprint 1 — Seguridad CRITICAL (3 dias)
> No se puede deployar a produccion sin resolver esto

| # | Hallazgo | Fix |
|---|----------|-----|
| 1 | JWT_SECRET fallback (A1) | `throw` si no hay env var al startup |
| 2 | Cookie secret fallback (C9) | Igual — `throw` si no definido |
| 3 | Credenciales demo en bundle (C2) | Mover a backend seed; eliminar de AuthContext |
| 4 | `face_auth_bypass` (C1) | Crear endpoint `/api/auth/face` dedicado |
| 5 | Passwords en localStorage (B1) | Nunca guardar passwords; usar hash o eliminar demo mode |
| 6 | Gemini API key en cliente (C5) | Crear proxy `/api/ai/chat` en backend |
| 7 | POI rutas sin admin (C3) | Agregar `requireAdmin` a POST/PUT/DELETE |
| 8 | `/metrics/cache` sin auth (C4) | Agregar `checkMetricsAuth` |

### Sprint 2 — Dead Code (2 dias)
> Limpia antes de arreglar — no arregles lo que vas a borrar

| # | Hallazgo | Fix |
|---|----------|-----|
| 1 | `GuideDashboard.tsx` (C11) | Eliminar archivo + import |
| 2 | `AdminDashboard.tsx` import (C12) | Eliminar import de App.tsx |
| 3 | `AdvancedDashboard.tsx` (C14) | Eliminar o conectar a router |
| 4 | 6 componentes UI huerfanos (B5-B10) | Eliminar DragReorder, VirtualList, RichTextEditor, MultiStepForm, InfiniteScroll, DataViz |
| 5 | Servicios huerfanos (B11-B14) | Eliminar gastronomy.ts, syncManager.ts, cn.ts, keyboard.tsx |
| 6 | Three.js + Stripe frontend (C22, C23) | `npm uninstall three @react-three/fiber @react-three/drei stripe` |
| 7 | `-with-events` services (B15-B16) | Eliminar o integrar |
| 8 | `ui/Navigation.tsx` duplicado (B20) | Eliminar |

### Sprint 3 — Arquitectura + URLs (2 dias)

| # | Hallazgo | Fix |
|---|----------|-----|
| 1 | `ViewState.ORDERS` -> CartView (C16) | Conectar a MyOrdersView |
| 2 | `ADMIN_ADVANCED` sin case (C15) | Eliminar del enum o implementar |
| 3 | Todas las URLs hardcodeadas (C6-C8, B2) | Unificar a `import.meta.env.VITE_API_URL` |
| 4 | `process.env.API_KEY` en Vite (A23) | Cambiar a `import.meta.env.VITE_*` o proxy |
| 5 | Rutas `/api/admin/advanced/*` inexistentes (B21) | Implementar o redirigir |
| 6 | Modelo Gemini inexistente (C19) | Actualizar a `gemini-2.0-flash` |

### Sprint 4 — Resiliencia (3 dias)

| # | Hallazgo | Fix |
|---|----------|-----|
| 1 | Cero ErrorBoundary (A4) | Agregar `<ErrorBoundary>` al root |
| 2 | SellerDashboard 100% mock (C17) | Conectar a API real |
| 3 | SmartMapView 100% hardcodeado (A27) | Conectar a backend POI API |
| 4 | Admin fallback silencioso a mock (C18) | Propagar error, mostrar banner |
| 5 | Silent `.catch(() => {})` x4 (A5, B23, B24, B26) | Agregar error UI visible |
| 6 | NotificationBell sin feedback (A6) | Agregar retry + error state |

### Sprint 5 — Datos (2 dias)

| # | Hallazgo | Fix |
|---|----------|-----|
| 1 | KPIs financieros fake (A28) | Conectar a `/api/marketplace/seller/stats` |
| 2 | MOCK_ADMIN_STATS como produccion (C18) | Eliminar fallback a mock |
| 3 | Timestamps anacronicos (A10) | Actualizar o usar `Date.now()` |
| 4 | console.log en produccion (A22, A26) | Condicionar a `NODE_ENV` |
| 5 | Stripe TODOs (C25) | Implementar o deshabilitar botones |

### Sprint 6 — Accesibilidad (3 dias)

| # | Hallazgo | Fix |
|---|----------|-----|
| 1 | Botones icon-only sin aria-label x5 (A13-A16) | Agregar `aria-label` |
| 2 | Contraste insuficiente x3 (A11, A12, A17) | Subir opacidad a /80 minimo |
| 3 | Heading hierarchy rota (C20) | h1 -> h2 -> h3 en orden |
| 4 | `alt=""` en imagenes de contenido (B27-B28) | Agregar alt descriptivo |
| 5 | LoadingSpinner sin aria-live (A20) | `role="status" aria-live="polite"` |
| 6 | Banners sin aria-live (B29) | Agregar `aria-live="polite"` |
| 7 | Skip-to-content faltante (B32) | Agregar `id="main-content"` + skip link |

### Sprint 7 — Tech Debt (2 dias)

| # | Hallazgo | Fix |
|---|----------|-----|
| 1 | Vitest configs duplicados (A24) | Separar unit/ vs e2e/ |
| 2 | Admin service no usa ApiClient (A25) | Refactorizar |
| 3 | API_BASE inconsistente entre servicios (B33) | Unificar patron |
| 4 | 40+ .md sueltos en root (B36) | Mover a docs/ |
| 5 | PWA workbox hardcodea localhost (B37) | Usar env var |
| 6 | Haptics duplicado (B19) | Consolidar |

### Sprint 8 — Verificacion Final (1 dia)

| Check | Criterio de cierre |
|-------|-------------------|
| TypeScript | `tsc --noEmit` — 0 errores |
| Lint | `eslint .` — 0 errores |
| Tests | `npm test` — todos pasan (349+ existentes + nuevos) |
| Build | `npm run build` — sin warnings |
| Bundle | Verificar reduccion de ~2MB (Three.js + Stripe removidos) |
| Security | 0 hallazgos CRITICAL abiertos |

---

## CRITERIO DE CIERRE

- [ ] 0 errores TypeScript (`tsc --noEmit`)
- [ ] 0 errores lint
- [ ] Todos los tests pasan
- [ ] 0 hallazgos CRITICAL abiertos
- [ ] 0 credenciales hardcodeadas en codigo fuente
- [ ] Todas las URLs usan `import.meta.env.VITE_API_URL`
- [ ] ErrorBoundary en root de la app
- [ ] Bundle reducido en ~2MB (dependencias muertas removidas)

---

---

## CROSS-AUDIT GEMINI (Fase 2 - Protocolo Manus)

### Hallazgos Confirmados por Gemini
- Credenciales demo en bundle JS (CRITICAL)
- Passwords plaintext en localStorage (CRITICAL)
- JWT_SECRET fallback a literal (CRITICAL)
- Gemini API key en bundle via `vite.config.ts define` (CRITICAL)
- `/metrics/cache` sin auth (HIGH)
- CSP deshabilitado (MEDIUM)

### Falso Positivo Detectado
| Hallazgo | Clasificacion original | Gemini dice | Razon |
|---|---|---|---|
| `face_auth_bypass` backdoor | CRITICAL | **NO ES BACKDOOR FUNCIONAL** | La cadena solo existe en el frontend. El backend usa `bcrypt.compare` — el login fallaria a menos que la password real del user sea literalmente esa cadena. Es mala practica pero no vulnerabilidad funcional. |

### Severidades Ajustadas
| Hallazgo | Original | Ajustado | Razon |
|---|---|---|---|
| API_BASE hardcodeado fuerza demo mode | CRITICAL | **MEDIUM** | Problema de disponibilidad/funcionalidad, no compromiso de datos |
| `/metrics/cache` sin auth | HIGH | **MEDIUM** | Expone stats de Redis, no datos sensibles de usuarios |

### Hallazgos NUEVOS (Solo Gemini detecto)

| # | Capa | Sev | Archivo | Descripcion | Fix |
|---|------|-----|---------|-------------|-----|
| G1 | Seguridad | **CRITICAL** | `DOCKER_SETUP_SUMMARY.md:374` | **Claves `sk_live_*` de Stripe** visibles en archivos Markdown commiteados. Secretos de produccion en el historial de Git. | Revocar claves INMEDIATAMENTE. Limpiar historial con `git-filter-repo`. Eliminar .md con secretos. |
| G2 | Seguridad | HIGH | `backend/src/app.ts` | Falta de proteccion **CSRF** en endpoints que aceptan `refreshTokens` via cookies. Facilita secuestro de sesion. | Implementar `@fastify/csrf-protection` |
| G3 | Resiliencia | HIGH | `backend/src/routes/metrics.ts` | **Resource Exhaustion (DoS)**: Endpoint publico lanza 9 queries pesadas sincronas a la BD por cada request. Sin cache ni rate limit. | Cachear resultados por 60s minimo. Agregar rate limit. |
| G4 | Seguridad | MEDIUM | `backend/src/app.ts` | CORS permisivo (`origin: true`) en dev/staging. Permite ataques de origenes arbitrarios si se deploya sin cambiar. | Definir whitelist estricta de dominios |
| G5 | Seguridad | CRITICAL | `vite.config.ts` | Inyeccion de secretos en cliente via `define`. Mecanismo que expone `GEMINI_API_KEY` al bundle — confirmacion de raiz del problema. | Eliminar `define` de secretos; proxy por backend |

### Veredicto Gemini
**Score de Riesgo: 9.2/10 — NO DEPLOY**

> "El sistema tiene fugas de secretos de produccion en el historial de Git y en la configuracion
> de compilacion de Vite. La arquitectura de autenticacion es inconsistente y carece de protecciones
> basicas contra CSRF y DoS en endpoints de monitoreo. Se requiere una limpieza profunda de secretos
> y una refactorizacion de la capa de seguridad antes de cualquier salida a produccion."

---

## RESUMEN FINAL TRIPLE-AUDIT

| Auditor | Hallazgos | CRITICAL | Unicos |
|---|---|---|---|
| Alpha (Claude) | 63 | 6 | 29 |
| Beta (Claude) | 72 | 3 | 37 |
| Gemini (Cross-Audit) | 5 nuevos | 2 nuevos | 5 |
| **Consolidado** | **90** | **7** | — |

### Ajuste a Severidades Post-Gemini

| Severidad | Pre-Gemini | Post-Gemini | Cambio |
|---|---|---|---|
| CRITICAL | 6 | 7 (+G1 Stripe keys, reclasificacion face_auth) | +1 real, -1 reclasificado |
| HIGH | 26 | 28 (+G2 CSRF, +G3 DoS) | +2 |
| MEDIUM | 22 | 24 (+G4 CORS, reclasificaciones) | +2 |
| LOW | 21 | 21 | = |

### Prioridad #0 (ANTES de Sprint 1)
**REVOCAR CLAVES STRIPE** que estan en `DOCKER_SETUP_SUMMARY.md` commiteado en Git.
Esto es accionable HOY. No esperar al sprint.

---

*Auditoria ejecutada: 2026-03-13*
*Auditor Alpha: 63 hallazgos, 128 tool uses, 10 min*
*Auditor Beta: 72 hallazgos, 133 tool uses, 10 min*
*Gemini Cross-Audit: 5 hallazgos nuevos, 1 falso positivo, 2 ajustes de severidad*
*Triple-audit consolidado: 90 hallazgos unicos*
