import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Link2, Unlink, CheckCircle, Eye, EyeOff,
  Globe, Mail, CreditCard, Calendar, Webhook, Key, Settings,
  ChevronRight, ExternalLink, User, Save, Zap, Bot, Play,
  Palette, Bell, BellOff, SlidersHorizontal, Check,
  Monitor, LayoutGrid, Type, RefreshCw, GitBranch,
  MessageSquare, Users, Tag, CheckSquare, Megaphone,
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';
import { useAuthStore } from '../store/authStore';

// ── Integration definitions ────────────────────────────────────────────────────
const INTEGRATIONS = [
  {
    service: 'openai',
    name: 'OpenAI / OpenRouter',
    description: 'Habilita respuestas automáticas inteligentes en WhatsApp. Compatible con OpenAI (GPT-4, GPT-3.5) y OpenRouter (acceso a Claude, Llama, Mistral y más).',
    icon: Bot,
    color: '#4cd6ff',
    fields: [
      { key: 'openai_api_key',  label: 'API Key',     type: 'api_key', placeholder: 'sk-proj-... o tu clave de OpenRouter' },
      { key: 'openai_model',    label: 'Modelo',      type: 'config',  placeholder: 'gpt-3.5-turbo' },
      { key: 'openai_base_url', label: 'Base URL (OpenRouter: https://openrouter.ai/api/v1)', type: 'config', placeholder: 'https://api.openai.com/v1' }
    ],
    docs: 'https://openrouter.ai/keys',
    badge: 'IA'
  },
  {
    service: 'n8n',
    name: 'N8N Automatizaciones',
    description: 'Conecta el CRM con N8N para automatizar flujos: enviar emails, crear tickets, notificar en Slack y más cuando lleguen leads o mensajes.',
    icon: Zap,
    color: '#ffb77f',
    fields: [
      { key: 'n8n_webhook_url', label: 'URL del Webhook N8N (para recibir eventos del CRM)', type: 'config', placeholder: 'https://tu-n8n.app/webhook/...' }
    ],
    readonlyInfo: {
      label: 'URL para crear leads desde N8N → CRM',
      getValue: () => `${window.location.origin.replace('5173', '3002')}/api/webhooks/leads`
    },
    testAction: true,
    badge: 'Automatización'
  },
  {
    service: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sincroniza eventos del CRM con tu Google Calendar. Crea reuniones automáticamente cuando muevas un lead en el pipeline.',
    icon: Calendar,
    color: '#ffb4ab',
    fields: [
      { key: 'google_calendar_api_key', label: 'API Key de Google', type: 'api_key', placeholder: 'AIzaSy...' },
      { key: 'google_calendar_id',      label: 'ID del Calendario',  type: 'config',  placeholder: 'primary o tu-email@gmail.com' }
    ],
    docs: 'https://developers.google.com/calendar'
  },
  {
    service: 'smtp_email',
    name: 'Email (SMTP)',
    description: 'Envía emails automáticos a leads y clientes. Configura notificaciones y seguimientos por correo.',
    icon: Mail,
    color: '#aac7ff',
    fields: [
      { key: 'smtp_host', label: 'Servidor SMTP',              type: 'config',  placeholder: 'smtp.gmail.com' },
      { key: 'smtp_port', label: 'Puerto',                     type: 'config',  placeholder: '587' },
      { key: 'smtp_user', label: 'Usuario',                    type: 'config',  placeholder: 'tu@empresa.com' },
      { key: 'smtp_pass', label: 'Contraseña / App Password',  type: 'api_key', placeholder: '••••••••' }
    ]
  },
  {
    service: 'stripe',
    name: 'Stripe Pagos',
    description: 'Integra pagos para facturar a clientes directamente desde el CRM. Rastrea transacciones y cobros.',
    icon: CreditCard,
    color: '#4cff91',
    fields: [
      { key: 'stripe_publishable_key', label: 'Publishable Key', type: 'config',  placeholder: 'pk_live_...' },
      { key: 'stripe_secret_key',      label: 'Secret Key',      type: 'api_key', placeholder: 'sk_live_...' }
    ],
    docs: 'https://stripe.com/docs/keys'
  },
  {
    service: 'webhook_leads',
    name: 'Webhook de Leads',
    description: 'Recibe nuevos leads desde formularios externos (landing pages, Facebook Ads, etc.) via webhook POST.',
    icon: Webhook,
    color: '#3e90ff',
    fields: [
      { key: 'webhook_secret', label: 'Webhook Secret (para firmar)', type: 'api_key', placeholder: 'whsec_...' }
    ],
    readonlyInfo: {
      label: 'URL del Webhook',
      getValue: () => `${window.location.origin.replace('5173', '3002')}/api/webhooks/leads`
    }
  }
];

// ── Integration Card ───────────────────────────────────────────────────────────
const IntegrationCard = ({ integration, settingsData, onConnect, onDisconnect, onTest, isAdmin }) => {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({});
  const [showFields, setShowFields] = useState({});
  const [testing, setTesting] = useState(false);
  const { service, name, description, icon: Icon, color, fields, docs, readonlyInfo, testAction, badge } = integration;

  const connectedFields = fields.filter(f =>
    settingsData?.find(s => s.key === f.key && s.connected)
  );
  const isConnected = connectedFields.length > 0;

  const handleTest = async () => {
    setTesting(true);
    try {
      await onTest(service);
      toast.success('Prueba enviada con éxito');
    } catch {
      toast.error('Error en la prueba');
    }
    setTesting(false);
  };

  return (
    <div className="bg-[#201f1f] rounded-2xl overflow-hidden transition-all ghost-border">
      <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={() => isAdmin && setExpanded(e => !e)}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}>
          <Icon size={22} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-[#e5e2e1]">{name}</h3>
            {badge && (
              <span className="text-xs px-1.5 py-0.5 rounded-md font-medium bg-white/5 text-[#8b90a0]">{badge}</span>
            )}
            <span className={clsx(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              isConnected ? 'bg-[#4cd6ff]/10 text-[#4cd6ff]' : 'bg-[#414755]/30 text-[#8b90a0]'
            )}>
              {isConnected ? '● Conectado' : '○ Sin conectar'}
            </span>
          </div>
          <p className="text-xs text-[#8b90a0] mt-1 line-clamp-1">{description}</p>
        </div>
        {isAdmin && (
          <ChevronRight size={16} className={clsx('text-[#8b90a0] transition-transform flex-shrink-0', expanded && 'rotate-90')} />
        )}
      </div>

      {expanded && isAdmin && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
          <p className="text-sm text-[#c1c6d7] leading-relaxed">{description}</p>

          {readonlyInfo && (
            <div className="bg-[#2a2a2a]/60 rounded-xl p-3">
              <p className="text-xs text-[#8b90a0] mb-1.5">{readonlyInfo.label}</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-[#aac7ff] flex-1 break-all">{readonlyInfo.getValue()}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(readonlyInfo.getValue()); toast.success('Copiado'); }}
                  className="text-xs text-[#c1c6d7] hover:text-[#e5e2e1] ghost-border px-2 py-1 rounded-lg whitespace-nowrap">
                  Copiar
                </button>
              </div>
            </div>
          )}

          {fields.map(field => {
            const existing = settingsData?.find(s => s.key === field.key);
            const isSet = existing?.connected;
            return (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#c1c6d7]">{field.label}</label>
                  {isSet && <span className="text-xs text-[#4cd6ff] flex items-center gap-1"><CheckCircle size={10} /> Guardado</span>}
                </div>
                <div className="relative">
                  <input
                    type={field.type === 'api_key' && !showFields[field.key] ? 'password' : 'text'}
                    value={form[field.key] || ''}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={isSet ? '••••••••' : field.placeholder}
                    className="input-obs w-full px-4 py-2.5 text-sm pr-10"
                  />
                  {field.type === 'api_key' && (
                    <button type="button"
                      onClick={() => setShowFields(s => ({ ...s, [field.key]: !s[field.key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b90a0] hover:text-[#c1c6d7]">
                      {showFields[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {docs && (
            <a href={docs} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#aac7ff] hover:underline">
              <ExternalLink size={11} /> Ver documentación
            </a>
          )}

          <div className="flex gap-2 pt-1">
            {isConnected && (
              <button onClick={() => onDisconnect(service, fields)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[#ffb4ab] ghost-border hover:bg-[#ffb4ab]/10 transition-colors">
                <Unlink size={14} /> Desconectar
              </button>
            )}
            {testAction && isConnected && (
              <button onClick={handleTest} disabled={testing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[#ffb77f] ghost-border hover:bg-[#ffb77f]/10 transition-colors">
                <Play size={14} /> {testing ? 'Enviando...' : 'Probar'}
              </button>
            )}
            <button onClick={() => onConnect(service, form)}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-sm flex-1 justify-center">
              <Link2 size={14} /> {isConnected ? 'Actualizar' : 'Conectar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Profile Section ────────────────────────────────────────────────────────────
const ProfileSection = () => {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', profile);
      if (setUser) setUser(data);
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar perfil');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePwdChange = async (e) => {
    e.preventDefault();
    if (pwdForm.new_password !== pwdForm.confirm) return toast.error('Las contraseñas no coinciden');
    if (pwdForm.new_password.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres');
    setLoadingPwd(true);
    try {
      await api.put('/auth/password', { current_password: pwdForm.current_password, new_password: pwdForm.new_password });
      toast.success('Contraseña actualizada');
      setPwdForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Contraseña actual incorrecta');
    } finally {
      setLoadingPwd(false);
    }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) || 'U';

  return (
    <div className="space-y-4">
      {/* Avatar + info */}
      <div className="bg-[#201f1f] ghost-border rounded-2xl p-5">
        <h3 className="text-sm font-bold text-[#e5e2e1] font-display mb-4">Mi perfil</h3>
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl btn-primary flex items-center justify-center text-white text-xl font-black">
              {initials}
            </div>
          </div>
          <div>
            <p className="text-base font-bold text-[#e5e2e1]">{user?.name}</p>
            <p className="text-sm text-[#8b90a0]">{user?.email}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#aac7ff]/15 text-[#aac7ff] mt-1 inline-block capitalize">{user?.role}</span>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Nombre</label>
              <input value={profile.name} onChange={e => setProfile(f => ({ ...f, name: e.target.value }))}
                className="input-obs w-full px-4 py-2.5 text-sm" placeholder="Tu nombre" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Email</label>
              <input type="email" value={profile.email} onChange={e => setProfile(f => ({ ...f, email: e.target.value }))}
                className="input-obs w-full px-4 py-2.5 text-sm" placeholder="tu@email.com" />
            </div>
          </div>
          <button type="submit" disabled={loadingProfile}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
            <Save size={14} /> {loadingProfile ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Password change */}
      <div className="bg-[#201f1f] ghost-border rounded-2xl p-5">
        <h3 className="text-sm font-bold text-[#e5e2e1] font-display mb-4">Cambiar contraseña</h3>
        <form onSubmit={handlePwdChange} className="space-y-3">
          <input type="password" value={pwdForm.current_password}
            onChange={e => setPwdForm(f => ({ ...f, current_password: e.target.value }))}
            placeholder="Contraseña actual" className="input-obs w-full px-4 py-2.5 text-sm" />
          <input type="password" value={pwdForm.new_password}
            onChange={e => setPwdForm(f => ({ ...f, new_password: e.target.value }))}
            placeholder="Nueva contraseña (mín. 6 caracteres)" className="input-obs w-full px-4 py-2.5 text-sm" />
          <input type="password" value={pwdForm.confirm}
            onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))}
            placeholder="Confirmar nueva contraseña" className="input-obs w-full px-4 py-2.5 text-sm" />
          <button type="submit" disabled={loadingPwd}
            className="btn-primary w-full py-2.5 text-sm">
            {loadingPwd ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Appearance Section ─────────────────────────────────────────────────────────
const ACCENT_COLORS = [
  { label: 'Azul',     primary: '#aac7ff', secondary: '#3e90ff', id: 'blue'   },
  { label: 'Índigo',   primary: '#c3b1e1', secondary: '#6366f1', id: 'indigo' },
  { label: 'Esmeralda',primary: '#6ee7b7', secondary: '#10b981', id: 'emerald'},
  { label: 'Naranja',  primary: '#fed7aa', secondary: '#f97316', id: 'orange' },
  { label: 'Rosa',     primary: '#fda4af', secondary: '#f43f5e', id: 'rose'   },
  { label: 'Cyan',     primary: '#a5f3fc', secondary: '#06b6d4', id: 'cyan'   },
];

const AppearanceSection = () => {
  const [accent, setAccent]     = useState(() => localStorage.getItem('crm_accent') || 'blue');
  const [density, setDensity]   = useState(() => localStorage.getItem('crm_density') || 'comfortable');
  const [animations, setAnim]   = useState(() => localStorage.getItem('crm_animations') !== 'false');

  const save = () => {
    localStorage.setItem('crm_accent', accent);
    localStorage.setItem('crm_density', density);
    localStorage.setItem('crm_animations', String(animations));
    toast.success('Preferencias de apariencia guardadas — recarga para aplicar');
  };

  return (
    <div className="space-y-4">
      {/* Accent color */}
      <div className="bg-[#201f1f] ghost-border rounded-2xl p-5">
        <h3 className="text-sm font-bold text-[#e5e2e1] mb-1">Color de acento</h3>
        <p className="text-xs text-[#8b90a0] mb-4">Define el color principal de la interfaz</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ACCENT_COLORS.map(c => (
            <button key={c.id} onClick={() => setAccent(c.id)}
              className={clsx('flex flex-col items-center gap-2 p-3 rounded-xl transition-all ghost-border',
                accent === c.id ? 'bg-white/10' : 'hover:bg-white/5')}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})` }}>
                {accent === c.id && <Check size={14} className="text-white" />}
              </div>
              <span className="text-[10px] text-[#8b90a0]">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Density */}
      <div className="bg-[#201f1f] ghost-border rounded-2xl p-5">
        <h3 className="text-sm font-bold text-[#e5e2e1] mb-1">Densidad de la UI</h3>
        <p className="text-xs text-[#8b90a0] mb-4">Controla el espaciado entre elementos</p>
        <div className="flex gap-3">
          {[
            { id: 'compact',      label: 'Compacto',    desc: 'Más contenido visible' },
            { id: 'comfortable',  label: 'Cómodo',      desc: 'Balance ideal' },
            { id: 'spacious',     label: 'Espacioso',   desc: 'Más respiro' },
          ].map(d => (
            <button key={d.id} onClick={() => setDensity(d.id)}
              className={clsx('flex-1 p-4 rounded-xl text-left transition-all ghost-border',
                density === d.id ? 'bg-[#aac7ff]/10 border-[#aac7ff]/30' : 'hover:bg-white/5')}>
              <p className={clsx('text-sm font-semibold', density === d.id ? 'text-[#aac7ff]' : 'text-[#e5e2e1]')}>{d.label}</p>
              <p className="text-xs text-[#8b90a0] mt-0.5">{d.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Animations */}
      <div className="bg-[#201f1f] ghost-border rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#e5e2e1]">Animaciones</h3>
            <p className="text-xs text-[#8b90a0] mt-0.5">Transiciones y efectos de movimiento</p>
          </div>
          <button onClick={() => setAnim(a => !a)}
            className={clsx('w-12 h-6 rounded-full transition-all duration-300 relative',
              animations ? 'bg-[#3e90ff]' : 'bg-white/10')}>
            <div className={clsx('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300',
              animations ? 'left-6' : 'left-0.5')} />
          </button>
        </div>
      </div>

      <button onClick={save} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
        <Save size={14} /> Guardar apariencia
      </button>
    </div>
  );
};

// ── Notifications Section ──────────────────────────────────────────────────────
const NotificationsSection = () => {
  const [prefs, setPrefs] = useState({
    new_lead:        true,
    new_message:     true,
    task_assigned:   true,
    task_due:        true,
    pipeline_change: false,
    daily_summary:   false,
  });

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const notifItems = [
    { key: 'new_lead',        icon: Users,        label: 'Nuevo lead',              desc: 'Cuando se recibe un lead nuevo en el pipeline' },
    { key: 'new_message',     icon: MessageSquare,label: 'Nuevo mensaje',            desc: 'Cuando llega un mensaje de WhatsApp' },
    { key: 'task_assigned',   icon: CheckSquare,  label: 'Tarea asignada',          desc: 'Cuando te asignan una nueva tarea' },
    { key: 'task_due',        icon: CheckSquare,  label: 'Tarea próxima a vencer',  desc: 'Recordatorio 24 horas antes del vencimiento' },
    { key: 'pipeline_change', icon: GitBranch,    label: 'Cambio en pipeline',      desc: 'Cuando un contacto cambia de etapa' },
    { key: 'daily_summary',   icon: LayoutGrid,   label: 'Resumen diario',          desc: 'Email matutino con métricas del día anterior' },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-[#201f1f] ghost-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-[#e5e2e1]">Notificaciones push</h3>
          <p className="text-xs text-[#8b90a0] mt-0.5">Controla qué eventos generan notificaciones en el navegador</p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {notifItems.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-[#8b90a0]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#e5e2e1]">{item.label}</p>
                    <p className="text-xs text-[#8b90a0]">{item.desc}</p>
                  </div>
                </div>
                <button onClick={() => toggle(item.key)}
                  className={clsx('w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0',
                    prefs[item.key] ? 'bg-[#3e90ff]' : 'bg-white/10')}>
                  <div className={clsx('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300',
                    prefs[item.key] ? 'left-5' : 'left-0.5')} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <button onClick={() => toast.success('Preferencias de notificaciones guardadas')}
        className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
        <Save size={14} /> Guardar notificaciones
      </button>
    </div>
  );
};

// ── CRM Preferences Section ────────────────────────────────────────────────────
const CRMSection = () => {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [pipelineStages, setPipelineStages] = useState([
    { id: 1, name: 'Nuevo Lead',    color: '#aac7ff' },
    { id: 2, name: 'Contactado',    color: '#3e90ff' },
    { id: 3, name: 'Negociando',    color: '#ffb77f' },
    { id: 4, name: 'Propuesta',     color: '#f59e0b' },
    { id: 5, name: 'Convertido',    color: '#10b981' },
    { id: 6, name: 'Perdido',       color: '#ffb4ab' },
  ]);

  const [contactStatuses, setContactStatuses] = useState([
    { id: 1, name: 'Lead',       color: '#aac7ff' },
    { id: 2, name: 'Prospecto',  color: '#f59e0b' },
    { id: 3, name: 'Cliente',    color: '#10b981' },
    { id: 4, name: 'Inactivo',   color: '#8b90a0' },
  ]);

  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [timeZone, setTimeZone]               = useState('America/Los_Angeles');

  const save = () => {
    try {
      localStorage.setItem('crm_pipeline_stages', JSON.stringify(pipelineStages));
      localStorage.setItem('crm_contact_statuses', JSON.stringify(contactStatuses));
      localStorage.setItem('crm_currency', defaultCurrency);
      localStorage.setItem('crm_timezone', timeZone);
      toast.success('Configuración del CRM guardada');
    } catch {
      toast.error('Error al guardar');
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-[#201f1f] ghost-border rounded-2xl p-6 text-center">
        <Key size={32} className="text-[#414755] mx-auto mb-3" />
        <p className="text-[#c1c6d7] text-sm">Solo los administradores pueden configurar el CRM.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pipeline stages */}
      <div className="bg-[#201f1f] ghost-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#e5e2e1]">Etapas del pipeline</h3>
            <p className="text-xs text-[#8b90a0] mt-0.5">Personaliza las etapas del embudo de ventas</p>
          </div>
          <button onClick={() => setPipelineStages(s => [...s, { id: Date.now(), name: 'Nueva etapa', color: '#8b90a0' }])}
            className="btn-glass text-xs px-3 py-1.5 flex items-center gap-1.5">
            <span>+</span> Añadir
          </button>
        </div>
        <div className="space-y-2">
          {pipelineStages.map((stage, i) => (
            <div key={stage.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] group">
              <input type="color" value={stage.color}
                onChange={e => setPipelineStages(s => s.map((st, si) => si === i ? {...st, color: e.target.value} : st))}
                className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent" />
              <input value={stage.name}
                onChange={e => setPipelineStages(s => s.map((st, si) => si === i ? {...st, name: e.target.value} : st))}
                className="input-obs flex-1 px-3 py-1.5 text-sm" />
              {pipelineStages.length > 2 && (
                <button onClick={() => setPipelineStages(s => s.filter((_, si) => si !== i))}
                  className="opacity-0 group-hover:opacity-100 text-[#ffb4ab]/50 hover:text-[#ffb4ab] transition-all w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#ffb4ab]/10">
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact statuses */}
      <div className="bg-[#201f1f] ghost-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#e5e2e1]">Estados de contactos</h3>
            <p className="text-xs text-[#8b90a0] mt-0.5">Define los estados que pueden tener tus contactos</p>
          </div>
          <button onClick={() => setContactStatuses(s => [...s, { id: Date.now(), name: 'Nuevo estado', color: '#8b90a0' }])}
            className="btn-glass text-xs px-3 py-1.5 flex items-center gap-1.5">
            <span>+</span> Añadir
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {contactStatuses.map((status, i) => (
            <div key={status.id} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] group">
              <input type="color" value={status.color}
                onChange={e => setContactStatuses(s => s.map((st, si) => si === i ? {...st, color: e.target.value} : st))}
                className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent flex-shrink-0" />
              <input value={status.name}
                onChange={e => setContactStatuses(s => s.map((st, si) => si === i ? {...st, name: e.target.value} : st))}
                className="input-obs flex-1 px-2 py-1 text-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* General CRM settings */}
      <div className="bg-[#201f1f] ghost-border rounded-2xl p-5">
        <h3 className="text-sm font-bold text-[#e5e2e1] mb-4">Preferencias generales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Moneda predeterminada</label>
            <select value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)}
              className="input-obs w-full px-4 py-2.5 text-sm">
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="MXN">MXN — Peso mexicano</option>
              <option value="COP">COP — Peso colombiano</option>
              <option value="ARS">ARS — Peso argentino</option>
              <option value="CLP">CLP — Peso chileno</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Zona horaria</label>
            <select value={timeZone} onChange={e => setTimeZone(e.target.value)}
              className="input-obs w-full px-4 py-2.5 text-sm">
              <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
              <option value="America/New_York">Nueva York (GMT-5)</option>
              <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
              <option value="America/Bogota">Bogotá (GMT-5)</option>
              <option value="America/Santiago">Santiago (GMT-3)</option>
              <option value="America/Buenos_Aires">Buenos Aires (GMT-3)</option>
              <option value="Europe/Madrid">Madrid (GMT+1)</option>
            </select>
          </div>
        </div>
      </div>

      <button onClick={save} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
        <Save size={14} /> Guardar configuración del CRM
      </button>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState('profile');

  const { data: settingsData = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => isAdmin ? api.get('/settings').then(r => r.data) : Promise.resolve([]),
    enabled: isAdmin
  });

  const connectMutation = useMutation({
    mutationFn: async ({ service, form }) => {
      const entries = Object.entries(form).filter(([, v]) => v);
      if (!entries.length) { toast.error('Ingresa al menos un campo'); throw new Error(); }
      await Promise.all(entries.map(([key, value]) =>
        api.post('/settings', { service, key, value, type: 'api_key' })
      ));
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Integración guardada'); },
    onError: () => {}
  });

  const disconnectMutation = useMutation({
    mutationFn: async ({ service, fields }) => {
      await Promise.all(fields.map(f => api.delete(`/settings/${f.key}`)));
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Integración desconectada'); }
  });

  const testN8N = async (service) => {
    await api.post('/webhooks/n8n-test');
  };

  const TABS = [
    { id: 'profile',      label: 'Perfil',        icon: User              },
    { id: 'appearance',   label: 'Apariencia',    icon: Palette           },
    { id: 'notifications',label: 'Notificaciones', icon: Bell             },
    { id: 'crm',          label: 'CRM',           icon: SlidersHorizontal },
    { id: 'integrations', label: 'Integraciones', icon: Link2             },
  ];

  return (
    <div className="space-y-5 pb-6 max-w-3xl mx-auto">
      <div>
        <h1 className="page-title text-[2rem] lg:text-[2.5rem]">Configuración</h1>
        <p className="page-subtitle">Personaliza tu experiencia y las preferencias del CRM</p>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-1 bg-[#201f1f] rounded-xl p-1 w-max min-w-full">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  tab === t.id ? 'bg-[#aac7ff]/20 text-[#aac7ff]' : 'text-white/40 hover:text-white/70'
                )}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'profile'       && <ProfileSection />}
      {tab === 'appearance'    && <AppearanceSection />}
      {tab === 'notifications' && <NotificationsSection />}
      {tab === 'crm'           && <CRMSection />}

      {tab === 'integrations' && (
        <div className="space-y-3">
          {!isAdmin && (
            <div className="bg-[#201f1f] rounded-2xl p-6 text-center">
              <Key size={32} className="text-[#414755] mx-auto mb-3" />
              <p className="text-[#c1c6d7] text-sm">Solo los administradores pueden gestionar integraciones.</p>
            </div>
          )}
          {isAdmin && INTEGRATIONS.map(integration => (
            <IntegrationCard
              key={integration.service}
              integration={integration}
              settingsData={settingsData}
              isAdmin={isAdmin}
              onConnect={(service, form) => connectMutation.mutate({ service, form })}
              onDisconnect={(service, fields) => disconnectMutation.mutate({ service, fields })}
              onTest={testN8N}
            />
          ))}
        </div>
      )}
    </div>
  );
}
