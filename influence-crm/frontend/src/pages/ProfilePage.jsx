import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Lock, Globe, Clock, Bell, BellOff,
  Camera, Save, Eye, EyeOff, CheckCircle, LayoutGrid,
  Shield, Sliders, Trash2, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

// ── Constants ─────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
];

const TIMEZONES = [
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Bogota',       label: 'Bogotá (GMT-5)' },
  { value: 'America/Lima',         label: 'Lima (GMT-5)' },
  { value: 'America/Santiago',     label: 'Santiago (GMT-4)' },
  { value: 'America/Caracas',      label: 'Caracas (GMT-4)' },
  { value: 'America/Mexico_City',  label: 'Ciudad de México (GMT-6)' },
  { value: 'America/New_York',     label: 'Nueva York (GMT-5)' },
  { value: 'America/Los_Angeles',  label: 'Los Ángeles (GMT-8)' },
  { value: 'Europe/Madrid',        label: 'Madrid (GMT+1)' },
  { value: 'Europe/London',        label: 'Londres (GMT+0)' },
  { value: 'UTC',                  label: 'UTC (GMT+0)' },
];

const TABS = [
  { id: 'profile',  label: 'Perfil',         icon: User    },
  { id: 'prefs',    label: 'Preferencias',   icon: Sliders },
  { id: 'notifs',   label: 'Notificaciones', icon: Bell    },
  { id: 'security', label: 'Seguridad',      icon: Shield  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function resizeImage(file, maxPx = 256) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height, maxPx);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Center-crop
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function AvatarUpload({ avatar, name, onAvatarChange }) {
  const inputRef = useRef();

  const handleFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    const b64 = await resizeImage(file, 256);
    onAvatarChange(b64);
    toast.success('Foto actualizada — guardá los cambios');
  }, [onAvatarChange]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group cursor-pointer" onClick={() => inputRef.current?.click()}>
        {avatar ? (
          <img
            src={avatar}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover ring-2 ring-[#aac7ff]/20"
          />
        ) : (
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-[#003064]"
            style={{ background: 'linear-gradient(135deg, #aac7ff 0%, #3e90ff 100%)' }}>
            {name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera size={20} className="text-white" />
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-xs text-white/40 hover:text-[#aac7ff] transition-colors"
      >
        Cambiar foto
      </button>
      {avatar && (
        <button
          type="button"
          onClick={() => onAvatarChange(null)}
          className="text-xs text-[#ffb4ab]/60 hover:text-[#ffb4ab] transition-colors flex items-center gap-1"
        >
          <Trash2 size={10} /> Eliminar foto
        </button>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        {description && <p className="text-xs text-white/35 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={clsx(
          'w-11 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0',
          checked ? 'bg-[#aac7ff]/80' : 'bg-white/10'
        )}
      >
        <span className={clsx(
          'absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200',
          checked ? 'translate-x-5 bg-white' : 'translate-x-0.5 bg-white/40'
        )} />
      </button>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function ProfileTab({ form, setForm, saving, onSave }) {
  return (
    <div className="space-y-6">
      <AvatarUpload
        avatar={form.avatar}
        name={form.name}
        onAvatarChange={(v) => setForm(f => ({ ...f, avatar: v }))}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Nombre completo</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Tu nombre"
              className="input-obs pl-9 pr-3 py-2.5 w-full text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="tu@empresa.com"
              className="input-obs pl-9 pr-3 py-2.5 w-full text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Teléfono</label>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={form.phone || ''}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+54 11 1234-5678"
              className="input-obs pl-9 pr-3 py-2.5 w-full text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={onSave} disabled={saving}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50">
          {saving ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
            : <><Save size={14} /> Guardar cambios</>}
        </button>
      </div>
    </div>
  );
}

function PrefsTab({ form, setForm, saving, onSave }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Idioma</label>
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 z-10" />
            <select
              value={form.language || 'es'}
              onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
              className="input-obs pl-9 pr-3 py-2.5 w-full text-sm appearance-none"
            >
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Zona horaria</label>
          <div className="relative">
            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 z-10" />
            <select
              value={form.timezone || 'America/Buenos_Aires'}
              onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              className="input-obs pl-9 pr-3 py-2.5 w-full text-sm appearance-none"
            >
              {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Visualización</h3>
        <Toggle
          checked={form.compact_mode || false}
          onChange={v => setForm(f => ({ ...f, compact_mode: v }))}
          label="Modo compacto"
          description="Reduce el espaciado en listas y tablas para ver más contenido"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={onSave} disabled={saving}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50">
          {saving ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
            : <><Save size={14} /> Guardar preferencias</>}
        </button>
      </div>
    </div>
  );
}

function NotifsTab({ form, setForm, saving, onSave }) {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-5 space-y-5">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Canales de notificación</h3>
        <Toggle
          checked={form.notifications_email !== false}
          onChange={v => setForm(f => ({ ...f, notifications_email: v }))}
          label="Notificaciones por email"
          description="Recibe alertas de nuevos leads, tareas vencidas y mensajes importantes"
        />
        <div className="h-px bg-white/5" />
        <Toggle
          checked={form.notifications_wa !== false}
          onChange={v => setForm(f => ({ ...f, notifications_wa: v }))}
          label="Notificaciones por WhatsApp"
          description="Recibe resúmenes diarios y alertas críticas en tu WhatsApp"
        />
      </div>

      <div className="glass-panel rounded-xl p-5 space-y-5">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Tipos de alertas</h3>
        <div className="space-y-4 opacity-60 pointer-events-none">
          <Toggle checked={true} onChange={() => {}} label="Nuevos leads" description="Cuando llega un lead desde webhook o formulario" />
          <div className="h-px bg-white/5" />
          <Toggle checked={true} onChange={() => {}} label="Mensajes de WhatsApp" description="Cuando recibes mensajes nuevos" />
          <div className="h-px bg-white/5" />
          <Toggle checked={false} onChange={() => {}} label="Recordatorios de tareas" description="24 horas antes del vencimiento" />
        </div>
        <p className="text-xs text-white/25">Configuración granular disponible próximamente</p>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={onSave} disabled={saving}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50">
          {saving ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
            : <><Save size={14} /> Guardar notificaciones</>}
        </button>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false });
  const [saving, setSaving] = useState(false);

  const strength = (() => {
    const p = form.next;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const strengthColor = ['#ff4444', '#ffb77f', '#ffe066', '#aac7ff', '#4cd6ff'];

  const handleChange = async (e) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (form.next.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/password', { current_password: form.current, new_password: form.next });
      toast.success('Contraseña actualizada');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleChange} className="space-y-4">
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Contraseña actual</label>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type={show.current ? 'text' : 'password'}
              value={form.current}
              onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
              placeholder="••••••••"
              className="input-obs pl-9 pr-10 py-2.5 w-full text-sm"
              required
            />
            <button type="button" onClick={() => setShow(s => ({ ...s, current: !s.current }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
              {show.current ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">Nueva contraseña</label>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type={show.next ? 'text' : 'password'}
              value={form.next}
              onChange={e => setForm(f => ({ ...f, next: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
              className="input-obs pl-9 pr-10 py-2.5 w-full text-sm"
              required
            />
            <button type="button" onClick={() => setShow(s => ({ ...s, next: !s.next }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
              {show.next ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {strength !== null && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[0,1,2,3].map(i => (
                  <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-300"
                    style={{ background: i < strength ? strengthColor[strength] : 'rgba(255,255,255,0.1)' }} />
                ))}
              </div>
              <p className="text-xs" style={{ color: strengthColor[strength] }}>{strengthLabel[strength]}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">Confirmar nueva contraseña</label>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="password"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="Repetí la contraseña"
              className="input-obs pl-9 pr-3 py-2.5 w-full text-sm"
              required
            />
            {form.confirm && (
              <div className={clsx(
                'absolute right-3 top-1/2 -translate-y-1/2',
                form.next === form.confirm ? 'text-[#4cd6ff]' : 'text-[#ffb4ab]'
              )}>
                {form.next === form.confirm ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50">
            {saving ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Actualizando...</>
              : <><Shield size={14} /> Cambiar contraseña</>}
          </button>
        </div>
      </form>

      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Sesión activa</h3>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#4cd6ff] shadow-[0_0_8px_rgba(76,214,255,0.6)]" />
          <div>
            <p className="text-sm text-white/70 font-medium">Este dispositivo</p>
            <p className="text-xs text-white/30">Token válido por 7 días desde el último inicio de sesión</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name:                 user?.name || '',
    email:                user?.email || '',
    phone:                user?.phone || '',
    avatar:               user?.avatar || null,
    language:             user?.language || 'es',
    timezone:             user?.timezone || 'America/Buenos_Aires',
    compact_mode:         user?.compact_mode || false,
    notifications_email:  user?.notifications_email !== false,
    notifications_wa:     user?.notifications_wa    !== false,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      setUser(data);
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const tabProps = { form, setForm, saving, onSave: handleSave };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="page-title text-[2rem]">
          Mi <span className="page-title-accent">Perfil</span>
        </h1>
        <p className="page-subtitle">
          {user?.email} · {user?.role === 'admin' ? 'Administrador' : 'Miembro del equipo'}
        </p>
      </motion.div>

      {/* Tab bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex gap-1 p-1 rounded-xl ghost-border bg-white/[0.02]"
      >
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200',
                active
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/5'
              )}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="glass-panel rounded-xl p-6"
        >
          {activeTab === 'profile'  && <ProfileTab  {...tabProps} />}
          {activeTab === 'prefs'    && <PrefsTab    {...tabProps} />}
          {activeTab === 'notifs'   && <NotifsTab   {...tabProps} />}
          {activeTab === 'security' && <SecurityTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
