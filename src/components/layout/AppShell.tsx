import React, { useState } from 'react';
import {
  Utensils,
  Package,
  BookOpen,
  CalendarCheck,
  LayoutDashboard,
  Users,
  Building2,
  Armchair,
  Warehouse,
  Tags,
  Receipt,
  FileText,
  Banknote,
  FileSpreadsheet,
  Box,
  LogOut,
  Menu,
  X,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ActiveSection, CurrentUser } from '../../types';
import { BrandLogo } from '../ui/BrandLogo';

interface NavItem {
  id: ActiveSection;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const KITCHEN_NAV: NavItem[] = [
  { id: 'secComidas', label: 'Carga Diario Comidas', shortLabel: 'Comidas', icon: <Utensils className="h-4 w-4" /> },
  { id: 'secInsumosCocina', label: 'Consumo de Insumos', shortLabel: 'Insumos', icon: <Package className="h-4 w-4" /> },
  { id: 'secDiarioCocina', label: 'Diario y Reporte Visual', shortLabel: 'Diario', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'secNominaCocina', label: 'Asistencia Diaria', shortLabel: 'Asistencia', icon: <CalendarCheck className="h-4 w-4" /> },
];

const SUPERVISOR_NAV: NavItem[] = [
  { id: 'secDashboardSup', label: 'Resumen General', shortLabel: 'Resumen', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'secReportesCocina', label: 'Cobros & Gastos Cocina', shortLabel: 'Cobros', icon: <Receipt className="h-4 w-4" /> },
  { id: 'secInventarioSup', label: 'Inventario & Excel', shortLabel: 'Inventario', icon: <Warehouse className="h-4 w-4" /> },
  { id: 'secNominaSup', label: 'Nómina y Pago Móvil', shortLabel: 'Nómina', icon: <Banknote className="h-4 w-4" /> },
  { id: 'secPdfReportes', label: 'Reportes PDF', shortLabel: 'PDF', icon: <FileText className="h-4 w-4" /> },
  { id: 'secClientesSup', label: 'Gestión de Clientes', shortLabel: 'Clientes', icon: <Building2 className="h-4 w-4" /> },
  { id: 'secBienesSup', label: 'Bienes en Clientes', shortLabel: 'Bienes', icon: <Armchair className="h-4 w-4" /> },
  { id: 'secPreciosPlatos', label: 'Precios y Tipos Platos', shortLabel: 'Precios', icon: <Tags className="h-4 w-4" /> },
  { id: 'secUsuariosSup', label: 'Control de Usuarios', shortLabel: 'Usuarios', icon: <Users className="h-4 w-4" /> },
];

const CLIENT_NAV: NavItem[] = [
  { id: 'secPortalClienteDeuda', label: 'Mi Estado de Cuenta', shortLabel: 'Cuenta', icon: <FileSpreadsheet className="h-4 w-4" /> },
  { id: 'secPortalClienteBienes', label: 'Bienes Asignados', shortLabel: 'Bienes', icon: <Box className="h-4 w-4" /> },
];

interface AppShellProps {
  currentUser: CurrentUser;
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  onLogout: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentUser,
  activeSection,
  onSelectSection,
  onLogout,
  onRefresh,
  refreshing,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems =
    currentUser.role === 'cocina'
      ? KITCHEN_NAV
      : currentUser.role === 'supervisor'
      ? SUPERVISOR_NAV
      : CLIENT_NAV;

  const roleTitle =
    currentUser.role === 'cocina'
      ? 'Panel de Cocina'
      : currentUser.role === 'supervisor'
      ? 'Panel de Supervisión'
      : 'Portal Corporativo';

  const currentNavItem = navItems.find((n) => n.id === activeSection);
  const mobileQuickTabs = navItems.slice(0, 4);

  const handleSelect = (id: ActiveSection) => {
    onSelectSection(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Bar Contract: Brand | Context Breadcrumb | User Actions */}
      <header className="sticky top-0 z-30 h-13 sm:h-16 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-3 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <BrandLogo size={32} />
          <div className="min-w-0">
            <span className="block font-display text-sm sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap truncate">
              El Sazón de Helem C.A.
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 min-w-0">
          <span className="whitespace-nowrap">{roleTitle}</span>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-slate-900 truncate">
            {currentNavItem?.label}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden sm:inline text-xs font-medium text-slate-600 whitespace-nowrap">
            {currentUser.role === 'cliente' ? `Cliente · ${currentUser.nombre}` : currentUser.nombre}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            title="Actualizar datos"
            aria-label="Actualizar datos"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex min-h-9 items-center gap-1.5 rounded-lg bg-[#8B1E3F] px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#68132D] transition-colors whitespace-nowrap shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white py-5 px-3">
          <p className="px-3 mb-2 text-xs font-semibold tracking-wide text-slate-400">
            {roleTitle}
          </p>
          <nav className="flex-1 space-y-1" aria-label="Navegación principal">
            {navItems.map((item) => {
              const isActive = item.id === activeSection;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`flex w-full min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#8B1E3F] font-semibold text-white shadow-xs'
                      : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={isActive ? 'text-amber-200' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-slate-100 px-3 pt-4 text-xs text-slate-400">
            <p className="font-mono tabular-nums">RIF J-508474309</p>
          </div>
        </aside>

        {/* Mobile Slide-Out Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative z-50 w-72 max-w-[85vw] bg-white h-full border-r border-slate-200 py-5 px-3 flex flex-col shadow-xl">
              <div className="flex items-center justify-between px-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="block font-display text-sm font-bold text-slate-900">
                    {roleTitle}
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    {currentUser.nombre}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Cerrar menú lateral"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = item.id === activeSection;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      className={`flex w-full min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-[#8B1E3F] font-semibold text-white'
                          : 'font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className={isActive ? 'text-amber-200' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-10 overflow-y-auto">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-6xl"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Thumb Navigation Bar */}
      <nav
        aria-label="Acceso rápido móvil"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 border-t border-slate-200 bg-white/95 backdrop-blur-sm px-1 flex items-center justify-around"
      >
        {mobileQuickTabs.map((tab) => {
          const isActive = tab.id === activeSection;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 min-h-11 rounded-lg transition-colors ${
                isActive ? 'text-[#8B1E3F]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={isActive ? 'scale-110 transition-transform' : ''}>
                {tab.icon}
              </span>
              <span className={`text-[11px] leading-none truncate max-w-[72px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
        {navItems.length > 4 && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1 min-h-11 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Menu className="h-4 w-4" />
            <span className="text-[11px] leading-none font-medium">Más</span>
          </button>
        )}
      </nav>
    </div>
  );
};
