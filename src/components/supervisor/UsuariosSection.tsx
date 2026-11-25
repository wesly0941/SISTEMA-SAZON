import React, { useState } from 'react';
import { UserPlus, Trash2, Loader2, Users } from 'lucide-react';
import { SystemUser } from '../../types';

interface UsuariosSectionProps {
  usuarios: SystemUser[];
  onCreateUser: (payload: {
    usuario: string;
    password: string;
    rol: 'cocina' | 'supervisor';
  }) => Promise<boolean>;
  onDeleteUser: (id: number, nombre: string) => void;
}

export const UsuariosSection: React.FC<UsuariosSectionProps> = ({
  usuarios,
  onCreateUser,
  onDeleteUser,
}) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'cocina' | 'supervisor'>('cocina');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) return;
    setSaving(true);
    const ok = await onCreateUser({
      usuario: usuario.trim(),
      password: password.trim(),
      rol,
    });
    setSaving(false);
    if (ok) {
      setUsuario('');
      setPassword('');
      setRol('cocina');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Control y Gestión de Usuarios
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Administre las credenciales de acceso para Jefa de Cocina y Supervisores.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-base font-bold text-slate-900 mb-5">
            Crear Nuevo Usuario
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="nuevoUserNombre"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Nombre de Usuario
              </label>
              <input
                id="nuevoUserNombre"
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ej: cocina, supervisor"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              />
            </div>

            <div>
              <label
                htmlFor="nuevoUserPass"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Contraseña
              </label>
              <input
                id="nuevoUserPass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              />
            </div>

            <div>
              <label
                htmlFor="nuevoUserRol"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Rol en el Sistema
              </label>
              <select
                id="nuevoUserRol"
                value={rol}
                onChange={(e) =>
                  setRol(e.target.value as 'cocina' | 'supervisor')
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              >
                <option value="cocina">Jefa de Cocina</option>
                <option value="supervisor">Supervisor General</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full min-h-10 items-center justify-center gap-2 rounded-lg bg-[#8B1E3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#68132D] transition-colors disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span>{saving ? 'Guardando...' : 'Guardar Usuario'}</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              Usuarios Registrados
            </h2>
          </div>

          {usuarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <Users className="h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                No hay usuarios registrados
              </p>
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-slate-100">
                {usuarios.map((u) => (
                  <div key={u.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {u.usuario}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="font-mono">#{u.id}</span> ·{' '}
                        {u.rol === 'supervisor'
                          ? 'Supervisor General'
                          : 'Jefa de Cocina'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteUser(u.id, u.usuario)}
                      aria-label={`Eliminar usuario ${u.usuario}`}
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
                      <th className="px-6 py-3 text-left">Usuario</th>
                      <th className="px-6 py-3 text-left">Rol</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usuarios.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70">
                        <td className="px-6 py-3 font-mono text-xs tabular-nums text-slate-500">
                          #{u.id}
                        </td>
                        <td className="px-6 py-3 font-semibold text-slate-900">
                          {u.usuario}
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          {u.rol === 'supervisor'
                            ? 'Supervisor General'
                            : 'Jefa de Cocina'}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteUser(u.id, u.usuario)}
                            aria-label={`Eliminar usuario ${u.usuario}`}
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
