import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Search,
  Trash2,
  Loader2,
  Warehouse,
} from 'lucide-react';
import { InventoryItem, RUBROS_FIJOS } from '../../types';
import {
  descargarModeloExcel,
  parseInventarioExcel,
} from '../../utils/exports';

interface InventarioSectionProps {
  inventario: InventoryItem[];
  onAddOrUpdateProduct: (payload: {
    rubro: string;
    producto: string;
    unidad: string;
    stock: number;
    stockMin: number;
  }) => Promise<boolean>;
  onBulkImportExcel: (
    items: Array<{
      rubro: string;
      nombre: string;
      unidad: string;
      stock: number;
      stock_min: number;
    }>,
    skipped: number
  ) => Promise<void>;
  onDeleteProduct: (id: number, nombre: string) => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const InventarioSection: React.FC<InventarioSectionProps> = ({
  inventario,
  onAddOrUpdateProduct,
  onBulkImportExcel,
  onDeleteProduct,
  onNotify,
}) => {
  const [rubro, setRubro] = useState<string>(RUBROS_FIJOS[0]);
  const [prodLista, setProdLista] = useState('');
  const [prodManual, setProdManual] = useState('');
  const [unidad, setUnidad] = useState('Kg');
  const [stock, setStock] = useState('');
  const [stockMin, setStockMin] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  const [search, setSearch] = useState('');
  const [filterRubro, setFilterRubro] = useState('');
  const excelInputRef = useRef<HTMLInputElement>(null);

  const prodsEnRubro = inventario.filter((i) => i.rubro === rubro);

  const filtrados = inventario.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      item.producto.toLowerCase().includes(q) ||
      item.rubro.toLowerCase().includes(q);
    const matchRubro = !filterRubro || item.rubro === filterRubro;
    return matchSearch && matchRubro;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productoFinal =
      prodManual.trim() !== '' ? prodManual.trim() : prodLista;
    if (!productoFinal) {
      onNotify('Seleccione un producto guardado o escriba uno nuevo.', 'error');
      return;
    }

    setSaving(true);
    const ok = await onAddOrUpdateProduct({
      rubro,
      producto: productoFinal,
      unidad,
      stock: parseFloat(stock) || 0,
      stockMin: parseFloat(stockMin) || 0,
    });
    setSaving(false);

    if (ok) {
      setProdLista('');
      setProdManual('');
      setStock('');
      setStockMin('');
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingExcel(true);
    try {
      const { items, skipped } = await parseInventarioExcel(file);
      await onBulkImportExcel(items, skipped);
    } catch {
      onNotify('Error al leer el archivo Excel.', 'error');
    } finally {
      setUploadingExcel(false);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Control de Inventario y Subdivisión de Rubros
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Cargue existencias de forma individual o masiva mediante plantilla Excel.
        </p>
      </div>

      {/* Bulk Excel Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900">
              Carga Masiva mediante Excel
            </h2>
            <p className="text-xs text-slate-500">
              Descargue la plantilla oficial con los 6 rubros fijos o importe su archivo actualizado.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={descargarModeloExcel}
            className="flex min-h-10 items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs sm:text-sm font-bold text-[#4A0E20] hover:bg-[#C39E2B] transition-colors whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>Descargar Plantilla Excel</span>
          </button>

          <label
            htmlFor="inputExcelInventario"
            className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#8B1E3F] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#68132D] transition-colors whitespace-nowrap"
          >
            {uploadingExcel ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>
              {uploadingExcel ? 'Cargando...' : 'Subir Excel Actualizado'}
            </span>
          </label>
          <input
            ref={excelInputRef}
            id="inputExcelInventario"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleExcelUpload}
            className="sr-only"
          />
        </div>
      </div>

      {/* Add Form + Search/Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-base font-bold text-slate-900 mb-5">
            Cargar / Registrar Producto en Rubro
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="regRubroInsumo"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                1. Seleccionar Rubro (Fijo)
              </label>
              <select
                id="regRubroInsumo"
                value={rubro}
                onChange={(e) => {
                  setRubro(e.target.value);
                  setProdLista('');
                }}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              >
                {RUBROS_FIJOS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="regSelectProductoInsumo"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                2. Seleccionar Producto Guardado
              </label>
              <select
                id="regSelectProductoInsumo"
                value={prodLista}
                onChange={(e) => setProdLista(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              >
                <option value="">Seleccione producto guardado...</option>
                {prodsEnRubro.map((p) => (
                  <option key={p.id} value={p.producto}>
                    {p.producto}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="regNuevoProductoManual"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                O Escribir Producto Nuevo
              </label>
              <input
                id="regNuevoProductoManual"
                type="text"
                value={prodManual}
                onChange={(e) => setProdManual(e.target.value)}
                placeholder="Ej: Harina de Maíz"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="regUnidadInsumo"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Unidad
                </label>
                <select
                  id="regUnidadInsumo"
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
                >
                  <option value="Kg">Kilogramos (Kg)</option>
                  <option value="Gramos">Gramos (g)</option>
                  <option value="Lts">Litros (Lts)</option>
                  <option value="Unid">Unidades (Unid)</option>
                  <option value="Paquetes">Paquetes</option>
                  <option value="Latas">Latas</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="regStockInsumo"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Stock (+)
                </label>
                <input
                  id="regStockInsumo"
                  type="number"
                  step="0.1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="10.0"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
                />
              </div>
              <div>
                <label
                  htmlFor="regMinInsumo"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Mínimo
                </label>
                <input
                  id="regMinInsumo"
                  type="number"
                  step="0.1"
                  value={stockMin}
                  onChange={(e) => setStockMin(e.target.value)}
                  placeholder="2.0"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
                />
              </div>
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
              <span>{saving ? 'Guardando...' : 'Guardar Producto'}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {/* Search & Filter */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-display text-base font-bold text-slate-900 mb-4">
              Buscador e Inspección de Productos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="searchInsumoInput"
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  Buscar Producto o Rubro
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="searchInsumoInput"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Escriba: Harina, Proteínas..."
                    className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="filterRubroInventario"
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  Filtrar por Rubro Fijo
                </label>
                <select
                  id="filterRubroInventario"
                  value={filterRubro}
                  onChange={(e) => setFilterRubro(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
                >
                  <option value="">TODOS LOS RUBROS</option>
                  {RUBROS_FIJOS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            {filtrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <Warehouse className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Sin productos que coincidan
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filtrados.map((item) => {
                    const bajo = item.stock <= item.stockMin;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 flex items-center justify-between gap-3 ${
                          bajo ? 'bg-rose-50/60' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-slate-900 truncate">
                            {item.producto}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.rubro} · Mín:{' '}
                            <span className="font-mono tabular-nums">
                              {item.stockMin}
                            </span>{' '}
                            {item.unidad || 'Unid'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span
                              className={`block font-mono text-sm font-bold tabular-nums ${
                                bajo ? 'text-rose-700' : 'text-slate-900'
                              }`}
                            >
                              {item.stock} {item.unidad || 'Unid'}
                            </span>
                            {bajo && (
                              <span className="text-[11px] font-semibold text-rose-700">
                                Stock bajo
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onDeleteProduct(item.id, item.producto)
                            }
                            aria-label={`Eliminar ${item.producto}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
                        <th className="px-4 py-3 text-left">Rubro</th>
                        <th className="px-4 py-3 text-left">Producto</th>
                        <th className="px-4 py-3 text-right">Stock</th>
                        <th className="px-4 py-3 text-left">Unidad</th>
                        <th className="px-4 py-3 text-right">Mín.</th>
                        <th className="px-4 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtrados.map((item) => {
                        const bajo = item.stock <= item.stockMin;
                        return (
                          <tr
                            key={item.id}
                            className={
                              bajo
                                ? 'bg-rose-50/60 hover:bg-rose-50'
                                : 'hover:bg-slate-50/70'
                            }
                          >
                            <td className="px-4 py-3 text-xs text-slate-600">
                              {item.rubro}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {item.producto}
                              {bajo && (
                                <span className="ml-2 text-xs font-semibold text-rose-700">
                                  · Stock bajo
                                </span>
                              )}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-mono font-bold tabular-nums ${
                                bajo ? 'text-rose-700' : 'text-slate-900'
                              }`}
                            >
                              {item.stock}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {item.unidad || 'Unid'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-500">
                              {item.stockMin}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  onDeleteProduct(item.id, item.producto)
                                }
                                aria-label={`Eliminar ${item.producto}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
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
      </div>
    </div>
  );
};
