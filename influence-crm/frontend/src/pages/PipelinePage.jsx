import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Zap, X } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useSocketStore } from '../store/socketStore';
import { toast } from 'sonner';
import clsx from 'clsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

const STAGES = [
  { id: 'new_lead',    label: 'Nuevo Lead',  icon: '🎯', accent: 'text-[#aac7ff]', headerBg: 'bg-[#aac7ff]/10', cardBorder: 'border-[#aac7ff]/20' },
  { id: 'contacted',   label: 'Contactado',  icon: '💬', accent: 'text-[#4cd6ff]', headerBg: 'bg-[#4cd6ff]/10', cardBorder: 'border-[#4cd6ff]/15' },
  { id: 'negotiating', label: 'Negociando',  icon: '🤝', accent: 'text-[#ffb77f]', headerBg: 'bg-[#ffb77f]/10', cardBorder: 'border-[#ffb77f]/15' },
  { id: 'proposal',    label: 'Propuesta',   icon: '📋', accent: 'text-[#aac7ff]', headerBg: 'bg-[#3e90ff]/10', cardBorder: 'border-[#3e90ff]/20' },
  { id: 'converted',   label: 'Convertido',  icon: '✅', accent: 'text-[#4cd6ff]', headerBg: 'bg-[#aac7ff]/10', cardBorder: 'border-[#4cd6ff]/20' },
  { id: 'lost',        label: 'Perdido',     icon: '❌', accent: 'text-[#ffb4ab]', headerBg: 'bg-[#93000a]/15', cardBorder: 'border-[#ffb4ab]/15' },
];

const STAGE_IDS = STAGES.map(s => s.id);

const LeadModal = ({ open, contact, users, onClose, onMove, onAssign }) => {
  const [note, setNote] = useState(contact?.pipeline_notes || '');
  const [assignTo, setAssignTo] = useState(contact?.assigned_to || '');

  useEffect(() => {
    if (contact) {
      setNote(contact.pipeline_notes || '');
      setAssignTo(contact.assigned_to || '');
    }
  }, [contact]);

  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-white/5">
          <div className="w-11 h-11 rounded-full btn-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {contact.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h3 className="font-bold text-[#e5e2e1]">{contact.name}</h3>
            <p className="text-xs text-[#8b90a0]">{contact.phone}</p>
          </div>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
          <div>
            <p className="text-xs font-semibold text-[#8b90a0] uppercase tracking-wider mb-3">Mover a etapa</p>
            <div className="grid grid-cols-3 gap-2">
              {STAGES.map((s) => (
                <button key={s.id} onClick={() => onMove(contact.id, s.id, note)}
                  className={clsx(
                    'flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium transition ghost-border',
                    contact.pipeline_stage === s.id
                      ? `${s.headerBg} ${s.accent}`
                      : 'bg-[#2a2a2a]/50 text-[#c1c6d7] hover:text-[#e5e2e1] hover:bg-[#2a2a2a]'
                  )}
                >
                  <span className="text-base">{s.icon}</span>
                  {s.label}
                  {contact.pipeline_stage === s.id && <span className="text-xs opacity-60">← actual</span>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#8b90a0] uppercase tracking-wider mb-2">Asignar a</p>
            <div className="flex gap-2">
              <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
                className="input-obs flex-1 px-3 py-2 text-sm">
                <option value="">Sin asignar</option>
                {(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <button onClick={() => onAssign(contact.id, assignTo)}
                className="btn-primary px-4 py-2 text-sm">
                Asignar
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#8b90a0] uppercase tracking-wider mb-2">Notas del pipeline</p>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder="Agrega notas sobre este lead..."
              className="input-obs w-full px-4 py-2.5 text-sm resize-none" />
            <button onClick={() => onMove(contact.id, contact.pipeline_stage || 'new_lead', note)}
              className="mt-2 w-full py-2 bg-[#2a2a2a] hover:bg-[#353534] text-[#c1c6d7] hover:text-[#e5e2e1] text-sm rounded-xl transition">
              Guardar notas
            </button>
          </div>

          {contact.messages?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#8b90a0] uppercase tracking-wider mb-2">Último mensaje WA</p>
              <div className="bg-[#2a2a2a]/60 rounded-xl p-3 text-sm text-[#c1c6d7] ghost-border">
                <p className="text-xs text-[#8b90a0] mb-1">
                  {format(new Date(contact.messages[0].createdAt), "dd MMM, HH:mm", { locale: es })}
                </p>
                {contact.messages[0].body}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
            <div>
              <p className="text-xs text-[#8b90a0]">Origen</p>
              <p className="text-sm text-[#e5e2e1] mt-0.5 flex items-center gap-1">
                {contact.wa_jid ? <><MessageSquare size={12} className="text-[#4cd6ff]" /> WhatsApp</> : 'Manual'}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#8b90a0]">Creado</p>
              <p className="text-sm text-[#e5e2e1] mt-0.5">
                {format(new Date(contact.createdAt), "dd MMM yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const LeadCard = ({ contact, stage, onClick }) => {
  const initial = contact.name?.[0]?.toUpperCase() || '?';
  const lastMsg = contact.messages?.[0];

  return (
    <div onClick={onClick}
      className={clsx(
        'bg-[#201f1f] border rounded-xl p-3.5 cursor-pointer transition-all hover:bg-[#2a2a2a] hover:-translate-y-0.5',
        stage.cardBorder
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full btn-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-semibold text-[#e5e2e1] truncate">{contact.name}</p>
            {contact.wa_jid && <MessageSquare size={12} className="text-[#4cd6ff] flex-shrink-0 mt-0.5" />}
          </div>
          {contact.phone && <p className="text-xs text-[#8b90a0] mt-0.5">{contact.phone}</p>}
        </div>
      </div>

      {lastMsg && (
        <p className="text-xs text-[#8b90a0] mt-2 line-clamp-2 pl-2 border-l border-[#414755]/40">
          {lastMsg.body}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        {contact.assignedUser ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#c1c6d7] text-xs font-bold">
              {contact.assignedUser.name[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-[#8b90a0]">{contact.assignedUser.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="text-xs text-[#414755]">Sin asignar</span>
        )}
        <span className="text-xs text-[#414755]">
          {format(new Date(contact.createdAt), 'dd MMM', { locale: es })}
        </span>
      </div>
    </div>
  );
};

export default function PipelinePage() {
  const qc = useQueryClient();
  const { newLeads } = useSocketStore();
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => api.get('/pipeline').then(r => r.data),
    refetchInterval: 30000
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data)
  });

  useEffect(() => {
    if (newLeads.length === 0) return;
    const lead = newLeads[0];
    toast.custom(() => (
      <div className="bg-[#201f1f] ghost-border rounded-xl p-4 shadow-ambient flex items-start gap-3 max-w-sm animate-in slide-in-from-top-2 duration-300">
        <div className="w-10 h-10 rounded-full btn-primary flex items-center justify-center text-white font-bold flex-shrink-0">
          {lead.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-[#e5e2e1] flex items-center gap-1">
            <Zap size={13} className="text-[#ffb77f]" /> Nuevo Lead WA
          </p>
          <p className="text-sm text-[#c1c6d7]">{lead.name}</p>
          <p className="text-xs text-[#8b90a0]">{lead.phone}</p>
          {lead.firstMessage && (
            <p className="text-xs text-[#8b90a0] mt-1 line-clamp-1">"{lead.firstMessage}"</p>
          )}
        </div>
      </div>
    ), { duration: 6000 });
    qc.invalidateQueries({ queryKey: ['pipeline'] });
  }, [newLeads]);

  const moveMutation = useMutation({
    mutationFn: ({ id, stage, notes }) => api.put(`/pipeline/${id}/stage`, { stage, pipeline_notes: notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pipeline'] }); qc.invalidateQueries({ queryKey: ['contacts'] }); setSelected(null); toast.success('Lead actualizado'); },
    onError: () => toast.error('Error al mover lead')
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, assigned_to }) => api.put(`/pipeline/${id}/assign`, { assigned_to }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pipeline'] }); toast.success('Lead asignado'); }
  });

  const board = data?.board || {};
  const totalLeads = STAGE_IDS.reduce((acc, s) => acc + (board[s]?.length || 0), 0);
  const totalConverted = board['converted']?.length || 0;
  const convRate = totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0;

  return (
    <TooltipProvider delayDuration={400}>
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-[#e5e2e1] tracking-tight">Pipeline de Leads</h1>
          <p className="text-[#8b90a0] text-sm mt-0.5">Los mensajes de WhatsApp nuevos se agregan automáticamente</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-2xl font-black text-[#e5e2e1]">{totalLeads}</p>
            <p className="text-xs text-[#8b90a0]">Total leads</p>
          </div>
          <div className="w-px h-10 bg-[#2a2a2a]" />
          <div className="text-right">
            <p className="text-2xl font-black text-[#4cd6ff]">{convRate}%</p>
            <p className="text-xs text-[#8b90a0]">Conversión</p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#aac7ff] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
          {STAGES.map((stage) => {
            const cards = board[stage.id] || [];
            return (
              <div key={stage.id} className="flex flex-col flex-shrink-0 w-60">
                <div className={clsx('rounded-xl px-4 py-2.5 mb-3', stage.headerBg)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{stage.icon}</span>
                      <span className={clsx('text-sm font-semibold', stage.accent)}>{stage.label}</span>
                    </div>
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full bg-[#0e0e11]/40', stage.accent)}>
                      {cards.length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 flex-1">
                  {cards.map(contact => (
                    <LeadCard key={contact.id} contact={contact} stage={stage} onClick={() => setSelected(contact)} />
                  ))}
                  {cards.length === 0 && (
                    <div className="rounded-xl py-10 text-center text-[#414755] text-xs"
                      style={{ border: '1px dashed rgba(72,71,78,0.3)' }}>
                      Sin leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LeadModal
        open={!!selected}
        contact={selected}
        users={users}
        onClose={() => setSelected(null)}
        onMove={(id, stage, notes) => moveMutation.mutate({ id, stage, notes })}
        onAssign={(id, assigned_to) => assignMutation.mutate({ id, assigned_to })}
      />
    </div>
    </TooltipProvider>
  );
}
