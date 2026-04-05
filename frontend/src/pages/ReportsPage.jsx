import React, { useState } from 'react';
import { FileText, Download, CheckSquare, Users, MessageSquare, Loader } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const reportTypes = [
  {
    id: 'tasks',
    icon: CheckSquare,
    title: 'Reporte de Tareas',
    description: 'Resumen de tareas del equipo, estados, prioridades y responsables',
    accent: '#aac7ff',
    gradient: 'from-[#aac7ff]/20 to-[#3e90ff]/10',
    endpoint: '/reports/tasks'
  },
  {
    id: 'contacts',
    icon: Users,
    title: 'Reporte de Contactos',
    description: 'Base de datos de contactos, leads, prospectos y clientes activos',
    accent: '#4cd6ff',
    gradient: 'from-[#4cd6ff]/15 to-[#aac7ff]/5',
    endpoint: '/reports/contacts'
  },
  {
    id: 'messages',
    icon: MessageSquare,
    title: 'Reporte de WhatsApp',
    description: 'Actividad de mensajes entrantes y salientes por WhatsApp Business',
    accent: '#ffb77f',
    gradient: 'from-[#ffb77f]/15 to-[#ffb77f]/5',
    endpoint: '/reports/messages'
  }
];

export default function ReportsPage() {
  const [dates, setDates] = useState({ from: '', to: '' });
  const [generating, setGenerating] = useState(null);

  const generateReport = async (report) => {
    setGenerating(report.id);
    try {
      const params = {};
      if (dates.from) params.from = dates.from;
      if (dates.to) params.to = dates.to;

      const { data } = await api.get(report.endpoint, { params });
      const link = document.createElement('a');
      link.href = data.url;
      link.download = `influence_${report.id}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Reporte generado y descargado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al generar reporte');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#e5e2e1] font-display tracking-tight">Reportes Profesionales</h1>
        <p className="text-[#8b90a0] text-sm mt-1">
          Genera reportes PDF con marca de agua Influence para validacion oficial
        </p>
      </div>

      {/* Filtro de fechas */}
      <div className="bg-[#201f1f] rounded-2xl p-5">
        <h2 className="text-xs font-semibold text-[#c1c6d7] uppercase tracking-wider mb-4">Filtro por periodo (opcional)</h2>
        <div className="flex gap-4 flex-wrap items-end">
          <div>
            <label className="block text-xs text-[#8b90a0] mb-1.5">Desde</label>
            <input type="date" value={dates.from} onChange={e => setDates({ ...dates, from: e.target.value })}
              className="input-obs px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-[#8b90a0] mb-1.5">Hasta</label>
            <input type="date" value={dates.to} onChange={e => setDates({ ...dates, to: e.target.value })}
              className="input-obs px-3 py-2 text-sm" />
          </div>
          {(dates.from || dates.to) && (
            <button onClick={() => setDates({ from: '', to: '' })}
              className="px-3 py-2 text-sm text-[#c1c6d7] hover:text-[#e5e2e1] ghost-border rounded-xl transition-colors">
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isGenerating = generating === report.id;

          return (
            <div key={report.id} className="bg-[#201f1f] rounded-2xl overflow-hidden ghost-border">
              {/* Gradient header */}
              <div className={`bg-gradient-to-br ${report.gradient} p-6 border-b border-white/5`}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${report.accent}18` }}>
                  <Icon size={22} style={{ color: report.accent }} />
                </div>
                <h3 className="text-base font-bold text-[#e5e2e1] font-display">{report.title}</h3>
              </div>

              <div className="p-5">
                <p className="text-sm text-[#c1c6d7] mb-5 leading-relaxed">{report.description}</p>

                {/* PDF badge */}
                <div className="bg-[#2a2a2a]/60 rounded-xl p-3 mb-5 flex items-center gap-3">
                  <div className="w-8 h-10 bg-[#2a2a2a] rounded flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-[#8b90a0]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#e5e2e1]">PDF con marca de agua</p>
                    <p className="text-xs text-[#8b90a0]">Incluye logo Influence + datos de validacion</p>
                  </div>
                </div>

                <button
                  onClick={() => generateReport(report)}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{
                    background: `${report.accent}15`,
                    color: report.accent,
                    border: `0.5px solid ${report.accent}30`
                  }}
                >
                  {isGenerating ? (
                    <><Loader size={14} className="animate-spin" /> Generando PDF...</>
                  ) : (
                    <><Download size={14} /> Generar y Descargar</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-[#201f1f] rounded-2xl p-5">
        <h3 className="text-xs font-semibold text-[#c1c6d7] uppercase tracking-wider mb-3">Sobre los reportes</h3>
        <ul className="space-y-1.5 text-xs text-[#8b90a0]">
          <li>• Todos los reportes incluyen marca de agua diagonal "INFLUENCE" semitransparente</li>
          <li>• Se genera el nombre del usuario que lo crea y la fecha exacta</li>
          <li>• Los PDFs se descargan automaticamente al generarse</li>
          <li>• Incluyen estadisticas visuales y tabla de detalle</li>
        </ul>
      </div>
    </div>
  );
}
