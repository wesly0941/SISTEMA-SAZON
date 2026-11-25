import React, { useState } from 'react';
import { CheckCircle2, XCircle, Users } from 'lucide-react';
import { AttendanceRecord, Employee } from '../../types';
import { getTodayISO } from '../../utils/format';

interface AsistenciaCocinaSectionProps {
  nomina: Employee[];
  asistencias: AttendanceRecord[];
  onToggleAttendance: (fecha: string, cedula: string) => Promise<void>;
}

export const AsistenciaCocinaSection: React.FC<AsistenciaCocinaSectionProps> = ({
  nomina,
  asistencias,
  onToggleAttendance,
}) => {
  const [fecha, setFecha] = useState(getTodayISO());
  const [loadingCedula, setLoadingCedula] = useState<string | null>(null);

  const handleToggle = async (cedula: string) => {
    setLoadingCedula(cedula);
    await onToggleAttendance(fecha, cedula);
    setLoadingCedula(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Control Diario de Asistencia
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Marque la asistencia diaria del personal operativo en cocina.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label
              htmlFor="fechaAsistenciaCocina"
              className="text-sm font-semibold text-slate-700 whitespace-nowrap"
            >
              Fecha de Trabajo:
            </label>
            <input
              id="fechaAsistenciaCocina"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
            />
          </div>
          <p className="text-xs font-mono tabular-nums text-slate-500">
            {nomina.length} trabajadores registrados
          </p>
        </div>

        {nomina.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Users className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">
              No hay empleados registrados
            </p>
            <p className="mt-1 text-xs text-slate-500">
              El supervisor debe registrar al personal en el módulo de Nómina.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100">
              {nomina.map((emp) => {
                const reg = asistencias.find(
                  (a) => a.fecha === fecha && a.cedula === emp.cedula
                );
                const presente = reg ? reg.presente : false;
                const busy = loadingCedula === emp.cedula;

                return (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between gap-3 p-4"
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
                          presente ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {presente ? (
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
                      onClick={() => handleToggle(emp.cedula)}
                      className={`min-h-10 shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap disabled:opacity-50 ${
                        presente
                          ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-[#8B1E3F] text-white hover:bg-[#68132D]'
                      }`}
                    >
                      {presente ? 'Ausente' : 'Presente'}
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
                    <th className="px-6 py-3 text-left">Cédula</th>
                    <th className="px-6 py-3 text-left">Nombre</th>
                    <th className="px-6 py-3 text-left">Cargo</th>
                    <th className="px-6 py-3 text-left">Estatus</th>
                    <th className="px-6 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nomina.map((emp) => {
                    const reg = asistencias.find(
                      (a) => a.fecha === fecha && a.cedula === emp.cedula
                    );
                    const presente = reg ? reg.presente : false;
                    const busy = loadingCedula === emp.cedula;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/70">
                        <td className="px-6 py-3 font-mono font-semibold tabular-nums text-slate-900">
                          {emp.cedula}
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-900">
                          {emp.nombre}
                        </td>
                        <td className="px-6 py-3 text-slate-600">{emp.cargo}</td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              presente ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {presente ? (
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
                        <td className="px-6 py-3 text-right">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleToggle(emp.cedula)}
                            className={`min-h-9 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap disabled:opacity-50 ${
                              presente
                                ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-[#8B1E3F] text-white hover:bg-[#68132D]'
                            }`}
                          >
                            {presente ? 'Marcar Ausente' : 'Marcar Presente'}
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
  );
};
