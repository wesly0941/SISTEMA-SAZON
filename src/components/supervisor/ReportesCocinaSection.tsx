import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  X,
  Save,
  Loader2,
} from 'lucide-react';
import {
  Client,
  DailyConsumption,
  InventoryItem,
  RUBROS_FIJOS,
  ServedDish,
} from '../../types';
import { formatUSD, getTodayISO } from '../../utils/format';
import { exportarComidasExcel } from '../../utils/exports';
import { DishThumbnail } from '../ui/DishThumbnail';

interface ReportesCocinaSectionProps {
  clients: Client[];
  preciosPlatos: Record<string, number>;
  registroComidas: ServedDish[];
  consumosDiarios: DailyConsumption[];
  inventario: InventoryItem[];
  onTogglePagoComida: (dish: ServedDish) => Promise<void>;
  onUpdateComida: (
    id: number,
    payload: {
      fecha_full: string;
      tipo: string;
      nombre: string;
      cliente: string;
      cantidad: number;
    }
  ) => Promise<boolean>;
  onDeleteComida: (dish: ServedDish) => void;
  onUpdateGasto: (
    gastoAntiguo: DailyConsumption,
    nuevoRubro: string,
    nuevoProdObj: InventoryItem,
    nuevaCant: number
  ) => Promise<boolean>;
  onDeleteGasto: (gasto: DailyConsumption) => void;
  onPreviewPhoto: (url: string) => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ReportesCocinaSection: React.FC<ReportesCocinaSectionProps> = ({
  clients,
  preciosPlatos,
  registroComidas,
  consumosDiarios,
  inventario,
  onTogglePagoComida,
  onUpdateComida,
  onDeleteComida,
  onUpdateGasto,
  onDeleteGasto,
  onPreviewPhoto,
  onNotify,
}) => {
  const today = getTodayISO();
  const [filtroCliente, setFiltroCliente] = useState('');
  const [desde, setDesde] = useState(today);
  const [hasta, setHasta] = useState(today);
  const [fechaGastos, setFechaGastos] = useState(today);

  // Edit Dish Modal State
  const [editingDish, setEditingDish] = useState<ServedDish | null>(null);
  const [editFecha, setEditFecha] = useState('');
  const [editTipo, setEditTipo] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editCliente, setEditCliente] = useState('');
  const [editCant, setEditCant] = useState('');
  const [savingDish, setSavingDish] = useState(false);

  // Edit Expense Modal State
  const [editingGasto, setEditingGasto] = useState<DailyConsumption | null>(
    null
  );
  const [editGastoRubro, setEditGastoRubro] = useState('');
  const [editGastoProdId, setEditGastoProdId] = useState('');
  const [editGastoCant, setEditGastoCant] = useState('');
  const [savingGasto, setSavingGasto] = useState(false);

  const filtrados = registroComidas.filter((item) => {
    const fechaItem =
      item.fecha_limpia ||
      (item.fecha_full ? String(item.fecha_full).substring(0, 10) : '');
    const matchCliente = !filtroCliente || item.cliente === filtroCliente;
    const matchDesde = !desde || fechaItem >= desde;
    const matchHasta = !hasta || fechaItem <= hasta;
    return matchCliente && matchDesde && matchHasta;
  });

  // Accumulated Manager Summary
  const acumuladoMap: Record<
    string,
    { cliente: string; tipo: string; totalCantidad: number }
  > = {};
  filtrados.forEach((item) => {
    const clave = `${item.cliente}___${item.tipo}`;
    if (!acumuladoMap[clave]) {
      acumuladoMap[clave] = {
        cliente: item.cliente,
        tipo: item.tipo,
        totalCantidad: 0,
      };
    }
    acumuladoMap[clave].totalCantidad += Number(item.cantidad) || 0;
  });
  const gruposAcumulados = Object.values(acumuladoMap);

  const consumosFecha = consumosDiarios.filter(
    (c) => (c.fecha_limpia || String(c.fecha).substring(0, 10)) === fechaGastos
  );

  const openEditDish = (dish: ServedDish) => {
    setEditingDish(dish);
    setEditFecha(
      dish.fecha_limpia || String(dish.fecha_full).substring(0, 10)
    );
    setEditTipo(dish.tipo);
    setEditNombre(dish.nombre);
    setEditCliente(dish.cliente);
    setEditCant(String(dish.cantidad));
  };

  const handleSaveDishEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;
    setSavingDish(true);
    const ok = await onUpdateComida(editingDish.id, {
      fecha_full: editFecha,
      tipo: editTipo,
      nombre: editNombre.trim(),
      cliente: editCliente,
      cantidad: parseInt(editCant, 10) || 1,
    });
    setSavingDish(false);
    if (ok) setEditingDish(null);
  };

  const openEditGasto = (gasto: DailyConsumption) => {
    setEditingGasto(gasto);
    setEditGastoRubro(gasto.rubro);
    setEditGastoCant(String(gasto.cantidad));
    const exactMatch = inventario.find(
      (i) =>
        i.rubro === gasto.rubro &&
        i.producto.toLowerCase() === gasto.producto.toLowerCase()
    );
    setEditGastoProdId(exactMatch ? String(exactMatch.id) : '');
  };

  const handleSaveGastoEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGasto) return;
    const prodObj = inventario.find((i) => i.id === Number(editGastoProdId));
    const cantNum = parseFloat(editGastoCant);
    if (!prodObj || isNaN(cantNum) || cantNum <= 0) {
      onNotify('Seleccione un producto y cantidad válida.', 'error');
      return;
    }
    setSavingGasto(true);
    const ok = await onUpdateGasto(
      editingGasto,
      editGastoRubro,
      prodObj,
      cantNum
    );
    setSavingGasto(false);
    if (ok) setEditingGasto(null);
  };

  const prodsEdicionGasto = inventario.filter(
    (i) => !editGastoRubro || i.rubro === editGastoRubro
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Reportes de Cocina: Cobros y Control de Comidas
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Auditoría gerencial acumulada, estatus de cobro por servicio y control de insumos consumidos.
        </p>
      </div>

      {/* Filters Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label
              htmlFor="filtroClienteCobros"
              className="block text-xs font-semibold text-slate-600 mb-1.5"
            >
              Filtrar por Cliente
            </label>
            <select
              id="filtroClienteCobros"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
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
              htmlFor="filtroDesdeCobros"
              className="block text-xs font-semibold text-slate-600 mb-1.5"
            >
              Desde Fecha
            </label>
            <input
              id="filtroDesdeCobros"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
            />
          </div>

          <div>
            <label
              htmlFor="filtroHastaCobros"
              className="block text-xs font-semibold text-slate-600 mb-1.5"
            >
              Hasta Fecha
            </label>
            <input
              id="filtroHastaCobros"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                if (filtrados.length === 0) {
                  onNotify('No hay registros para exportar.', 'info');
                  return;
                }
                exportarComidasExcel(filtrados, preciosPlatos);
                onNotify('Reporte Excel exportado correctamente.', 'success');
              }}
              className="flex w-full min-h-10 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#4A0E20] hover:bg-[#C39E2B] transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Exportar a Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Gerencial Summary */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-display text-base font-bold text-slate-900">
            Resumen Acumulado de Comidas Servidas (Vista Gerencial)
          </h2>
        </div>

        {gruposAcumulados.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            No hay registros acumulados para los filtros seleccionados.
          </p>
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-100">
              {gruposAcumulados.map((g) => {
                const precio = preciosPlatos[g.tipo] || 0;
                const total = precio * g.totalCantidad;
                return (
                  <div
                    key={`${g.cliente}_${g.tipo}`}
                    className="p-4 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {g.cliente}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {g.tipo} ·{' '}
                        <span className="font-mono tabular-nums">
                          {g.totalCantidad} rac. × {formatUSD(precio)}
                        </span>
                      </p>
                    </div>
                    <p className="font-mono text-sm font-bold tabular-nums text-[#8B1E3F] shrink-0">
                      {formatUSD(total)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                    <th className="px-6 py-3 text-left">Cliente / Empresa</th>
                    <th className="px-6 py-3 text-left">Tipo / Plato</th>
                    <th className="px-6 py-3 text-right">Raciones Acumuladas</th>
                    <th className="px-6 py-3 text-right">Precio Unit. ($)</th>
                    <th className="px-6 py-3 text-right">Total Acumulado ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gruposAcumulados.map((g) => {
                    const precio = preciosPlatos[g.tipo] || 0;
                    const total = precio * g.totalCantidad;
                    return (
                      <tr
                        key={`${g.cliente}_${g.tipo}`}
                        className="hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-3 font-semibold text-slate-900">
                          {g.cliente}
                        </td>
                        <td className="px-6 py-3 text-slate-600">{g.tipo}</td>
                        <td className="px-6 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {g.totalCantidad} Raciones
                        </td>
                        <td className="px-6 py-3 text-right font-mono tabular-nums text-slate-600">
                          {formatUSD(precio)}
                        </td>
                        <td className="px-6 py-3 text-right font-mono font-bold tabular-nums text-[#8B1E3F]">
                          {formatUSD(total)}
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

      {/* 2. Detailed Daily Records */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-display text-base font-bold text-slate-900">
            Detalle de Registros y Fotos ({filtrados.length})
          </h2>
        </div>

        {filtrados.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            No existen registros detallados para el rango de fechas seleccionado.
          </p>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtrados.map((item) => {
                const precio = preciosPlatos[item.tipo] || 0;
                const totalNeto = precio * (Number(item.cantidad) || 0);
                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
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
                          {item.cliente} · {item.tipo}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400 tabular-nums mt-0.5">
                          {item.fecha_limpia || item.fecha_full}
                          {item.hora ? ` · ${item.hora}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-sm font-bold tabular-nums text-slate-900">
                          {formatUSD(totalNeto)}
                        </p>
                        <p className="font-mono text-xs tabular-nums text-slate-500">
                          {item.cantidad} × {formatUSD(precio)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
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

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onTogglePagoComida(item)}
                          className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                            item.pagado
                              ? 'border border-slate-200 bg-white text-slate-700'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {item.pagado ? 'Pendiente' : 'Pagado'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditDish(item)}
                          aria-label={`Editar plato ${item.nombre}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteComida(item)}
                          aria-label={`Eliminar plato ${item.nombre}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Foto</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Plato / Tipo</th>
                    <th className="px-4 py-3 text-right">Cant.</th>
                    <th className="px-4 py-3 text-right">Total ($)</th>
                    <th className="px-4 py-3 text-left">Estatus</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtrados.map((item) => {
                    const precio = preciosPlatos[item.tipo] || 0;
                    const totalNeto = precio * (Number(item.cantidad) || 0);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-600 whitespace-nowrap">
                          {item.fecha_limpia || item.fecha_full}
                          {item.hora ? (
                            <span className="block text-slate-400">{item.hora}</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <DishThumbnail
                            src={item.foto_url}
                            alt={item.nombre}
                            onClick={() => onPreviewPhoto(item.foto_url)}
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {item.cliente}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{item.nombre}</p>
                          <p className="text-xs text-slate-500">
                            {item.tipo} · {formatUSD(precio)} c/u
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {item.cantidad}
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
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onTogglePagoComida(item)}
                              className={`min-h-8 rounded-lg px-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                                item.pagado
                                  ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {item.pagado ? 'Marcar Pend.' : 'Marcar Pagado'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditDish(item)}
                              aria-label={`Editar plato ${item.nombre}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteComida(item)}
                              aria-label={`Eliminar plato ${item.nombre}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
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

      {/* 3. Daily Supply Expenses */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <h2 className="font-display text-base font-bold text-slate-900">
            Gastos de Insumos Consumidos en Cocina
          </h2>
          <div className="flex items-center gap-2">
            <label
              htmlFor="filtroFechaGastosSup"
              className="text-xs font-semibold text-slate-600"
            >
              Fecha:
            </label>
            <input
              id="filtroFechaGastosSup"
              type="date"
              value={fechaGastos}
              onChange={(e) => setFechaGastos(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
            />
          </div>
        </div>

        {consumosFecha.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            No hay consumo de insumos registrado en la fecha seleccionada.
          </p>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100">
              {consumosFecha.map((c) => (
                <div
                  key={c.id}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">
                      {c.producto}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.rubro} ·{' '}
                      <span className="font-mono font-semibold text-slate-800 tabular-nums">
                        {c.cantidad} {c.unidad || 'Unid'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditGasto(c)}
                      aria-label={`Editar gasto de ${c.producto}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteGasto(c)}
                      aria-label={`Eliminar gasto de ${c.producto}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                    <th className="px-6 py-3 text-left">Rubro</th>
                    <th className="px-6 py-3 text-left">Producto / Insumo</th>
                    <th className="px-6 py-3 text-right">Cantidad Gastada</th>
                    <th className="px-6 py-3 text-left">Unidad</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consumosFecha.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-3 text-slate-600">{c.rubro}</td>
                      <td className="px-6 py-3 font-semibold text-slate-900">
                        {c.producto}
                      </td>
                      <td className="px-6 py-3 text-right font-mono font-bold tabular-nums text-slate-900">
                        {c.cantidad}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {c.unidad || 'Unid'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditGasto(c)}
                            aria-label={`Editar gasto de ${c.producto}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteGasto(c)}
                            aria-label={`Eliminar gasto de ${c.producto}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
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

      {/* Modal: Edit Dish */}
      {editingDish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-base font-bold text-slate-900">
                Modificar Plato Servido
              </h3>
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDishEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Fecha del Servicio
                </label>
                <input
                  type="date"
                  value={editFecha}
                  onChange={(e) => setEditFecha(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tipo de Plato
                </label>
                <select
                  value={editTipo}
                  onChange={(e) => setEditTipo(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {Object.keys(preciosPlatos).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Descripción del Plato
                </label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Cliente
                  </label>
                  <select
                    value={editCliente}
                    onChange={(e) => setEditCliente(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.nombre}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editCant}
                    onChange={(e) => setEditCant(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingDish}
                className="flex w-full min-h-10 items-center justify-center gap-2 rounded-lg bg-[#8B1E3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#68132D] transition-colors disabled:opacity-60"
              >
                {savingDish ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Guardar Cambios</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Supply Expense */}
      {editingGasto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-base font-bold text-slate-900">
                Modificar Gasto de Insumo
              </h3>
              <button
                type="button"
                onClick={() => setEditingGasto(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGastoEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Rubro
                </label>
                <select
                  value={editGastoRubro}
                  onChange={(e) => {
                    setEditGastoRubro(e.target.value);
                    setEditGastoProdId('');
                  }}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Seleccione rubro...</option>
                  {RUBROS_FIJOS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Producto
                </label>
                <select
                  value={editGastoProdId}
                  onChange={(e) => setEditGastoProdId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Seleccione producto...</option>
                  {prodsEdicionGasto.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.producto} (Disp: {p.stock} {p.unidad || 'Unid'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Cantidad Gastada
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={editGastoCant}
                  onChange={(e) => setEditGastoCant(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>

              <button
                type="submit"
                disabled={savingGasto}
                className="flex w-full min-h-10 items-center justify-center gap-2 rounded-lg bg-[#8B1E3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#68132D] transition-colors disabled:opacity-60"
              >
                {savingGasto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Guardar Cambios (Actualiza Inventario)</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
