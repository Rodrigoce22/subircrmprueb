# Guia de Deploy — Influence CRM en Hostinger EasyPanel

## Requisitos en tu VPS
- Ubuntu 24.04
- EasyPanel instalado
- Docker y Docker Compose (EasyPanel los incluye)
- Dominio apuntando a la IP del VPS

---

## Paso 1 — Subir el proyecto al VPS

```bash
# Desde tu PC local, comprimir el proyecto
cd influence-crm
zip -r influence-crm.zip . --exclude "node_modules/*" --exclude ".wa_sessions/*" --exclude "dist/*"

# Subir via SCP
scp influence-crm.zip root@TU_IP_VPS:/opt/
```

En el VPS:
```bash
cd /opt
unzip influence-crm.zip -d influence-crm
cd influence-crm
```

---

## Paso 2 — Configurar variables de entorno

```bash
cp .env.production .env
nano .env   # Edita los valores con tus datos reales
```

Valores que DEBES cambiar:
- `DB_PASS` — password de PostgreSQL
- `JWT_SECRET` — string largo y aleatorio (min 32 chars)
- `ADMIN_EMAIL` — tu email de admin
- `ADMIN_PASS` — tu password de admin
- `FRONTEND_URL` — tu dominio (ej: https://crm.tudominio.com)

---

## Paso 3 — Levantar los contenedores

```bash
docker compose up -d --build
```

Verificar que todo corre:
```bash
docker compose ps
docker compose logs backend --tail=50
```

---

## Paso 4 — Configurar dominio en EasyPanel

1. Abre EasyPanel en tu VPS (generalmente `http://IP:3000`)
2. Ve a **Domains** y agrega tu dominio
3. Apunta el dominio al puerto **80** (frontend)
4. EasyPanel genera el SSL automaticamente con Let's Encrypt

---

## Paso 5 — Primer acceso

1. Entra a `https://crm.tudominio.com`
2. Login con las credenciales que pusiste en `.env`
3. Crea los 5 usuarios de tu equipo en **Usuarios**
4. Ve a **WhatsApp** y haz clic en "Conectar WA"
5. Escanea el QR con tu WhatsApp Business

---

## Comandos utiles en el VPS

```bash
# Ver logs en tiempo real
docker compose logs -f backend

# Reiniciar servicios
docker compose restart

# Actualizar (cuando haya cambios)
docker compose down
docker compose up -d --build

# Backup de base de datos
docker exec influence_db pg_dump -U postgres influence_crm > backup_$(date +%Y%m%d).sql
```

---

## Estructura de contenedores

| Contenedor        | Puerto | Descripcion                    |
|------------------|--------|-------------------------------|
| influence_db     | -      | PostgreSQL 16                  |
| influence_backend| 3001   | Node.js API + WhatsApp + WS    |
| influence_frontend| 80    | React + Nginx                  |

---

## Credenciales por defecto (cambia en .env antes de deploy)

- Email: admin@influence.com
- Password: influence2024
