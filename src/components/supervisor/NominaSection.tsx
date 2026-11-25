import React, { useState, useEffect } from 'react';
import {
  Coins,
  UserPlus,
  RefreshCw,
  FileSpreadsheet,
  Copy,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  History,
} from 'lucide-react';
import {
  AttendanceRecord,
  Employee,
  PayrollPayment,
} from '../../types';
import {
  copyTextToClipboard,
  formatBs,
  formatUSD,
  getCurrentMonthISO,
  getTodayISO,
} from '../../utils/format';
import { exportarNominaExcel } from '../../utils/exports';

interface NominaSectionProps {
  tasaCambio: number;
  onUpdateTasa: (newTasa: number) => void;
  nomina: Employee[];
  asistencias: AttendanceRecord[];
  pagosNomina: Record<string, PayrollPayment>;
  onSaveEmployee: (
    payload: Omit<Employee, 'id'>,
    editId: number | null
  ) => Promise<boolean>;
  onDeleteEmployee: (emp: Employee) => void;
  onToggleAttendance: (fecha: string, cedula: string) => Promise<void>;
  onPayPeriod: (payload: {
    clavePago: string;
    cedula: string;
    mes: string;
    quincena: string;
    diasPagados: number;
    montoUSD: number;
    montoBS: number;
    nombreEmpleado: string;
  }) => void;
  onRevertPayment: (clavePago: string) => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const NominaSection: React.FC<NominaSectionProps> = ({
  tasaCambio,
  onUpdateTasa,
  nomina,
  asistencias,
  pagosNomina,
  onSaveEmployee,
  onDeleteEmployee,
  onToggleAttendance,
  onPayPeriod,
  onRevertPayment,
  onNotify,
}) => {
  const [tasaInput, setTasaInput] = useState(String(tasaCambio));
  useEffect(() => {
    setTasaInput(String(tasaCambio));
  }, [tasaCambio]);

  // Employee Form State
  const [editId, setEditId] = useState<number | null>(null);
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [sueldo, setSueldo] = useState('');
  const [banco, setBanco] = useState('');
  const [telefono, setTelefono] = useState('');
  const [savingEmp, setSavingEmp] = useState(false);

  // Period Filters
  const [mesSel, setMesSel] = useState(getCurrentMonthISO());
  const [quincenaSel, setQuincenaSel] = useState<'Q1' | 'Q2'>(() =>
    new Date().getDate() <= 15 ? 'Q1' : 'Q2'
  );
  const [fechaAsistencia, setFechaAsistencia] = useState(getTodayISO());
  const [busyCedula, setBusyCedula] = useState<string | null>(null);

  const resetForm = () => {
    setEditId(null);
    setCedula('');
    setNombre('');
    setCargo('');
    setSueldo('');
    setBanco('');
    setTelefono('');
  };

  const handleEditEmp = (emp: Employee) => {
    setEditId(emp.id);
    setCedula(emp.cedula);
    setNombre(emp.nombre);
    setCargo(emp.cargo);
    setSueldo(String(emp.sueldoMensual));
    setBanco(emp.banco || '');
    setTelefono(emp.telefono || '');
  };

  const handleSubmitEmp = async (e: React.FormEvent) => {
    e.preventDefault();
    const sueldoNum = parseFloat(sueldo);
    if (!cedula.trim() || !nombre.trim() || isNaN(sueldoNum)) return;
    setSavingEmp(true);
    const ok = await onSaveEmployee(
      {
        cedula: cedula.trim(),
        nombre: nombre.trim(),
        cargo: cargo.trim(),
        sueldoMensual: sueldoNum,
        banco: banco.trim(),
        telefono: telefono.trim(),
      },
      editId
    );
    setSavingEmp(false);
    if (ok) resetForm();
  };

  const handleApplyTasa = () => {
    const val = parseFloat(tasaInput);
    if (!isNaN(val) && val > 0) {
      onUpdateTasa(val);
    } else {
      onNotify('Ingrese una tasa de cambio válida mayor a 0.', 'error');
    }
  };

  const handleCopyPagoMovil = async (texto: string) => {
    const copied = await copyTextToClipboard(texto);
    if (copied) {
      onNotify('Datos de Pago Móvil copiados al portapapeles.', 'success');
    } else {
      onNotify('No se pudo copiar automáticamente al portapapeles.', 'error');
    }
  };

  const pagosHistorial = Object.values(pagosNomina).filter((p) => p.pagado);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Liquidación de Nómina Quincenal (Base 20 Días) y Pago Móvil
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Calcule asignaciones por días asistidos, aplique la tasa oficial y conserve el historial de pagos.
        </p>
      </div>

      {/* Exchange Rate Bar */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4AF37]/25 text-[#8B1E3F]">
            <Coins className="h-4 w-4" />
          </div>
          <label
            htmlFor="tasaCambioInput"
            className="text-sm font-semibold text-slate-800"
          >
            Tasa de Cambio Actual (Bs / USD):
          </label>
          <input
            id="tasaCambioInput"
            type="number"
            step="0.01"
            min="0.01"
            value={tasaInput}
            onChange={(e) => setTasaInput(e.target.value)}
            className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-mono font-semibold tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleApplyTasa}
            className="min-h-9 rounded-lg bg-[#8B1E3F] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#68132D] transition-colors whitespace-nowrap"
          >
            Aplicar Tasa
          </button>
        </div>

        <p className="font-mono text-xs tabular-nums text-slate-600">
          Tasa activa: <strong>{tasaCambio.toFixed(2)} Bs/$</strong>
        </p>
      </div>

      {/* Employee Form + Period Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-base font-bold text-slate-900 mb-5">
            {editId ? 'Editar Empleado' : 'Registrar Empleado y Datos de Pago'}
          </h2>

          <form onSubmit={handleSubmitEmp} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Cédula de Identidad
                </label>
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="V-12345678"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Sueldo Base Mensual (USD $)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sueldo}
                  onChange={(e) => setSueldo(e.target.value)}
                  placeholder="Ej: 400.00"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Banco (Pago Móvil)
                </label>
                <input
                  type="text"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  placeholder="Ej: Banesco, Venezuela"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Teléfono (Pago Móvil)
                </label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 04141234567"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={savingEmp}
                className="flex flex-1 min-h-10 items-center justify-center gap-2 rounded-lg bg-[#8B1E3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#68132D] transition-colors disabled:opacity-60"
              >
                {savingEmp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editId ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                <span>{editId ? 'Actualizar Empleado' : 'Guardar Empleado'}</span>
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-base font-bold text-slate-900 mb-5">
            Filtro de Periodo Quincenal
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="filtroMesNomina"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Mes de Liquidación
              </label>
              <input
                id="filtroMesNomina"
                type="month"
                value={mesSel}
                onChange={(e) => setMesSel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="filtroQuincenaNomina"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Quincena a Liquidar
              </label>
              <select
                id="filtroQuincenaNomina"
                value={quincenaSel}
                onChange={(e) => setQuincenaSel(e.target.value as 'Q1' | 'Q2')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
              >
                <option value="Q1">Primera Quincena (Días 01 al 15)</option>
                <option value="Q2">Segunda Quincena (Días 16 al 31)</option>
              </select>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Al marcar <strong className="text-slate-700">Pagado</strong>, la cuenta pendiente del corte reinicia a 0 días y el comprobante queda guardado en el historial con la tasa aplicada del día.
            </p>

            <button
              type="button"
              onClick={() => {
                exportarNominaExcel(
                  nomina,
                  asistencias,
                  pagosNomina,
                  mesSel,
                  quincenaSel,
                  tasaCambio
                );
                onNotify('Archivo de nómina exportado a Excel.', 'success');
              }}
              className="flex w-full min-h-10 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-[#4A0E20] hover:bg-[#C39E2B] transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Descargar Nómina en Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Liquidation Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 sm:px-6 py-4">
          <h2 className="font-display text-base font-bold text-slate-900">
            Liquidación Activa ({mesSel} · {quincenaSel === 'Q1' ? '1ra Quincena' : '2da Quincena'})
          </h2>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {nomina.map((emp) => {
            const pagoDia = emp.sueldoMensual / 20;
            const asistenciasEmp = asistencias.filter((a) => {
              if (!a.fecha || a.cedula !== emp.cedula || !a.presente)
                return false;
              if (!a.fecha.startsWith(mesSel)) return false;
              const dia = parseInt(a.fecha.split('-')[2], 10);
              if (quincenaSel === 'Q1') return dia >= 1 && dia <= 15;
              return dia >= 16 && dia <= 31;
            });

            const diasReales = asistenciasEmp.length;
            const clavePago = `${mesSel}_${quincenaSel}_${emp.cedula}`;
            const regPago = pagosNomina[clavePago];
            const estaPagado = Boolean(regPago && regPago.pagado);

            const diasPendientes = estaPagado ? 0 : diasReales;
            const totalUSD = diasPendientes * pagoDia;
            const totalBS = totalUSD * tasaCambio;

            const textoCopiar = `PAGO MOVIL:\nCedula: ${emp.cedula}\nBanco: ${
              emp.banco || 'N/A'
            }\nTelefono: ${emp.telefono || 'N/A'}\nMonto: ${formatBs(
              totalBS
            )} (${diasPendientes} dias - ${quincenaSel})`;

            return (
              <div key={emp.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">
                      {emp.nombre}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="font-mono">{emp.cedula}</span> ·{' '}
                      {emp.banco || 'N/A'} {emp.telefono || ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-bold tabular-nums text-[#8B1E3F]">
                      {formatBs(totalBS)}
                    </p>
                    <p className="font-mono text-xs tabular-nums text-slate-600">
                      {formatUSD(totalUSD)} · {diasPendientes}d
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      estaPagado ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {estaPagado ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Pagado (0)</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3.5 w-3.5" />
                        <span>Pendiente</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    {!estaPagado ? (
                      <button
                        type="button"
                        onClick={() =>
                          onPayPeriod({
                            clavePago,
                            cedula: emp.cedula,
                            mes: mesSel,
                            quincena: quincenaSel,
                            diasPagados: diasReales,
                            montoUSD: totalUSD,
                            montoBS: totalBS,
                            nombreEmpleado: emp.nombre,
                          })
                        }
                        className="min-h-9 rounded-lg bg-emerald-600 px-3.5 text-xs font-semibold text-white"
                      >
                        PAGADO
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRevertPayment(clavePago)}
                        className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                      >
                        Revertir
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopyPagoMovil(textoCopiar)}
                      aria-label={`Copiar Pago Móvil de ${emp.nombre}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
                    >
                      <Copy className="h-4 w-4" />
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
                <th className="px-4 py-3 text-left">Empleado</th>
                <th className="px-4 py-3 text-right">Días Pend.</th>
                <th className="px-4 py-3 text-right">Monto ($)</th>
                <th className="px-4 py-3 text-right">Monto (Bs.)</th>
                <th className="px-4 py-3 text-left">Pago Móvil</th>
                <th className="px-4 py-3 text-left">Estatus</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {nomina.map((emp) => {
                const pagoDia = emp.sueldoMensual / 20;
                const asistenciasEmp = asistencias.filter((a) => {
                  if (!a.fecha || a.cedula !== emp.cedula || !a.presente)
                    return false;
                  if (!a.fecha.startsWith(mesSel)) return false;
                  const dia = parseInt(a.fecha.split('-')[2], 10);
                  if (quincenaSel === 'Q1') return dia >= 1 && dia <= 15;
                  return dia >= 16 && dia <= 31;
                });

                const diasReales = asistenciasEmp.length;
                const clavePago = `${mesSel}_${quincenaSel}_${emp.cedula}`;
                const regPago = pagosNomina[clavePago];
                const estaPagado = Boolean(regPago && regPago.pagado);

                const diasPendientes = estaPagado ? 0 : diasReales;
                const totalUSD = diasPendientes * pagoDia;
                const totalBS = totalUSD * tasaCambio;

                const textoCopiar = `PAGO MOVIL:\nCedula: ${emp.cedula}\nBanco: ${
                  emp.banco || 'N/A'
                }\nTelefono: ${emp.telefono || 'N/A'}\nMonto: ${formatBs(
                  totalBS
                )} (${diasPendientes} dias - ${quincenaSel})`;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {emp.nombre}
                      </p>
                      <p className="font-mono text-xs text-slate-500">
                        {emp.cedula}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      <span className="font-semibold text-slate-900">
                        {diasPendientes} días
                      </span>
                      {estaPagado && (
                        <span className="block text-xs text-emerald-700">
                          Pagados: {regPago.diasPagados || diasReales}d
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {formatUSD(totalUSD)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-[#8B1E3F]">
                      {formatBs(totalBS)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <span className="font-medium text-slate-800">
                        {emp.banco || 'N/A'}
                      </span>
                      <span className="block font-mono">
                        {emp.telefono || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          estaPagado ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {estaPagado ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Pagado (0)</span>
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
                        {!estaPagado ? (
                          <button
                            type="button"
                            onClick={() =>
                              onPayPeriod({
                                clavePago,
                                cedula: emp.cedula,
                                mes: mesSel,
                                quincena: quincenaSel,
                                diasPagados: diasReales,
                                montoUSD: totalUSD,
                                montoBS: totalBS,
                                nombreEmpleado: emp.nombre,
                              })
                            }
                            className="min-h-8 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                          >
                            PAGADO
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onRevertPayment(clavePago)}
                            className="min-h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Revertir
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyPagoMovil(textoCopiar)}
                          title="Copiar datos Pago Móvil"
                          aria-label={`Copiar Pago Móvil de ${emp.nombre}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saved Payroll History */}
      <div className="rounded-xl border border-emerald-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 sm:px-6 py-4 flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-700" />
          <h2 className="font-display text-base font-bold text-slate-900">
            Historial de Pagos Quincenales Guardados
          </h2>
        </div>

        {pagosHistorial.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            Aún no se han registrado pagos quincenales guardados.
          </p>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {pagosHistorial.map((p) => {
                const emp = nomina.find((e) => e.cedula === p.cedula);
                const labelQuin =
                  p.quincena === 'Q1'
                    ? '1ra Q'
                    : p.quincena === 'Q2'
                    ? '2da Q'
                    : p.quincena;

                return (
                  <div
                    key={p.clave_pago}
                    className="p-4 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {emp ? emp.nombre : p.cedula}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                        {p.mes} · {labelQuin} · {p.diasPagados}d · Tasa{' '}
                        {p.tasaCambio > 0 ? p.tasaCambio.toFixed(2) : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <p className="font-mono text-sm font-bold tabular-nums text-emerald-700">
                          {formatBs(p.montoBS)}
                        </p>
                        <p className="font-mono text-xs tabular-nums text-slate-600">
                          {formatUSD(p.montoUSD)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRevertPayment(p.clave_pago)}
                        aria-label="Eliminar del historial"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600"
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
                    <th className="px-4 py-3 text-left">Periodo / Mes</th>
                    <th className="px-4 py-3 text-left">Empleado</th>
                    <th className="px-4 py-3 text-right">Días Pagados</th>
                    <th className="px-4 py-3 text-right">Monto ($)</th>
                    <th className="px-4 py-3 text-right">Tasa Aplicada</th>
                    <th className="px-4 py-3 text-right">Monto (Bs.)</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagosHistorial.map((p) => {
                    const emp = nomina.find((e) => e.cedula === p.cedula);
                    const labelQuin =
                      p.quincena === 'Q1'
                        ? '1ra Quincena (1-15)'
                        : p.quincena === 'Q2'
                        ? '2da Quincena (16-31)'
                        : p.quincena;

                    return (
                      <tr key={p.clave_pago} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-slate-900">
                            {p.mes}
                          </span>
                          <span className="text-slate-400 mx-1.5">·</span>
                          <span className="text-xs text-slate-600">{labelQuin}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {emp ? emp.nombre : p.cedula}
                          </p>
                          {emp && (
                            <p className="font-mono text-xs text-slate-500">
                              {p.cedula}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                          {p.diasPagados} días
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                          {formatUSD(p.montoUSD)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                          {p.tasaCambio > 0
                            ? `${p.tasaCambio.toFixed(2)} Bs/$`
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-emerald-700">
                          {formatBs(p.montoBS)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => onRevertPayment(p.clave_pago)}
                            aria-label="Eliminar del historial"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
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

      {/* Employee Directory */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 sm:px-6 py-4">
          <h2 className="font-display text-base font-bold text-slate-900">
            Lista y Edición de Trabajadores ({nomina.length})
          </h2>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {nomina.map((emp) => (
            <div
              key={emp.id}
              className="p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-900 truncate">
                  {emp.nombre}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {emp.cargo} · <span className="font-mono">{emp.cedula}</span>
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sueldo: <span className="font-mono font-semibold">{formatUSD(emp.sueldoMensual)}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEditEmp(emp)}
                  aria-label={`Editar ${emp.nombre}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteEmployee(emp)}
                  aria-label={`Eliminar ${emp.nombre}`}
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
                <th className="px-4 py-3 text-left">Cédula</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Cargo</th>
                <th className="px-4 py-3 text-left">Pago Móvil</th>
                <th className="px-4 py-3 text-right">Sueldo ($)</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {nomina.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                    {emp.cedula}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {emp.nombre}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{emp.cargo}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {emp.banco || 'N/A'} ·{' '}
                    <span className="font-mono">{emp.telefono || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                    {formatUSD(emp.sueldoMensual)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditEmp(emp)}
                        aria-label={`Editar ${emp.nombre}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEmployee(emp)}
                        aria-label={`Eliminar ${emp.nombre}`}
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
      </div>

      {/* Daily Attendance Audit */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 sm:px-6 py-4">
          <h2 className="font-display text-base font-bold text-slate-900">
            Consulta y Registro de Asistencia Diaria
          </h2>
          <div className="flex items-center gap-2">
            <label
              htmlFor="filtroFechaAsistenciaSup"
              className="text-xs font-semibold text-slate-600"
            >
              Fecha:
            </label>
            <input
              id="filtroFechaAsistenciaSup"
              type="date"
              value={fechaAsistencia}
              onChange={(e) => setFechaAsistencia(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none"
            />
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {nomina.map((emp) => {
            const reg = asistencias.find(
              (a) => a.fecha === fechaAsistencia && a.cedula === emp.cedula
            );
            const asistio = reg ? reg.presente : false;
            const busy = busyCedula === emp.cedula;

            return (
              <div
                key={emp.id}
                className="p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">
                    {emp.nombre}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="font-mono">{emp.cedula}</span> · {emp.cargo}
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${
                      asistio ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {asistio ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Asistió</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Ausente</span>
                      </>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusyCedula(emp.cedula);
                    await onToggleAttendance(fechaAsistencia, emp.cedula);
                    setBusyCedula(null);
                  }}
                  className={`min-h-10 shrink-0 rounded-lg px-3.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                    asistio
                      ? 'border border-rose-200 bg-rose-50 text-rose-700'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {asistio ? 'Ausente' : 'Presente'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-500">
                <th className="px-4 py-3 text-left">Cédula</th>
                <th className="px-4 py-3 text-left">Empleado</th>
                <th className="px-4 py-3 text-left">Cargo</th>
                <th className="px-4 py-3 text-left">Estatus</th>
                <th className="px-4 py-3 text-right">Acción del Supervisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {nomina.map((emp) => {
                const reg = asistencias.find(
                  (a) => a.fecha === fechaAsistencia && a.cedula === emp.cedula
                );
                const asistio = reg ? reg.presente : false;
                const busy = busyCedula === emp.cedula;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      {emp.cedula}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {emp.nombre}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{emp.cargo}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          asistio ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {asistio ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Asistió</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            <span>Ausente</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          setBusyCedula(emp.cedula);
                          await onToggleAttendance(fechaAsistencia, emp.cedula);
                          setBusyCedula(null);
                        }}
                        className={`min-h-8 rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          asistio
                            ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {asistio ? 'Marcar Ausente' : 'Marcar Presente'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
