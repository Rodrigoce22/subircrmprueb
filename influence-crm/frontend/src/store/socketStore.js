import { create } from 'zustand';
import { io } from 'socket.io-client';

let socket = null;

// ── Push notification helper ───────────────────────────────────────────────────
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
};

const showPushNotification = (title, body, icon, onClick) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification(title, {
    body,
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag:   'crm-wa-message',
    renotify: true,
    silent: false
  });
  if (onClick) n.onclick = () => { onClick(); n.close(); window.focus(); };
  setTimeout(() => n.close(), 8000);
};

export const useSocketStore = create((set, get) => ({
  connected: false,
  waStatus: { status: 'disconnected', qr: null, phone: null },
  newMessages: [],
  newLeads: [],
  notificationsEnabled: false,

  requestNotifications: async () => {
    const granted = await requestNotificationPermission();
    set({ notificationsEnabled: granted });
    return granted;
  },

  connect: () => {
    if (socket?.connected) return;
    socket = io('/', { transports: ['websocket'] });

    socket.on('connect',    () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));

    socket.on('wa:status', (status) => set({ waStatus: status }));

    socket.on('wa:new_message', (msg) => {
      set(state => ({ newMessages: [msg, ...state.newMessages].slice(0, 100) }));

      // Push notification for inbound messages
      if (msg.direction === 'inbound') {
        const contactName = msg.contact?.name || msg.from_jid?.replace('@s.whatsapp.net', '') || 'Nuevo mensaje';
        const body        = msg.body === '[Audio]' ? '🎙️ Mensaje de voz' : (msg.body || 'Mensaje recibido');
        showPushNotification(
          `💬 ${contactName}`,
          body,
          null,
          () => { window.location.hash = '#/whatsapp'; }
        );
      }
    });

    socket.on('wa:new_lead', (lead) => {
      set(state => ({ newLeads: [lead, ...state.newLeads].slice(0, 50) }));
      showPushNotification(
        '🎯 Nuevo Lead en Pipeline',
        `${lead.name} · ${lead.phone || ''}`,
        null,
        () => { window.location.hash = '#/pipeline'; }
      );
    });

    socket.on('wa:message_status', ({ wa_message_id, status }) => {
      set(state => ({
        newMessages: state.newMessages.map(m =>
          m.wa_message_id === wa_message_id ? { ...m, status } : m
        )
      }));
    });

    // Request notification permission on first socket connect
    requestNotificationPermission().then(granted => set({ notificationsEnabled: granted }));
  },

  disconnect: () => {
    socket?.disconnect();
    socket = null;
    set({ connected: false });
  },

  clearLeads:    () => set({ newLeads: [] }),
  clearMessages: () => set({ newMessages: [] }),
  getSocket:     () => socket
}));
