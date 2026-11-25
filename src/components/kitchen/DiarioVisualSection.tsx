import React, { useState, useRef } from 'react';
import { ImageDown, Loader2, Utensils } from 'lucide-react';
import { ServedDish } from '../../types';
import { getTodayISO } from '../../utils/format';
import { descargarReporteImagen } from '../../utils/exports';
import { DishThumbnail } from '../ui/DishThumbnail';

interface DiarioVisualSectionProps {
  registroComidas: ServedDish[];
  onPreviewPhoto: (url: string) => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DiarioVisualSection: React.FC<DiarioVisualSectionProps> = ({
  registroComidas,
  onPreviewPhoto,
  onNotify,
}) => {
  const [fecha, setFecha] = useState(getTodayISO());
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const platosFecha = registroComidas.filter(
    (c) => (c.fecha_limpia || String(c.fecha_full).substring(0, 10)) === fecha
  );

  const totalRaciones = platosFecha.reduce(
    (acc, item) => acc + (Number(item.cantidad) || 0),
    0
  );

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await descargarReporteImagen(cardRef.current, fecha);
      onNotify('Reporte visual PNG descargado correctamente.', 'success');
    } catch {
      onNotify('No se pudo generar la imagen del reporte.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Diario y Reporte Visual de Cocina
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Consulte la ficha visual diaria de menús servidos y expórtela en imagen PNG para compartir.
        </p>
      </div>

      {/* Filter & Export Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label
            htmlFor="filtroFechaDiario"
            className="text-sm font-semibold text-slate-700 whitespace-nowrap"
          >
            Fecha de Consulta:
          </label>
          <input
            id="filtroFechaDiario"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
          />
        </div>

        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={exporting}
          className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageDown className="h-4 w-4" />
          )}
          <span>{exporting ? 'Generando PNG...' : 'Descargar Reporte en Imagen (PNG)'}</span>
        </button>
      </div>

      {/* Exportable Visual Card */}
      <div
        ref={cardRef}
        className="rounded-xl border-2 border-[#8B1E3F] bg-white p-6 sm:p-8"
      >
        <div className="border-b-2 border-[#8B1E3F] pb-4 mb-6 text-center">
          <h2 className="font-display text-xl font-extrabold tracking-tight text-[#8B1E3F]">
            EL SAZÓN DE HELEM C.A.
          </h2>
          <p className="mt-1 text-xs font-semibold tracking-wider text-slate-600 uppercase">
            Reporte Diario de Comidas Servidas
          </p>
          <p className="mt-1.5 font-mono text-sm text-slate-700 tabular-nums">
            Fecha del Reporte: {fecha} · Total: {totalRaciones} raciones
          </p>
        </div>

        <h3 className="font-display text-sm font-bold text-[#8B1E3F] mb-4 flex items-center gap-2">
          <Utensils className="h-4 w-4" />
          <span>Menús Servidos del Día</span>
        </h3>

        {platosFecha.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No hay registros de platos para esta fecha.
          </p>
        ) : (
          <div className="space-y-3">
            {platosFecha.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5"
              >
                <DishThumbnail
                  src={p.foto_url}
                  alt={p.nombre}
                  sizeClass="h-16 w-16"
                  onClick={() => onPreviewPhoto(p.foto_url)}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {p.nombre}{' '}
                    <span className="font-normal text-slate-500">· {p.tipo}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Cliente: <span className="font-medium text-slate-800">{p.cliente}</span>
                    {' · '}
                    Cantidad:{' '}
                    <span className="font-mono font-bold tabular-nums text-[#8B1E3F]">
                      {p.cantidad} Raciones
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
