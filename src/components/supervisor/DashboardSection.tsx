import React, { useState, useMemo } from 'react';
import {
  Utensils,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Package,
  Clock,
  Users,
  Receipt,
  FileText,
  Banknote,
  TrendingUp,
  Building2,
} from 'lucide-react';
import {
  ActiveSection,
  AttendanceRecord,
  Client,
  DailyConsumption,
  Employee,
  InventoryItem,
  ServedDish,
} from '../../types';
import { formatBs, formatUSD, getCurrentMonthISO, getTodayISO } from '../../utils/format';
import { DishThumbnail } from '../ui/DishThumbnail';

interface DashboardSectionProps {
  registroComidas: ServedDish[];
  inventario: InventoryItem[];
  preciosPlatos: Record<string, number>;
  clientes: Client[];
  nomina: Employee[];
  asistencias: AttendanceRecord[];
  consumosDiarios: DailyConsumption[];
  tasaCambio: number;
  onNavigate: (section: ActiveSection) => void;
  onPreviewPhoto: (url: string) => void;
}

type PeriodMode = 'hoy' | '7d' | 'mes';

function shiftDateISO(baseISO: string, daysDelta: number): string {
  const [y, m, d] = baseISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + daysDelta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function shortDayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return `${days[dt.getDay()]} ${d}`;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  registroComidas,
  inventario,
  preciosPlatos,
  clientes,
  nomina,
  asistencias,
  consumosDiarios,
  tasaCambio,
  onNavigate,
  onPreviewPhoto,
}) => {
  const [period, setPeriod] = useState<PeriodMode>('hoy');
  const hoy = getTodayISO();
  const mesActual = getCurrentMonthISO();
  const hace7Dias = shiftDateISO(hoy, -6);

  const comidasPeriodo = useMemo(() => {
    return registroComidas.filter((c) => {
      const fecha =
        c.fecha_limpia || (c.fecha_full ? String(c.fecha_full).substring(0, 10) : '');
      if (period === 'hoy') return fecha === hoy;
      if (period === '7d') return fecha >= hace7Dias && fecha <= hoy;
      return fecha.startsWith(mesActual);
    });
  }, [registroComidas, period, hoy, hace7Dias, mesActual]);

  // Period KPIs
  const totalRacionesPeriodo = comidasPeriodo.reduce(
    (acc, curr) => acc + (Number(curr.cantidad) || 0),
    0
  );
  const totalVentasPeriodo = comidasPeriodo.reduce(
    (acc, item) =>
      acc + (Number(item.cantidad) || 0) * (preciosPlatos[item.tipo] || 0),
    0
  );
  const ventasPeriodoBs = totalVentasPeriodo * tasaCambio;

  // Global Accounts Receivable (All Unpaid)
  const { totalPendienteUSD, registrosPendientes, totalCobradoPeriodo } = useMemo(() => {
    let pendUSD = 0;
    let pendCount = 0;
    registroComidas.forEach((item) => {
      if (!item.pagado) {
        pendCount++;
        pendUSD += (Number(item.cantidad) || 0) * (preciosPlatos[item.tipo] || 0);
      }
    });
    const cobradoPer = comidasPeriodo.reduce((acc, item) => {
      if (!item.pagado) return acc;
      return acc + (Number(item.cantidad) || 0) * (preciosPlatos[item.tipo] || 0);
    }, 0);
    return {
      totalPendienteUSD: pendUSD,
      registrosPendientes: pendCount,
      totalCobradoPeriodo: cobradoPer,
    };
  }, [registroComidas, comidasPeriodo, preciosPlatos]);

  // Attendance Today
  const presentesHoy = useMemo(() => {
    return nomina.filter((emp) =>
      asistencias.some((a) => a.fecha === hoy && a.cedula === emp.cedula && a.presente)
    ).length;
  }, [nomina, asistencias, hoy]);

  // Supplies Used Today
  const consumosHoyCount = useMemo(
    () =>
      consumosDiarios.filter(
        (c) => (c.fecha_limpia || String(c.fecha).substring(0, 10)) === hoy
      ).length,
    [consumosDiarios, hoy]
  );

  // 7-Day Trend Data
  const trend7Days = useMemo(() => {
    const days: Array<{ iso: string; label: string; raciones: number; usd: number }> = [];
    for (let i = -6; i <= 0; i++) {
      const iso = shiftDateISO(hoy, i);
      const dayItems = registroComidas.filter(
        (c) => (c.fecha_limpia || String(c.fecha_full).substring(0, 10)) === iso
      );
      const raciones = dayItems.reduce((a, b) => a + (Number(b.cantidad) || 0), 0);
      const usd = dayItems.reduce(
        (a, b) => a + (Number(b.cantidad) || 0) * (preciosPlatos[b.tipo] || 0),
        0
      );
      days.push({ iso, label: shortDayLabel(iso), raciones, usd });
    }
    const maxUsd = Math.max(...days.map((d) => d.usd), 1);
    const maxRaciones = Math.max(...days.map((d) => d.raciones), 1);
    return { days, maxUsd, maxRaciones };
  }, [registroComidas, preciosPlatos, hoy]);

  // Client Billing Breakdown for Selected Period
  const clientBreakdown = useMemo(() => {
    const map: Record<
      string,
      { cliente: string; raciones: number; totalUSD: number; pagadoUSD: number }
    > = {};
    comidasPeriodo.forEach((item) => {
      const key = item.cliente || 'Sin Cliente';
      if (!map[key]) {
        map[key] = { cliente: key, raciones: 0, totalUSD: 0, pagadoUSD: 0 };
      }
      const cant = Number(item.cantidad) || 0;
      const usd = cant * (preciosPlatos[item.tipo] || 0);
      map[key].raciones += cant;
      map[key].totalUSD += usd;
      if (item.pagado) map[key].pagadoUSD += usd;
    });
    const list = Object.values(map).sort((a, b) => b.totalUSD - a.totalUSD);
    const maxUSD = Math.max(...list.map((c) => c.totalUSD), 1);
    return { list, maxUSD };
  }, [comidasPeriodo, preciosPlatos]);

  // Dish Category Mix for Selected Period
  const categoryMix = useMemo(() => {
    const map: Record<string, { tipo: string; raciones: number; usd: number }> = {};
    comidasPeriodo.forEach((item) => {
      if (!map[item.tipo]) {
        map[item.tipo] = { tipo: item.tipo, raciones: 0, usd: 0 };
      }
      const cant = Number(item.cantidad) || 0;
      map[item.tipo].raciones += cant;
      map[item.tipo].usd += cant * (preciosPlatos[item.tipo] || 0);
    });
    return Object.values(map).sort((a, b) => b.raciones - a.raciones);
  }, [comidasPeriodo, preciosPlatos]);

  const recentDishes = registroComidas.slice(0, 5);
  const bajoStock = inventario.filter((i) => i.stock <= i.stockMin);

  const periodLabel =
    period === 'hoy' ? 'Hoy' : period === '7d' ? 'Últimos 7 días' : 'Mes actual';

  return (
    <div className="space-y-6">
      {/* Executive Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-[#68132D] via-[#8B1E3F] to-[#4A0E20] p-5 sm:p-7 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="font-mono text-xs text-amber-200/95 tabular-nums">
              {hoy} · Tasa BCV/Ref: {tasaCambio.toFixed(2)} Bs/$ · {clientes.length} clientes activos
            </p>
            <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Resumen General de Operación
            </h1>
            <p className="mt-1 text-sm text-rose-100/85 max-w-xl">
              Monitoreo en vivo de producción de cocina, cuentas por cobrar, asistencia de personal y reposición de almacén.
            </p>
          </div>

          {/* Period Segmented Switcher */}
          <div className="inline-flex self-start md:self-auto rounded-xl bg-black/25 p-1 backdrop-blur-xs">
            {(
              [
                { id: 'hoy', label: 'Hoy' },
                { id: '7d', label: '7 Días' },
                { id: 'mes', label: 'Este Mes' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={`min-h-9 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  period === opt.id
                    ? 'bg-[#D4AF37] text-[#4A0E20] shadow-xs'
                    : 'text-rose-100 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Action Strip (Touch friendly on mobile) */}
        <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('secReportesCocina')}
            className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
          >
            <Receipt className="h-3.5 w-3.5 text-amber-300" />
            <span>Cobros & Platos</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('secInventarioSup')}
            className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
          >
            <Package className="h-3.5 w-3.5 text-amber-300" />
            <span>Inventario</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('secNominaSup')}
            className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
          >
            <Banknote className="h-3.5 w-3.5 text-amber-300" />
            <span>Nómina</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('secPdfReportes')}
            className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-amber-300" />
            <span>Reportes PDF</span>
          </button>
        </div>
      </div>

      {/* 4-Column KPI Grid (2x2 on Phone, 4x1 on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Raciones ({periodLabel})
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-[#8B1E3F]">
              <Utensils className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
            {totalRacionesPeriodo}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {comidasPeriodo.length} servicios · {clientBreakdown.list.length} clientes
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Facturado ({periodLabel})
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
            {formatUSD(totalVentasPeriodo)}
          </p>
          <p className="mt-1 font-mono text-xs text-slate-500 tabular-nums truncate">
            {formatBs(ventasPeriodoBs)} · Cobrado: {formatUSD(totalCobradoPeriodo)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('secReportesCocina')}
          className="text-left rounded-xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-[#8B1E3F]/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Por Cobrar (Total)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-bold tabular-nums text-rose-700">
            {formatUSD(totalPendienteUSD)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {registrosPendientes} entregas pendientes
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('secNominaSup')}
          className="text-left rounded-xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-[#8B1E3F]/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Asistencia Hoy
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
            {presentesHoy}
            <span className="text-base font-normal text-slate-400">
              /{nomina.length}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {consumosHoyCount} egresos de almacén hoy
          </p>
        </button>
      </div>

      {/* Middle Analytics Row: 7-Day Trend Chart + Client Billing Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 7-Day Production & Revenue Bar Chart */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#8B1E3F]" />
                <span>Pulso Operativo (Últimos 7 Días)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Facturación diaria sin IVA (USD) y volumen de raciones
              </p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-44 pt-4">
            {trend7Days.days.map((day) => {
              const heightPct =
                day.usd > 0
                  ? Math.max(12, Math.round((day.usd / trend7Days.maxUsd) * 100))
                  : 4;
              const isToday = day.iso === hoy;
              return (
                <div
                  key={day.iso}
                  className="flex flex-col items-center h-full justify-end group"
                >
                  <span className="font-mono text-[10px] sm:text-xs font-semibold tabular-nums text-slate-700 mb-1">
                    {day.raciones > 0 ? `${day.raciones}` : '0'}
                  </span>
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      title={`${day.label}: ${day.raciones} raciones · ${formatUSD(day.usd)}`}
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-10 rounded-t-lg transition-all ${
                        day.usd === 0
                          ? 'bg-slate-100'
                          : isToday
                          ? 'bg-[#8B1E3F]'
                          : 'bg-[#D4AF37]/80 hover:bg-[#8B1E3F]/85'
                      }`}
                    />
                  </div>
                  <span
                    className={`mt-2 text-[10px] sm:text-xs tabular-nums whitespace-nowrap ${
                      isToday
                        ? 'font-bold text-[#8B1E3F]'
                        : 'font-medium text-slate-500'
                    }`}
                  >
                    {day.label}
                  </span>
                  <span className="hidden sm:block font-mono text-[10px] tabular-nums text-slate-400">
                    {formatUSD(day.usd)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Client Breakdown */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#8B1E3F]" />
                <span>Consumo por Cliente ({periodLabel})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Participación en facturación neta
              </p>
            </div>
          </div>

          {clientBreakdown.list.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm font-medium text-slate-600">
                Sin servicios registrados en este periodo
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Cambie el filtro a 7 Días o Este Mes para ver el histórico.
              </p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {clientBreakdown.list.slice(0, 5).map((cl) => {
                const widthPct = Math.max(
                  6,
                  Math.round((cl.totalUSD / clientBreakdown.maxUSD) * 100)
                );
                const paidPct =
                  cl.totalUSD > 0
                    ? Math.round((cl.pagadoUSD / cl.totalUSD) * 100)
                    : 0;

                return (
                  <div key={cl.cliente}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-semibold text-slate-900 truncate">
                        {cl.cliente}
                      </span>
                      <span className="font-mono text-xs font-bold tabular-nums text-slate-900 shrink-0">
                        {formatUSD(cl.totalUSD)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className="h-full rounded-full bg-[#8B1E3F]"
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                      <span>{cl.raciones} raciones</span>
                      <span>{paidPct}% cobrado</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Kitchen Activity + Category Mix & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Kitchen Feed */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 sm:px-6 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Últimos Platos Registrados en Cocina
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Entregas recientes con respaldo fotográfico
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('secReportesCocina')}
              className="text-xs font-semibold text-[#8B1E3F] hover:underline whitespace-nowrap"
            >
              Ver todos
            </button>
          </div>

          {recentDishes.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">
              Aún no hay platos registrados en el sistema.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentDishes.map((dish) => {
                const total =
                  (Number(dish.cantidad) || 0) * (preciosPlatos[dish.tipo] || 0);
                return (
                  <div
                    key={dish.id}
                    className="flex items-center gap-3.5 px-5 sm:px-6 py-3.5 hover:bg-slate-50/70 transition-colors"
                  >
                    <DishThumbnail
                      src={dish.foto_url}
                      alt={dish.nombre}
                      sizeClass="h-12 w-12"
                      onClick={() => onPreviewPhoto(dish.foto_url)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {dish.nombre}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {dish.cliente} · {dish.tipo} ·{' '}
                        <span className="font-mono tabular-nums">
                          {dish.fecha_limpia || dish.fecha_full}
                        </span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-bold tabular-nums text-slate-900">
                        {formatUSD(total)}
                      </p>
                      <p className="font-mono text-xs tabular-nums text-slate-500">
                        {dish.cantidad} rac.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Stack: Dish Mix + Low Stock Alerts */}
        <div className="lg:col-span-5 space-y-6">
          {/* Dish Type Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-display text-base font-bold text-slate-900 mb-3">
              Menús por Categoría ({periodLabel})
            </h2>
            {categoryMix.length === 0 ? (
              <p className="text-xs text-slate-500">
                Sin platos servidos en este periodo.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {categoryMix.map((cat) => (
                  <div
                    key={cat.tipo}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <span className="font-medium text-slate-800">{cat.tipo}</span>
                    <div className="text-right font-mono tabular-nums">
                      <span className="font-semibold text-slate-900">
                        {cat.raciones} rac.
                      </span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="text-xs text-[#8B1E3F] font-semibold">
                        {formatUSD(cat.usd)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inventory Alerts */}
          <div
            className={`rounded-xl border p-5 sm:p-6 ${
              bajoStock.length === 0
                ? 'border-emerald-200 bg-emerald-50/40'
                : 'border-amber-200 bg-amber-50/50'
            }`}
          >
            {bajoStock.length === 0 ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-display text-base font-bold text-emerald-900">
                    Inventario en Nivel Óptimo
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-emerald-800/85">
                    Todos los rubros superan su stock mínimo configurado.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Alertas de Stock ({bajoStock.length})
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('secInventarioSup')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B1E3F] hover:underline whitespace-nowrap"
                  >
                    <span>Reponer</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-amber-200/70 rounded-lg border border-amber-200 bg-white overflow-hidden">
                  {bajoStock.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs sm:text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {item.producto}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.rubro}
                        </p>
                      </div>
                      <span className="font-mono text-xs tabular-nums text-rose-700 font-bold shrink-0">
                        {item.stock}/{item.stockMin} {item.unidad || 'U'}
                      </span>
                    </div>
                  ))}
                </div>
                {bajoStock.length > 6 && (
                  <button
                    type="button"
                    onClick={() => onNavigate('secInventarioSup')}
                    className="mt-3 w-full text-center text-xs font-semibold text-[#8B1E3F] hover:underline"
                  >
                    Ver los {bajoStock.length} productos en alerta
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
