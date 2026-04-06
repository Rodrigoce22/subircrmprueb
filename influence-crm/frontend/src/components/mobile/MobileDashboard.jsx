import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, ChevronRight, MoreHorizontal,
  TrendingUp, CheckSquare, MessageSquare, Target,
  Clock, Award, Zap, Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

// ── Pipeline bar (CSS-based, lightweight) ──────────────────────────────────

function PipelineBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#8b90a0] uppercase tracking-wide font-medium">{label}</span>
        <span className="text-[10px] font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}60, ${color})` }}
        />
      </div>
    </div>
  )
}

// ── KPI Card (full-width list style) ───────────────────────────────────────

function KPICard({ icon: Icon, label, value, badge, color = '#aac7ff', onClick }) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="rounded-[1.5rem] p-4 flex items-center gap-4 cursor-pointer active:opacity-80 transition-opacity"
      style={{
        background: 'rgba(28,27,27,0.7)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '0.5px solid rgba(65,71,85,0.2)',
      }}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <Icon className="w-6 h-6" style={{ color }} strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-[#8b90a0] uppercase tracking-widest font-medium">{label}</p>
        <p className="text-2xl font-bold text-[#e5e2e1] tracking-tight">{value}</p>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[10px] uppercase tracking-wide font-bold px-2.5 py-1 rounded-lg text-[#003064]"
            style={{ background: 'linear-gradient(135deg, #aac7ff, #3e90ff)' }}>
            {badge}
          </span>
        )}
        <ChevronRight className="w-5 h-5 text-[#414755]" strokeWidth={1.5} />
      </div>
    </motion.div>
  )
}

// ── Main Mobile Dashboard ───────────────────────────────────────────────────

export default function MobileDashboard({ user, data }) {
  const navigate  = useNavigate()

  const d = data || {}
  const charts    = d.charts || {}
  const taskPct   = d.tasks?.total > 0 ? Math.round((d.tasks.completed / d.tasks.total) * 100) : 0
  const convRate  = d.conversion_rate || 0
  const firstName = user?.name?.split(' ')[0] || 'Director'

  const pipeline      = charts.pipelineDistribution || []
  const maxPipelineVal = Math.max(...pipeline.map(p => p.value || 0), 1)

  const kpiCards = [
    { icon: Users,        label: 'CONTACTOS',  value: String(d.contacts || 0),        color: '#3e90ff', path: '/contacts'  },
    { icon: Target,       label: 'CONVERSIÓN', value: `${convRate}%`,                  color: '#10b981', path: '/pipeline'  },
    { icon: CheckSquare,  label: 'TAREAS',     value: String(d.tasks?.total || 0),     color: '#f59e0b', path: '/tasks'     },
    { icon: MessageSquare,label: 'MENSAJES',   value: String(d.messages?.today || 0),  color: '#8b5cf6', path: '/whatsapp',
      badge: d.messages?.today > 0 ? 'NUEVO' : undefined },
  ]

  const miniStats = [
    { icon: TrendingUp, value: d.converted_contacts || 0, label: 'Clientes cerrados', color: '#3e90ff' },
    { icon: Zap,        value: d.tasks?.pending || 0,      label: 'Pendientes',        color: '#f59e0b' },
    { icon: Award,      value: d.tasks?.completed || 0,    label: 'Completadas',       color: '#10b981' },
    { icon: Clock,      value: d.tasks?.in_progress || 0,  label: 'En progreso',       color: '#8b5cf6' },
  ]

  const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  }

  return (
    <div className="min-h-screen" style={{ background: '#131313' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #aac7ff, #3e90ff)' }}>
            <span className="text-[#003064] text-sm font-black">
              {firstName[0]?.toUpperCase()}
            </span>
          </div>
          <span className="text-[#e5e2e1] font-semibold text-lg tracking-tight">Echo Influence</span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center active:scale-90 transition-transform" aria-label="Buscar">
          <Search className="w-5 h-5 text-[#8b90a0]" strokeWidth={1.5} />
        </button>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <main className="px-5 pb-36 space-y-5">

        {/* Hero */}
        <section className="flex items-start justify-between">
          <div>
            <p className="text-[10px] text-[#8b90a0] uppercase tracking-[0.2em] font-bold mb-1">
              {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <h1 className="text-[2rem] font-bold text-[#e5e2e1] tracking-tight leading-tight">
              {getGreeting()},
            </h1>
            <h2 className="text-[1.5rem] font-bold tracking-tight leading-tight"
              style={{ background: 'linear-gradient(135deg, #aac7ff, #3e90ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {firstName}
            </h2>
          </div>

          {/* Weather Widget */}
          <div className="relative flex items-center gap-2.5 rounded-2xl px-4 py-3 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(30,42,58,0.9), rgba(28,27,27,0.9))',
              border: '0.5px solid rgba(62,144,255,0.2)',
              backdropFilter: 'blur(20px)',
            }}>
            <div className="absolute inset-0 opacity-10"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(62,144,255,0.4), transparent)', animation: 'shimmer 3s ease infinite' }} />
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-md opacity-50" style={{ background: '#FFB800' }} />
              <svg className="w-6 h-6 text-[#FFB800] relative" style={{ animation: 'spin 20s linear infinite' }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="5" fill="#FFB800" stroke="none" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
            <div className="text-right relative">
              <span className="text-[#e5e2e1] font-bold text-base">24°C</span>
              <p className="text-[#aac7ff] text-[10px] uppercase tracking-wide font-medium">SF</p>
            </div>
          </div>
        </section>

        {/* KPI Cards */}
        <motion.section variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
          {kpiCards.map((card) => (
            <motion.div key={card.label} variants={itemVariants}>
              <KPICard {...card} onClick={() => navigate(card.path)} />
            </motion.div>
          ))}
        </motion.section>

        {/* Pipeline Lifecycle */}
        <section className="rounded-[2rem] p-6"
          style={{
            background: 'rgba(28,27,27,0.8)',
            backdropFilter: 'blur(30px)',
            border: '0.5px solid rgba(65,71,85,0.2)',
          }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[#e5e2e1] font-bold text-sm uppercase tracking-wide">Pipeline Lifecycle</h2>
            <button className="w-8 h-8 flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5 text-[#8b90a0]" strokeWidth={1.5} />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {pipeline.length > 0 ? pipeline.map((stage) => (
              <PipelineBar key={stage.name} label={stage.name} value={stage.value} max={maxPipelineVal} color={stage.color || '#aac7ff'} />
            )) : (
              ['LEAD', 'CALIFICADO', 'PROPUESTA', 'NEGOC.', 'CERRADO'].map((label, i) => (
                <PipelineBar key={label} label={label} value={0} max={1}
                  color={['#aac7ff','#3e90ff','#ffb77f','#f59e0b','#10b981'][i]} />
              ))
            )}
          </div>

          <div className="flex border-t pt-5" style={{ borderColor: 'rgba(53,53,52,0.8)' }}>
            <div className="flex-1 text-center border-r" style={{ borderColor: 'rgba(53,53,52,0.8)' }}>
              <p className="text-2xl font-bold text-[#aac7ff]">
                {pipeline.reduce((s, p) => s + (p.value || 0), 0)}
              </p>
              <p className="text-[10px] text-[#8b90a0] uppercase tracking-wide mt-1">Deals activos</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-[#e5e2e1]">{d.contacts || 0}</p>
              <p className="text-[10px] text-[#8b90a0] uppercase tracking-wide mt-1">Contactos</p>
            </div>
          </div>
        </section>

        {/* Mini Stats — horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {miniStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label}
                className="flex items-center gap-3 flex-shrink-0 min-w-[148px] rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(28,27,27,0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '0.5px solid rgba(65,71,85,0.2)',
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${stat.color}18` }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#e5e2e1]">{stat.value}</p>
                  <p className="text-[10px] text-[#8b90a0] whitespace-nowrap">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Nueva Transacción CTA */}
        <button
          onClick={() => navigate('/pipeline')}
          className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-[#003064]"
          style={{ background: 'linear-gradient(135deg, #aac7ff 0%, #3e90ff 100%)' }}
        >
          <span className="text-lg font-black">+</span>
          <span>Nueva Transacción</span>
        </button>

      </main>
    </div>
  )
}
