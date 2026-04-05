const { Op } = require('sequelize');

let started = false;

const start = () => {
  if (started) return;
  started = true;

  // Check every minute for pending scheduled messages
  setInterval(async () => {
    try {
      const { ScheduledMessage } = require('../models');
      const wa = require('./whatsapp');

      const now = new Date();
      const pending = await ScheduledMessage.findAll({
        where: {
          status: 'pending',
          scheduled_at: { [Op.lte]: now }
        }
      });

      for (const msg of pending) {
        console.log('[Scheduler] Enviando mensaje programado:', msg.id, 'a', msg.jids?.length, 'contactos');
        try {
          const results = await wa.sendBroadcast(msg.jids, msg.text);
          await msg.update({ status: 'sent', result: results });
          console.log('[Scheduler] Mensaje enviado:', msg.id);
        } catch (e) {
          console.error('[Scheduler] Error enviando:', msg.id, e.message);
          await msg.update({ status: 'failed', result: { error: e.message } });
        }
      }
    } catch (e) {
      console.error('[Scheduler] Error en tick:', e.message);
    }
  }, 60 * 1000); // Every minute

  console.log('[Scheduler] Iniciado - revisando mensajes programados cada minuto');
};

module.exports = { start };
