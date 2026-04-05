import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login, token, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });

  if (token) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (!result.success) toast.error(result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#131313' }}>
      {/* Ambient bloom */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: 'rgba(170,199,255,0.06)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-[80px]"
          style={{ background: 'rgba(62,144,255,0.04)' }} />
      </div>

      <div className="w-full max-w-sm px-6 relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-glow-blue"
            style={{ background: 'linear-gradient(135deg, #aac7ff 0%, #3e90ff 100%)' }}>
            <span className="text-2xl font-black text-[#003064]">I</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">influence</h1>
          <p className="text-white/30 mt-1.5 text-[10px] tracking-[0.3em] uppercase font-bold">CRM &amp; Marketing</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8 shadow-ambient">
          <h2 className="text-lg font-bold text-white mb-6 tracking-tight">Iniciar Sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@influence.com"
                className="input-obs w-full px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Contraseña</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="input-obs w-full px-4 py-3 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 text-sm mt-2 rounded-xl">
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/15 text-[10px] mt-6 font-medium tracking-widest uppercase">
          Influence CRM v2.0 — Obsidian Glass
        </p>
      </div>
    </div>
  );
}
