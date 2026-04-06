const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');

const authCtrl        = require('../controllers/authController');
const usersCtrl       = require('../controllers/usersController');
const contactsCtrl    = require('../controllers/contactsController');
const tasksCtrl       = require('../controllers/tasksController');
const projectsCtrl    = require('../controllers/projectsController');
const waCtrl          = require('../controllers/whatsappController');
const reportsCtrl     = require('../controllers/reportsController');
const dashboardCtrl   = require('../controllers/dashboardController');
const pipelineCtrl    = require('../controllers/pipelineController');
const eventsCtrl      = require('../controllers/eventsController');
const settingsCtrl    = require('../controllers/settingsController');
const autoReplyCtrl   = require('../controllers/autoReplyController');
const webhooksCtrl    = require('../controllers/webhooksController');

// ── Auth ───────────────────────────────────────────────────────────────────────
router.post('/auth/login',    authCtrl.login);
router.get( '/auth/me',  auth, authCtrl.me);
router.put( '/auth/profile',  auth, authCtrl.updateProfile);
router.put( '/auth/password', auth, authCtrl.changePassword);

// ── Dashboard ──────────────────────────────────────────────────────────────────
router.get('/dashboard/stats', auth, dashboardCtrl.stats);

// ── Users ──────────────────────────────────────────────────────────────────────
router.get(   '/users',     auth, adminOnly, usersCtrl.list);
router.post(  '/users',     auth, adminOnly, usersCtrl.create);
router.put(   '/users/:id', auth,            usersCtrl.update);
router.delete('/users/:id', auth, adminOnly, usersCtrl.remove);

// ── Contacts ───────────────────────────────────────────────────────────────────
router.get(   '/contacts',     auth, contactsCtrl.list);
router.get(   '/contacts/:id', auth, contactsCtrl.getOne);
router.post(  '/contacts',     auth, contactsCtrl.create);
router.put(   '/contacts/:id', auth, contactsCtrl.update);
router.delete('/contacts/:id', auth, contactsCtrl.remove);

// ── Projects ───────────────────────────────────────────────────────────────────
router.get(   '/projects',     auth, projectsCtrl.list);
router.post(  '/projects',     auth, projectsCtrl.create);
router.put(   '/projects/:id', auth, projectsCtrl.update);
router.delete('/projects/:id', auth, projectsCtrl.remove);

// ── Tasks ──────────────────────────────────────────────────────────────────────
router.get(   '/tasks',     auth, tasksCtrl.list);
router.post(  '/tasks',     auth, tasksCtrl.create);
router.put(   '/tasks/:id', auth, tasksCtrl.update);
router.delete('/tasks/:id', auth, tasksCtrl.remove);

// ── Calendar Events ────────────────────────────────────────────────────────────
router.get(   '/events',     auth, eventsCtrl.list);
router.post(  '/events',     auth, eventsCtrl.create);
router.put(   '/events/:id', auth, eventsCtrl.update);
router.delete('/events/:id', auth, eventsCtrl.remove);

// ── Settings / Integrations ────────────────────────────────────────────────────
router.get(   '/settings',                  auth, adminOnly, settingsCtrl.list);
router.post(  '/settings',                  auth, adminOnly, settingsCtrl.upsert);
router.delete('/settings/:key',             auth, adminOnly, settingsCtrl.disconnect);
router.get(   '/settings/service/:service', auth,            settingsCtrl.getByService);

// ── Auto-Reply Rules ───────────────────────────────────────────────────────────
router.get(   '/auto-replies',     auth, adminOnly, autoReplyCtrl.list);
router.post(  '/auto-replies',     auth, adminOnly, autoReplyCtrl.create);
router.put(   '/auto-replies/:id', auth, adminOnly, autoReplyCtrl.update);
router.delete('/auto-replies/:id', auth, adminOnly, autoReplyCtrl.remove);

// ── WhatsApp ───────────────────────────────────────────────────────────────────
router.get( '/whatsapp/status',       auth,            waCtrl.status);
router.post('/whatsapp/connect',      auth, adminOnly, waCtrl.connect);
router.post('/whatsapp/disconnect',   auth, adminOnly, waCtrl.disconnect);
router.post('/whatsapp/send',         auth,            waCtrl.sendMessage);
router.post('/whatsapp/send-audio',   auth,            waCtrl.audioUpload, waCtrl.sendAudio);
router.post(  '/whatsapp/broadcast',           auth,            waCtrl.sendBroadcast);
router.get(   '/whatsapp/scheduled',           auth,            waCtrl.getScheduled);
router.delete('/whatsapp/scheduled/:id',       auth, adminOnly, waCtrl.cancelScheduled);
router.get( '/whatsapp/chats',        auth,            waCtrl.getChats);
router.get( '/whatsapp/chats/:jid',   auth,            waCtrl.getChatMessages);

// ── Pipeline ───────────────────────────────────────────────────────────────────
router.get('/pipeline',             auth, pipelineCtrl.getBoard);
router.put('/pipeline/:id/stage',   auth, pipelineCtrl.moveStage);
router.put('/pipeline/:id/assign',  auth, pipelineCtrl.assign);

// ── Reports ────────────────────────────────────────────────────────────────────
router.get('/reports/tasks',              auth, reportsCtrl.generateTasksReport);
router.get('/reports/contacts',           auth, reportsCtrl.generateContactsReport);
router.get('/reports/messages',           auth, reportsCtrl.generateMessagesReport);
router.get('/reports/download/:filename', auth, reportsCtrl.download);

// ── Webhooks (incoming - no auth for external tools) ──────────────────────────
router.post('/webhooks/leads',       webhooksCtrl.incomingLead);
router.post('/webhooks/n8n-test',    auth, adminOnly, webhooksCtrl.test);

module.exports = router;
