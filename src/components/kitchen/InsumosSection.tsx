import React, { useState } from 'react';
import { MinusCircle, Loader2, Package } from 'lucide-react';
import { DailyConsumption, InventoryItem, RUBROS_FIJOS } from '../../types';
import { getTodayISO } from '../../utils/format';

interface InsumosSectionProps {
  inventario: InventoryItem[];
  consumosDiarios: DailyConsumption[];
  onDeductSupply: (item: InventoryItem, cantidad: number) => Promise<boolean>;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const InsumosSection: React.FC<InsumosSectionProps> = ({
  inventario,
  consumosDiarios,
  onDeductSupply,
  onNotify,
}) => {
  const [rubro, setRubro] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [saving, setSaving] = useState(false);

  const productosFiltrados = inventario.filter(
    (i) => !rubro || i.rubro === rubro
  );
  const selectedItem = inventario.find((i) => i.id === Number(productoId));

  const hoy = getTodayISO();
  const consumosHoy = consumosDiarios.filter(
    (c) => (c.fecha_limpia || String(c.fecha).substring(0, 10)) === hoy
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cantNum = parseFloat(cantidad);
    if (!selectedItem || isNaN(cantNum) || cantNum <= 0) {
      onNotify('Seleccione un producto y una cantidad válida.', 'error');
      return;
    }
    if (cantNum > selectedItem.stock) {
      onNotify('La cantidad gastada supera el stock disponible.', 'error');
      return;
    }

    setSaving(true);
    const ok = await onDeductSupply(selectedItem, cantNum);
    setSaving(false);

    if (ok) {
      setCantidad('');
      setProductoId('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Consumo de Insumos Diarios
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Descuente los ingredientes y materias primas utilizadas en la jornada de cocina.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
        >
          <div className="md:col-span-3">
            <label
              htmlFor="selectRubroInsumo"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Rubro (Categoría Fija)
            </label>
            <select
              id="selectRubroInsumo"
              value={rubro}
              onChange={(e) => {
                setRubro(e.target.value);
                setProductoId('');
              }}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
            >
              <option value="">Seleccione rubro...</option>
              {RUBROS_FIJOS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="selectProductoInsumo"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Producto a Descontar
            </label>
            <select
              id="selectProductoInsumo"
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
            >
              <option value="">Seleccione producto...</option>
              {productosFiltrados.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.producto} (Disp: {prod.stock} {prod.unidad || 'Unid'})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="cantGastoInsumo"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Cantidad Gastada
            </label>
            <input
              id="cantGastoInsumo"
              type="number"
              step="0.1"
              min="0.1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ej: 10.0"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="flex w-full min-h-10 items-center justify-center gap-2 rounded-lg bg-[#8B1E3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#68132D] transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MinusCircle className="h-4 w-4" />
              )}
              <span>{saving ? 'Registrando...' : 'Registrar Gasto'}</span>
            </button>
          </div>
        </form>

        {selectedItem && (
          <p className="mt-3 text-xs text-slate-500 font-mono tabular-nums">
            Disponible en almacén: {selectedItem.stock} {selectedItem.unidad} · Mínimo recomendado: {selectedItem.stockMin} {selectedItem.unidad}
          </p>
        )}
      </div>

      {/* Today's Consumption Log */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-display text-base font-bold text-slate-900">
            Consumos Registrados Hoy
          </h2>
          <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
            Fecha: {hoy} · {consumosHoy.length} movimientos
          </p>
        </div>

        {consumosHoy.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Package className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">
              Sin consumos registrados hoy
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Los insumos descontados durante el día aparecerán aquí.
            </p>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-100">
              {consumosHoy.map((c) => (
                <div
                  key={c.id}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">
                      {c.producto}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.rubro}</p>
                  </div>
                  <span className="font-mono text-sm font-bold tabular-nums text-[#8B1E3F] shrink-0">
                    {c.cantidad} {c.unidad || 'Unid'}
                  </span>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                    <th className="px-6 py-3 text-left">Rubro</th>
                    <th className="px-6 py-3 text-left">Producto</th>
                    <th className="px-6 py-3 text-right">Cantidad Gastada</th>
                    <th className="px-6 py-3 text-left">Unidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consumosHoy.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-3 text-slate-600">{c.rubro}</td>
                      <td className="px-6 py-3 font-semibold text-slate-900">{c.producto}</td>
                      <td className="px-6 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                        {c.cantidad}
                      </td>
                      <td className="px-6 py-3 text-slate-600">{c.unidad || 'Unid'}</td>
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
