import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, ChevronRight, Plus, X, Clock,
  MapPin, User, Phone, Calendar, Edit2, Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs';

const EVENT_TYPES = [
  { id: 'meeting',  label: 'Reunión',    color: '#aac7ff' },
  { id: 'call',     label: 'Llamada',    color: '#4cd6ff' },
  { id: 'task',     label: 'Tarea',      color: '#ffb77f' },
  { id: 'reminder', label: 'Recordatorio', color: '#3e90ff' },
  { id: 'other',    label: 'Otro',       color: '#8b90a0' }
];

const typeColor = (type) => EVENT_TYPES.find(t => t.id === type)?.color || '#aac7ff';
const typeLabel = (type) => EVENT_TYPES.find(t => t.id === type)?.label || type;

// ── Event Form Modal ───────────────────────────────────────────────────────────
const EventModal = ({ open, event, users, contacts, onClose, onSave }) => {
  const defaultStart = event?.start_date
    ? format(parseISO(event.start_date), "yyyy-MM-dd'T'HH:mm")
    : format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const defaultEnd = event?.end_date
    ? format(parseISO(event.end_date), "yyyy-MM-dd'T'HH:mm")
    : format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm");

  const [form, setForm] = useState(event ? {
    ...event,
    start_date: defaultStart,
    end_date: defaultEnd
  } : {
    title: '', description: '', start_date: defaultStart, end_date: defaultEnd,
    all_day: false, color: '#aac7ff', type: 'meeting', location: '',
    contact_id: '', assigned_to: ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{event?.id ? 'Editar evento' : 'Nuevo evento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
          {/* Tipo + color */}
          <div className="flex gap-2 flex-wrap">
            {EVENT_TYPES.map(t => (
              <button key={t.id} type="button"
                onClick={() => { set('type', t.id); set('color', t.color); }}
                className={clsx(
                  'text-xs px-3 py-1.5 rounded-full font-medium transition-all ghost-border',
                  form.type === t.id ? 'text-black' : 'text-[#c1c6d7] hover:text-[#e5e2e1]'
                )}
                style={form.type === t.id ? { background: t.color, borderColor: t.color } : {}}>
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Título *</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)}
              className="input-obs w-full px-4 py-2.5 text-sm" placeholder="Nombre del evento" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Inicio *</label>
              <input required type={form.all_day ? 'date' : 'datetime-local'}
                value={form.start_date} onChange={e => set('start_date', e.target.value)}
                className="input-obs w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Fin *</label>
              <input required type={form.all_day ? 'date' : 'datetime-local'}
                value={form.end_date} onChange={e => set('end_date', e.target.value)}
                className="input-obs w-full px-3 py-2.5 text-sm" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <div className={clsx('w-9 h-5 rounded-full transition-colors relative', form.all_day ? 'bg-[#aac7ff]' : 'bg-[#2a2a2a]')}
              onClick={() => set('all_day', !form.all_day)}>
              <div className={clsx('absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all', form.all_day ? 'left-4' : 'left-0.5')} />
            </div>
            <span className="text-xs text-[#c1c6d7]">Todo el día</span>
          </label>

          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Descripción</label>
            <textarea value={form.description || ''} onChange={e => set('description', e.target.value)}
              rows={2} className="input-obs w-full px-4 py-2.5 text-sm resize-none" placeholder="Detalles del evento..." />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Ubicación</label>
            <input value={form.location || ''} onChange={e => set('location', e.target.value)}
              className="input-obs w-full px-4 py-2.5 text-sm" placeholder="Dirección o enlace de reunión" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Asignar a</label>
              <select value={form.assigned_to || ''} onChange={e => set('assigned_to', e.target.value)}
                className="input-obs w-full px-3 py-2.5 text-sm">
                <option value="">Sin asignar</option>
                {(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Contacto</label>
              <select value={form.contact_id || ''} onChange={e => set('contact_id', e.target.value)}
                className="input-obs w-full px-3 py-2.5 text-sm">
                <option value="">Sin contacto</option>
                {(contacts || []).slice(0, 50).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl ghost-border text-[#c1c6d7] hover:text-[#e5e2e1] text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 py-2.5 text-sm">
              {event?.id ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── Event detail dialog ───────────────────────────────────────────────────────
const EventDetail = ({ open, event, onClose, onEdit, onDelete }) => (
  <Dialog open={open} onOpenChange={v => !v && onClose()}>
    <DialogContent className="max-w-sm">
      {event && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: event.color || typeColor(event.type) }} />
            <span className="text-xs text-[#c1c6d7] uppercase tracking-wider font-medium">{typeLabel(event.type)}</span>
          </div>
          <div className="space-y-3">
            <h3 className="text-base font-bold text-[#e5e2e1]">{event.title}</h3>
            <div className="flex items-center gap-2 text-xs text-[#c1c6d7]">
              <Clock size={13} />
              {event.all_day ? 'Todo el día' : format(parseISO(event.start_date), "dd MMM · HH:mm", { locale: es })}
              {!event.all_day && ` — ${format(parseISO(event.end_date), "HH:mm")}`}
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-xs text-[#c1c6d7]">
                <MapPin size={13} /> {event.location}
              </div>
            )}
            {event.assignee && (
              <div className="flex items-center gap-2 text-xs text-[#c1c6d7]">
                <User size={13} /> {event.assignee.name}
              </div>
            )}
            {event.contact && (
              <div className="flex items-center gap-2 text-xs text-[#c1c6d7]">
                <Phone size={13} /> {event.contact.name} {event.contact.phone ? `· ${event.contact.phone}` : ''}
              </div>
            )}
            {event.description && (
              <p className="text-sm text-[#8b90a0] leading-relaxed">{event.description}</p>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={onEdit}
                className="flex-1 py-2.5 rounded-xl text-sm text-[#aac7ff] ghost-border hover:bg-[#aac7ff]/10 transition-colors flex items-center justify-center gap-1.5">
                <Edit2 size={13} /> Editar
              </button>
              <button onClick={onDelete}
                className="flex-1 py-2.5 rounded-xl text-sm text-[#ffb4ab] ghost-border hover:bg-[#ffb4ab]/10 transition-colors flex items-center justify-center gap-1.5">
                <Trash2 size={13} /> Eliminar
              </button>
            </div>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>
);

// ── Main Calendar ──────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const qc = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [modal, setModal] = useState(null); // null | {} | event
  const [detail, setDetail] = useState(null);
  const [view, setView] = useState('month'); // 'month' | 'list'

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd     = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days       = eachDayOfInterval({ start: calStart, end: calEnd });

  const { data: events = [] } = useQuery({
    queryKey: ['events', format(monthStart, 'yyyy-MM'), format(monthEnd, 'yyyy-MM')],
    queryFn: () => api.get('/events', {
      params: { from: monthStart.toISOString(), to: monthEnd.toISOString() }
    }).then(r => r.data)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data)
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', ''],
    queryFn: () => api.get('/contacts', { params: { limit: 100 } }).then(r => r.data)
  });
  const contacts = contactsData?.contacts || [];

  const saveMutation = useMutation({
    mutationFn: (data) => data.id
      ? api.put(`/events/${data.id}`, data)
      : api.post('/events', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      setModal(null);
      setDetail(null);
      toast.success('Evento guardado');
    },
    onError: () => toast.error('Error al guardar evento')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      setDetail(null);
      toast.success('Evento eliminado');
    }
  });

  const eventsForDay = (day) =>
    events.filter(e => isSameDay(parseISO(e.start_date), day));

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl font-black text-[#e5e2e1] tracking-tight">Calendario</h1>
          <p className="text-[#8b90a0] text-sm mt-0.5">Gestión de eventos, reuniones y llamadas</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="month">Mes</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
            </TabsList>
          </Tabs>
          <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            <Plus size={15} /> Nuevo
          </button>
        </div>
      </motion.div>

      {/* Month navigation */}
      <div className="flex items-center justify-between bg-[#201f1f] ghost-border rounded-2xl px-5 py-3">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          className="text-[#c1c6d7] hover:text-[#e5e2e1] transition-colors p-1">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-base font-bold text-[#e5e2e1] font-display capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          className="text-[#c1c6d7] hover:text-[#e5e2e1] transition-colors p-1">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar grid */}
      {view === 'month' && (
        <div className="bg-[#201f1f] rounded-2xl overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-white/5">
            {weekDays.map(d => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-[#8b90a0] uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dayEvents = eventsForDay(day);
              const inMonth   = isSameMonth(day, currentMonth);
              const today     = isToday(day);

              return (
                <div key={i}
                  className={clsx(
                    'min-h-[90px] p-1.5 border-r border-b border-white/5 cursor-pointer hover:bg-[#2a2a2a]/40 transition-colors',
                    !inMonth && 'opacity-30',
                    (i + 1) % 7 === 0 && 'border-r-0'
                  )}
                  onClick={() => setModal({ start_date: format(day, "yyyy-MM-dd'T'09:00"), end_date: format(day, "yyyy-MM-dd'T'10:00") })}
                >
                  <div className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 mx-auto',
                    today ? 'btn-primary text-white' : 'text-[#c1c6d7]'
                  )}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id}
                        onClick={e => { e.stopPropagation(); setDetail(ev); }}
                        className="text-xs px-1.5 py-0.5 rounded-md truncate font-medium cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ background: `${ev.color || typeColor(ev.type)}20`, color: ev.color || typeColor(ev.type) }}>
                        {ev.all_day ? '' : format(parseISO(ev.start_date), 'HH:mm') + ' '}
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-[#8b90a0] px-1.5">+{dayEvents.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="bg-[#201f1f] rounded-2xl overflow-hidden">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar size={36} className="text-[#414755] mb-3" />
              <p className="text-[#8b90a0] text-sm">Sin eventos este mes</p>
              <button onClick={() => setModal({})} className="btn-primary mt-4 px-4 py-2 text-sm">
                Crear primer evento
              </button>
            </div>
          ) : events.map(ev => (
            <div key={ev.id}
              onClick={() => setDetail(ev)}
              className="flex items-center gap-4 px-5 py-4 hover:bg-[#2a2a2a]/40 transition-colors cursor-pointer border-b border-white/5 last:border-b-0">
              <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: ev.color || typeColor(ev.type) }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#e5e2e1] truncate">{ev.title}</p>
                <p className="text-xs text-[#8b90a0] mt-0.5">
                  {ev.all_day
                    ? format(parseISO(ev.start_date), "EEEE dd MMM", { locale: es })
                    : format(parseISO(ev.start_date), "EEEE dd MMM · HH:mm", { locale: es })
                  }
                  {ev.location ? ` · ${ev.location}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: `${ev.color || typeColor(ev.type)}18`, color: ev.color || typeColor(ev.type) }}>
                  {typeLabel(ev.type)}
                </span>
                {ev.assignee && (
                  <div className="w-6 h-6 rounded-full btn-primary flex items-center justify-center text-white text-xs font-bold">
                    {ev.assignee.name[0]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <EventModal
        open={modal !== null}
        event={modal?.id ? modal : null}
        users={users}
        contacts={contacts}
        onClose={() => setModal(null)}
        onSave={saveMutation.mutate}
      />
      <EventDetail
        open={!!detail}
        event={detail}
        onClose={() => setDetail(null)}
        onEdit={() => { setModal(detail); setDetail(null); }}
        onDelete={() => deleteMutation.mutate(detail.id)}
      />
    </div>
  );
}
