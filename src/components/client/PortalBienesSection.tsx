import React from 'react';
import { Box } from 'lucide-react';
import { ClientAsset } from '../../types';

interface PortalBienesSectionProps {
  clienteNombre: string;
  bienesClientes: ClientAsset[];
}

export const PortalBienesSection: React.FC<PortalBienesSectionProps> = ({
  clienteNombre,
  bienesClientes,
}) => {
  const bienes = bienesClientes.filter((b) => b.cliente === clienteNombre);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Equipos y Bienes Propiedad de El Sazón de Helem C.A.
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Relación de equipos, utensilios e inmobiliario asignados en resguardo en sus instalaciones.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {bienes.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Box className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">
              Sin bienes asignados en resguardo
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Actualmente no posee equipos ni mobiliario asignados en sus instalaciones.
            </p>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-100">
              {bienes.map((b) => (
                <div key={b.id} className="p-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900">
                      {b.nombre_bien}
                    </p>
                    <span className="font-mono text-xs font-bold tabular-nums text-[#8B1E3F] shrink-0">
                      ×{b.cantidad}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    <span className="font-mono">{b.codigo_serial || 'S/N'}</span> · {b.estado}
                  </p>
                  <p className="font-mono text-[11px] text-slate-400 tabular-nums">
                    Asignado: {b.fecha_asignacion || '-'}
                  </p>
                  {b.observacion && (
                    <p className="text-xs text-slate-500">{b.observacion}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                    <th className="px-6 py-3 text-left">Fecha Asignación</th>
                    <th className="px-6 py-3 text-left">Equipo / Bien</th>
                    <th className="px-6 py-3 text-left">Código / Serial</th>
                    <th className="px-6 py-3 text-right">Cantidad</th>
                    <th className="px-6 py-3 text-left">Estado</th>
                    <th className="px-6 py-3 text-left">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bienes.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-3 font-mono text-xs tabular-nums text-slate-600">
                        {b.fecha_asignacion || '-'}
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-900">
                        {b.nombre_bien}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-600">
                        {b.codigo_serial || 'S/N'}
                      </td>
                      <td className="px-6 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                        {b.cantidad}
                      </td>
                      <td className="px-6 py-3 text-slate-700">{b.estado}</td>
                      <td className="px-6 py-3 text-slate-500">
                        {b.observacion || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
