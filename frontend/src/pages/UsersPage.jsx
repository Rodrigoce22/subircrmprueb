import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, UserX } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';

const inputCls = 'input-obs w-full px-4 py-2.5 text-sm';
const selectCls = 'input-obs w-full px-3 py-2.5 text-sm';

const UserModal = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState(user || { name: '', email: '', password: '', role: 'user' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#201f1f] ghost-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-ambient">
        <h2 className="text-lg font-bold text-[#e5e2e1] font-display mb-5">
          {user ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h2>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Nombre *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className={inputCls} />
          </div>
          {!user && (
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Contrasena *</label>
              <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className={inputCls} />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Rol</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className={selectCls}>
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl ghost-border text-[#c1c6d7] hover:text-[#e5e2e1] text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 py-2.5 text-sm">
              {user ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data)
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id ? api.put(`/users/${data.id}`, data) : api.post('/users', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setModal(null); toast.success('Usuario guardado'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Error')
  });

  const toggleMutation = useMutation({
    mutationFn: (u) => api.put(`/users/${u.id}`, { ...u, active: !u.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] })
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#e5e2e1] font-display tracking-tight">Usuarios del Equipo</h1>
        <button onClick={() => setModal({})}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Plus size={15} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-[#201f1f] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#131317]">
              <th className="text-left text-xs font-semibold text-[#8b90a0] uppercase tracking-wider px-4 py-3">Usuario</th>
              <th className="text-left text-xs font-semibold text-[#8b90a0] uppercase tracking-wider px-4 py-3 hidden md:table-cell">Email</th>
              <th className="text-left text-xs font-semibold text-[#8b90a0] uppercase tracking-wider px-4 py-3">Rol</th>
              <th className="text-left text-xs font-semibold text-[#8b90a0] uppercase tracking-wider px-4 py-3">Estado</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12">
                <div className="inline-block w-8 h-8 border-2 border-[#aac7ff] border-t-transparent rounded-full animate-spin" />
              </td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-[#2a2a2a]/40 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                      u.active ? 'btn-primary' : 'bg-[#2a2a2a]'
                    )}>
                      {u.name[0]?.toUpperCase()}
                    </div>
                    <span className={clsx('text-sm font-medium', u.active ? 'text-[#e5e2e1]' : 'text-[#8b90a0]')}>
                      {u.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell text-sm text-[#c1c6d7]">{u.email}</td>
                <td className="px-4 py-3.5">
                  <span className={clsx(
                    'text-xs px-2.5 py-1 rounded-full font-medium',
                    u.role === 'admin'
                      ? 'bg-[#aac7ff]/15 text-[#aac7ff]'
                      : 'bg-[#414755]/30 text-[#c1c6d7]'
                  )}>
                    {u.role === 'admin' ? 'Admin' : 'Usuario'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={clsx(
                    'text-xs px-2.5 py-1 rounded-full',
                    u.active
                      ? 'bg-[#4cd6ff]/10 text-[#4cd6ff]'
                      : 'bg-[#93000a]/30 text-[#ffb4ab]'
                  )}>
                    {u.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setModal(u)} className="text-[#8b90a0] hover:text-[#aac7ff] transition-colors p-1">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => toggleMutation.mutate(u)} className="text-[#8b90a0] hover:text-[#ffb4ab] transition-colors p-1">
                      <UserX size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <UserModal user={modal.id ? modal : null} onClose={() => setModal(null)} onSave={saveMutation.mutate} />
      )}
    </div>
  );
}
