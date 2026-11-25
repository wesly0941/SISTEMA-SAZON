import React, { useState } from 'react';
import { PlusCircle, Trash2, Loader2, Building2 } from 'lucide-react';
import { Client } from '../../types';

interface ClientesSectionProps {
  clients: Client[];
  onSaveClient: (nombre: string, clavePortal: string) => Promise<boolean>;
  onDeleteClient: (id: number, nombre: string) => void;
}

export const ClientesSection: React.FC<ClientesSectionProps> = ({
  clients,
  onSaveClient,
  onDeleteClient,
}) => {
  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !clave.trim()) return;
    setSaving(true);
    const ok = await onSaveClient(nombre.trim(), clave.trim());
    setSaving(false);
    if (ok) {
      setNombre('');
      setClave('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Gestión de Clientes y Claves de Portal
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Registre empresas contratantes y asigne su clave de acceso al Portal Corporativo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-base font-bold text-slate-900 mb-5">
            Registrar / Actualizar Cliente
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="nombreClienteInput"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Nombre / Razón Social del Cliente
              </label>
              <input
                id="nombreClienteInput"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Corporación Alpha"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              />
            </div>

            <div>
              <label
                htmlFor="claveClienteInput"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Clave de Acceso al Portal
              </label>
              <input
                id="claveClienteInput"
                type="text"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Ej: alpha2026"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
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
                <PlusCircle className="h-4 w-4" />
              )}
              <span>{saving ? 'Guardando...' : 'Guardar Cliente'}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              Clientes y Claves Registradas
            </h2>
          </div>

          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <Building2 className="h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                No hay clientes registrados
              </p>
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-slate-100">
                {clients.map((c) => (
                  <div key={c.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {c.nombre}
                      </p>
                      <p className="font-mono text-xs text-slate-500 mt-0.5">
                        #{c.id} · Clave: {c.clave_portal || 'No asignada'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteClient(c.id, c.nombre)}
                      aria-label={`Eliminar cliente ${c.nombre}`}
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
                      <th className="px-6 py-3 text-left">ID</th>
                      <th className="px-6 py-3 text-left">Cliente</th>
                      <th className="px-6 py-3 text-left">Clave Portal</th>
                      <th className="px-6 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clients.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70">
                        <td className="px-6 py-3 font-mono text-xs tabular-nums text-slate-500">
                          #{c.id}
                        </td>
                        <td className="px-6 py-3 font-semibold text-slate-900">
                          {c.nombre}
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-slate-700">
                          {c.clave_portal || 'No asignada'}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteClient(c.id, c.nombre)}
                            aria-label={`Eliminar cliente ${c.nombre}`}
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
