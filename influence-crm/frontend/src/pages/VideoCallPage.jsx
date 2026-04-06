import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Video, Phone, Users, Copy, ExternalLink,
  Mic, MicOff, VideoOff, MessageSquare, X, Plus, Link2
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Generate room ID ───────────────────────────────────────────────────────────
const genRoomId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'influence-';
  for (let i = 0; i < 10; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
};

// ── Jitsi Meet iframe ──────────────────────────────────────────────────────────
const JitsiRoom = ({ roomId, displayName, onLeave }) => {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: roomId,
      width: '100%',
      height: '100%',
      parentNode: containerRef.current,
      userInfo: { displayName },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
        toolbarButtons: [
          'camera', 'chat', 'closedcaptions', 'desktop',
          'filmstrip', 'fullscreen', 'hangup', 'help',
          'microphone', 'noisesuppression', 'participants-pane',
          'raisehand', 'recording', 'settings', 'shareaudio',
          'sharedvideo', 'shortcuts', 'stats', 'tileview',
          'toggle-camera', 'videoquality'
        ]
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_ALWAYS_VISIBLE: false,
        DEFAULT_BACKGROUND: '#0e0e11',
        DEFAULT_LOCAL_DISPLAY_NAME: displayName,
        MOBILE_APP_PROMO: false
      }
    };

    // Load Jitsi API script if needed
    const loadAndInit = () => {
      if (window.JitsiMeetExternalAPI) {
        apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
        apiRef.current.addEventListener('readyToClose', onLeave);
        apiRef.current.addEventListener('videoConferenceLeft', onLeave);
      }
    };

    if (window.JitsiMeetExternalAPI) {
      loadAndInit();
    } else {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.onload = loadAndInit;
      document.head.appendChild(script);
    }

    return () => {
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch {}
        apiRef.current = null;
      }
    };
  }, [roomId, displayName]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0e0e11] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#131317]/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4cd6ff] shadow-[0_0_8px_#4cd6ff] animate-pulse" />
          <span className="text-sm font-medium text-[#e5e2e1]">Videollamada activa</span>
          <span className="text-xs text-[#8b90a0]">· {roomId}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(`https://meet.jit.si/${roomId}`); toast.success('Enlace copiado'); }}
            className="flex items-center gap-1.5 text-xs text-[#c1c6d7] hover:text-[#e5e2e1] ghost-border px-3 py-1.5 rounded-lg transition-colors">
            <Copy size={12} /> Copiar enlace
          </button>
          <button onClick={onLeave}
            className="flex items-center gap-1.5 text-xs bg-[#93000a]/40 text-[#ffb4ab] hover:bg-[#93000a]/60 px-3 py-1.5 rounded-lg transition-colors">
            <Phone size={12} /> Salir
          </button>
        </div>
      </div>

      {/* Jitsi container */}
      <div ref={containerRef} className="flex-1" />
    </div>
  );
};

// ── Recent rooms (localStorage) ───────────────────────────────────────────────
const getRecentRooms = () => {
  try { return JSON.parse(localStorage.getItem('crm_recent_rooms') || '[]'); } catch { return []; }
};
const saveRecentRoom = (room) => {
  const rooms = getRecentRooms().filter(r => r.id !== room.id).slice(0, 4);
  localStorage.setItem('crm_recent_rooms', JSON.stringify([room, ...rooms]));
};

// ── Main ───────────────────────────────────────────────────────────────────────
export default function VideoCallPage() {
  const { user } = useAuthStore();
  const [activeRoom, setActiveRoom] = useState(null);
  const [customRoom, setCustomRoom] = useState('');
  const [recentRooms, setRecentRooms] = useState(getRecentRooms);

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', ''],
    queryFn: () => api.get('/contacts', { params: { limit: 20 } }).then(r => r.data)
  });
  const contacts = contactsData?.contacts || [];

  const startRoom = (roomId, title = '') => {
    const room = { id: roomId, title: title || roomId, createdAt: new Date().toISOString() };
    saveRecentRoom(room);
    setRecentRooms(getRecentRooms());
    setActiveRoom(roomId);
  };

  const inviteContact = (contact) => {
    const roomId = genRoomId();
    const link = `https://meet.jit.si/${roomId}`;
    const msg = `Hola ${contact.name.split(' ')[0]}, te invito a una videollamada: ${link}`;
    // Open WhatsApp page pre-filled — simple copy to clipboard approach
    navigator.clipboard.writeText(msg);
    toast.success(`Enlace copiado para ${contact.name} — pégalo en WhatsApp`);
    startRoom(roomId, `Llamada con ${contact.name}`);
  };

  if (activeRoom) {
    return (
      <JitsiRoom
        roomId={activeRoom}
        displayName={user?.name || 'Usuario'}
        onLeave={() => setActiveRoom(null)}
      />
    );
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Hero header */}
      <div>
        <h1 className="page-title">Video <span className="page-title-accent">Presence</span></h1>
        <p className="page-subtitle">Interfaz de comunicación de alta fidelidad para colaboración élite. Inicia salas con latencia cero.</p>
      </div>

      {/* Main cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start instant meeting */}
        <div className="card p-6 relative overflow-hidden group cursor-pointer" onClick={() => startRoom(genRoomId(), 'Instant Studio')}>
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none transition-opacity group-hover:opacity-10"
            style={{ background: 'radial-gradient(circle at bottom right, #aac7ff, transparent 65%)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#aac7ff]/15 text-[#aac7ff] tracking-wider">INTERNAL HUB</span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#aac7ff]/10 flex items-center justify-center mb-4">
              <Video size={24} className="text-[#aac7ff]" />
            </div>
            <h2 className="text-xl font-black text-[#e5e2e1] font-display mb-1">Initiate Instant Studio</h2>
            <p className="text-sm text-[#8b90a0] mb-5">Sesión de vídeo 4K encriptada. Transcripciones y resumen IA automáticos.</p>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); startRoom(genRoomId(), 'Instant Studio'); }}
                className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
                <Plus size={14} /> New Meeting
              </button>
              <button onClick={(e) => e.stopPropagation()}
                className="px-4 py-2.5 rounded-xl text-sm text-[#8b90a0] hover:text-[#c1c6d7] ghost-border transition-colors">
                Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Join by session */}
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ background: 'radial-gradient(circle at top left, #aac7ff, transparent 65%)' }} />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-[#aac7ff]/10 flex items-center justify-center mb-4">
              <Link2 size={24} className="text-[#aac7ff]" />
            </div>
            <h2 className="text-xl font-black text-[#e5e2e1] font-display mb-1">Join Session</h2>
            <p className="text-sm text-[#8b90a0] mb-5">Ingresa un código de reunión o enlace de invitación.</p>
            <div className="flex gap-2">
              <input
                value={customRoom}
                onChange={e => setCustomRoom(e.target.value)}
                placeholder="Meeting ID: XXX-XXXX-X"
                className="input-obs flex-1 px-3 py-2.5 text-sm"
                onKeyDown={e => e.key === 'Enter' && customRoom.trim() && startRoom(customRoom.trim().replace('https://meet.jit.si/', ''))}
              />
              <button
                onClick={() => customRoom.trim() && startRoom(customRoom.trim().replace('https://meet.jit.si/', ''))}
                disabled={!customRoom.trim()}
                className="btn-primary px-4 py-2.5 text-sm disabled:opacity-40">
                Conectar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Recent contexts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-[#414755] uppercase tracking-[0.1em]">Recent Contexts</h3>
          <span className="text-xs text-[#414755]">Contextos archivados y próximas sesiones</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent rooms */}
        <div className="card p-5">
          <h3 className="text-xs font-bold text-[#414755] uppercase tracking-[0.1em] mb-4">Salas recientes</h3>
          {recentRooms.length === 0 ? (
            <div className="text-center py-8">
              <Video size={24} className="text-[#2a2a2a] mx-auto mb-2" />
              <p className="text-[#414755] text-sm">Sin salas recientes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRooms.map(room => (
                <div key={room.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors ghost-border">
                  <div className="w-9 h-9 rounded-xl bg-[#aac7ff]/10 flex items-center justify-center flex-shrink-0">
                    <Video size={15} className="text-[#aac7ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#c1c6d7] truncate">{room.title || room.id}</p>
                    <p className="text-xs text-[#414755]">{format(new Date(room.createdAt), "dd MMM · HH:mm", { locale: es })}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startRoom(room.id, room.title)}
                      className="text-xs text-[#aac7ff] px-3 py-1.5 rounded-lg ghost-border hover:bg-[#aac7ff]/10 transition-colors">
                      Replay
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(`https://meet.jit.si/${room.id}`); toast.success('Copiado'); }}
                      className="text-[#414755] hover:text-[#6b6b7a] p-1.5 transition-colors">
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite a contact */}
        <div className="card p-5">
          <h3 className="text-xs font-bold text-[#414755] uppercase tracking-[0.1em] mb-3">Invitar contacto</h3>
          <p className="text-xs text-[#414755] mb-3">Crea una sala y copia el mensaje de invitación para enviarlo por WhatsApp.</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {contacts.slice(0, 15).map(contact => (
              <div key={contact.id} className="flex items-center gap-3 p-2.5 bg-[#2a2a2a]/40 rounded-xl hover:bg-[#2a2a2a] transition-colors">
                <div className="w-8 h-8 rounded-full btn-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {contact.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#e5e2e1] truncate">{contact.name}</p>
                  <p className="text-xs text-[#8b90a0]">{contact.phone || contact.email || '—'}</p>
                </div>
                <button onClick={() => inviteContact(contact)}
                  className="text-xs text-[#4cd6ff] ghost-border px-3 py-1.5 rounded-lg hover:bg-[#4cd6ff]/10 transition-colors whitespace-nowrap">
                  <Video size={11} className="inline mr-1" />
                  Invitar
                </button>
              </div>
            ))}
            {contacts.length === 0 && (
              <p className="text-center text-[#8b90a0] text-sm py-4">Sin contactos</p>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-[#201f1f] rounded-2xl p-5">
        <h3 className="text-xs font-semibold text-[#c1c6d7] uppercase tracking-wider mb-3">Sobre las videollamadas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#8b90a0]">
          <div className="flex items-start gap-2">
            <Video size={14} className="text-[#aac7ff] flex-shrink-0 mt-0.5" />
            <p>Videollamadas HD ilimitadas sin instalación — funciona desde el navegador.</p>
          </div>
          <div className="flex items-start gap-2">
            <Users size={14} className="text-[#4cd6ff] flex-shrink-0 mt-0.5" />
            <p>Hasta 100 participantes por sala. Comparte pantalla y chatea durante la llamada.</p>
          </div>
          <div className="flex items-start gap-2">
            <MessageSquare size={14} className="text-[#ffb77f] flex-shrink-0 mt-0.5" />
            <p>Las invitaciones se copian como mensaje listo para enviar por WhatsApp.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
