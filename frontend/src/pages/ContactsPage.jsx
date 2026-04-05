import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

const STATUS_COLORS = {
  lead:     'bg-[#aac7ff]/15 text-[#aac7ff]',
  prospect: 'bg-[#ffb77f]/10 text-[#ffb77f]',
  client:   'bg-[#4cd6ff]/10 text-[#4cd6ff]',
  inactive: 'bg-[#414755]/30 text-[#c1c6d7]'
};
const STATUS_LABELS = { lead: 'Lead', prospect: 'Prospecto', client: 'Cliente', inactive: 'Inactivo' };

const inputCls = 'input-obs w-full px-4 py-2.5 text-sm';

const ContactModal = ({ open, contact, users, onClose, onSave }) => {
  const [form, setForm] = useState(contact || {
    name: '', phone: '', email: '', company: '', status: 'lead', notes: '', assigned_to: ''
  });

  React.useEffect(() => {
    setForm(contact || { name: '', phone: '', email: '', company: '', status: 'lead', notes: '', assigned_to: '' });
  }, [contact, open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? 'Editar contacto' : 'Nuevo contacto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Nombre *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className={inputCls} placeholder="Nombre completo" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Teléfono</label>
              <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })}
                className={inputCls} placeholder="+54 9 11..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Email</label>
              <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}
                className={inputCls} placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Empresa</label>
              <input value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })}
                className={inputCls} placeholder="Nombre de empresa" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Estado</label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="prospect">Prospecto</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Asignar a</label>
              <Select value={form.assigned_to || ''} onValueChange={v => setForm({ ...form, assigned_to: v || null })}>
                <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {(users || []).map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[#c1c6d7] mb-1.5">Notas</label>
              <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
                className="input-obs w-full px-4 py-2.5 text-sm resize-none" placeholder="Notas sobre el contacto..." />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl ghost-border text-[#c1c6d7] hover:text-[#e5e2e1] text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 py-2.5 text-sm">
              {contact ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function ContactsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', search],
    queryFn: () => api.get('/contacts', { params: { search, limit: 50 } }).then(r => r.data)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data)
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id ? api.put(`/contacts/${data.id}`, data) : api.post('/contacts', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); setModal(null); toast.success('Contacto guardado'); },
    onError: () => toast.error('Error al guardar')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/contacts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contacto eliminado'); }
  });

  const contacts = data?.contacts || [];

  return (
    <TooltipProvider delayDuration={400}>
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4"
        >
          <h1 className="text-2xl font-black text-[#e5e2e1] tracking-tight">Contactos</h1>
          <div className="flex gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="input-obs w-full pl-9 pr-4 py-2 text-sm"
              />
            </div>
            <button onClick={() => setModal({})}
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2 whitespace-nowrap">
              <Plus size={15} /> Nuevo
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-[#201f1f] rounded-2xl overflow-hidden ghost-border"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider px-4 py-3">Nombre</th>
                <th className="text-left text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider px-4 py-3 hidden md:table-cell">Empresa</th>
                <th className="text-left text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Teléfono</th>
                <th className="text-left text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider px-4 py-3">Estado</th>
                <th className="text-left text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Asignado</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <div className="inline-block w-6 h-6 border-2 border-[#aac7ff] border-t-transparent rounded-full animate-spin" />
                </td></tr>
              ) : contacts.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="border-b border-white/[0.04] hover:bg-[#2a2a2a]/40 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full btn-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#e5e2e1]">{c.name}</p>
                        {c.email && <p className="text-xs text-[#8b90a0]">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-sm text-[#c1c6d7]">{c.company || '—'}</td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-[#c1c6d7]">{c.phone || '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', STATUS_COLORS[c.status])}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-[#c1c6d7]">
                    {c.assignedUser?.name || '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 justify-end">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => setModal(c)} className="text-[#8b90a0] hover:text-[#aac7ff] transition-colors p-1.5 rounded-lg hover:bg-[#aac7ff]/10">
                            <Edit2 size={13} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => deleteMutation.mutate(c.id)} className="text-[#8b90a0] hover:text-[#ffb4ab] transition-colors p-1.5 rounded-lg hover:bg-[#ffb4ab]/10">
                            <Trash2 size={13} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {!isLoading && contacts.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-[#8b90a0] text-sm">Sin contactos</td></tr>
              )}
            </tbody>
          </table>
        </motion.div>

        <ContactModal
          open={modal !== null}
          contact={modal?.id ? modal : null}
          users={users}
          onClose={() => setModal(null)}
          onSave={saveMutation.mutate}
        />
      </div>
    </TooltipProvider>
  );
}
