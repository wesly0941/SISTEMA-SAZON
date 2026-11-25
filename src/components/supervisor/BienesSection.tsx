import React, { useState } from 'react';
import { Save, Trash2, Loader2, Armchair } from 'lucide-react';
import { Client, ClientAsset } from '../../types';
import { getTodayISO } from '../../utils/format';

interface BienesSectionProps {
  clients: Client[];
  bienesClientes: ClientAsset[];
  onSaveAsset: (payload: {
    cliente: string;
    nombre_bien: string;
    codigo_serial: string;
    cantidad: number;
    estado: string;
    observacion: string;
    fecha_asignacion: string;
  }) => Promise<boolean>;
  onDeleteAsset: (id: number, nombreBien: string) => void;
}

export const BienesSection: React.FC<BienesSectionProps> = ({
  clients,
  bienesClientes,
  onSaveAsset,
  onDeleteAsset,
}) => {
  const [cliente, setCliente] = useState('');
  const [nombreBien, setNombreBien] = useState('');
  const [codigoSerial, setCodigoSerial] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [estado, setEstado] = useState('Operativo / Óptimo');
  const [observacion, setObservacion] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [saving, setSaving] = useState(false);

  const filtrados = bienesClientes.filter(
    (b) => !filtroCliente || b.cliente === filtroCliente
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente || !nombreBien.trim()) return;
    setSaving(true);
    const ok = await onSaveAsset({
      cliente,
      nombre_bien: nombreBien.trim(),
      codigo_serial: codigoSerial.trim() || 'S/N',
      cantidad: parseInt(cantidad, 10) || 1,
      estado,
      observacion: observacion.trim(),
      fecha_asignacion: getTodayISO(),
    });
    setSaving(false);

    if (ok) {
      setCliente('');
      setNombreBien('');
      setCodigoSerial('');
      setCantidad('1');
      setEstado('Operativo / Óptimo');
      setObservacion('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Control de Bienes e Inmobiliario en Clientes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Registro de equipos y utensilios propiedad de El Sazón de Helem C.A. en resguardo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-base font-bold text-slate-900 mb-5">
            Asignar Bien / Equipo a Cliente
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="bienClienteSelect"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Cliente donde se resguarda
              </label>
              <select
                id="bienClienteSelect"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              >
                <option value="">Seleccione cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="bienNombreInput"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Nombre del Producto / Equipo
              </label>
              <input
                id="bienNombreInput"
                type="text"
                value={nombreBien}
                onChange={(e) => setNombreBien(e.target.value)}
                placeholder="Ej: Baño de María 4 bandejas, Termo 20L"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="bienCodigoInput"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Código / Serial
                </label>
                <input
                  id="bienCodigoInput"
                  type="text"
                  value={codigoSerial}
                  onChange={(e) => setCodigoSerial(e.target.value)}
                  placeholder="Ej: SH-BM-001"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
                />
              </div>
              <div>
                <label
                  htmlFor="bienCantidadInput"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Cantidad
                </label>
                <input
                  id="bienCantidadInput"
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="bienEstadoSelect"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Estado Físico
              </label>
              <select
                id="bienEstadoSelect"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              >
                <option value="Operativo / Óptimo">Operativo / Óptimo</option>
                <option value="En Uso (Buen Estado)">En Uso (Buen Estado)</option>
                <option value="Requiere Mantenimiento">
                  Requiere Mantenimiento
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="bienObsInput"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Observaciones / Detalles
              </label>
              <input
                id="bienObsInput"
                type="text"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Ej: Entregado en comedor principal"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full min-h-10 items-center justify-center gap-2 rounded-lg bg-[#8B1E3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#68132D] transition-colors disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? 'Guardando...' : 'Guardar Bien Asignado'}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              Inventario de Bienes en Clientes
            </h2>
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              aria-label="Filtrar bienes por cliente"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-[#8B1E3F] focus:outline-none"
            >
              <option value="">TODOS LOS CLIENTES</option>
              {clients.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <Armchair className="h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                No hay bienes registrados para mostrar
              </p>
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-slate-100">
                {filtrados.map((b) => (
                  <div key={b.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-slate-900 truncate">
                          {b.nombre_bien}
                        </p>
                        <span className="font-mono text-xs font-bold tabular-nums text-[#8B1E3F] shrink-0">
                          ×{b.cantidad}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700">
                        {b.cliente}
                      </p>
                      <p className="text-xs text-slate-500">
                        <span className="font-mono">{b.codigo_serial || 'S/N'}</span> · {b.estado}
                      </p>
                      {b.observacion && (
                        <p className="text-xs text-slate-400">{b.observacion}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteAsset(b.id, b.nombre_bien)}
                      aria-label={`Eliminar bien ${b.nombre_bien}`}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Bien / Equipo</th>
                      <th className="px-4 py-3 text-left">Cód.</th>
                      <th className="px-4 py-3 text-right">Cant.</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtrados.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {b.cliente}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {b.nombre_bien}
                          </p>
                          {b.observacion && (
                            <p className="text-xs text-slate-500">
                              {b.observacion}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {b.codigo_serial || 'S/N'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {b.cantidad}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700">
                          {b.estado}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteAsset(b.id, b.nombre_bien)}
                            aria-label={`Eliminar bien ${b.nombre_bien}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
    </div>
  );
};
