import React, { useState } from 'react';
import {
  FileSpreadsheet,
  DollarSign,
  Utensils,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { ServedDish } from '../../types';
import { formatUSD, getTodayISO } from '../../utils/format';
import { exportarExcelPortalCliente } from '../../utils/exports';
import { DishThumbnail } from '../ui/DishThumbnail';

interface PortalDeudaSectionProps {
  clienteNombre: string;
  registroComidas: ServedDish[];
  preciosPlatos: Record<string, number>;
  onPreviewPhoto: (url: string) => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PortalDeudaSection: React.FC<PortalDeudaSectionProps> = ({
  clienteNombre,
  registroComidas,
  preciosPlatos,
  onPreviewPhoto,
  onNotify,
}) => {
  const [desde, setDesde] = useState(getTodayISO());
  const [hasta, setHasta] = useState(getTodayISO());

  const comidasCliente = registroComidas.filter((c) => {
    const fechaItem =
      c.fecha_limpia || (c.fecha_full ? String(c.fecha_full).substring(0, 10) : '');
    const matchCliente = c.cliente === clienteNombre;
    const matchDesde = !desde || fechaItem >= desde;
    const matchHasta = !hasta || fechaItem <= hasta;
    return matchCliente && matchDesde && matchHasta;
  });

  let deudaTotal = 0;
  let totalPlatos = 0;
  const discriminado: Record<string, number> = {};

  comidasCliente.forEach((item) => {
    const precio = preciosPlatos[item.tipo] || 0;
    const cant = Number(item.cantidad) || 0;
    const totalNeto = precio * cant;
    totalPlatos += cant;
    discriminado[item.tipo] = (discriminado[item.tipo] || 0) + cant;
    if (!item.pagado) {
      deudaTotal += totalNeto;
    }
  });

  const handleExport = () => {
    if (comidasCliente.length === 0) {
      onNotify(
        'No hay datos para exportar en el rango de fechas seleccionado.',
        'info'
      );
      return;
    }
    exportarExcelPortalCliente(
      clienteNombre,
      comidasCliente,
      preciosPlatos,
      desde,
      hasta
    );
    onNotify('Estado de cuenta exportado a Excel.', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Estado de Cuenta y Servicios Consumidos
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Consulta detallada de raciones servidas, precios sin IVA y saldo pendiente para{' '}
          <span className="font-semibold text-slate-800">{clienteNombre}</span>.
        </p>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              Deuda Total Pendiente (USD)
            </p>
            <p className="mt-0.5 font-mono text-2xl font-bold tabular-nums text-rose-700">
              {formatUSD(deudaTotal)}
            </p>
          </div>
        </div>

        <div className="md:col-span-8 rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[#8B1E3F]">
            <Utensils className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">
              Resumen de Platos Servidos (Periodo)
            </p>
            <p className="mt-0.5 font-display text-xl font-bold tabular-nums text-slate-900">
              {totalPlatos} Platos Totales
            </p>
            {Object.keys(discriminado).length > 0 && (
              <p className="mt-1 text-xs text-slate-600 tabular-nums">
                {Object.entries(discriminado)
                  .map(([tipo, count]) => `${tipo}: ${count}`)
                  .join(' · ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Export Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label
              htmlFor="filtroDesdeCliente"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Desde Fecha
            </label>
            <input
              id="filtroDesdeCliente"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
            />
          </div>
          <div>
            <label
              htmlFor="filtroHastaCliente"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Hasta Fecha
            </label>
            <input
              id="filtroHastaCliente"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={handleExport}
              className="flex w-full min-h-10 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#4A0E20] hover:bg-[#C39E2B] transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Descargar Excel Detallado</span>
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-display text-base font-bold text-slate-900">
            Historial de Servicios y Facturación
          </h2>
        </div>

        {comidasCliente.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-800">
              No hay consumos registrados para el rango de fechas seleccionado
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ajuste las fechas de consulta para visualizar periodos anteriores.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100">
              {comidasCliente.map((item) => {
                const precio = preciosPlatos[item.tipo] || 0;
                const cant = Number(item.cantidad) || 0;
                const totalNeto = precio * cant;
                return (
                  <div key={item.id} className="p-4 flex items-start gap-3">
                    <DishThumbnail
                      src={item.foto_url}
                      alt={item.nombre}
                      sizeClass="h-14 w-14"
                      onClick={() => onPreviewPhoto(item.foto_url)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-slate-900">
                        {item.nombre}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.tipo} ·{' '}
                        <span className="font-mono tabular-nums">
                          {item.fecha_limpia || item.fecha_full}
                        </span>
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-slate-600 tabular-nums">
                          {cant} × {formatUSD(precio)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            item.pagado ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {item.pagado ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Pagado</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5" />
                              <span>Pendiente</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-bold tabular-nums text-slate-900">
                        {formatUSD(totalNeto)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                    <th className="px-4 py-3 text-left">Fecha / Hora</th>
                    <th className="px-4 py-3 text-left">Foto</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Descripción</th>
                    <th className="px-4 py-3 text-right">Cant.</th>
                    <th className="px-4 py-3 text-right">P. Unit ($)</th>
                    <th className="px-4 py-3 text-right">Total ($)</th>
                    <th className="px-4 py-3 text-left">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comidasCliente.map((item) => {
                    const precio = preciosPlatos[item.tipo] || 0;
                    const cant = Number(item.cantidad) || 0;
                    const totalNeto = precio * cant;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
                          {item.fecha_limpia || item.fecha_full}{' '}
                          {item.hora ? `· ${item.hora}` : ''}
                        </td>
                        <td className="px-4 py-3">
                          <DishThumbnail
                            src={item.foto_url}
                            alt={item.nombre}
                            onClick={() => onPreviewPhoto(item.foto_url)}
                          />
                        </td>
                        <td className="px-4 py-3 text-slate-700">{item.tipo}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {item.nombre}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {cant}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                          {formatUSD(precio)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-slate-900">
                          {formatUSD(totalNeto)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${
                              item.pagado ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {item.pagado ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Pagado</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5" />
                                <span>Pendiente</span>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
