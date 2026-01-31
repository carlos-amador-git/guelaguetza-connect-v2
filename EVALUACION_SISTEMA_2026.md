# 📑 Reporte de Evaluación Técnica - Guelaguetza Connect

![Concepto Guelaguetza Connect](/Users/marxchavez/.gemini/antigravity/brain/27cfb94f-cafd-4175-9d76-b2264c73ad9d/guelaguetza_hero_concept_1769753706485.png)

**Fecha:** 29 de Enero, 2026
**Evaluador:** Antigravity AI
**Versión del Sistema Evaluada:** 0.0.0 (Pre-Alpha / Desarrollo)

---

## 1. Resumen Ejecutivo

**Guelaguetza Connect** es una "Super App" ambiciosa diseñada para digitalizar la experiencia de la Guelaguetza. El sistema no es solo un sitio web, sino una **Progressive Web App (PWA)** compleja con capacidades de Realidad Aumentada (AR), Mapas interactivos, E-commerce, Streaming y Red Social.

El nivel técnico del proyecto es **excepcionalmente alto** para una fase de desarrollo temprana. Destaca por el uso de tecnologías de punta (React 19, Fastify, Node 22) y una arquitectura de backend profesional (Clean Architecture). Sin embargo, la arquitectura de navegación del frontend (Single View State) presenta desafíos de escalabilidad y UX que deben ser monitoreados.

### 🏆 Calificación Global: 9.0 / 10

| Área | Calificación | Estado |
| :--- | :--- | :--- |
| **Técnica** | **9/10** | 🟢 Excelente |
| **Operativa** | **10/10** | 🟢 Impecable |
| **Diseño / UX** | **8.5/10** | 🟢 Muy Bueno |
| **Arquitectura** | **8.5/10** | 🟡 Bueno (con observaciones) |

---

## 2. Evaluación Detallada

### 🛠️ Calificación Técnica (Stack y Código)
![Tech Stack Visualization](/Users/marxchavez/.gemini/antigravity/brain/27cfb94f-cafd-4175-9d76-b2264c73ad9d/tech_stack_isometric_1769753722996.png)

**Veredicto: Vanguardista y Robusto.**

*   **Frontend (React 19 + Vite):** Estás utilizando la versión más reciente de React (v19), lo que te prepara para el futuro (Server Actions, use, etc.), aunque puede presentar inestabilidad con librerías antiguas.
*   **Backend (Node 22 + Fastify):** La elección de Fastify sobre Express es excelente para performance. El uso de Node 22 (LTS reciente) garantiza soporte a largo plazo.
*   **Database (Prisma + PostgreSQL):** El stack estándar de la industria moderna. Prisma ofrece seguridad de tipos (type-safety) end-to-end.
*   **Innovación:** Integración de **AR** (WebXR/Three.js), **Mapas** (Leaflet), **Pagos** (Stripe) y **AI** (Google GenAI) en un solo monorepo.

### ⚙️ Calificación Operativa (DevOps y Mantenimiento)
**Veredicto: Nivel Enterprise.**

*   **Documentación:** La cantidad y calidad de la documentación (`_SUMMARY.md`, `_GUIDE.md`) es sobresaliente. Es raro ver proyectos con guías tan detalladas de migración, testing y arquitectura.
*   **Testing:** Cobertura completa con **Vitest** (Unit/Integration) y **Playwright** (E2E). Esto garantiza estabilidad en cada release.
*   **Contenerización:** Configuración de Docker minuciosa para producción, testing y monitoreo.
*   **Scripts:** El `package.json` contiene scripts automatizados para casi cualquier tarea (seed, migrate, check), facilitando enormemente el onboarding de nuevos desarrolladores.

### 🎨 Calificación de Diseño y UX
![Interfaz de Usuario y UX](/Users/marxchavez/.gemini/antigravity/brain/27cfb94f-cafd-4175-9d76-b2264c73ad9d/guelaguetza_app_ui_1769753743129.png)

**Veredicto: Moderno y Accesible.**

*   **PWA First:** La app está diseñada para funcionar offline y sentirse nativa (`vite-plugin-pwa`, indicadores offline).
*   **Estilos:** Uso de clases utilitarias (estilo Tailwind) con soporte nativo para **Dark Mode**.
*   **Accesibilidad:** El archivo `index.css` muestra atención explícita a normas WCAG (tamaños de toque mínimos, focus visible).
*   **Transiciones:** Implementación de `PageTransition` para suavizar la navegación, emulando una app nativa.

---

## 3. 🎨 Nuevos Activos de UI Generados

Se han generado e integrado los siguientes activos gráficos personalizados para mejorar la identidad visual de la aplicación:

| Icono | Uso | Descripción |
| :---: | :--- | :--- |
| ![Inicio](/public/images/ui/icon_home.png) | **Inicio / Feed** | Greca zapoteca estilizada con gradiente 'Pink Mexicano'. |
| ![Mercado](/public/images/ui/icon_market.png) | **Mercado** | Canasta tradicional (tenate) simplificada. |
| ![Eventos](/public/images/ui/icon_events.png) | **Eventos** | Penacho de la Danza de la Pluma minimalista. |
| ![AR](/public/images/ui/icon_ar.png) | **Scanner AR** | Máscara de diablo en visor de realidad aumentada. |

> *Nota: Estos iconos se encuentran en `/public/images/ui/` y están integrados en `components/Navigation.tsx`.*

### Imágenes de Contenido (Pendientes de Integración)

Se generaron 10 imágenes PNG de alta calidad en `/public/images/` para reemplazar placeholders. **Actualmente no están referenciadas** en ningún componente — el sistema usa `GradientPlaceholder` como fallback visual.

| Categoría | Archivo | Uso Previsto |
| :--- | :--- | :--- |
| **Danzas** | `dance_flor_de_pina.png` | Danza Flor de Piña |
| | `dance_pluma.png` | Danza de la Pluma |
| **Puntos de Interés** | `poi_auditorio_guelaguetza.png` | Auditorio Guelaguetza |
| | `poi_hierve_el_agua.png` | Hierve el Agua |
| | `poi_monte_alban.png` | Monte Albán |
| | `poi_santo_domingo.png` | Templo de Santo Domingo |
| **Productos** | `product_alebrije.png` | Alebrijes artesanales |
| | `product_barro_negro.png` | Barro negro de Coyotepec |
| | `product_mezcal.png` | Mezcal artesanal |
| | `product_textiles.png` | Textiles zapotecos |

> *Recomendación: Integrar estas imágenes en las vistas correspondientes (`POIDetailView`, `TiendaView`, `ExperienceDetailView`) para enriquecer la experiencia visual cuando los datos incluyan `imageUrl` apuntando a estos assets locales.*

---

## 4. 🚨 Hallazgos Críticos y Alertas

### A. Arquitectura de Navegación "Custom" (Frontend)
El archivo `App.tsx` maneja la navegación mediante un **switch gigante** (`case ViewState.HOME`, `case ViewState.LOGIN`, ...).
*   **El Riesgo:** Esto rompe el comportamiento estándar de la web.
    *   **No Deep Linking:** Si un usuario recarga la página en "Detalle de Evento", el estado se resetea al inicio (a menos que haya lógica oculta de sincronización con URL).
    *   **Historial:** El botón "Atrás" del navegador podría sacarte de la app en lugar de volver a la vista anterior si no se manipula el `window.history` manualmente.
*   **Impacto:** Medio/Alto. Hace que la app se sienta muy nativa, pero frustra a usuarios de escritorio o web móvil que esperan compartir URLs específicas.

### B. "God Component" (App.tsx)
El archivo `App.tsx` tiene más de 500 líneas y centraliza demasiada lógica de estado (`selectedEventId`, `selectedUserId`, `showOnboarding`, etc.).
*   **El Riesgo:** Cada vez que agregues una vista nueva, este archivo crecerá. Renderiza toda la aplicación, por lo que cualquier cambio de estado aquí provoca re-renders masivos si no se tiene cuidado (React 19 ayuda, pero no hace magia).
*   **Impacto:** Mantenibilidad a largo plazo.

### C. Dependencia Oculta de CSS Framework
El código usa clases como `bg-gray-100`, `text-xl`, `dark:bg-gray-950`. Esto es sintaxis de **Tailwind CSS**, pero no veo `tailwindcss` explícitamente en las `dependencies` o `devDependencies` del `package.json` raíz (aunque podría estar pre-configurado en Vite o ser un preset).
*   **Alerta:** Asegúrate de que el build pipeline procese estas clases correctamente. Si estás usando clases utilitarias manuales en `index.css` para imitar Tailwind, será inmantenerible.

---

## 5. 💡 Recomendaciones

### Corto Plazo (Quick Wins)
1.  **Sincronización de URL:** Si decides mantener el `switch` en `App.tsx`, implementa un hook que sincronice el `currentView` y los IDs (`selectedEventId`) con la URL (ej. `?view=EVENT_DETAIL&id=123`). Esto permitirá compartir enlaces y recargar la página sin perder el contexto.
2.  **Refactorización de App.tsx:** Mueve el `switch` gigante a un componente `AppRouter` o `ViewManager`. Deja `App.tsx` solo para Providers (Auth, Theme) y Layout base.

### Mediano Plazo
1.  **Gestor de Estado Global:** Mover los estados de selección (`selectedCommunityId`, `selectedProductId`) fuera de `App.tsx` a un store global ligero como **Zustand** o un **Context** dedicado (`NavigationContext`). Esto limpiará el componente raíz.
2.  **Validación de Dependencias React 19:** Verifica que librerías críticas como `react-leaflet` y `@react-three/fiber` sean totalmente compatibles con React 19 y React Compiler (si lo activas).

### Largo Plazo
1.  **Micro-frontends o Lazy Loading agresivo:** Ya usas `lazy` para el scanner AR. Extiende esto para módulos pesados como el Dashboard de Vendedor o los Mapas 3D para mantener el bundle inicial pequeño.
