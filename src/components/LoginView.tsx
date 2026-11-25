import React, { useState } from 'react';
import {
  Building2,
  KeyRound,
  Lock,
  User,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Client } from '../types';
import { BrandLogo } from './ui/BrandLogo';
import { LOGIN_HERO_IMAGE } from '../utils/format';

interface LoginViewProps {
  clients: Client[];
  loadingData: boolean;
  onLoginInternal: (username: string, password: string) => void;
  onLoginClient: (clientName: string, accessKey: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  clients,
  loadingData,
  onLoginInternal,
  onLoginClient,
}) => {
  const [mode, setMode] = useState<'admin' | 'cliente'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [clientPass, setClientPass] = useState('');

  const handleInternalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginInternal(username.trim(), password.trim());
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginClient(selectedClient, clientPass.trim());
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50">
      {/* Desktop Editorial Catering Panel */}
      <div className="relative hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between overflow-hidden bg-[#2A0611]">
        <img
          src={LOGIN_HERO_IMAGE}
          alt="Servicio corporativo de alimentos El Sazón de Helem C.A."
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2A0611] via-[#68132D]/55 to-slate-950/35" />

        <div className="relative z-10 flex items-center gap-3.5 p-10">
          <BrandLogo size={48} />
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-white">
              El Sazón de Helem C.A.
            </p>
            <p className="font-mono text-xs text-amber-200/90 tabular-nums">
              RIF J-508474309
            </p>
          </div>
        </div>

        <div className="relative z-10 p-10 max-w-xl">
          <p className="text-xs font-semibold tracking-wider text-amber-300 uppercase mb-3">
            Alimentación Corporativa & Comedores Industriales
          </p>
          <h1
            className="font-display text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight"
            style={{ textWrap: 'balance' }}
          >
            Control operativo integral desde la cocina hasta la gerencia
          </h1>
          <p className="mt-4 text-sm xl:text-base text-slate-200 leading-relaxed">
            Supervisión de menús servidos con respaldo fotográfico, inventario en tiempo real, nómina quincenal y portal de facturación para clientes.
          </p>
        </div>
      </div>

      {/* Right / Mobile Authentication Panel */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-start lg:justify-center bg-slate-50">
        {/* Mobile Hero Banner */}
        <div className="relative h-44 sm:h-52 lg:hidden overflow-hidden bg-[#2A0611]">
          <img
            src={LOGIN_HERO_IMAGE}
            alt="Servicio corporativo de alimentos El Sazón de Helem C.A."
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2A0611] via-[#68132D]/60 to-black/30" />
          <div className="relative z-10 flex h-full flex-col justify-end p-5">
            <div className="flex items-center gap-3">
              <BrandLogo size={42} />
              <div>
                <h1 className="font-display text-lg font-bold text-white leading-tight">
                  El Sazón de Helem C.A.
                </h1>
                <p className="font-mono text-xs text-amber-200/95 tabular-nums">
                  RIF J-508474309 · Sistema de Gestión
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 py-6 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="hidden lg:block">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8B1E3F] mb-2">
                <ShieldCheck className="h-4 w-4" />
                <span>Acceso Autorizado</span>
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                Iniciar Sesión
              </h2>
              <p className="mt-1 font-mono text-xs text-slate-500 tabular-nums">
                El Sazón de Helem C.A. · RIF J-508474309
              </p>
            </div>

            <div className="lg:hidden mb-1">
              <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">
                Iniciar Sesión
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Seleccione su modalidad de ingreso
              </p>
            </div>

            {/* Mode Selector Tabs */}
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode('admin')}
                className={`min-h-11 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  mode === 'admin'
                    ? 'bg-white text-[#8B1E3F] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sistema Interno
              </button>
              <button
                type="button"
                onClick={() => setMode('cliente')}
                className={`min-h-11 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  mode === 'cliente'
                    ? 'bg-white text-[#8B1E3F] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Portal de Clientes
              </button>
            </div>

            {loadingData ? (
              <div className="mt-8 flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-[#8B1E3F]" />
                <span>Conectando con base de datos...</span>
              </div>
            ) : mode === 'admin' ? (
              <form onSubmit={handleInternalSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="login-username"
                    className="block text-sm font-semibold text-slate-700 mb-1.5"
                  >
                    Usuario
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ingrese su usuario"
                      required
                      className="w-full min-h-11 rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-semibold text-slate-700 mb-1.5"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full min-h-11 rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 flex w-full min-h-12 items-center justify-center gap-2 rounded-lg bg-[#8B1E3F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#68132D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1E3F] focus-visible:ring-offset-2"
                >
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleClientSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="login-client-select"
                    className="block text-sm font-semibold text-slate-700 mb-1.5"
                  >
                    Empresa / Cliente
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      id="login-client-select"
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      required
                      className="w-full min-h-11 rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
                    >
                      <option value="">Seleccione su empresa...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.nombre}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-client-pass"
                    className="block text-sm font-semibold text-slate-700 mb-1.5"
                  >
                    Clave de Acceso
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-client-pass"
                      type="password"
                      value={clientPass}
                      onChange={(e) => setClientPass(e.target.value)}
                      placeholder="Ingrese su clave corporativa"
                      required
                      className="w-full min-h-11 rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/15"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 flex w-full min-h-12 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#4A0E20] hover:bg-[#C39E2B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2"
                >
                  <span>Ingresar al Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
