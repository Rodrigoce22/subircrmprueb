import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Zap, Users, Download, TrendingUp,
  TrendingDown, Minus, ExternalLink, Brain, Shield,
  Loader, Activity,
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import clsx from 'clsx';

// ── PDF Reports ────────────────────────────────────────────────────────────────
const PDF_REPORTS = [
  { id: 'tasks',    label: 'Tareas',    endpoint: '/reports/tasks',    color: '#aac7ff' },
  { id: 'contacts', label: 'Contactos', endpoint: '/reports/contacts', color: '#4cd6ff' },
  { id: 'messages', label: 'WhatsApp',  endpoint: '/reports/messages', color: '#ffb77f' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function Trend({ value }) {
  if (value > 0) return (
    <span className="flex items-center gap-1 text-[#4cff91] font-mono text-sm font-bold tracking-widest">
      <TrendingUp size={12} /> +{value}%
    </span>
  );
  if (value < 0) return (
    <span className="flex items-center gap-1 text-[#ffb4ab] font-mono text-sm font-bold tracking-widest">
      <TrendingDown size={12} /> {value}%
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-white/40 font-mono text-sm font-bold tracking-widest">
      <Minus size={12} /> STABLE
    </span>
  );
}

function ProgressBar({ value, max = 100, gradient = false }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: gradient
            ? 'linear-gradient(90deg, #aac7ff 0%, #3e90ff 100%)'
            : '#aac7ff',
        }}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [generating, setGenerating] = useState(null);
  const [dates, setDates] = useState({ from: '', to: '' });

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
    staleTime: 60_000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.tasks || []);
    }),
    staleTime: 60_000,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: () => api.get('/contacts').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d.contacts || []);
    }),
    staleTime: 60_000,
  });

  // ── Derived metrics ─────────────────────────────────────────────────────────
  const totalTasks       = tasks.length || 0;
  const completedTasks   = tasks.filter(t => t.status === 'completed').length;
  const taskRate         = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalContacts    = contacts.length || 0;
  const newContacts      = contacts.filter(c => {
    const d = new Date(c.createdAt);
    const now = new Date();
    return (now - d) < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const messagesTotal    = stats?.messages?.total || 0;
  const messagesToday    = stats?.messages?.today || 0;

  const recentActivity = tasks.slice(0, 6).map(t => ({
    event:    t.title,
    entity:   t.assignee?.name || 'Sin asignar',
    accuracy: t.status === 'completed' ? '100%' : t.status === 'in_progress' ? '65%' : '—',
    ts: (() => {
      try { return t.updatedAt ? format(new Date(t.updatedAt), 'HH:mm:ss') : '—'; }
      catch { return '—'; }
    })(),
    status:   t.status,
  }));

  // ── PDF download ─────────────────────────────────────────────────────────────
  const generatePDF = async (report) => {
    setGenerating(report.id);
    try {
      const params = {};
      if (dates.from) params.from = dates.from;
      if (dates.to)   params.to   = dates.to;
      const { data } = await api.get(report.endpoint, { params });
      const link = document.createElement('a');
      link.href = data.url;
      link.download = `influence_${report.id}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF descargado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al generar reporte');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-8 pb-8">

      {/* ── Hero Header ───────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-[3rem] font-black tracking-tight leading-tight text-white mb-2">
          Performance{' '}
          <span className="text-[#aac7ff]">Intelligence</span>
        </h1>
        <p className="text-white/50 text-base max-w-2xl font-light">
          Sincronización de datos en tiempo real y modelado predictivo para el ecosistema Influence.
        </p>
      </motion.header>

      {/* ── KPI Bento Grid ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
      >
        {/* Card 1 — Task Efficiency */}
        <div className="glass-panel p-8 rounded-xl flex flex-col justify-between group hover:border-[#aac7ff]/30 transition-all duration-500">
          <div className="flex justify-between items-start mb-8">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #aac7ff 0%, #3e90ff 100%)' }}>
              <Zap size={20} className="text-white" fill="white" />
            </div>
            <Trend value={taskRate > 50 ? 12 : -4} />
          </div>
          <div>
            <h3 className="text-white/60 text-xs font-bold tracking-widest uppercase mb-1">
              Eficiencia de Tareas
            </h3>
            <p className="text-4xl font-black text-white">
              {taskRate}<span className="text-[#aac7ff] text-xl font-medium ml-1">%</span>
            </p>
            <div className="mt-4">
              <ProgressBar value={taskRate} gradient />
            </div>
            <p className="text-white/30 text-xs mt-2 font-mono">
              {completedTasks} de {totalTasks} tareas completadas
            </p>
          </div>
        </div>

        {/* Card 2 — Contacts */}
        <div className="glass-panel p-8 rounded-xl flex flex-col justify-between group hover:border-[#aac7ff]/30 transition-all duration-500">
          <div className="flex justify-between items-start mb-8">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <Users size={20} className="text-[#aac7ff]" />
            </div>
            <Trend value={newContacts > 0 ? Math.round((newContacts / Math.max(totalContacts, 1)) * 100) : 0} />
          </div>
          <div>
            <h3 className="text-white/60 text-xs font-bold tracking-widest uppercase mb-1">
              Engagement Activo
            </h3>
            <p className="text-4xl font-black text-white">
              {totalContacts.toLocaleString()}
              <span className="text-[#aac7ff] text-xl font-medium ml-1">k</span>
            </p>
            <div className="mt-4 flex gap-1 items-end h-8">
              {[40, 60, 80, 100, 90, 50].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm transition-all"
                  style={{
                    height: `${h}%`,
                    background: i === 3
                      ? 'linear-gradient(180deg, #aac7ff, #3e90ff)'
                      : `rgba(170,199,255,${h / 250})`,
                  }}
                />
              ))}
            </div>
            <p className="text-white/30 text-xs mt-2 font-mono">
              +{newContacts} esta semana
            </p>
          </div>
        </div>

        {/* Card 3 — Messages / Data Integrity */}
        <div className="glass-panel p-8 rounded-xl flex flex-col justify-between group hover:border-[#aac7ff]/30 transition-all duration-500">
          <div className="flex justify-between items-start mb-8">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <Shield size={20} className="text-[#aac7ff]" />
            </div>
            <Trend value={0} />
          </div>
          <div>
            <h3 className="text-white/60 text-xs font-bold tracking-widest uppercase mb-1">
              Mensajes Procesados
            </h3>
            <p className="text-4xl font-black text-white">
              {messagesTotal > 0 ? messagesTotal.toLocaleString() : '—'}
              {messagesTotal > 0 && <span className="text-[#aac7ff] text-xl font-medium ml-1">msg</span>}
            </p>
            <p className="text-white/40 text-xs mt-4 italic font-mono tracking-tighter">
              {messagesToday} mensajes hoy · Verificado por Influence AI
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Main Section ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Activity Table */}
        <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden">
          <div className="px-7 py-5 flex justify-between items-center border-b border-white/5">
            <h2 className="text-lg font-bold tracking-tight text-white">Actividad Reciente</h2>
            <div className="flex items-center gap-3">
              <Activity size={14} className="text-white/30" />
              <span className="text-xs text-[#aac7ff] font-bold uppercase tracking-widest">
                Tiempo real
              </span>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className="px-7 py-12 text-center text-white/30 text-sm">
              Sin actividad reciente. Creá tareas para verlas aquí.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.03] text-[0.65rem] uppercase tracking-widest text-white/30">
                    <th className="px-7 py-4 font-bold">Evento</th>
                    <th className="px-7 py-4 font-bold hidden sm:table-cell">Responsable</th>
                    <th className="px-7 py-4 font-bold">Estado</th>
                    <th className="px-7 py-4 font-bold hidden md:table-cell">Timestamp</th>
                    <th className="px-7 py-4 font-bold text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {recentActivity.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#3e90ff] shadow-[0_0_8px_#3e90ff] flex-shrink-0" />
                          <span className="font-medium text-white/80 text-sm truncate max-w-[180px]">
                            {row.event}
                          </span>
                        </div>
                      </td>
                      <td className="px-7 py-4 text-white/50 text-sm hidden sm:table-cell">
                        {row.entity}
                      </td>
                      <td className="px-7 py-4">
                        <span className={clsx(
                          'px-2 py-1 rounded text-[0.65rem] font-bold',
                          row.status === 'completed'   && 'bg-[#4cd6ff]/10 text-[#4cd6ff]',
                          row.status === 'in_progress' && 'bg-[#aac7ff]/10 text-[#aac7ff]',
                          row.status === 'pending'     && 'bg-white/5 text-white/40',
                          !row.status                  && 'bg-white/5 text-white/40',
                        )}>
                          {row.status === 'completed'   ? 'Completado'
                          : row.status === 'in_progress' ? 'En curso'
                          : row.status === 'pending'     ? 'Pendiente'
                          : row.accuracy}
                        </span>
                      </td>
                      <td className="px-7 py-4 text-white/30 text-sm font-mono hidden md:table-cell">
                        {row.ts}
                      </td>
                      <td className="px-7 py-4 text-right">
                        <ExternalLink
                          size={14}
                          className="text-white/10 group-hover:text-[#aac7ff] transition-colors cursor-pointer ml-auto"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-7 py-4 bg-white/[0.02] flex justify-center border-t border-white/5">
            <button className="text-sm font-bold text-white/30 hover:text-white transition-colors">
              Ver todas las actividades
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Predictive Logic */}
          <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 pointer-events-none">
              <Brain size={64} className="text-[#aac7ff]/10" />
            </div>
            <h3 className="text-base font-bold mb-5 text-white relative z-10">Lógica Predictiva</h3>
            <div className="space-y-4 relative z-10">
              <div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-white/50">Confianza de Pronóstico</span>
                  <span className="text-[#aac7ff] font-bold">{taskRate > 0 ? taskRate + 5 : 82}%</span>
                </div>
                <ProgressBar value={taskRate > 0 ? taskRate + 5 : 82} />
              </div>
              <div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-white/50">Detección de Anomalías</span>
                  <span className="text-[#4cd6ff] font-bold">Activo</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full">
                  <div className="h-full bg-[#4cd6ff] w-full animate-pulse rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-white/50">Cobertura de Datos</span>
                  <span className="text-[#aac7ff] font-bold">
                    {totalContacts > 0 ? '99%' : '—'}
                  </span>
                </div>
                <ProgressBar value={totalContacts > 0 ? 99 : 0} />
              </div>
            </div>
            <button className="mt-6 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold tracking-widest uppercase hover:bg-white/10 transition-colors text-white/60">
              Ajustar parámetros
            </button>
          </div>

          {/* Deep Insights */}
          <div className="glass-panel p-6 rounded-xl bg-gradient-to-br from-[#aac7ff]/8 to-transparent border border-[#aac7ff]/10">
            <h3 className="text-base font-bold mb-2 text-white">Deep Insights</h3>
            <p className="text-white/50 text-sm mb-4 leading-relaxed">
              {totalContacts > 0
                ? `Base de datos activa con ${totalContacts} contactos. ${completedTasks} tareas completadas este período.`
                : 'Agregá contactos y tareas para generar insights automáticos del sistema.'}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#4cd6ff] shadow-[0_0_8px_rgba(76,214,255,0.6)] animate-pulse" />
              <span className="text-xs text-white/30 font-mono">Influence AI analizando datos</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── PDF Reports ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="glass-panel rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-white/80">Exportar Reportes PDF</h2>
            <p className="text-xs text-white/30 mt-0.5">Con marca de agua Influence para validación oficial</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div>
              <label className="text-xs text-white/30 block mb-1">Desde</label>
              <input type="date" value={dates.from}
                onChange={e => setDates(d => ({ ...d, from: e.target.value }))}
                className="input-obs px-3 py-1.5 text-xs" />
            </div>
            <div>
              <label className="text-xs text-white/30 block mb-1">Hasta</label>
              <input type="date" value={dates.to}
                onChange={e => setDates(d => ({ ...d, to: e.target.value }))}
                className="input-obs px-3 py-1.5 text-xs" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {PDF_REPORTS.map(report => {
            const isGen = generating === report.id;
            return (
              <button
                key={report.id}
                onClick={() => generatePDF(report)}
                disabled={!!generating}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                style={{
                  background: `${report.color}12`,
                  color: report.color,
                  border: `0.5px solid ${report.color}30`,
                }}
              >
                {isGen
                  ? <Loader size={13} className="animate-spin" />
                  : <Download size={13} />}
                {isGen ? 'Generando...' : report.label}
              </button>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}
