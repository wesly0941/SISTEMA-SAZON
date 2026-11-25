import React, { useState } from 'react';
import { FileDown, ClipboardList, IdCard } from 'lucide-react';
import { Client, DailyConsumption, ServedDish } from '../../types';
import { getTodayISO } from '../../utils/format';
import {
  generarPDFConsolidadoInterno,
  generarPDFSoloCliente,
} from '../../utils/exports';

interface PdfReportesSectionProps {
  clients: Client[];
  preciosPlatos: Record<string, number>;
  registroComidas: ServedDish[];
  consumosDiarios: DailyConsumption[];
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PdfReportesSection: React.FC<PdfReportesSectionProps> = ({
  clients,
  preciosPlatos,
  registroComidas,
  consumosDiarios,
  onNotify,
}) => {
  const today = getTodayISO();
  const [clienteSel, setClienteSel] = useState('');
  const [fechaCliente, setFechaCliente] = useState(today);
  const [tipoSel, setTipoSel] = useState('');
  const [fechaInterno, setFechaInterno] = useState(today);

  const handlePdfCliente = () => {
    generarPDFSoloCliente(
      registroComidas,
      preciosPlatos,
      clienteSel,
      fechaCliente,
      tipoSel
    );
    onNotify('Ficha diaria para cliente generada en PDF.', 'success');
  };

  const handlePdfInterno = () => {
    generarPDFConsolidadoInterno(
      registroComidas,
      consumosDiarios,
      preciosPlatos,
      fechaInterno
    );
    onNotify('Reporte interno consolidado generado en PDF.', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Generación de Reportes Diarios en PDF
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Exporte fichas diarias con fotografías para sus clientes o reportes consolidados internos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 1: Client PDF */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-[#8B1E3F] mb-2">
              <IdCard className="h-5 w-5" />
              <h2 className="font-display text-base font-bold text-slate-900">
                1. Ficha Diaria para el Cliente
              </h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              Reporte exclusivo para enviar al cliente. Contiene{' '}
              <strong className="text-slate-900">únicamente</strong> la relación
              de platos servidos del día con sus fotos reales, descripción y
              costos sin IVA.
            </p>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="pdfSelectCliente"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Seleccionar Cliente
                </label>
                <select
                  id="pdfSelectCliente"
                  value={clienteSel}
                  onChange={(e) => setClienteSel(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
                >
                  <option value="">TODOS LOS CLIENTES</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="pdfFechaComidas"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Fecha de Servicio
                </label>
                <input
                  id="pdfFechaComidas"
                  type="date"
                  value={fechaCliente}
                  onChange={(e) => setFechaCliente(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="pdfSelectTipoComida"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Filtrar por Tipo de Comida (Opcional)
                </label>
                <select
                  id="pdfSelectTipoComida"
                  value={tipoSel}
                  onChange={(e) => setTipoSel(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
                >
                  <option value="">TODAS LAS COMIDAS</option>
                  {Object.keys(preciosPlatos).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePdfCliente}
            className="mt-6 flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-[#8B1E3F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#68132D] transition-colors"
          >
            <FileDown className="h-4 w-4" />
            <span>Descargar Ficha para Cliente (PDF)</span>
          </button>
        </div>

        {/* Card 2: Consolidated Internal PDF */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-[#8B1E3F] mb-2">
              <ClipboardList className="h-5 w-5" />
              <h2 className="font-display text-base font-bold text-slate-900">
                2. Reporte Interno Consolidado
              </h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              Reporte completo para control interno. Contiene{' '}
              <strong className="text-slate-900">ambas secciones</strong>: la
              ficha de platos servidos a los clientes{' '}
              <strong className="text-slate-900">más</strong> la relación exacta
              de los insumos y productos gastados en el día.
            </p>

            <div>
              <label
                htmlFor="pdfFechaInsumosInterno"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Fecha del Reporte Interno
              </label>
              <input
                id="pdfFechaInsumosInterno"
                type="date"
                value={fechaInterno}
                onChange={(e) => setFechaInterno(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handlePdfInterno}
            className="mt-6 flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#4A0E20] hover:bg-[#C39E2B] transition-colors"
          >
            <FileDown className="h-4 w-4" />
            <span>Descargar Reporte Interno (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
