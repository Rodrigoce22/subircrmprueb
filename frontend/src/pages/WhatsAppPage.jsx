import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send, QrCode, WifiOff, RefreshCw, MessageSquare,
  Check, CheckCheck, Search, Mic, MicOff, Square, X,
  Radio, Bot, Plus, Trash2, Edit2, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../services/api';
import { useSocketStore } from '../store/socketStore';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import clsx from 'clsx';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Ayer';
  return format(d, 'dd/MM/yy', { locale: es });
};

const StatusIcon = ({ status }) => {
  if (status === 'read')      return <CheckCheck size={12} className="text-[#4cd6ff]" />;
  if (status === 'delivered') return <CheckCheck size={12} className="text-[#8b90a0]" />;
  return <Check size={12} className="text-[#8b90a0]" />;
};

// ── In-app notification banner ─────────────────────────────────────────────────
const InAppNotification = ({ message, onClose, onJump }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, []);

  const name = message?.contact?.name || message?.from_jid?.replace('@s.whatsapp.net', '') || 'Mensaje nuevo';
  const body = message?.body === '[Audio]' ? '🎙️ Mensaje de voz' : (message?.body || '');

  return (
    <div className="fixed top-4 right-4 z-[100] flex items-start gap-3 bg-[#2a2a2a] ghost-border rounded-2xl p-4 shadow-ambient max-w-sm animate-in slide-in-from-top-2 duration-200">
      <div className="w-9 h-9 rounded-full btn-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {name[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0" onClick={onJump} role="button">
        <p className="text-sm font-bold text-[#e5e2e1]">{name}</p>
        <p className="text-xs text-[#c1c6d7] truncate mt-0.5">{body}</p>
      </div>
      <button onClick={onClose} className="text-[#8b90a0] hover:text-[#e5e2e1] transition flex-shrink-0 p-0.5">
        <X size={14} />
      </button>
    </div>
  );
};

// ── QR Panel ───────────────────────────────────────────────────────────────────
const QRPanel = ({ waStatus, onConnect }) => (
  <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
    {waStatus.status === 'qr' && waStatus.qr ? (
      <>
        <div className="text-center mb-2">
          <h2 className="text-xl font-bold text-[#e5e2e1] font-display mb-1">Escanea el código QR</h2>
          <p className="text-[#c1c6d7] text-sm">Abre WhatsApp Business → Menú → Dispositivos vinculados</p>
        </div>
        <div className="p-3 bg-white rounded-2xl shadow-glow-primary">
          <img src={waStatus.qr} alt="QR WhatsApp" className="w-64 h-64" />
        </div>
        <div className="flex items-center gap-2 text-[#ffb77f] text-sm animate-pulse">
          <RefreshCw size={14} className="animate-spin" /> Esperando escaneo...
        </div>
      </>
    ) : waStatus.status === 'connecting' ? (
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[#aac7ff] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#c1c6d7]">Generando QR...</p>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#2a2a2a] flex items-center justify-center">
          <MessageSquare size={36} className="text-[#414755]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#e5e2e1] font-display mb-2">WhatsApp no conectado</h2>
          <p className="text-[#c1c6d7] text-sm mb-6 max-w-xs">
            Conecta tu WhatsApp Business para ver y responder mensajes en tiempo real
          </p>
        </div>
        <button onClick={onConnect}
          className="flex items-center gap-2 bg-[#4cd6ff]/15 hover:bg-[#4cd6ff]/25 text-[#4cd6ff] font-semibold px-6 py-3 rounded-xl transition ghost-border">
          <QrCode size={18} /> Conectar WhatsApp
        </button>
      </div>
    )}
  </div>
);

// ── Chat item ──────────────────────────────────────────────────────────────────
const ChatItem = ({ chat, selected, onClick }) => {
  const name    = chat.contact?.name || chat.jid?.replace('@s.whatsapp.net', '') || 'Desconocido';
  const initial = name[0]?.toUpperCase() || '?';
  return (
    <button onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-3 transition-all text-left',
        selected ? 'bg-[#aac7ff]/10 border-l-2 border-l-[#aac7ff]' : 'hover:bg-[#2a2a2a]/50'
      )}>
      <div className="w-10 h-10 rounded-full btn-primary flex items-center justify-center text-white font-bold text-base flex-shrink-0 relative">
        {initial}
        {chat.unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#4cd6ff] text-black text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {chat.unread > 9 ? '9+' : chat.unread}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-sm font-semibold text-[#e5e2e1] truncate">{name}</p>
          <span className="text-xs text-[#8b90a0] flex-shrink-0 ml-2">{formatTime(chat.lastAt)}</span>
        </div>
        <p className="text-xs text-[#8b90a0] truncate">{chat.lastMessage || 'Sin mensajes'}</p>
      </div>
    </button>
  );
};

// ── Message bubble ─────────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isOut = msg.direction === 'outbound';
  const isAudio = msg.type === 'audio';

  return (
    <div className={clsx('flex mb-2', isOut ? 'justify-end' : 'justify-start')}>
      <div className={clsx(
        'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
        isOut ? 'text-white rounded-br-sm' : 'bg-[#2a2a2a] text-[#e5e2e1] rounded-bl-sm ghost-border'
      )}
        style={isOut ? { background: 'linear-gradient(135deg, #aac7ff, #3e90ff)' } : undefined}>
        {isAudio ? (
          <div className="flex items-center gap-2 py-1">
            <Mic size={14} className={isOut ? 'text-white/80' : 'text-[#aac7ff]'} />
            <div className="flex items-end gap-0.5 h-4">
              {[3,5,7,5,8,4,6,5,7,4,3,6,8,5,4].map((h, i) => (
                <div key={i} className={clsx('w-0.5 rounded-full', isOut ? 'bg-white/60' : 'bg-[#aac7ff]/60')}
                  style={{ height: `${h * 2}px` }} />
              ))}
            </div>
            <span className={clsx('text-xs', isOut ? 'text-white/60' : 'text-[#8b90a0]')}>Audio</span>
          </div>
        ) : (
          <>
            {msg.type !== 'text' && msg.type && (
              <p className="text-xs opacity-60 mb-1 uppercase tracking-wider">[{msg.type}]</p>
            )}
            <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.body || '...'}</p>
          </>
        )}
        <div className={clsx('flex items-center justify-end gap-1 mt-1', isOut ? 'text-white/60' : 'text-[#8b90a0]')}>
          <span className="text-xs">{format(new Date(msg.createdAt || Date.now()), 'HH:mm')}</span>
          {isOut && <StatusIcon status={msg.status} />}
        </div>
      </div>
    </div>
  );
};

const DateDivider = ({ date }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-[#2a2a2a]" />
    <span className="text-xs text-[#8b90a0] px-2">
      {isToday(new Date(date)) ? 'Hoy' : isYesterday(new Date(date)) ? 'Ayer' : format(new Date(date), 'dd MMM yyyy', { locale: es })}
    </span>
    <div className="flex-1 h-px bg-[#2a2a2a]" />
  </div>
);

// ── Audio recorder hook ────────────────────────────────────────────────────────
const useAudioRecorder = () => {
  const [recording, setRecording]   = useState(false);
  const [audioBlob, setAudioBlob]   = useState(null);
  const [duration, setDuration]     = useState(0);
  const mediaRef   = useRef(null);
  const chunksRef  = useRef([]);
  const timerRef   = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      toast.error('No se pudo acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRef.current?.state === 'recording') mediaRef.current.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.ondataavailable = null;
      mediaRef.current.onstop = null;
      mediaRef.current.stop();
      mediaRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    clearInterval(timerRef.current);
    chunksRef.current = [];
    setRecording(false);
    setAudioBlob(null);
    setDuration(0);
  };

  const resetAudio = () => setAudioBlob(null);

  return { recording, audioBlob, duration, startRecording, stopRecording, cancelRecording, resetAudio };
};

// ── Broadcast Modal ────────────────────────────────────────────────────────────
const BroadcastModal = ({ chats, onClose }) => {
  const [text, setText] = useState('');
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState('');

  const toggleContact = (jid) =>
    setSelected(s => s.includes(jid) ? s.filter(j => j !== jid) : [...s, jid]);

  const handleSend = async () => {
    if (!text.trim()) { setError('Escribe un mensaje'); return; }
    if (!selected.length) { setError('Selecciona al menos un contacto'); return; }
    if (scheduleMode && !scheduledAt) { setError('Elige la fecha y hora de envío'); return; }
    setError('');
    setSending(true);
    try {
      const body = { jids: selected, text: text.trim() };
      if (scheduleMode && scheduledAt) body.scheduled_at = new Date(scheduledAt).toISOString();

      const { data } = await api.post('/whatsapp/broadcast', body);

      if (data.scheduled) {
        toast.success(`Programado para enviar a ${selected.length} contacto${selected.length !== 1 ? 's' : ''}`);
        onClose();
        return;
      }

      setResults(data.results || []);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error al enviar';
      setError(msg);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  // Minimum datetime = now + 2 min
  const minDatetime = new Date(Date.now() + 2 * 60000).toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#201f1f] ghost-border rounded-2xl w-full max-w-lg shadow-ambient flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-base font-bold text-[#e5e2e1] font-display">Mensaje masivo</h2>
            <p className="text-xs text-[#8b90a0] mt-0.5">Envía a múltiples contactos a la vez</p>
          </div>
          <button onClick={onClose} className="text-[#8b90a0] hover:text-[#e5e2e1] transition"><X size={18} /></button>
        </div>

        {results ? (
          <div className="p-5 space-y-2 overflow-y-auto flex-1">
            <p className="text-sm font-semibold text-[#e5e2e1] mb-3">
              Resultado: {results.filter(r => r.ok).length}/{results.length} enviados
            </p>
            {results.map((r, i) => (
              <div key={i} className={clsx('flex items-center gap-2 text-sm px-3 py-2 rounded-xl',
                r.ok ? 'bg-[#4cd6ff]/10 text-[#4cd6ff]' : 'bg-[#ffb4ab]/10 text-[#ffb4ab]')}>
                {r.ok ? <Check size={13} /> : <X size={13} />}
                <span className="truncate">{r.jid?.replace('@s.whatsapp.net', '')} — {r.ok ? 'Enviado' : (r.error || 'Error')}</span>
              </div>
            ))}
            <button onClick={onClose} className="btn-primary w-full py-2.5 text-sm mt-2">Cerrar</button>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-3 border-b border-white/5">
              <textarea value={text} onChange={e => { setText(e.target.value); setError(''); }} rows={3}
                placeholder="Escribe el mensaje para todos los contactos seleccionados..."
                className="input-obs w-full px-4 py-2.5 text-sm resize-none" />

              {/* Schedule toggle */}
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setScheduleMode(s => !s)}
                  className={clsx('flex items-center gap-2 text-sm transition-colors',
                    scheduleMode ? 'text-[#aac7ff]' : 'text-[#8b90a0] hover:text-[#c1c6d7]')}>
                  {scheduleMode ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  Programar envío
                </button>
              </div>

              {scheduleMode && (
                <div>
                  <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Fecha y hora de envío</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    min={minDatetime}
                    onChange={e => { setScheduledAt(e.target.value); setError(''); }}
                    className="input-obs w-full px-4 py-2.5 text-sm"
                  />
                </div>
              )}

              {error && <p className="text-xs text-[#ffb4ab] bg-[#93000a]/20 px-3 py-2 rounded-xl">{error}</p>}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
              <div className="flex items-center justify-between px-2 mb-2">
                <p className="text-xs font-medium text-[#c1c6d7] uppercase tracking-wider">
                  Contactos ({selected.length} seleccionados)
                </p>
                <button onClick={() => setSelected(selected.length === chats.length ? [] : chats.map(c => c.jid))}
                  className="text-xs text-[#aac7ff] hover:underline">
                  {selected.length === chats.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
              </div>

              {chats.length === 0 && (
                <p className="text-center text-[#8b90a0] text-sm py-4">Sin conversaciones disponibles</p>
              )}

              {chats.map(chat => {
                const name = chat.contact?.name || chat.jid?.replace('@s.whatsapp.net', '') || 'Desconocido';
                const checked = selected.includes(chat.jid);
                return (
                  <button key={chat.jid} onClick={() => { toggleContact(chat.jid); setError(''); }}
                    className={clsx('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                      checked ? 'bg-[#aac7ff]/15' : 'hover:bg-[#2a2a2a]/60')}>
                    <div className={clsx(
                      'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors',
                      checked ? 'bg-[#aac7ff]' : 'ghost-border bg-transparent'
                    )}>
                      {checked && <Check size={10} className="text-white" />}
                    </div>
                    <div className="w-8 h-8 rounded-full btn-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#e5e2e1] truncate">{name}</p>
                      {chat.contact?.phone && <p className="text-xs text-[#8b90a0]">{chat.contact.phone}</p>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-white/5">
              <button onClick={handleSend} disabled={sending}
                className="btn-primary w-full py-2.5 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {sending
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
                  : scheduleMode
                    ? <><Plus size={14} /> Programar para {selected.length} contacto{selected.length !== 1 ? 's' : ''}</>
                    : <><Radio size={14} /> Enviar ahora a {selected.length} contacto{selected.length !== 1 ? 's' : ''}</>
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Auto-Reply Rules Panel ─────────────────────────────────────────────────────
const AutoReplyPanel = ({ onClose }) => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', trigger_type: 'keyword', keyword: '', response: '', use_ai: false, ai_prompt: '', active: true });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['auto_replies'],
    queryFn: () => api.get('/auto-replies').then(r => r.data)
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id ? api.put(`/auto-replies/${data.id}`, data) : api.post('/auto-replies', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['auto_replies'] }); setShowForm(false); setEditing(null); toast.success('Regla guardada'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/auto-replies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auto_replies'] })
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => api.put(`/auto-replies/${id}`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auto_replies'] })
  });

  const openEdit = (rule) => {
    setForm({ ...rule });
    setEditing(rule.id);
    setShowForm(true);
  };

  const openNew = () => {
    setForm({ name: '', trigger_type: 'keyword', keyword: '', response: '', use_ai: false, ai_prompt: '', active: true });
    setEditing(null);
    setShowForm(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#201f1f] ghost-border rounded-2xl w-full max-w-lg shadow-ambient flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-base font-bold text-[#e5e2e1] font-display">Respuestas automáticas</h2>
            <p className="text-xs text-[#8b90a0] mt-0.5">Responde automáticamente con reglas o IA</p>
          </div>
          <button onClick={onClose} className="text-[#8b90a0] hover:text-[#e5e2e1] transition"><X size={18} /></button>
        </div>

        {showForm ? (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Nombre de la regla</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input-obs w-full px-4 py-2.5 text-sm" placeholder="Ej: Bienvenida" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Disparador</label>
              <select value={form.trigger_type} onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value }))}
                className="input-obs w-full px-3 py-2.5 text-sm">
                <option value="first_message">Primer mensaje del contacto</option>
                <option value="keyword">Palabra clave</option>
                <option value="always">Siempre</option>
              </select>
            </div>
            {form.trigger_type === 'keyword' && (
              <div>
                <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Palabra clave</label>
                <input value={form.keyword || ''} onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))}
                  className="input-obs w-full px-4 py-2.5 text-sm" placeholder="hola, precio, info..." />
              </div>
            )}

            <div className="flex items-center gap-3 py-2">
              <button type="button" onClick={() => setForm(f => ({ ...f, use_ai: !f.use_ai }))}
                className={clsx('text-sm flex items-center gap-2', form.use_ai ? 'text-[#4cd6ff]' : 'text-[#8b90a0]')}>
                {form.use_ai ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                Responder con IA
              </button>
            </div>

            {form.use_ai ? (
              <div>
                <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Prompt del sistema para la IA</label>
                <textarea value={form.ai_prompt || ''} onChange={e => setForm(f => ({ ...f, ai_prompt: e.target.value }))}
                  rows={3} className="input-obs w-full px-4 py-2.5 text-sm resize-none"
                  placeholder="Eres un asistente de ventas de [empresa]. Responde amablemente sobre nuestros servicios..." />
                <p className="text-xs text-[#8b90a0] mt-1">Requiere API Key de OpenAI/OpenRouter configurada en Ajustes</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Respuesta fija</label>
                <textarea value={form.response || ''} onChange={e => setForm(f => ({ ...f, response: e.target.value }))}
                  rows={3} className="input-obs w-full px-4 py-2.5 text-sm resize-none"
                  placeholder="Hola! Gracias por contactarnos. Te responderemos a la brevedad." />
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl ghost-border text-[#c1c6d7] text-sm transition-colors hover:text-[#e5e2e1]">
                Cancelar
              </button>
              <button onClick={() => saveMutation.mutate({ ...form, id: editing })}
                className="btn-primary flex-1 py-2.5 text-sm">
                {editing ? 'Guardar' : 'Crear regla'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#aac7ff] border-t-transparent rounded-full animate-spin" /></div>}
              {!isLoading && rules.length === 0 && (
                <div className="text-center py-8 text-[#414755] text-sm">
                  <Bot size={28} className="mx-auto mb-2 text-[#414755]" />
                  Sin reglas configuradas
                </div>
              )}
              {rules.map(rule => (
                <div key={rule.id} className={clsx('flex items-center gap-3 p-3.5 rounded-xl ghost-border transition-colors',
                  rule.active ? 'bg-[#2a2a2a]/40' : 'opacity-50')}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#e5e2e1]">{rule.name}</p>
                      {rule.use_ai && <span className="text-xs bg-[#4cd6ff]/10 text-[#4cd6ff] px-1.5 py-0.5 rounded">IA</span>}
                    </div>
                    <p className="text-xs text-[#8b90a0] mt-0.5">
                      {rule.trigger_type === 'keyword' ? `Keyword: "${rule.keyword}"` :
                       rule.trigger_type === 'first_message' ? 'Primer mensaje' : 'Siempre'}
                      {rule.match_count > 0 && ` · ${rule.match_count} activaciones`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleMutation.mutate({ id: rule.id, active: !rule.active })}
                      className={clsx('p-1.5 rounded-lg transition-colors',
                        rule.active ? 'text-[#4cd6ff] hover:bg-[#4cd6ff]/10' : 'text-[#8b90a0] hover:bg-white/5')}>
                      {rule.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => openEdit(rule)} className="p-1.5 text-[#8b90a0] hover:text-[#aac7ff] rounded-lg transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(rule.id)} className="p-1.5 text-[#8b90a0] hover:text-[#ffb4ab] rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/5">
              <button onClick={openNew} className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
                <Plus size={14} /> Nueva regla
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function WhatsAppPage() {
  const { waStatus, newMessages } = useSocketStore();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [selectedJid, setSelectedJid]     = useState(null);
  const [text, setText]                   = useState('');
  const [search, setSearch]               = useState('');
  const [notification, setNotification]   = useState(null);
  const [showSidebar, setShowSidebar]     = useState(true);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showAutoReply, setShowAutoReply] = useState(false);
  const messagesEnd = useRef(null);
  const inputRef    = useRef(null);

  const { recording, audioBlob, duration, startRecording, stopRecording, cancelRecording, resetAudio } = useAudioRecorder();

  const { data: chats = [], refetch: refetchChats } = useQuery({
    queryKey: ['wa_chats'],
    queryFn: () => api.get('/whatsapp/chats').then(r => r.data),
    refetchInterval: 10000,
    enabled: waStatus.status === 'connected'
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['wa_messages', selectedJid],
    queryFn: () => api.get(`/whatsapp/chats/${encodeURIComponent(selectedJid)}`).then(r => r.data),
    enabled: !!selectedJid,
    refetchInterval: false
  });

  // New message → show in-app banner if chat not selected
  useEffect(() => {
    if (!newMessages.length) return;
    const latest = newMessages[0];
    if (latest.direction === 'inbound') {
      const jid = latest.from_jid;
      if (jid !== selectedJid) setNotification(latest);
    }
    refetchChats();
    const latestJid = latest.from_jid || latest.to_jid;
    if (selectedJid && latestJid === selectedJid) refetchMessages();
  }, [newMessages]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (selectedJid) inputRef.current?.focus(); }, [selectedJid]);

  const connectMutation    = useMutation({ mutationFn: () => api.post('/whatsapp/connect'),    onSuccess: () => toast.success('Generando QR...') });
  const disconnectMutation = useMutation({ mutationFn: () => api.post('/whatsapp/disconnect'), onSuccess: () => qc.invalidateQueries({ queryKey: ['wa_chats'] }) });


  const sendMutation = useMutation({
    mutationFn: ({ jid, text }) => api.post('/whatsapp/send', { jid, text }),
    onSuccess: () => { setText(''); setTimeout(() => refetchMessages(), 300); },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al enviar')
  });

  const sendAudioMutation = useMutation({
    mutationFn: ({ jid, blob }) => {
      const fd = new FormData();
      fd.append('audio', blob, 'audio.webm');
      fd.append('jid', jid);
      return api.post('/whatsapp/send-audio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { resetAudio(); setTimeout(() => refetchMessages(), 300); toast.success('Audio enviado'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Error al enviar audio')
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!selectedJid || waStatus.status !== 'connected') return;
    if (audioBlob) { sendAudioMutation.mutate({ jid: selectedJid, blob: audioBlob }); return; }
    if (!text.trim()) return;
    sendMutation.mutate({ jid: selectedJid, text: text.trim() });
  };

  const filteredChats = chats.filter(c => {
    if (!search) return true;
    const name = c.contact?.name || c.jid || '';
    return name.toLowerCase().includes(search.toLowerCase()) || (c.contact?.phone || '').includes(search);
  });

  const selectedName = chats.find(c => c.jid === selectedJid)?.contact?.name
    || selectedJid?.replace('@s.whatsapp.net', '') || '';

  const groupedMessages = messages.reduce((acc, msg) => {
    const day = format(new Date(msg.createdAt || Date.now()), 'yyyy-MM-dd');
    if (!acc.length || acc[acc.length - 1].day !== day) acc.push({ day, messages: [msg] });
    else acc[acc.length - 1].messages.push(msg);
    return acc;
  }, []);

  const isConnected = waStatus.status === 'connected';
  const fmtDur = `${Math.floor(duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}`;

  return (
    <>
      {/* In-app notification */}
      {notification && (
        <InAppNotification
          message={notification}
          onClose={() => setNotification(null)}
          onJump={() => {
            setSelectedJid(notification.from_jid);
            setNotification(null);
          }}
        />
      )}

      {/* Broadcast modal */}
      {showBroadcast && (
        <BroadcastModal
          chats={chats}
          onClose={() => setShowBroadcast(false)}
        />
      )}

      {/* Auto-reply panel */}
      {showAutoReply && (
        <AutoReplyPanel onClose={() => setShowAutoReply(false)} />
      )}

      <div className="flex h-full" style={{ height: 'calc(100vh - 112px)' }}>
        <div className="flex w-full rounded-2xl overflow-hidden ghost-border">

          {/* ── Chat list sidebar ─────────────────────────────────────── */}
          <div className={clsx(
            'flex-shrink-0 flex flex-col bg-[#131317] transition-all duration-200',
            'w-72',
            selectedJid ? 'hidden sm:flex' : 'flex w-full sm:w-72'
          )}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-[#e5e2e1] font-display text-base">WhatsApp</h2>
                <div className="flex items-center gap-1.5">
                  {isConnected && (
                    <>
                      <button onClick={() => setShowBroadcast(true)} title="Mensaje masivo"
                        className="p-1.5 rounded-lg text-[#8b90a0] hover:text-[#ffb77f] hover:bg-[#ffb77f]/10 transition">
                        <Radio size={14} />
                      </button>
                      {user?.role === 'admin' && (
                        <button onClick={() => setShowAutoReply(true)} title="Respuestas automáticas"
                          className="p-1.5 rounded-lg text-[#8b90a0] hover:text-[#4cd6ff] hover:bg-[#4cd6ff]/10 transition">
                          <Bot size={14} />
                        </button>
                      )}
                      <div className="w-2 h-2 rounded-full bg-[#4cd6ff] shadow-[0_0_8px_#4cd6ff]" />
                      {user?.role === 'admin' && (
                        <button onClick={() => disconnectMutation.mutate()}
                          className="text-[#8b90a0] hover:text-[#ffb4ab] transition p-1" title="Desconectar">
                          <WifiOff size={13} />
                        </button>
                      )}
                    </>
                  )}
                  {!isConnected && (
                    <button onClick={() => connectMutation.mutate()}
                      disabled={connectMutation.isPending || ['connecting', 'qr'].includes(waStatus.status)}
                      className="flex items-center gap-1 bg-[#4cd6ff]/15 hover:bg-[#4cd6ff]/25 text-[#4cd6ff] text-xs font-semibold px-3 py-1.5 rounded-lg transition ghost-border disabled:opacity-60">
                      <QrCode size={12} />
                      {['qr', 'connecting'].includes(waStatus.status) ? 'Conectando...' : 'Conectar'}
                    </button>
                  )}
                </div>
              </div>

              {isConnected && (
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0]" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar..." className="input-obs w-full pl-8 pr-3 py-2 text-xs" />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {!isConnected && !['qr', 'connecting'].includes(waStatus.status) && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageSquare size={28} className="text-[#414755] mb-2" />
                  <p className="text-[#8b90a0] text-sm">Conecta WhatsApp para ver conversaciones</p>
                </div>
              )}
              {['qr', 'connecting'].includes(waStatus.status) && (
                <div className="p-4 text-center text-[#c1c6d7] text-sm">Escanea el QR para ver mensajes</div>
              )}
              {isConnected && filteredChats.length === 0 && (
                <div className="flex items-center justify-center h-full p-6">
                  <p className="text-[#8b90a0] text-sm">{search ? 'Sin resultados' : 'Sin conversaciones aún'}</p>
                </div>
              )}
              {filteredChats.map(chat => (
                <ChatItem key={chat.jid} chat={chat} selected={selectedJid === chat.jid}
                  onClick={() => { setSelectedJid(chat.jid); }} />
              ))}
            </div>
          </div>

          {/* ── Main area ─────────────────────────────────────────────── */}
          <div className={clsx(
            'flex-1 flex-col bg-[#0e0e11]',
            selectedJid ? 'flex' : 'hidden sm:flex'
          )}>
            {!isConnected || ['qr', 'connecting'].includes(waStatus.status) ? (
              <QRPanel waStatus={waStatus} onConnect={() => connectMutation.mutate()} />
            ) : !selectedJid ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
                <div className="w-20 h-20 rounded-2xl bg-[#201f1f] flex items-center justify-center">
                  <MessageSquare size={36} className="text-[#414755]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#c1c6d7] font-display mb-1">Selecciona una conversación</h3>
                  <p className="text-[#8b90a0] text-sm">Elige un chat de la lista</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3.5 bg-[#131317]/60 backdrop-blur-sm">
                  {/* Back button on mobile */}
                  <button onClick={() => setSelectedJid(null)}
                    className="sm:hidden text-[#c1c6d7] hover:text-[#e5e2e1] mr-1">
                    ←
                  </button>
                  <div className="w-10 h-10 rounded-full btn-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                    {selectedName[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-[#e5e2e1]">{selectedName}</p>
                    <p className="text-xs text-[#8b90a0]">{selectedJid?.replace('@s.whatsapp.net', '')}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {messages.length === 0 && (
                    <div className="text-center text-[#414755] text-sm mt-8">Sin mensajes en este chat</div>
                  )}
                  {groupedMessages.map(({ day, messages: dayMsgs }) => (
                    <div key={day}>
                      <DateDivider date={day} />
                      {dayMsgs.map(msg => <MessageBubble key={msg.id || msg.wa_message_id} msg={msg} />)}
                    </div>
                  ))}
                  <div ref={messagesEnd} />
                </div>

                {/* Input area */}
                <form onSubmit={handleSend}
                  className="flex items-end gap-2 px-4 py-3 bg-[#131317]/60 backdrop-blur-sm">

                  {/* Audio blob preview */}
                  {audioBlob && !recording && (
                    <div className="flex-1 flex items-center gap-3 bg-[#2a2a2a] rounded-xl px-4 py-2.5">
                      <Mic size={16} className="text-[#aac7ff]" />
                      <div className="flex items-end gap-0.5 h-4 flex-1">
                        {[3,5,7,5,8,4,6,5,7,4,3,6].map((h, i) => (
                          <div key={i} className="w-0.5 bg-[#aac7ff]/60 rounded-full" style={{ height: `${h * 2}px` }} />
                        ))}
                      </div>
                      <span className="text-xs text-[#c1c6d7]">Audio listo</span>
                      <button type="button" onClick={() => { cancelRecording(); resetAudio(); }}
                        className="text-[#8b90a0] hover:text-[#ffb4ab] transition">
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Recording indicator */}
                  {recording && (
                    <div className="flex-1 flex items-center gap-3 bg-[#93000a]/20 rounded-xl px-4 py-2.5 ghost-border border-[#ffb4ab]/20">
                      <div className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-pulse" />
                      <span className="text-sm text-[#ffb4ab] font-mono">{fmtDur}</span>
                      <span className="text-xs text-[#c1c6d7]">Grabando...</span>
                      <button type="button" onClick={cancelRecording}
                        className="ml-auto text-[#8b90a0] hover:text-[#ffb4ab] transition">
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Text input (hide when recording) */}
                  {!recording && !audioBlob && (
                    <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                      placeholder="Escribe un mensaje..." rows={1}
                      style={{ resize: 'none', maxHeight: '120px', overflowY: 'auto' }}
                      className="input-obs flex-1 px-4 py-2.5 text-sm"
                      onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                    />
                  )}

                  {/* Audio button */}
                  {!text.trim() && !audioBlob && (
                    <button type="button"
                      onPointerDown={startRecording}
                      onPointerUp={stopRecording}
                      onPointerLeave={recording ? stopRecording : undefined}
                      className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                        recording
                          ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] scale-110'
                          : 'bg-[#2a2a2a] text-[#c1c6d7] hover:text-[#aac7ff] hover:bg-[#aac7ff]/10 ghost-border'
                      )}>
                      {recording ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                  )}

                  {/* Send button */}
                  {(text.trim() || audioBlob) && (
                    <button type="submit"
                      disabled={sendMutation.isPending || sendAudioMutation.isPending}
                      className="btn-primary w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 shadow-glow-primary">
                      {(sendMutation.isPending || sendAudioMutation.isPending)
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Send size={16} className="text-white" />
                      }
                    </button>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
