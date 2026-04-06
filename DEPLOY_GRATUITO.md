# 🚀 Guía Rápida: Desplegar Influence CRM en Render.com (GRATUITO)

## Credenciales de Acceso

```
📧 Email:    admin@influence.crm
🔑 Password: IuZ9#mK2@xL5$pQ8
```

**⚠️ Cambiar esta contraseña después de primer login**

---

## PASO 1: Crear Cuenta en Render.com (2 min)

1. Ve a: https://render.com
2. Haz clic en **Sign up**
3. **Opción recomendada**: Sign up con GitHub (más fácil)
4. Autoriza Render para acceder a tu GitHub

---

## PASO 2: Crear Base de Datos PostgreSQL (2 min)

1. En el dashboard, haz clic en **New +** (arriba a la derecha)
2. Selecciona **PostgreSQL**
3. Rellena:
   - **Name**: `influence-crm-db`
   - **Database**: `influence_crm`
   - **User**: `influence_user`
   - **Password**: Render genera uno automáticamente (copiar)
   - **Region**: Selecciona tu región (ej: North Virginia para América)
   - **Plan**: Selecciona **Free**
4. Haz clic en **Create Database**
5. ⏳ Espera 2-3 minutos a que se cree

**Una vez listo**:
- Ir a la pestaña **Connections**
- Copiar la **Internal Database URL** (comienza con `postgres://`)
- Guardar en un notepad (la necesitarás en el PASO 3)

---

## PASO 3: Crear Servicio Web Backend (5 min)

1. Haz clic en **New +** → **Web Service**
2. En **GitHub**, busca y selecciona: `Rodrigoce22/subircrmprueb`
3. Rellena:
   - **Name**: `influence-crm-backend`
   - **Environment**: `Docker`
   - **Branch**: `master`
   - **Plan**: Selecciona **Free**
4. Haz clic en **Advanced** (abajo)
5. En **Docker Buildkit**, elige **Enabled**
6. Desplázate hacia abajo y haz clic en **Deploy**

**Ahora hay que configurar variables de entorno:**

7. Una vez que se cree el servicio, ve a la pestaña **Environment**
8. Haz clic en **Add Environment Variable** y añade EXACTAMENTE estos (en orden):

| Clave | Valor |
|-------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `JWT_SECRET` | `7f8d9e2c5b1a4f6h9k3l2m0n8q7r5s2t` |
| `ADMIN_EMAIL` | `admin@influence.crm` |
| `ADMIN_PASS` | `IuZ9#mK2@xL5$pQ8` |
| `FRONTEND_URL` | `https://rodrigoce22.github.io/subircrmprueb/` |
| `DATABASE_URL` | **Pega aquí la URL que copiaste en PASO 2** |

9. Haz clic en **Save Changes**
10. ⏳ Espera 5-10 minutos a que se compile y despliegue

**¿Cómo sé que terminó?**
- En la parte superior aparecerá: "Your service is live"
- La URL será algo como: `https://influence-crm-backend-xxxxx.onrender.com`
- 📌 **Copia esta URL** (la necesitarás para el frontend)

---

## PASO 4: Actualizar Frontend con la URL del Backend (3 min)

Una vez que tengas la URL del backend (ej: `https://influence-crm-backend-xxxxx.onrender.com`):

1. Abre PowerShell en tu máquina local
2. Navega a la carpeta del proyecto:
   ```powershell
   cd "c:\Users\Noxie\OneDrive\Desktop\crm-listo\influence-crm\frontend"
   ```

3. Reemplaza `xxxxx` en el comando y ejecuta:
   ```powershell
   $env:VITE_API_URL="https://influence-crm-backend-xxxxx.onrender.com/api"
   npm run build
   ```

4. Luego actualiza GitHub:
   ```powershell
   cd "c:\Users\Noxie\OneDrive\Desktop\crm-listo"
   git add .
   git commit -m "Update backend URL"
   git push origin master
   ```

5. ⏳ GitHub Actions automáticamente desplegará el frontend (2 min)

---

## PASO 5: Verificar que Funciona ✅

1. Ve a: https://rodrigoce22.github.io/subircrmprueb/
2. Ingresa:
   - Email: `admin@influence.crm`
   - Password: `IuZ9#mK2@xL5$pQ8`
3. Haz clic en **Entrar**

**Si ves el dashboard**, ¡está funcionando! 🎉

---

## NOTAS IMPORTANTES

⚠️ **Los servicios gratis en Render se hibernan después de 15 minutos sin uso**. 
- La primera petición tardará ~30 segundos en responder
- Después es normal

🔒 **Cambiar la contraseña del admin**:
- Una vez logueado, ve a **Settings** → **Change Password**
- Ingresa la contraseña actual: `IuZ9#mK2@xL5$pQ8`
- Establece una nueva más segura

💰 **Para producción (sin hibernación)**:
- Considera cambiar a plan pagado en Render (~$5-10/mes)
- O usar otro servicio como Railway.app o Heroku

---

## Troubleshooting

### ❌ "Error de conexión" en el login

1. Verifica que en Render el servicio esté **"live"** (status debe ser verde)
2. Espera 30 segundos (los servicios gratis inician lentamente)
3. Recarga la página

### ❌ "CORS error o error 500"

1. Ve a Render → tu servicio backend
2. Verifica que todas las variables de entorno estén correctas
3. Mira los **Logs** (pestaña) para ver el error exacto

### ❌ La BD no se conecta

1. Verifica que `DATABASE_URL` esté correctamente en las variables
2. Asegúrate de haber copiado la **Internal Database URL** (no la externa)

---

## ¿Necesitas ayuda?

Envía un mensaje con:
- El error que ves
- La URL de tu backend en Render (ej: `https://influence-crm-backend-xxxxx.onrender.com`)
- Una captura de los logs en Render
