import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, Edit2, Clock, Folder, FolderPlus, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';
import { format, isAfter, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

const COLUMNS = [
  { id: 'pending',     label: 'Pendiente',   accent: 'text-[#c1c6d7]',  headerBg: 'bg-[#2a2a2a]/50' },
  { id: 'in_progress', label: 'En Progreso',  accent: 'text-[#aac7ff]',  headerBg: 'bg-[#aac7ff]/10' },
  { id: 'review',      label: 'Revisión',     accent: 'text-[#ffb77f]',  headerBg: 'bg-[#ffb77f]/10' },
  { id: 'completed',   label: 'Completada',   accent: 'text-[#4cd6ff]',  headerBg: 'bg-[#4cd6ff]/10' },
];

const PRIORITY_COLORS = {
  urgent: 'bg-[#93000a]/40 text-[#ffb4ab]',
  high:   'bg-[#ffb77f]/10 text-[#ffb77f]',
  medium: 'bg-[#aac7ff]/10 text-[#aac7ff]',
  low:    'bg-white/[0.04] text-[#414755]'
};
const PRIORITY_LABELS = { urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja' };

const PROJECT_COLORS = ['#aac7ff', '#4cd6ff', '#ffb77f', '#ffb4ab', '#3e90ff', '#4cff91', '#ffd97f', '#ff6b9d'];

const getCategoryTag = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('whatsapp') || t.includes('api') || t.includes('integr') || t.includes('desarr') || t.includes('código') || t.includes('backend') || t.includes('frontend')) return { label: 'DESARROLLO', cls: 'tag-dev' };
  if (t.includes('diseño') || t.includes('ui') || t.includes('ux') || t.includes('mockup') || t.includes('figma') || t.includes('visual')) return { label: 'DISEÑO', cls: 'tag-design' };
  if (t.includes('marketing') || t.includes('email') || t.includes('campaña') || t.includes('social') || t.includes('contenido')) return { label: 'MARKETING', cls: 'tag-marketing' };
  if (t.includes('plan') || t.includes('estrateg') || t.includes('roadmap') || t.includes('objetivo') || t.includes('kpi')) return { label: 'ESTRATEGIA', cls: 'tag-strategy' };
  if (t.includes('legal') || t.includes('contrato') || t.includes('privacidad') || t.includes('término')) return { label: 'LEGAL', cls: 'tag-legal' };
  return { label: 'OPERACIONES', cls: 'tag-ops' };
};

const inputCls = 'input-obs w-full px-4 py-2.5 text-sm';

// ── Project Modal ─────────────────────────────────────────────────────────────
const ProjectModal = ({ open, project, onClose, onSave }) => {
  const [form, setForm] = useState(project || {
    name: '', description: '', client_name: '', color: '#aac7ff', status: 'active', deadline: '', budget: ''
  });

  React.useEffect(() => {
    setForm(project || { name: '', description: '', client_name: '', color: '#aac7ff', status: 'active', deadline: '', budget: '' });
  }, [project, open]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? 'Editar proyecto' : 'Nuevo proyecto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Nombre del proyecto *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputCls} placeholder="Ej: Campaña Q4 - Cliente ABC" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Cliente</label>
            <input value={form.client_name || ''} onChange={e => setForm({ ...form, client_name: e.target.value })}
              className={inputCls} placeholder="Nombre del cliente" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Descripción</label>
            <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2} className="input-obs w-full px-4 py-2.5 text-sm resize-none" placeholder="Descripción del proyecto..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Estado</label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Deadline</label>
              <input type="date" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value || null })}
                className="input-obs w-full px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map(c => (
                <button key={c} type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={clsx('w-7 h-7 rounded-full transition-transform', form.color === c && 'ring-2 ring-white scale-110')}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl ghost-border text-[#c1c6d7] hover:text-[#e5e2e1] text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 py-2.5 text-sm">
              {project ? 'Guardar' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── Task Modal ────────────────────────────────────────────────────────────────
const TaskModal = ({ open, task, users, projects, currentProjectId, onClose, onSave }) => {
  const [form, setForm] = useState(task || {
    title: '', description: '', priority: 'medium',
    status: 'pending', assigned_to: '', due_date: '',
    project_id: currentProjectId || ''
  });

  React.useEffect(() => {
    setForm(task || {
      title: '', description: '', priority: 'medium',
      status: 'pending', assigned_to: '', due_date: '',
      project_id: currentProjectId || ''
    });
  }, [task, open]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar tarea' : 'Nueva tarea'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Título *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className={inputCls} placeholder="¿Qué hay que hacer?" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Descripción</label>
            <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2} className="input-obs w-full px-4 py-2.5 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Proyecto</label>
            <Select value={String(form.project_id || '')} onValueChange={v => setForm({ ...form, project_id: v || null })}>
              <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin proyecto</SelectItem>
                {(projects || []).map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Prioridad</label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Estado</label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="review">Revisión</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Asignar a</label>
              <Select value={String(form.assigned_to || '')} onValueChange={v => setForm({ ...form, assigned_to: v || null })}>
                <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {(users || []).map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Fecha límite</label>
              <input type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value || null })}
                className="input-obs w-full px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl ghost-border text-[#c1c6d7] hover:text-[#e5e2e1] text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 py-2.5 text-sm">
              {task ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function TasksPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [projectModal, setProjectModal] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjects, setShowProjects] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', selectedProject],
    queryFn: () => {
      const params = selectedProject ? `?project_id=${selectedProject}` : '';
      return api.get(`/tasks${params}`).then(r => r.data);
    },
    refetchInterval: 20000
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data)
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data)
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id ? api.put(`/tasks/${data.id}`, data) : api.post('/tasks', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setModal(null);
      toast.success('Tarea guardada');
    },
    onError: () => toast.error('Error al guardar')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Tarea eliminada'); }
  });

  const saveProjectMutation = useMutation({
    mutationFn: (data) => data.id ? api.put(`/projects/${data.id}`, data) : api.post('/projects', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setProjectModal(null);
      toast.success('Proyecto guardado');
    },
    onError: () => toast.error('Error al guardar proyecto')
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      if (selectedProject === deleteProjectMutation.variables) setSelectedProject(null);
      toast.success('Proyecto eliminado');
    }
  });

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);
  const currentProject = projects.find(p => p.id === selectedProject);
  const overdueTasks = tasks.filter(t =>
    t.due_date && t.status !== 'completed' && isAfter(new Date(), parseISO(t.due_date + 'T23:59:59'))
  );

  return (
    <TooltipProvider delayDuration={400}>
      <div className="space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-3"
        >
          <div>
            <h1 className="page-title text-[1.8rem]">
              {currentProject
                ? currentProject.name
                : <>Tareas del <span className="page-title-accent">Equipo</span></>
              }
            </h1>
            <p className="page-subtitle">
              {currentProject?.client_name
                ? `Cliente: ${currentProject.client_name}`
                : 'Visualiza y gestiona el flujo de trabajo operativo con precisión milimétrica'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowProjects(s => !s)}
              className={clsx('flex items-center gap-2 text-sm px-3 py-2 rounded-xl ghost-border transition-colors',
                showProjects ? 'text-[#aac7ff] bg-[#aac7ff]/10' : 'text-[#c1c6d7] hover:text-[#e5e2e1]')}>
              <Folder size={14} />
              <span className="hidden sm:inline">Proyectos</span>
              <span className="text-xs bg-[#aac7ff]/20 text-[#aac7ff] px-1.5 py-0.5 rounded-full">{projects.length}</span>
            </button>
            <button onClick={() => setModal({})}
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
              <Plus size={15} />
              <span className="hidden sm:inline">Nueva Tarea</span>
            </button>
          </div>
        </motion.div>

        {/* Overdue banner */}
        <AnimatePresence>
          {overdueTasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 bg-[#93000a]/20 text-[#ffb4ab] text-xs px-4 py-2.5 rounded-xl ghost-border"
            >
              <Clock size={13} />
              <span>{overdueTasks.length} tarea{overdueTasks.length > 1 ? 's' : ''} vencida{overdueTasks.length > 1 ? 's' : ''}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects Panel */}
        <AnimatePresence>
          {showProjects && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-[#201f1f] ghost-border rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#e5e2e1]">Proyectos</h3>
                <button onClick={() => setProjectModal({})}
                  className="flex items-center gap-1.5 text-xs text-[#aac7ff] hover:text-[#c4a8ff] transition-colors">
                  <FolderPlus size={13} /> Nuevo
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedProject(null)}
                  className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ghost-border',
                    selectedProject === null ? 'bg-[#aac7ff]/20 text-[#aac7ff]' : 'text-[#c1c6d7] hover:text-[#e5e2e1]')}>
                  Todas
                </button>
                {projects.map(p => (
                  <div key={p.id} className="group flex items-center">
                    <button onClick={() => setSelectedProject(p.id)}
                      className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                        selectedProject === p.id ? 'text-white' : 'text-[#c1c6d7] hover:text-[#e5e2e1] ghost-border')}
                      style={selectedProject === p.id ? { backgroundColor: p.color + '30', color: p.color } : {}}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      {p.name}
                      <span className="opacity-60">({p.task_count || 0})</span>
                    </button>
                    <div className="hidden group-hover:flex gap-0.5 ml-1">
                      <button onClick={() => setProjectModal(p)} className="p-1 text-[#8b90a0] hover:text-[#aac7ff] transition-colors">
                        <Edit2 size={11} />
                      </button>
                      <button onClick={() => deleteProjectMutation.mutate(p.id)} className="p-1 text-[#8b90a0] hover:text-[#ffb4ab] transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {currentProject && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5">
                  {[
                    { label: 'Total', value: tasks.length, color: '#e5e2e1', bg: 'bg-[#2a2a2a]/50' },
                    { label: 'En progreso', value: tasksByStatus('in_progress').length, color: '#aac7ff', bg: 'bg-[#aac7ff]/10' },
                    { label: 'Completadas', value: tasksByStatus('completed').length, color: '#4cd6ff', bg: 'bg-[#4cd6ff]/10' },
                    { label: 'Pendientes', value: tasksByStatus('pending').length, color: '#e5e2e1', bg: 'bg-[#2a2a2a]/50' },
                  ].map(s => (
                    <div key={s.label} className={clsx('rounded-xl p-3', s.bg)}>
                      <p className="text-xs" style={{ color: s.color, opacity: 0.7 }}>{s.label}</p>
                      <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#aac7ff] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            {COLUMNS.map((col) => (
              <div key={col.id} className="flex flex-col">
                <div className={clsx('rounded-xl px-4 py-2.5 mb-3', col.headerBg)}>
                  <div className="flex items-center justify-between">
                    <span className={clsx('text-sm font-semibold', col.accent)}>{col.label}</span>
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full bg-black/20', col.accent)}>
                      {tasksByStatus(col.id).length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 flex-1">
                  {tasksByStatus(col.id).map((task, i) => {
                    const isOverdue = task.due_date && task.status !== 'completed' &&
                      isAfter(new Date(), parseISO(task.due_date + 'T23:59:59'));
                    const tag = getCategoryTag(task.title);
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.04 }}
                        className="card p-4 hover:border-white/10 transition-all cursor-default"
                      >
                        <div className="mb-2.5">
                          <span className={clsx('text-[9px] font-bold px-2 py-0.5 rounded-md tracking-wider', tag.cls)}>{tag.label}</span>
                        </div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium text-[#c1c6d7] leading-snug">{task.title}</p>
                          <div className="flex gap-0.5 flex-shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={() => setModal(task)} className="text-[#8b90a0] hover:text-[#aac7ff] transition-colors p-1 rounded-lg hover:bg-[#aac7ff]/10">
                                  <Edit2 size={12} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={() => deleteMutation.mutate(task.id)} className="text-[#8b90a0] hover:text-[#ffb4ab] transition-colors p-1 rounded-lg hover:bg-[#ffb4ab]/10">
                                  <Trash2 size={12} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Eliminar</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-xs text-[#8b90a0] mb-3 line-clamp-2">{task.description}</p>
                        )}

                        {task.project && (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.project.color }} />
                            <span className="text-xs text-[#8b90a0]">{task.project.name}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', PRIORITY_COLORS[task.priority])}>
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                          {task.assignee && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full btn-primary flex items-center justify-center text-white text-[10px] font-bold">
                                {task.assignee.name[0]?.toUpperCase()}
                              </div>
                              <span className="text-xs text-[#8b90a0]">{task.assignee.name.split(' ')[0]}</span>
                            </div>
                          )}
                        </div>

                        {task.due_date && (
                          <div className={clsx('mt-2.5 flex items-center gap-1 text-xs', isOverdue ? 'text-[#ffb4ab]' : 'text-[#8b90a0]')}>
                            <Clock size={11} />
                            {format(parseISO(task.due_date + 'T00:00:00'), 'dd MMM', { locale: es })}
                            {isOverdue && <span className="ml-1 font-medium">Vencida</span>}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {tasksByStatus(col.id).length === 0 && (
                    <div className="rounded-xl py-8 text-center text-[#414755] text-xs"
                      style={{ border: '1px dashed rgba(72,71,78,0.3)' }}>
                      Sin tareas
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        <TaskModal
          open={modal !== null}
          task={modal?.id ? modal : null}
          users={users}
          projects={projects}
          currentProjectId={selectedProject !== 'none' ? selectedProject : null}
          onClose={() => setModal(null)}
          onSave={saveMutation.mutate}
        />

        <ProjectModal
          open={projectModal !== null}
          project={projectModal?.id ? projectModal : null}
          onClose={() => setProjectModal(null)}
          onSave={saveProjectMutation.mutate}
        />
      </div>
    </TooltipProvider>
  );
}
