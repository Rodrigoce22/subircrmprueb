import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, CheckSquare, MessageSquare, TrendingUp, Clock,
  Target, Zap, ArrowUpRight, ArrowDownRight, Activity, Award,
  FolderKanban, CalendarDays, ChevronRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { format, isPast, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import MobileDashboard from '../components/mobile/MobileDashboard';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-xl px-3 py-2 shadow-ambient text-xs">
      {label && <p className="text-white/40 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-medium">
          {p.name}: <span className="text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value, sub, accent, trend }) => (
  <div className="glass-panel p-6 rounded-xl group hover:bg-white/5 transition-all duration-500 relative overflow-hidden">
    <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] pointer-events-none"
      style={{ background: `${accent}18` }} />
    <div className="relative">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl" style={{ background: `${accent}15` }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'badge-up' : 'badge-down'}`}>
            {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-white tabular-nums">{value}</p>
      {sub && <p className="text-xs text-white/25 mt-1">{sub}</p>}
    </div>
  </div>
);

const STATUS_STYLES = {
  completed:   'bg-[#aac7ff]/10 text-[#aac7ff]',
  in_progress: 'bg-[#3e90ff]/10 text-[#3e90ff]',
  pending:     'bg-white/5 text-white/40',
  review:      'bg-[#ffb77f]/10 text-[#ffb77f]',
  cancelled:   'bg-[#ffb4ab]/10 text-[#ffb4ab]'
};
const STATUS_LABELS = { completed: 'Lista', in_progress: 'En curso', pending: 'Pendiente', review: 'Revisión', cancelled: 'Cancelada' };

const PRIORITY_STYLES = {
  urgent: 'bg-[#ffb4ab]/10 text-[#ffb4ab]',
  high:   'bg-[#ffb77f]/10 text-[#ffb77f]',
  medium: 'bg-[#aac7ff]/10 text-[#aac7ff]',
  low:    'bg-white/5 text-white/30'
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
    refetchInterval: 30000
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#aac7ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const d = data || {};
  const charts = d.charts || {};
  const taskPct = d.tasks?.total > 0 ? Math.round((d.tasks.completed / d.tasks.total) * 100) : 0;
  const convRate = d.conversion_rate || 0;

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } }
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
  };

  return (
    <>
    {/* ── Mobile Dashboard (< lg screens only) ─────────────────────────── */}
    <div className="lg:hidden">
      <MobileDashboard user={user} data={d} />
    </div>

    {/* ── Desktop Dashboard (lg+ screens only) ─────────────────────────── */}
    <div className="hidden lg:block">
    <div className="space-y-8 pb-6 max-w-7xl mx-auto">

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'rgba(170,199,255,0.05)' }} />
        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold mb-3">
          {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="page-title">
              {getGreeting()}, <span className="page-title-accent">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="page-subtitle">
              {d.contacts > 0
                ? `${d.contacts} contactos en base · ${d.messages?.today || 0} mensajes hoy`
                : 'Todo listo. Empezá agregando tus primeros contactos.'}
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel">
              <Activity size={13} className="text-[#aac7ff]" />
              <span className="text-xs text-[#aac7ff] font-semibold">En línea</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { icon: Users,        label: "Total Contactos", value: d.contacts || 0,        accent: "#aac7ff", trend: 12 },
          { icon: Target,       label: "Conversión",      value: `${convRate}%`,          accent: "#3e90ff", trend: convRate > 20 ? 5 : -3 },
          { icon: CheckSquare,  label: "Tareas Activas",  value: d.tasks?.total || 0,     accent: "#ffb77f", sub: `${taskPct}% completado` },
          { icon: MessageSquare,label: "Mensajes Hoy",    value: d.messages?.today || 0,  accent: "#c6c6cb", sub: `${d.messages?.total || 0} total` },
        ].map((props) => (
          <motion.div key={props.label} variants={item}>
            <KpiCard {...props} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Secondary KPI ────────────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { icon: TrendingUp, value: d.converted_contacts || 0, label: 'Clientes cerrados', color: '#aac7ff' },
          { icon: Zap,        value: d.tasks?.pending || 0,     label: 'Tareas pendientes', color: '#ffb4ab' },
          { icon: Award,      value: d.tasks?.completed || 0,   label: 'Completadas',       color: '#3e90ff' },
          { icon: Clock,      value: d.tasks?.in_progress || 0, label: 'En progreso',       color: '#ffb77f' },
        ].map(({ icon: Icon, value, label, color }) => (
          <motion.div key={label} variants={item}>
            <div className="glass-panel p-4 rounded-xl flex items-center gap-3 hover:bg-white/5 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}12` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-black text-white tabular-nums">{value}</p>
                <p className="text-[10px] text-white/30 font-medium">{label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Proyectos activos ────────────────────────────────────────────── */}
      {projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderKanban size={16} className="text-[#aac7ff]" />
              <h3 className="text-sm font-bold text-white">Proyectos activos</h3>
            </div>
            <Link to="/tasks" className="text-xs text-[#aac7ff] hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.filter(p => p.status === 'active').slice(0, 6).map((proj) => {
              const pct = proj.task_count > 0 ? Math.round((proj.completed_count / proj.task_count) * 100) : 0;
              const isOverdue = proj.deadline && isPast(parseISO(proj.deadline));
              return (
                <motion.div key={proj.id} variants={item}
                  className="glass-panel p-4 rounded-xl hover:bg-white/5 transition-all duration-300 group cursor-pointer"
                  onClick={() => {}}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: proj.color || '#aac7ff' }} />
                      <span className="text-sm font-semibold text-white/80 truncate group-hover:text-white transition-colors">{proj.name}</span>
                    </div>
                    <span className="text-xs font-black flex-shrink-0 ml-2" style={{ color: proj.color || '#aac7ff' }}>{pct}%</span>
                  </div>
                  {proj.description && (
                    <p className="text-[10px] text-white/25 mb-3 line-clamp-1">{proj.description}</p>
                  )}
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${proj.color || '#aac7ff'}80, ${proj.color || '#aac7ff'})` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/25">{proj.completed_count}/{proj.task_count} tareas</span>
                    {proj.deadline && (
                      <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-[#ffb4ab]' : 'text-white/25'}`}>
                        <CalendarDays size={9} />
                        {format(parseISO(proj.deadline), 'd MMM', { locale: es })}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Charts Row 1: Pipeline + Contact status ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-white">Embudo de pipeline</h3>
            <p className="text-[10px] text-white/30 mt-0.5">Distribución de contactos por etapa de venta</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.pipelineDistribution || []} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
                {(charts.pipelineDistribution || []).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-6 rounded-xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white">Estado contactos</h3>
            <p className="text-[10px] text-white/30 mt-0.5">Distribución actual</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={charts.contactsByStatus || []} cx="50%" cy="50%"
                innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {(charts.contactsByStatus || []).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {(charts.contactsByStatus || []).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-white/50">{item.name}</span>
                </div>
                <span className="text-white font-bold tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts Row 2: Messages + Tasks ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-white">Actividad de mensajes</h3>
            <p className="text-[10px] text-white/30 mt-0.5">Últimos 7 días — entrantes vs salientes</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={charts.msgsByDay || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#aac7ff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#aac7ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3e90ff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3e90ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="inbound"  name="Entrantes" stroke="#aac7ff" fill="url(#gradIn)"  strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="outbound" name="Salientes" stroke="#3e90ff" fill="url(#gradOut)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-6 rounded-xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white">Tareas por estado</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={charts.tasksByStatus || []} cx="50%" cy="50%"
                innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {(charts.tasksByStatus || []).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {(charts.tasksByStatus || []).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-white/50">{item.name}</span>
                </div>
                <span className="text-white font-bold tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts Row 3 ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-xl">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-white">Crecimiento mensual</h3>
            <p className="text-[10px] text-white/30 mt-0.5">Nuevos contactos — últimos 6 meses</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={charts.monthlyContacts || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="leads"   name="Leads"    fill="#aac7ff" radius={[4,4,0,0]} maxBarSize={20} opacity={0.8} />
              <Bar dataKey="clients" name="Clientes" fill="#3e90ff" radius={[4,4,0,0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-6 rounded-xl">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-white">Prioridad de tareas</h3>
            <p className="text-[10px] text-white/30 mt-0.5">Distribución actual del backlog</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={charts.priorityDist || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Tareas" radius={[4,4,0,0]} maxBarSize={28}>
                {(charts.priorityDist || []).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom Row: Team + Recent tasks ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Team performance */}
        <div className="glass-panel p-6 rounded-xl">
          <div className="mb-5 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white">Rendimiento del equipo</h3>
              <p className="text-[10px] text-white/30 mt-0.5">Tareas completadas por agente</p>
            </div>
          </div>
          <div className="space-y-5">
            {(d.teamStats || []).slice(0, 5).map((member, i) => {
              const pct = member.total_tasks > 0
                ? Math.round((member.completed_tasks / member.total_tasks) * 100) : 0;
              const colors = ['#aac7ff', '#3e90ff', '#ffb77f', '#c6c6cb', '#ffb4ab'];
              const c = colors[i % colors.length];
              return (
                <div key={member.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[#003064] text-xs font-black flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #aac7ff 0%, #3e90ff 100%)' }}>
                        {member.name[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-white/80">{member.name}</span>
                      {member.urgent_tasks > 0 && (
                        <span className="text-[10px] bg-[#ffb4ab]/10 text-[#ffb4ab] px-1.5 py-0.5 rounded-full font-bold">
                          {member.urgent_tasks} urgente
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/25">{member.completed_tasks}/{member.total_tasks}</span>
                      <span className="text-xs font-black" style={{ color: c }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c}80, ${c})` }} />
                  </div>
                </div>
              );
            })}
            {(!d.teamStats || d.teamStats.length === 0) && (
              <p className="text-white/20 text-sm text-center py-4">Sin datos de equipo</p>
            )}
          </div>
        </div>

        {/* Recent tasks */}
        <div className="glass-panel p-6 rounded-xl">
          <div className="mb-5 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white">Tareas recientes</h3>
              <p className="text-[10px] text-white/30 mt-0.5">Actividad más nueva del equipo</p>
            </div>
          </div>
          <div className="space-y-2">
            {(d.recentTasks || []).slice(0, 6).map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate group-hover:text-white transition-colors">{task.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_STYLES[task.status]}`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                    {task.assignee && (
                      <span className="text-[10px] text-white/25">{task.assignee.name.split(' ')[0]}</span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-bold ${PRIORITY_STYLES[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
            ))}
            {(!d.recentTasks || d.recentTasks.length === 0) && (
              <p className="text-white/20 text-sm text-center py-4">Sin tareas recientes</p>
            )}
          </div>
        </div>
      </div>

    </div>
    </div>{/* end hidden lg:block */}
    </> /* end fragment */
  );
}
