# Deploy — Influence CRM en Hostinger VPS + EasyPanel

## Requisitos previos
- VPS Hostinger con Ubuntu 22.04 o 24.04
- EasyPanel instalado (viene pre-instalado en VPS Hostinger con cPanel)
- Dominio apuntando a la IP del VPS (registro A: `crm.tudominio.com` → IP del VPS)

---

## Paso 1 — Conectarse al VPS por SSH

```bash
ssh root@TU_IP_VPS
# o con tu usuario si no es root
ssh usuario@TU_IP_VPS
```

---

## Paso 2 — Subir el código al VPS

**Opción A — Desde tu PC via SCP (si no usas Git)**

Desde tu PC local (no el VPS):
```bash
# Comprimir sin node_modules ni builds temporales
cd "C:\Users\Noxie\OneDrive\Desktop\crm\crm"
tar -czf influence-crm.tar.gz influence-crm \
  --exclude="influence-crm/*/node_modules" \
  --exclude="influence-crm/frontend/dist" \
  --exclude="influence-crm/backend/.wa_sessions"

# Subir al VPS
scp influence-crm.tar.gz root@TU_IP_VPS:/opt/
```

En el VPS:
```bash
cd /opt
tar -xzf influence-crm.tar.gz
cd influence-crm
```

**Opción B — Desde GitHub (si subiste el proyecto a un repo)**
```bash
cd /opt
git clone https://github.com/TU_USUARIO/influence-crm.git
cd influence-crm
```

---

## Paso 3 — Configurar variables de entorno

```bash
# En el VPS, dentro de /opt/influence-crm
cp backend/.env.example .env
nano .env
```

Edita estos valores (todos obligatorios):

```env
DB_PASS=UnaPasswordSuperSegura2024!
JWT_SECRET=GeneraUnStringLargoAquiMinimo32CaracteresAleatorios
ADMIN_EMAIL=admin@tudominio.com
ADMIN_PASS=TuPasswordDeAdmin123!
FRONTEND_URL=https://crm.tudominio.com
FRONTEND_PORT=8080
```

> **Nota:** Usamos `FRONTEND_PORT=8080` para evitar conflicto con el puerto 80 que usa EasyPanel/Nginx del sistema.

Guardá el archivo (`Ctrl+X → Y → Enter`).

---

## Paso 4 — Levantar los contenedores

```bash
cd /opt/influence-crm

# Primera vez: construye las imágenes y levanta
docker compose --env-file .env up -d --build

# Verificar que los 3 contenedores estén corriendo
docker compose ps
```

Deberías ver algo así:
```
NAME                    STATUS
influence-crm-postgres-1   Up (healthy)
influence-crm-backend-1    Up
influence-crm-frontend-1   Up
```

Si algo falla:
```bash
# Ver logs del backend
docker compose logs backend --tail=50

# Ver logs del frontend
docker compose logs frontend --tail=20
```

---

## Paso 5 — Configurar dominio en EasyPanel

1. Abrí EasyPanel en tu navegador:
   - URL: `http://TU_IP_VPS:3000`
   - O la URL que te dio Hostinger para EasyPanel

2. Andá a **Services** o **Apps** → **Add Service** → **Custom**

3. Completá:
   - **Name**: `influence-crm`
   - **Source**: "External port" o "Proxy"
   - **Target**: `localhost:8080` (el puerto del frontend)

4. Andá a **Domains** dentro del servicio:
   - **Domain**: `crm.tudominio.com`
   - Activá **HTTPS / SSL** (EasyPanel lo genera automáticamente con Let's Encrypt)

5. Guardá. EasyPanel va a generar el certificado SSL en 1-2 minutos.

---

## Paso 6 — Primer acceso

1. Entrá a `https://crm.tudominio.com`
2. Login con:
   - Email: el `ADMIN_EMAIL` que pusiste en `.env`
   - Password: el `ADMIN_PASS` que pusiste en `.env`
3. Creá los usuarios del equipo en **Usuarios**
4. Andá a **WhatsApp** → "Conectar WA" → Escaneá el QR con WhatsApp Business

---

## Comandos útiles en el VPS

```bash
# Ver estado de todos los contenedores
docker compose -f /opt/influence-crm/docker-compose.yml ps

# Logs en tiempo real
docker compose -f /opt/influence-crm/docker-compose.yml logs -f backend

# Reiniciar solo el backend (sin perder sesión de WA)
docker compose -f /opt/influence-crm/docker-compose.yml restart backend

# Actualizar el CRM cuando haya cambios
cd /opt/influence-crm
git pull   # si usás git
# o subí los archivos nuevos via SCP, luego:
docker compose --env-file .env up -d --build

# Backup de la base de datos
docker exec influence-crm-postgres-1 \
  pg_dump -U postgres influence_crm > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i influence-crm-postgres-1 \
  psql -U postgres influence_crm < backup_20240101.sql
```

---

## Estructura de los contenedores

| Contenedor                  | Puerto interno | Descripción                    |
|-----------------------------|----------------|-------------------------------|
| influence-crm-postgres-1    | 5432 (interno) | PostgreSQL 16                  |
| influence-crm-backend-1     | 3001 (interno) | Node.js API + WhatsApp + WS    |
| influence-crm-frontend-1    | 8080 → 80      | React + Nginx (proxy al backend)|

El frontend en Nginx ya hace proxy automático de `/api/*` → backend, así que **no** necesitás exponer el backend directamente.

---

## Solución de problemas

### El frontend carga pero la API da error 502
```bash
# Verificar que backend está corriendo
docker compose logs backend --tail=30
# Si está crasheando, es probable que la DB no esté lista
docker compose restart backend
```

### La sesión de WhatsApp se pierde al reiniciar
```bash
# El volumen wa_sessions persiste la sesión, verificar que existe
docker volume ls | grep wa_sessions
```

### Puerto 8080 bloqueado por firewall de Hostinger
```bash
# Abrir el puerto en UFW
ufw allow 8080/tcp
# O ir al panel de Hostinger → VPS → Firewall → Agregar regla
```

### Error "database does not exist"
```bash
# El backend crea la DB automáticamente al primer inicio
# Si hay error, recrear el contenedor de postgres
docker compose down
docker volume rm influence-crm_postgres_data
docker compose up -d --build
```

---

## Actualizar cuando hay cambios de código

```bash
cd /opt/influence-crm

# Si usás git:
git pull origin main

# Reconstruir y reiniciar (sin downtime de DB)
docker compose --env-file .env up -d --build backend frontend

# La DB y los volúmenes se mantienen intactos
```
