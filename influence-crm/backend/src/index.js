require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const { sequelize } = require('./models');
const { User } = require('./models');
const routes = require('./routes');
const waService   = require('./services/whatsapp');
const scheduler   = require('./services/scheduler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/reports', express.static(path.join(__dirname, '../reports')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas API
app.use('/api', routes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Influence CRM' }));

// Socket.io
io.on('connection', (socket) => {
  console.log('[Socket] Cliente conectado:', socket.id);
  // Enviar estado actual de WA al conectarse
  socket.emit('wa:status', waService.getStatus());

  socket.on('disconnect', () => {
    console.log('[Socket] Cliente desconectado:', socket.id);
  });
});

waService.setSocketIO(io);

// Init DB y servidor
const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('[DB] Conectado a PostgreSQL');

    await sequelize.sync({ alter: { drop: false } });
    console.log('[DB] Modelos sincronizados');

    // Crear admin por defecto si no existe
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      await User.create({
        name: 'Administrador',
        email: process.env.ADMIN_EMAIL || 'admin@influence.com',
        password: process.env.ADMIN_PASS || 'influence2024',
        role: 'admin'
      });
      console.log('[Init] Admin creado: admin@influence.com / influence2024');
    }

    // Auto-conectar WhatsApp si hay sesion guardada
    const sessionDir = path.join(__dirname, '../.wa_sessions');
    const fs = require('fs');
    if (fs.existsSync(sessionDir) && fs.readdirSync(sessionDir).length > 0) {
      console.log('[WA] Sesion encontrada, reconectando...');
      waService.connect();
    }

    scheduler.start();

    server.listen(PORT, () => {
      console.log(`[Server] Influence CRM corriendo en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('[Error] Inicio fallido:', err);
    process.exit(1);
  }
};

start();
