import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, Loader2, Tags } from 'lucide-react';

interface PreciosSectionProps {
  preciosPlatos: Record<string, number>;
  onCreateDishType: (nombre: string, precio: number) => Promise<boolean>;
  onUpdatePrice: (nombre: string, precio: number) => Promise<boolean>;
  onDeleteDishType: (nombre: string) => void;
}

export const PreciosSection: React.FC<PreciosSectionProps> = ({
  preciosPlatos,
  onCreateDishType,
  onUpdatePrice,
  onDeleteDishType,
}) => {
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [precioNuevo, setPrecioNuevo] = useState('');
  const [saving, setSaving] = useState(false);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, string> = {};
    Object.entries(preciosPlatos).forEach(([k, v]) => {
      next[k] = String(v);
    });
    setDraftPrices(next);
  }, [preciosPlatos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(precioNuevo);
    if (!nombreNuevo.trim() || isNaN(p) || p < 0) return;
    setSaving(true);
    const ok = await onCreateDishType(nombreNuevo.trim(), p);
    setSaving(false);
    if (ok) {
      setNombreNuevo('');
      setPrecioNuevo('');
    }
  };

  const handleUpdate = async (cat: string) => {
    const val = parseFloat(draftPrices[cat]);
    if (isNaN(val) || val < 0) return;
    setUpdatingKey(cat);
    await onUpdatePrice(cat, val);
    setUpdatingKey(null);
  };

  const categories = Object.keys(preciosPlatos);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Precios y Tipos de Plato (Sin IVA)
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure el catálogo de categorías de menú y su tarifa neta en dólares estadounidenses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-base font-bold text-slate-900 mb-5">
            Añadir Nuevo Tipo de Plato
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="nombreNuevoPlato"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Nombre del Plato / Tipo
              </label>
              <input
                id="nombreNuevoPlato"
                type="text"
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                placeholder="Ej: Plato Comedor, Cena"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              />
            </div>

            <div>
              <label
                htmlFor="precioNuevoPlato"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Precio Neto USD (Sin IVA)
              </label>
              <input
                id="precioNuevoPlato"
                type="number"
                step="0.01"
                min="0"
                value={precioNuevo}
                onChange={(e) => setPrecioNuevo(e.target.value)}
                placeholder="Ej: 4.00"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
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
                <Plus className="h-4 w-4" />
              )}
              <span>{saving ? 'Guardando...' : 'Guardar Plato'}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              Catálogo de Precios
            </h2>
          </div>

          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <Tags className="h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                Sin categorías configuradas
              </p>
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-slate-100">
                {categories.map((cat) => (
                  <div key={cat} className="p-4 space-y-2.5">
                    <p className="font-semibold text-sm text-slate-900">{cat}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        aria-label={`Precio de ${cat}`}
                        value={draftPrices[cat] ?? ''}
                        onChange={(e) =>
                          setDraftPrices((prev) => ({
                            ...prev,
                            [cat]: e.target.value,
                          }))
                        }
                        className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={updatingKey === cat}
                        onClick={() => handleUpdate(cat)}
                        aria-label={`Actualizar precio de ${cat}`}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#8B1E3F] px-3.5 text-xs font-semibold text-white hover:bg-[#68132D] transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${
                            updatingKey === cat ? 'animate-spin' : ''
                          }`}
                        />
                        <span>Guardar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteDishType(cat)}
                        aria-label={`Eliminar ${cat}`}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                      <th className="px-6 py-3 text-left">Categoría</th>
                      <th className="px-6 py-3 text-left">Precio ($)</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.map((cat) => (
                      <tr key={cat} className="hover:bg-slate-50/70">
                        <td className="px-6 py-3 font-semibold text-slate-900">
                          {cat}
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            aria-label={`Precio de ${cat}`}
                            value={draftPrices[cat] ?? ''}
                            onChange={(e) =>
                              setDraftPrices((prev) => ({
                                ...prev,
                                [cat]: e.target.value,
                              }))
                            }
                            className="w-28 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
                          />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              disabled={updatingKey === cat}
                              onClick={() => handleUpdate(cat)}
                              aria-label={`Actualizar precio de ${cat}`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#8B1E3F] px-2.5 text-xs font-semibold text-white hover:bg-[#68132D] transition-colors disabled:opacity-50"
                            >
                              <RefreshCw
                                className={`h-3.5 w-3.5 ${
                                  updatingKey === cat ? 'animate-spin' : ''
                                }`}
                              />
                              <span>Actualizar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteDishType(cat)}
                              aria-label={`Eliminar ${cat}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
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
