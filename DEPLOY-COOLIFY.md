# Deploy en Coolify - Guelaguetza Connect

## Requisitos previos

- Servidor con Coolify instalado (163.245.208.96)
- Dominio `guelaguetzav2.mdconsultoria-ti.org` apuntando al servidor (registro A o CNAME en DNS)
- Repositorio accesible desde el servidor (GitHub)

## Arquitectura del deploy

```
Internet → Coolify (proxy 80/443 con SSL)
              ↓
         frontend (nginx :3005)
           ├── / → SPA React (archivos estáticos)
           └── /api → proxy a backend:3001
              ↓
         backend (Fastify :3001)
           ├── PostgreSQL (interno)
           └── Redis (interno)
```

El frontend sirve la app React y hace proxy de `/api` al backend. Un solo dominio, sin CORS.

## Pasos

### 1. Configurar DNS

En tu proveedor de dominio, crear registro A o CNAME:

```
guelaguetzav2.mdconsultoria-ti.org  →  163.245.208.96
```

Verificar propagación: `dig guelaguetzav2.mdconsultoria-ti.org` o https://dnschecker.org

### 2. En Coolify: Crear proyecto

1. Entrar a Coolify (https://163.245.208.96:8000 o el puerto que tengas)
2. **Projects** → **New Project** → nombre: `Guelaguetza Connect`
3. Seleccionar el servidor/environment

### 3. Agregar servicio Docker Compose

1. Dentro del proyecto → **New** → **Docker Compose**
2. Seleccionar fuente: **GitHub** (conectar repo si no está)
3. Seleccionar el repositorio `guelaguetza-connect`
4. Branch: `main`
5. **Docker Compose Location**: `docker-compose.coolify.yml`

### 4. Configurar variables de entorno

En la sección **Environment Variables** de Coolify, agregar:

| Variable | Valor | Notas |
|----------|-------|-------|
| `POSTGRES_PASSWORD` | (generar password seguro) | Usar: `openssl rand -base64 32` |
| `JWT_SECRET` | (generar secret seguro) | Usar: `openssl rand -base64 64` |
| `CORS_ORIGINS` | `https://guelaguetzav2.mdconsultoria-ti.org` | Dominios permitidos |

Para generar passwords seguros desde terminal:

```bash
# Password de PostgreSQL
openssl rand -base64 32

# JWT Secret
openssl rand -base64 64
```

### 5. Configurar dominio y SSL

1. En la configuración del servicio **frontend**:
   - **Domain**: `https://guelaguetzav2.mdconsultoria-ti.org`
   - **Port**: `3005`
2. Habilitar **SSL/HTTPS** (Let's Encrypt automático en Coolify)
3. Habilitar **Force HTTPS redirect**

### 6. Deploy

1. Click en **Deploy**
2. Esperar a que los 4 servicios levanten (postgres → redis → backend → frontend)
3. El primer deploy tarda más porque construye las imágenes Docker

### 7. Verificación

Acceder a `https://guelaguetzav2.mdconsultoria-ti.org` y verificar:

- [ ] La página carga correctamente
- [ ] Login con: `demo@guelaguetza.mx` / `password123`
- [ ] Navegar por: Tienda, Mapa, Streaming, Comunidades
- [ ] Las imágenes cargan correctamente
- [ ] El ícono PWA (alebrije) aparece

## Troubleshooting

### La página no carga

1. Verificar DNS: `dig guelaguetzav2.mdconsultoria-ti.org` debe resolver a `163.245.208.96`
2. En Coolify, revisar logs del servicio `frontend`
3. Verificar que el puerto 80/443 está abierto en el firewall del servidor

### Error 502 Bad Gateway

El backend no está listo. Revisar logs de `backend` en Coolify:
- Si dice "database connection failed": el postgres no terminó de inicializar, esperar y redesplegar
- Si dice "migration failed": conectarse al servidor y revisar logs detallados

### Login no funciona / API no responde

1. Revisar logs del `backend` en Coolify
2. Verificar que `AUTO_SEED=true` está en las variables (carga datos demo al iniciar)
3. Probar directamente: `curl https://guelaguetzav2.mdconsultoria-ti.org/api/health`
4. Verificar `CORS_ORIGINS` si hay errores de CORS en consola del navegador

### SSL no funciona

1. Verificar que el DNS ya propagó (`dig guelaguetzav2.mdconsultoria-ti.org`)
2. En Coolify, regenerar certificado SSL
3. Let's Encrypt requiere que el puerto 80 esté accesible para validación

## Archivos relevantes

| Archivo | Descripción |
|---------|-------------|
| `docker-compose.coolify.yml` | Compose para Coolify (4 servicios) |
| `.env.coolify.example` | Template de variables de entorno |
| `Dockerfile.frontend` | Build del frontend (nginx con proxy /api) |
| `backend/Dockerfile` | Build del backend (Fastify) |

## Re-deploy

Para actualizar después de cambios en el código:
1. Push cambios a `main`
2. En Coolify → proyecto → **Redeploy**
3. O configurar **Auto Deploy** en Coolify para deploy automático en cada push
