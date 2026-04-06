# Guía de Despliegue - Influence CRM en Render.com

## Paso 1: Preparar el repositorio

El repositorio ya está en GitHub: https://github.com/Rodrigoce22/subircrmprueb

## Paso 2: Crear una cuenta en Render.com

1. Ir a https://render.com
2. Hacer clic en "Create free account"
3. Registrarse con GitHub (para facilitar la integración)

## Paso 3: Crear el servicio de base de datos PostgreSQL

1. En el dashboard de Render, hacer clic en **New +** → **PostgreSQL**
2. Configurar:
   - **Name**: `influence-crm-db`
   - **Database**: `influence_crm`
   - **User**: `influence_user`
   - **Region**: Tu región más cercana (ej: North Virginia)
   - **Plan**: Free
3. Hacer clic en **Create Database**
4. Una vez creada, copiar la **Internal Database URL** (comienza con `postgres://`)

## Paso 4: Crear el servicio de backend

1. Hacer clic en **New +** → **Web Service**
2. Conectar el repositorio GitHub: `Rodrigoce22/subircrmprueb`
3. Configurar:
   - **Name**: `influence-crm-backend`
   - **Environment**: `Docker`
   - **Build Command**: (dejar en blanco, usa Dockerfile)
   - **Start Command**: (dejar en blanco, usa Dockerfile)
   - **Plan**: Free

## Paso 5: Configurar variables de entorno

En la sección **Environment**, agregar:

```
NODE_ENV = production
PORT = 3001
JWT_SECRET = tu-secreto-super-seguro-aqui
ADMIN_EMAIL = admin@influence.com
ADMIN_PASS = influence2024
DATABASE_URL = postgres://[usuario]:[password]@[host]:5432/[database]
FRONTEND_URL = https://rodrigoce22.github.io/subircrmprueb/
```

💡 La `DATABASE_URL` la obtienes al crear la BD en Paso 3. Cópiala tal como está.

## Paso 6: Desplegar

1. Hacer clic en **Deploy**
2. Esperar a que se compile y despliegue (unos 5-10 minutos)
3. Una vez listo, Render te mostrará una URL como: `https://influence-crm-backend-xxxxx.onrender.com`

## Paso 7: Actualizar el frontend

1. En tu máquina local, en la carpeta del frontend:
   ```bash
   cd influence-crm/frontend
   VITE_API_URL=https://influence-crm-backend-xxxxx.onrender.com/api npm run build
   ```

2. Desplegar a GitHub Pages:
   ```bash
   git add .
   git commit -m "Update backend API URL"
   git push
   ```

3. El workflow de GitHub Actions automáticamente desplegará el frontend actualizado.

## Verificar que funciona

1. Ir a: https://rodrigoce22.github.io/subircrmprueb/
2. Login con:
   - Email: `admin@influence.com`
   - Password: `influence2024`

## Notas importantes

⚠️ **Servicios gratuitos en Render se duermen después de 15 min sin uso**, así que la primera solicitud tardará unos segundos en responder.

✅ Para producción, considerar pasar a planes pagos o usar otro servicio.

🔒 **Cambiar la contraseña del admin** una vez que te logues correctamente.
