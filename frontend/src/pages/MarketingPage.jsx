import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Plus, Instagram, Globe, Mail, FileText,
  Pencil, Trash2, Calendar, Tag, CheckCircle2, Clock,
  Zap, TrendingUp, Eye, BarChart3, ChevronRight,
  Video, Image, AlignLeft, Hash, X, Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  { value: 'post',       label: 'Post',         icon: AlignLeft,  color: '#3e90ff' },
  { value: 'story',      label: 'Story',        icon: Image,      color: '#f59e0b' },
  { value: 'reel',       label: 'Reel / Video', icon: Video,      color: '#ff4d6d' },
  { value: 'email',      label: 'Email',        icon: Mail,       color: '#aac7ff' },
  { value: 'blog',       label: 'Blog / Artículo', icon: FileText, color: '#10b981' },
  { value: 'campaign',   label: 'Campaña',      icon: Megaphone,  color: '#8b5cf6' },
];

const PLATFORMS = [
  { value: 'instagram',  label: 'Instagram',    color: '#e1306c' },
  { value: 'tiktok',     label: 'TikTok',       color: '#010101' },
  { value: 'twitter',    label: 'X / Twitter',  color: '#1d9bf0' },
  { value: 'facebook',   label: 'Facebook',     color: '#1877f2' },
  { value: 'linkedin',   label: 'LinkedIn',     color: '#0a66c2' },
  { value: 'youtube',    label: 'YouTube',      color: '#ff0000' },
  { value: 'email',      label: 'Email',        color: '#aac7ff' },
  { value: 'web',        label: 'Web / Blog',   color: '#10b981' },
];

const CONTENT_STATUS = {
  pending:     { label: 'Idea',        color: '#8b90a0', bg: 'bg-white/5'          },
  in_progress: { label: 'En proceso',  color: '#aac7ff', bg: 'bg-[#aac7ff]/10'     },
  review:      { label: 'Revisión',    color: '#ffb77f', bg: 'bg-[#ffb77f]/10'     },
  completed:   { label: 'Publicado',   color: '#10b981', bg: 'bg-emerald-500/10'   },
  cancelled:   { label: 'Cancelado',   color: '#ffb4ab', bg: 'bg-[#ffb4ab]/10'     },
};

const MARKETING_PROJECT_NAME = 'Marketing Hub';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTypeInfo(tags) {
  const found = CONTENT_TYPES.find(t => (tags || []).includes(t.value));
  return found || CONTENT_TYPES[0];
}

function getPlatformInfo(tags) {
  return PLATFORMS.filter(p => (tags || []).includes(p.value));
}

// ── Content Modal ─────────────────────────────────────────────────────────────

function ContentModal({ open, onClose, task, projectId }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [form, setForm] = useState(task ? {
    title:       task.title,
    description: task.description || '',
    type:        getTypeInfo(task.tags).value,
    platforms:   getPlatformInfo(task.tags).map(p => p.value),
    status:      task.status,
    due_date:    task.due_date || '',
    priority:    task.priority,
  } : {
    title: '', description: '', type: 'post', platforms: [],
    status: 'pending', due_date: '', priority: 'medium',
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const tags = [data.type, ...data.platforms];
      const payload = {
        title:       data.title,
        description: data.description,
        status:      data.status,
        priority:    data.priority,
        due_date:    data.due_date || null,
        tags,
        project_id:  projectId,
        created_by:  user?.id,
      };
      return task
        ? api.put(`/tasks/${task.id}`, payload)
        : api.post('/tasks', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing-tasks'] });
      toast.success(task ? 'Contenido actualizado' : 'Contenido creado');
      onClose();
    },
    onError: () => toast.error('Error al guardar'),
  });

  const togglePlatform = (val) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(val)
        ? f.platforms.filter(p => p !== val)
        : [...f.platforms, val]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar contenido' : 'Nueva pieza de contenido'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Título *</label>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
              className="input-obs w-full px-4 py-2.5 text-sm" placeholder="Ej: Post lanzamiento nuevo producto" />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Brief / Descripción</label>
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
              className="input-obs w-full px-4 py-2.5 text-sm resize-none" rows={3}
              placeholder="Objetivo, tono, elementos clave, CTA..." />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Tipo de contenido</label>
            <div className="grid grid-cols-3 gap-2">
              {CONTENT_TYPES.map(t => {
                const Icon = t.icon;
                const active = form.type === t.value;
                return (
                  <button key={t.value} onClick={() => setForm(f => ({...f, type: t.value}))}
                    className={clsx('flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ghost-border',
                      active ? 'text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5')}
                    style={active ? { background: `${t.color}20`, borderColor: `${t.color}40` } : {}}>
                    <Icon size={13} style={active ? { color: t.color } : {}} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Plataformas</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => {
                const active = form.platforms.includes(p.value);
                return (
                  <button key={p.value} onClick={() => togglePlatform(p.value)}
                    className={clsx('px-3 py-1.5 rounded-xl text-xs font-medium transition-all ghost-border',
                      active ? 'text-white' : 'text-white/30 hover:text-white/60')}
                    style={active ? { background: `${p.color}25`, borderColor: `${p.color}40` } : {}}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Estado</label>
              <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
                className="input-obs w-full px-3 py-2.5 text-sm">
                {Object.entries(CONTENT_STATUS).map(([v, s]) => (
                  <option key={v} value={v}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Prioridad</label>
              <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}
                className="input-obs w-full px-3 py-2.5 text-sm">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Fecha</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))}
                className="input-obs w-full px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-glass px-5 py-2.5 text-sm flex-1">Cancelar</button>
            <button
              onClick={() => { if (!form.title.trim()) return toast.error('El título es requerido'); saveMutation.mutate(form); }}
              disabled={saveMutation.isPending}
              className="btn-primary px-5 py-2.5 text-sm flex-1 flex items-center justify-center gap-2">
              <Plus size={14} /> {saveMutation.isPending ? 'Guardando...' : task ? 'Actualizar' : 'Crear contenido'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Content Card ──────────────────────────────────────────────────────────────

function ContentCard({ task, onEdit, onDelete }) {
  const typeInfo = getTypeInfo(task.tags);
  const platforms = getPlatformInfo(task.tags);
  const status = CONTENT_STATUS[task.status] || CONTENT_STATUS.pending;
  const TypeIcon = typeInfo.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-panel rounded-xl p-4 hover:bg-white/5 transition-all duration-300 group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${typeInfo.color}18` }}>
          <TypeIcon size={16} style={{ color: typeInfo.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/85 truncate group-hover:text-white transition-colors">{task.title}</p>
          {task.description && (
            <p className="text-xs text-white/30 mt-0.5 line-clamp-2">{task.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-bold', status.bg)}
            style={{ color: status.color }}>{status.label}</span>
          {platforms.slice(0, 2).map(p => (
            <span key={p.value} className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-white/5 text-white/40">
              {p.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => onEdit(task)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-[#aac7ff] hover:bg-[#aac7ff]/10 transition-all">
                <Pencil size={12} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => onDelete(task.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-all">
                <Trash2 size={12} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Eliminar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {task.due_date && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
          <Calendar size={10} className="text-white/20" />
          <span className="text-[10px] text-white/25">
            {format(parseISO(task.due_date), "d 'de' MMMM", { locale: es })}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ── Calendar View ─────────────────────────────────────────────────────────────

function CalendarView({ tasks }) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const dayTasks = tasks.filter(t => t.due_date && isSameDay(parseISO(t.due_date), day));
          const isToday = isSameDay(day, today);
          return (
            <div key={day.toISOString()} className={clsx(
              'glass-panel rounded-xl p-3 min-h-[120px] transition-all',
              isToday && 'ring-1 ring-[#aac7ff]/30'
            )}>
              <div className="mb-2">
                <p className="text-[10px] text-white/30 uppercase tracking-wide font-medium">
                  {format(day, 'EEE', { locale: es })}
                </p>
                <p className={clsx('text-lg font-black tabular-nums', isToday ? 'text-[#aac7ff]' : 'text-white/60')}>
                  {format(day, 'd')}
                </p>
              </div>
              <div className="space-y-1">
                {dayTasks.map(t => {
                  const typeInfo = getTypeInfo(t.tags);
                  return (
                    <div key={t.id} className="text-[9px] px-2 py-1 rounded-lg font-medium truncate"
                      style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}>
                      {t.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-white/30">
        <span>Esta semana: {tasks.filter(t => t.due_date && days.some(d => isSameDay(parseISO(t.due_date), d))).length} piezas</span>
        {CONTENT_TYPES.slice(0, 4).map(t => {
          const Icon = t.icon;
          return (
            <span key={t.value} className="flex items-center gap-1">
              <Icon size={10} style={{ color: t.color }} /> {t.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Stats Row ─────────────────────────────────────────────────────────────────

function MarketingStats({ tasks }) {
  const total     = tasks.length;
  const published = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const ideas     = tasks.filter(t => t.status === 'pending').length;

  const stats = [
    { icon: Megaphone,    value: total,      label: 'Total contenido', color: '#3e90ff' },
    { icon: CheckCircle2, value: published,  label: 'Publicados',      color: '#10b981' },
    { icon: Zap,          value: inProgress, label: 'En proceso',      color: '#aac7ff' },
    { icon: Sparkles,     value: ideas,      label: 'Ideas',           color: '#f59e0b' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(s => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="glass-panel p-5 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}15` }}>
              <Icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-white tabular-nums">{s.value}</p>
              <p className="text-[10px] text-white/30 font-medium">{s.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('contenido');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [modal, setModal] = useState(null); // null | 'create' | task
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Find or track the marketing project ID
  const [marketingProjectId, setMarketingProjectId] = useState(null);

  // Load projects, find or prepare marketing project
  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
  });

  // Ensure marketing project exists
  const ensureProject = useMutation({
    mutationFn: () => api.post('/projects', {
      name: MARKETING_PROJECT_NAME,
      description: 'Gestion de contenido creativo y campanas de marketing',
      color: '#f59e0b',
      status: 'active',
    }),
    onSuccess: (res) => {
      setMarketingProjectId(res.data.id);
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  React.useEffect(() => {
    const mp = allProjects.find(p => p.name === MARKETING_PROJECT_NAME);
    if (mp) { setMarketingProjectId(mp.id); }
    else if (allProjects.length > 0 && !ensureProject.isPending) {
      ensureProject.mutate();
    }
  }, [allProjects]);

  // Load marketing tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['marketing-tasks', marketingProjectId],
    queryFn: () => marketingProjectId
      ? api.get('/tasks', { params: { project_id: marketingProjectId, limit: 200 } }).then(r => {
          // tasks endpoint may return { tasks } or array
          const d = r.data;
          return Array.isArray(d) ? d : (d.tasks || []);
        })
      : [],
    enabled: !!marketingProjectId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['marketing-tasks'] }); toast.success('Eliminado'); setDeleteConfirm(null); },
    onError: () => toast.error('Error al eliminar'),
  });

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterType !== 'all' && !((t.tags || []).includes(filterType))) return false;
    return true;
  });

  const tabs = [
    { id: 'contenido',  label: 'Contenido',  icon: AlignLeft },
    { id: 'calendario', label: 'Calendario', icon: Calendar  },
    { id: 'campanas',   label: 'Campañas',   icon: Megaphone },
  ];

  const campaigns = tasks.filter(t => (t.tags || []).includes('campaign'));

  return (
    <div className="space-y-6 pb-6 max-w-7xl mx-auto">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Megaphone size={20} className="text-[#f59e0b]" />
              <h1 className="page-title text-[2rem] lg:text-[3rem]">
                Marketing
              </h1>
            </div>
            <p className="page-subtitle">
              Gestión de contenido creativo, campañas y calendario editorial
            </p>
          </div>
          <button
            onClick={() => setModal('create')}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm flex-shrink-0">
            <Plus size={15} /> Nuevo contenido
          </button>
        </div>
      </motion.div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <MarketingStats tasks={tasks} />

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#201f1f] rounded-xl p-1 w-fit">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === t.id ? 'bg-[#aac7ff]/20 text-[#aac7ff]' : 'text-white/40 hover:text-white/70'
              )}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Contenido Tab ────────────────────────────────────────────────── */}
      {activeTab === 'contenido' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-[#201f1f] rounded-xl p-1">
              <button onClick={() => setFilterStatus('all')}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  filterStatus === 'all' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60')}>
                Todos
              </button>
              {Object.entries(CONTENT_STATUS).map(([v, s]) => (
                <button key={v} onClick={() => setFilterStatus(v)}
                  className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    filterStatus === v ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60')}>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-[#201f1f] rounded-xl p-1">
              <button onClick={() => setFilterType('all')}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  filterType === 'all' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60')}>
                Todos
              </button>
              {CONTENT_TYPES.map(t => (
                <button key={t.value} onClick={() => setFilterType(t.value)}
                  className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    filterType === t.value ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/60')}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-[#aac7ff] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <Megaphone size={40} className="text-white/10 mb-4" />
              <p className="text-white/40 text-sm mb-2">No hay contenido todavía</p>
              <p className="text-white/20 text-xs mb-5">Crea tu primera pieza de contenido para empezar</p>
              <button onClick={() => setModal('create')} className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
                <Plus size={14} /> Crear contenido
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredTasks.map(task => (
                  <ContentCard
                    key={task.id}
                    task={task}
                    onEdit={(t) => setModal(t)}
                    onDelete={(id) => setDeleteConfirm(id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ── Calendario Tab ───────────────────────────────────────────────── */}
      {activeTab === 'calendario' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40">
              Semana del {format(startOfWeek(new Date(), { weekStartsOn: 1 }), "d 'de' MMMM", { locale: es })}
            </p>
            <button onClick={() => setModal('create')} className="btn-glass text-xs px-3 py-2 flex items-center gap-1.5">
              <Plus size={12} /> Añadir al calendario
            </button>
          </div>
          <CalendarView tasks={tasks} />
        </div>
      )}

      {/* ── Campañas Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'campanas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40">{campaigns.length} campaña{campaigns.length !== 1 ? 's' : ''} activa{campaigns.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setModal('create')} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
              <Plus size={12} /> Nueva campaña
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 flex flex-col items-center text-center">
              <TrendingUp size={40} className="text-white/10 mb-4" />
              <p className="text-white/40 text-sm mb-5">No hay campañas activas</p>
              <button onClick={() => setModal('create')} className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
                <Plus size={14} /> Crear campaña
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map(t => {
                const status = CONTENT_STATUS[t.status] || CONTENT_STATUS.pending;
                const platforms = getPlatformInfo(t.tags);
                return (
                  <div key={t.id} className="glass-panel rounded-xl p-5 hover:bg-white/5 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white/85 group-hover:text-white transition-colors">{t.title}</p>
                        {t.description && <p className="text-xs text-white/30 mt-1 line-clamp-2">{t.description}</p>}
                      </div>
                      <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-bold ml-3 flex-shrink-0', status.bg)}
                        style={{ color: status.color }}>{status.label}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/25">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {platforms.map(p => (
                          <span key={p.value} className="px-2 py-0.5 rounded-lg bg-white/5">{p.label}</span>
                        ))}
                      </div>
                      {t.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {format(parseISO(t.due_date), "d MMM", { locale: es })}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal(t)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-[#aac7ff] hover:bg-[#aac7ff]/10 transition-all">
                        <Pencil size={11} /> Editar
                      </button>
                      <button onClick={() => setDeleteConfirm(t.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-all">
                        <Trash2 size={11} /> Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Content Modal ────────────────────────────────────────────────── */}
      <ContentModal
        open={modal !== null}
        onClose={() => setModal(null)}
        task={typeof modal === 'object' ? modal : null}
        projectId={marketingProjectId}
      />

      {/* ── Delete confirm ───────────────────────────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={v => !v && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar contenido?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/50 mt-2">Esta acción no se puede deshacer.</p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setDeleteConfirm(null)} className="btn-glass px-4 py-2 text-sm flex-1">Cancelar</button>
            <button onClick={() => deleteMutation.mutate(deleteConfirm)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex-1 bg-[#ffb4ab]/15 text-[#ffb4ab] hover:bg-[#ffb4ab]/25 transition-colors">
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
