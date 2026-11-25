import React, { useState, useRef } from 'react';
import { Camera, Save, Loader2, Utensils, X } from 'lucide-react';
import { Client, ServedDish } from '../../types';
import {
  compressImageFile,
  DEFAULT_DISH_IMAGE,
  getTodayISO,
} from '../../utils/format';
import { DishThumbnail } from '../ui/DishThumbnail';

interface ComidasSectionProps {
  clients: Client[];
  preciosPlatos: Record<string, number>;
  registroComidas: ServedDish[];
  onSaveDish: (payload: {
    fecha_full: string;
    hora: string;
    tipo: string;
    nombre: string;
    cliente: string;
    cantidad: number;
    foto_url: string;
  }) => Promise<boolean>;
  onPreviewPhoto: (url: string) => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ComidasSection: React.FC<ComidasSectionProps> = ({
  clients,
  preciosPlatos,
  registroComidas,
  onSaveDish,
  onPreviewPhoto,
  onNotify,
}) => {
  const [fecha, setFecha] = useState(getTodayISO());
  const [tipo, setTipo] = useState('');
  const [nombre, setNombre] = useState('');
  const [cliente, setCliente] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fotoDataUrl, setFotoDataUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tiposList = Object.keys(preciosPlatos);

  const comidasFecha = registroComidas.filter(
    (c) => (c.fecha_limpia || String(c.fecha_full).substring(0, 10)) === fecha
  );

  const totalRacionesFecha = comidasFecha.reduce(
    (acc, item) => acc + (Number(item.cantidad) || 0),
    0
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 800, 0.78);
      setFotoDataUrl(compressed);
    } catch {
      onNotify('No se pudo procesar la fotografía seleccionada.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cantNum = parseInt(cantidad, 10);
    if (!tipo || !nombre.trim() || !cliente || isNaN(cantNum) || cantNum < 1) {
      onNotify('Complete todos los campos requeridos.', 'error');
      return;
    }

    setSaving(true);
    const horaStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const ok = await onSaveDish({
      fecha_full: fecha,
      hora: horaStr,
      tipo,
      nombre: nombre.trim(),
      cliente,
      cantidad: cantNum,
      foto_url: fotoDataUrl || DEFAULT_DISH_IMAGE,
    });
    setSaving(false);

    if (ok) {
      setTipo('');
      setNombre('');
      setCliente('');
      setCantidad('');
      setFotoDataUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Carga Diaria de Comidas Servidas
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Registre los menús entregados por cliente con evidencia fotográfica y cantidad de raciones.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Card */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-base font-bold text-slate-900 mb-5">
            Registrar Menú Servido
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="fechaPlatoCocina"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Fecha del Servicio
              </label>
              <input
                id="fechaPlatoCocina"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              />
            </div>

            <div>
              <label
                htmlFor="selectTipoPlato"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Tipo / Categoría de Plato
              </label>
              <select
                id="selectTipoPlato"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              >
                <option value="">Seleccione tipo...</option>
                {tiposList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="nombrePlato"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Descripción del Plato
              </label>
              <input
                id="nombrePlato"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Puré de Papas con Pollo al Horno"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="selectClientePlatoCocina"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Cliente Autorizado
                </label>
                <select
                  id="selectClientePlatoCocina"
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
                  htmlFor="cantServida"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Cantidad (Raciones)
                </label>
                <input
                  id="cantServida"
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Ej: 45"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="fotoPlato"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Foto del Plato Elaborado
              </label>
              <label
                htmlFor="fotoPlato"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 hover:border-[#8B1E3F] hover:bg-rose-50/30 transition-colors"
              >
                <Camera className="h-4 w-4 text-[#8B1E3F]" />
                <span>{fotoDataUrl ? 'Cambiar fotografía' : 'Adjuntar fotografía del plato'}</span>
              </label>
              <input
                ref={fileInputRef}
                id="fotoPlato"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />

              {fotoDataUrl && (
                <div className="relative mt-3 inline-block">
                  <img
                    src={fotoDataUrl}
                    alt="Vista previa del plato"
                    className="h-28 w-auto rounded-lg border border-slate-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFotoDataUrl('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    aria-label="Quitar fotografía"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-[#8B1E3F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#68132D] transition-colors disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? 'Guardando...' : 'Guardar Registro'}</span>
            </button>
          </form>
        </div>

        {/* Registered Dishes for Selected Date */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Comidas Registradas
              </h2>
              <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                Fecha: {fecha} · {comidasFecha.length} registros · {totalRacionesFecha} raciones
              </p>
            </div>
          </div>

          {comidasFecha.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Utensils className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Sin platos registrados en esta fecha
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Complete el formulario para registrar el primer servicio del {fecha}.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-slate-100">
                {comidasFecha.map((item) => (
                  <div key={item.id} className="flex items-center gap-3.5 p-4">
                    <DishThumbnail
                      src={item.foto_url}
                      alt={item.nombre}
                      sizeClass="h-14 w-14"
                      onClick={() => onPreviewPhoto(item.foto_url)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {item.nombre}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {item.cliente} · {item.tipo}
                        {item.hora ? ` · ${item.hora}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-base font-bold tabular-nums text-[#8B1E3F]">
                        {item.cantidad}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        rac.
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                      <th className="px-4 py-3 text-left">Foto</th>
                      <th className="px-4 py-3 text-left">Plato y Categoría</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-right">Cant.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comidasFecha.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <DishThumbnail
                            src={item.foto_url}
                            alt={item.nombre}
                            onClick={() => onPreviewPhoto(item.foto_url)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{item.nombre}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.tipo}
                            {item.hora ? ` · ${item.hora}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{item.cliente}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {item.cantidad}
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
