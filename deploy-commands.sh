# Comandos para ejecutar en el VPS (uno por uno)

# PASO 1: Instalar Docker
curl -fsSL https://get.docker.com | sh

# PASO 2: Ir a /opt y clonar repositorio
cd /opt
git clone https://github.com/Rodrigoce22/subircrmprueb.git influence-crm
cd influence-crm

# PASO 3: Generar JWT_SECRET (copia el resultado)
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# PASO 4: Crear .env
cp .env.example .env

# PASO 5: Editar .env (usa nano .env)
# Pega estas configuraciones:
PORT=3001
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_NAME=influence_crm
DB_USER=postgres
DB_PASS=nR7+Zp3@qL9(du0#Kx5A
JWT_SECRET=[PEGA_AQUI_EL_RESULTADO_DEL_PASO_3]
ADMIN_EMAIL=admin@echoinfluenceagency.com
ADMIN_PASS=V4m?cT8&hN2-Je6/Pa1,
FRONTEND_URL=https://dash-crmfn.gt8vun.easypanel.host

# PASO 6: Levantar contenedores
docker compose --env-file .env up -d --build

# PASO 7: Verificar contenedores
docker compose ps

# PASO 8: Ver logs del backend
docker compose logs backend --tail=20