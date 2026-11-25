import { useState, useEffect, useCallback } from 'react';
import { db } from './lib/supabase';
import {
  ActiveSection,
  AttendanceRecord,
  Client,
  ClientAsset,
  CurrentUser,
  DailyConsumption,
  Employee,
  InventoryItem,
  PayrollPayment,
  ServedDish,
  SystemUser,
} from './types';
import { formatBs, formatUSD, getTodayISO } from './utils/format';
import { ToastContainer, ToastItem } from './components/ui/Toast';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { ImageModal } from './components/ui/ImageModal';
import { LoginView } from './components/LoginView';
import { AppShell } from './components/layout/AppShell';
import { ComidasSection } from './components/kitchen/ComidasSection';
import { InsumosSection } from './components/kitchen/InsumosSection';
import { DiarioVisualSection } from './components/kitchen/DiarioVisualSection';
import { AsistenciaCocinaSection } from './components/kitchen/AsistenciaCocinaSection';
import { DashboardSection } from './components/supervisor/DashboardSection';
import { UsuariosSection } from './components/supervisor/UsuariosSection';
import { ClientesSection } from './components/supervisor/ClientesSection';
import { BienesSection } from './components/supervisor/BienesSection';
import { InventarioSection } from './components/supervisor/InventarioSection';
import { PreciosSection } from './components/supervisor/PreciosSection';
import { ReportesCocinaSection } from './components/supervisor/ReportesCocinaSection';
import { PdfReportesSection } from './components/supervisor/PdfReportesSection';
import { NominaSection } from './components/supervisor/NominaSection';
import { PortalDeudaSection } from './components/client/PortalDeudaSection';
import { PortalBienesSection } from './components/client/PortalBienesSection';

const DEFAULT_PRICES: Record<string, number> = {
  Ejecutivo: 3.5,
  Especial: 5.0,
  Sopa: 2.0,
  Postre: 1.5,
};

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  action: (() => Promise<void> | void) | null;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('sh_current_user');
      return saved ? (JSON.parse(saved) as CurrentUser) : null;
    } catch {
      return null;
    }
  });

  const [activeSection, setActiveSection] = useState<ActiveSection>(() => {
    try {
      const saved = sessionStorage.getItem('sh_current_user');
      if (saved) {
        const parsed = JSON.parse(saved) as CurrentUser;
        if (parsed.role === 'cocina') return 'secComidas';
        if (parsed.role === 'supervisor') return 'secDashboardSup';
        return 'secPortalClienteDeuda';
      }
    } catch {
      // ignore
    }
    return 'secComidas';
  });

  const [tasaCambio, setTasaCambio] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sh_tasa_cambio');
      const parsed = saved ? parseFloat(saved) : 36.5;
      return !isNaN(parsed) && parsed > 0 ? parsed : 36.5;
    } catch {
      return 36.5;
    }
  });

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [usuariosSistema, setUsuariosSistema] = useState<SystemUser[]>([]);
  const [clientes, setClientes] = useState<Client[]>([]);
  const [bienesClientes, setBienesClientes] = useState<ClientAsset[]>([]);
  const [inventario, setInventario] = useState<InventoryItem[]>([]);
  const [preciosPlatos, setPreciosPlatos] =
    useState<Record<string, number>>(DEFAULT_PRICES);
  const [registroComidas, setRegistroComidas] = useState<ServedDish[]>([]);
  const [consumosDiarios, setConsumosDiarios] = useState<DailyConsumption[]>([]);
  const [nomina, setNomina] = useState<Employee[]>([]);
  const [asistencias, setAsistencias] = useState<AttendanceRecord[]>([]);
  const [pagosNomina, setPagosNomina] = useState<
    Record<string, PayrollPayment>
  >({});

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    description: '',
    action: null,
  });

  const notify = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const requestConfirm = (opts: Omit<ConfirmState, 'open'>) => {
    setConfirmState({ ...opts, open: true });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, open: false, action: null }));
  };

  // =========================================================================
  // SUPABASE LOADERS
  // =========================================================================
  const cargarUsuariosBD = useCallback(async () => {
    const { data, error } = await db.from('usuarios').select('*');
    if (!error && data) setUsuariosSistema(data as SystemUser[]);
  }, []);

  const cargarClientesBD = useCallback(async () => {
    const { data, error } = await db.from('clientes').select('*');
    if (!error && data) setClientes(data as Client[]);
  }, []);

  const cargarBienesClientesBD = useCallback(async () => {
    try {
      const { data, error } = await db
        .from('bienes_clientes')
        .select('*')
        .order('id', { ascending: false });
      if (!error && data) setBienesClientes(data as ClientAsset[]);
    } catch {
      // Table may not exist yet
    }
  }, []);

  const cargarInventarioBD = useCallback(async () => {
    const { data, error } = await db.from('productos').select('*');
    if (!error && data) {
      setInventario(
        data.map((i) => ({
          id: i.id,
          rubro: i.rubro,
          producto: i.nombre,
          unidad: i.unidad,
          stock: parseFloat(i.stock),
          stockMin: parseFloat(i.stock_min),
        }))
      );
    }
  }, []);

  const cargarPreciosPlatosBD = useCallback(async () => {
    const { data, error } = await db.from('precios_platos').select('*');
    if (!error && data && data.length > 0) {
      const next: Record<string, number> = {};
      data.forEach((p) => {
        next[p.nombre] = parseFloat(p.precio);
      });
      setPreciosPlatos(next);
    }
  }, []);

  const cargarEmpleadosBD = useCallback(async () => {
    const { data, error } = await db.from('empleados').select('*');
    if (!error && data) {
      setNomina(
        data.map((e) => ({
          id: e.id,
          cedula: e.cedula,
          nombre: e.nombre,
          cargo: e.cargo,
          sueldoMensual: parseFloat(e.sueldo_mensual),
          banco: e.banco,
          telefono: e.telefono,
        }))
      );
    }
  }, []);

  const cargarAsistenciasBD = useCallback(async () => {
    const { data, error } = await db
      .from('asistencias')
      .select('*')
      .limit(5000);
    if (!error && data) setAsistencias(data as AttendanceRecord[]);
  }, []);

  const cargarPagosNominaBD = useCallback(async () => {
    const { data, error } = await db
      .from('pagos_nomina')
      .select('*')
      .order('id', { ascending: false });
    if (!error && data) {
      const next: Record<string, PayrollPayment> = {};
      data.forEach((p) => {
        next[p.clave_pago] = {
          id: p.id,
          clave_pago: p.clave_pago,
          cedula: p.cedula,
          mes: p.mes,
          quincena: p.quincena,
          pagado: p.pagado,
          montoUSD: parseFloat(p.monto_usd || 0),
          montoBS: parseFloat(p.monto_bs || 0),
          tasaCambio: parseFloat(p.tasa_cambio || 0),
          diasPagados: parseInt(p.dias_pagados || 0, 10),
        };
      });
      setPagosNomina(next);
    }
  }, []);

  const cargarComidasBD = useCallback(async () => {
    const { data, error } = await db
      .from('comidas_servidas')
      .select('*')
      .order('fecha_full', { ascending: false })
      .limit(5000);
    if (!error && data) {
      setRegistroComidas(
        data.map((item) => ({
          ...item,
          fecha_limpia: item.fecha_full
            ? String(item.fecha_full).substring(0, 10)
            : '',
        }))
      );
    }
  }, []);

  const cargarConsumosBD = useCallback(async () => {
    const { data, error } = await db
      .from('consumos_diarios')
      .select('*')
      .limit(5000);
    if (!error && data) {
      setConsumosDiarios(
        data.map((c) => ({
          ...c,
          fecha_limpia: c.fecha ? String(c.fecha).substring(0, 10) : '',
        }))
      );
    }
  }, []);

  const cargarTodoDesdeSupabase = useCallback(async () => {
    await Promise.allSettled([
      cargarUsuariosBD(),
      cargarClientesBD(),
      cargarBienesClientesBD(),
      cargarInventarioBD(),
      cargarPreciosPlatosBD(),
      cargarEmpleadosBD(),
      cargarAsistenciasBD(),
      cargarPagosNominaBD(),
      cargarComidasBD(),
      cargarConsumosBD(),
    ]);
  }, [
    cargarUsuariosBD,
    cargarClientesBD,
    cargarBienesClientesBD,
    cargarInventarioBD,
    cargarPreciosPlatosBD,
    cargarEmpleadosBD,
    cargarAsistenciasBD,
    cargarPagosNominaBD,
    cargarComidasBD,
    cargarConsumosBD,
  ]);

  useEffect(() => {
    cargarTodoDesdeSupabase().finally(() => setLoadingInitial(false));
  }, [cargarTodoDesdeSupabase]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarTodoDesdeSupabase();
    setRefreshing(false);
    notify('Datos sincronizados con el servidor.', 'info');
  };

  // =========================================================================
  // AUTH HANDLERS
  // =========================================================================
  const handleLoginInternal = (username: string, password: string) => {
    const found = usuariosSistema.find(
      (u) => u.usuario === username && u.password === password
    );
    if (!found) {
      notify('Usuario o contraseña incorrectos.', 'error');
      return;
    }

    const userObj: CurrentUser = {
      nombre:
        found.rol === 'supervisor' ? 'Supervisor General' : 'Jefa de Cocina',
      role: found.rol,
    };
    setCurrentUser(userObj);
    sessionStorage.setItem('sh_current_user', JSON.stringify(userObj));
    setActiveSection(
      found.rol === 'cocina' ? 'secComidas' : 'secDashboardSup'
    );
  };

  const handleLoginClient = (clientName: string, accessKey: string) => {
    const found = clientes.find((c) => c.nombre === clientName);
    if (found && found.clave_portal === accessKey) {
      const userObj: CurrentUser = {
        nombre: found.nombre,
        role: 'cliente',
      };
      setCurrentUser(userObj);
      sessionStorage.setItem('sh_current_user', JSON.stringify(userObj));
      setActiveSection('secPortalClienteDeuda');
    } else {
      notify('Clave de acceso incorrecta para este cliente.', 'error');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sh_current_user');
    setCurrentUser(null);
  };

  // =========================================================================
  // KITCHEN & MEAL MUTATIONS
  // =========================================================================
  const handleSaveDish = async (payload: {
    fecha_full: string;
    hora: string;
    tipo: string;
    nombre: string;
    cliente: string;
    cantidad: number;
    foto_url: string;
  }): Promise<boolean> => {
    const { error } = await db
      .from('comidas_servidas')
      .insert([{ ...payload, pagado: false }]);

    if (error) {
      notify(`Error al guardar plato: ${error.message}`, 'error');
      return false;
    }
    notify(
      `Plato registrado correctamente para el ${payload.fecha_full}.`,
      'success'
    );
    await cargarComidasBD();
    return true;
  };

  const handleDeductSupply = async (
    item: InventoryItem,
    cantidad: number
  ): Promise<boolean> => {
    const nuevoStock = Number((item.stock - cantidad).toFixed(3));
    const fechaHoy = getTodayISO();

    const { error: errUpd } = await db
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', item.id);

    if (errUpd) {
      notify(`Error al actualizar inventario: ${errUpd.message}`, 'error');
      return false;
    }

    const { error: errIns } = await db.from('consumos_diarios').insert([
      {
        fecha: fechaHoy,
        producto: item.producto,
        rubro: item.rubro,
        cantidad,
        unidad: item.unidad || 'Unid',
      },
    ]);

    if (errIns) {
      notify(`Error al registrar consumo: ${errIns.message}`, 'error');
      return false;
    }

    notify(
      `Descontadas ${cantidad} ${item.unidad || 'unidades'} de ${item.producto}.`,
      'success'
    );
    await Promise.all([cargarInventarioBD(), cargarConsumosBD()]);
    return true;
  };

  // =========================================================================
  // SUPERVISOR MUTATIONS
  // =========================================================================
  const handleCreateUser = async (payload: {
    usuario: string;
    password: string;
    rol: 'cocina' | 'supervisor';
  }): Promise<boolean> => {
    const { error } = await db.from('usuarios').insert([payload]);
    if (error) {
      notify(`Error al crear usuario: ${error.message}`, 'error');
      return false;
    }
    notify('Usuario creado exitosamente.', 'success');
    await cargarUsuariosBD();
    return true;
  };

  const handleDeleteUser = (id: number, nombre: string) => {
    requestConfirm({
      title: 'Eliminar usuario',
      description: `¿Desea eliminar el acceso del usuario "${nombre}"?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
      action: async () => {
        const { error } = await db.from('usuarios').delete().eq('id', id);
        if (!error) {
          notify('Usuario eliminado.', 'success');
          await cargarUsuariosBD();
        } else {
          notify(`Error: ${error.message}`, 'error');
        }
      },
    });
  };

  const handleSaveClient = async (
    nombre: string,
    clave_portal: string
  ): Promise<boolean> => {
    const { error } = await db
      .from('clientes')
      .upsert([{ nombre, clave_portal }], { onConflict: 'nombre' });

    if (error) {
      notify(`Error al guardar cliente: ${error.message}`, 'error');
      return false;
    }
    notify('Cliente y clave de portal guardados exitosamente.', 'success');
    await cargarClientesBD();
    return true;
  };

  const handleDeleteClient = (id: number, nombre: string) => {
    requestConfirm({
      title: 'Eliminar cliente',
      description: `¿Desea eliminar al cliente "${nombre}"?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
      action: async () => {
        const { error } = await db.from('clientes').delete().eq('id', id);
        if (!error) {
          notify('Cliente eliminado.', 'success');
          await cargarClientesBD();
        } else {
          notify(`Error: ${error.message}`, 'error');
        }
      },
    });
  };

  const handleSaveAsset = async (payload: {
    cliente: string;
    nombre_bien: string;
    codigo_serial: string;
    cantidad: number;
    estado: string;
    observacion: string;
    fecha_asignacion: string;
  }): Promise<boolean> => {
    const { error } = await db.from('bienes_clientes').insert([payload]);
    if (error) {
      notify(`Error al guardar bien: ${error.message}`, 'error');
      return false;
    }
    notify('Bien asignado al cliente correctamente.', 'success');
    await cargarBienesClientesBD();
    return true;
  };

  const handleDeleteAsset = (id: number, nombreBien: string) => {
    requestConfirm({
      title: 'Eliminar bien asignado',
      description: `¿Desea eliminar "${nombreBien}" del listado del cliente?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
      action: async () => {
        const { error } = await db
          .from('bienes_clientes')
          .delete()
          .eq('id', id);
        if (!error) {
          notify('Bien eliminado del registro.', 'success');
          await cargarBienesClientesBD();
        } else {
          notify(`Error: ${error.message}`, 'error');
        }
      },
    });
  };

  const handleAddOrUpdateProduct = async (payload: {
    rubro: string;
    producto: string;
    unidad: string;
    stock: number;
    stockMin: number;
  }): Promise<boolean> => {
    const exist = inventario.find(
      (i) =>
        i.producto.toLowerCase() === payload.producto.toLowerCase() &&
        i.rubro === payload.rubro
    );

    if (exist) {
      const nuevoStock = Number((exist.stock + payload.stock).toFixed(3));
      const { error } = await db
        .from('productos')
        .update({
          stock: nuevoStock,
          stock_min: payload.stockMin,
          unidad: payload.unidad,
        })
        .eq('id', exist.id);

      if (error) {
        notify(`Error al actualizar stock: ${error.message}`, 'error');
        return false;
      }
      notify(`Stock actualizado a ${nuevoStock} ${payload.unidad}.`, 'success');
    } else {
      const { error } = await db.from('productos').insert([
        {
          rubro: payload.rubro,
          nombre: payload.producto,
          unidad: payload.unidad,
          stock: payload.stock,
          stock_min: payload.stockMin,
        },
      ]);

      if (error) {
        notify(`Error al registrar producto: ${error.message}`, 'error');
        return false;
      }
      notify(`Producto "${payload.producto}" guardado.`, 'success');
    }

    await cargarInventarioBD();
    return true;
  };

  const handleBulkImportExcel = async (
    items: Array<{
      rubro: string;
      nombre: string;
      unidad: string;
      stock: number;
      stock_min: number;
    }>,
    skipped: number
  ) => {
    if (items.length === 0) {
      notify(
        'No se encontraron filas válidas con los rubros fijos en el archivo Excel.',
        'error'
      );
      return;
    }

    const { error } = await db.from('productos').insert(items);
    if (error) {
      notify(`Error al importar Excel: ${error.message}`, 'error');
      return;
    }
    notify(
      `Se cargaron ${items.length} productos${
        skipped > 0 ? ` (${skipped} filas omitidas)` : ''
      }.`,
      'success'
    );
    await cargarInventarioBD();
  };

  const handleDeleteProduct = (id: number, nombre: string) => {
    requestConfirm({
      title: 'Eliminar producto del inventario',
      description: `¿Desea eliminar "${nombre}" del inventario?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
      action: async () => {
        const { error } = await db.from('productos').delete().eq('id', id);
        if (!error) {
          notify('Producto eliminado.', 'success');
          await cargarInventarioBD();
        } else {
          notify(`Error: ${error.message}`, 'error');
        }
      },
    });
  };

  const handleCreateDishType = async (
    nombre: string,
    precio: number
  ): Promise<boolean> => {
    const { error } = await db
      .from('precios_platos')
      .upsert([{ nombre, precio }], { onConflict: 'nombre' });

    if (error) {
      notify(`Error al guardar plato: ${error.message}`, 'error');
      return false;
    }
    notify(`Tipo de plato "${nombre}" guardado.`, 'success');
    await cargarPreciosPlatosBD();
    return true;
  };

  const handleUpdatePrice = async (
    nombre: string,
    precio: number
  ): Promise<boolean> => {
    const { error } = await db
      .from('precios_platos')
      .update({ precio })
      .eq('nombre', nombre);

    if (error) {
      notify(`Error al actualizar precio: ${error.message}`, 'error');
      return false;
    }
    setPreciosPlatos((prev) => ({ ...prev, [nombre]: precio }));
    notify(`Precio de "${nombre}" actualizado.`, 'success');
    return true;
  };

  const handleDeleteDishType = (nombre: string) => {
    requestConfirm({
      title: 'Eliminar categoría de plato',
      description: `¿Desea eliminar la categoría "${nombre}" del catálogo de precios?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
      action: async () => {
        const { error } = await db
          .from('precios_platos')
          .delete()
          .eq('nombre', nombre);
        if (!error) {
          setPreciosPlatos((prev) => {
            const copy = { ...prev };
            delete copy[nombre];
            return copy;
          });
          notify(`Categoría "${nombre}" eliminada.`, 'success');
          await cargarPreciosPlatosBD();
        } else {
          notify(`Error: ${error.message}`, 'error');
        }
      },
    });
  };

  const handleTogglePagoComida = async (dish: ServedDish) => {
    const { error } = await db
      .from('comidas_servidas')
      .update({ pagado: !dish.pagado })
      .eq('id', dish.id);
    if (!error) {
      await cargarComidasBD();
      notify(
        `Registro marcado como ${!dish.pagado ? 'Pagado' : 'Pendiente'}.`,
        'success'
      );
    } else {
      notify(`Error al actualizar estatus: ${error.message}`, 'error');
    }
  };

  const handleUpdateComida = async (
    id: number,
    payload: {
      fecha_full: string;
      tipo: string;
      nombre: string;
      cliente: string;
      cantidad: number;
    }
  ): Promise<boolean> => {
    const { error } = await db
      .from('comidas_servidas')
      .update(payload)
      .eq('id', id);
    if (error) {
      notify(`Error al actualizar plato: ${error.message}`, 'error');
      return false;
    }
    notify('Registro de plato actualizado correctamente.', 'success');
    await cargarComidasBD();
    return true;
  };

  const handleDeleteComida = (dish: ServedDish) => {
    requestConfirm({
      title: 'Eliminar registro de plato',
      description: `¿Desea eliminar el registro "${dish.nombre}" (${dish.cantidad} raciones) de ${dish.cliente}?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
      action: async () => {
        const { error } = await db
          .from('comidas_servidas')
          .delete()
          .eq('id', dish.id);
        if (!error) {
          notify('Registro eliminado.', 'success');
          await cargarComidasBD();
        } else {
          notify(`Error: ${error.message}`, 'error');
        }
      },
    });
  };

  const handleUpdateGasto = async (
    gastoAntiguo: DailyConsumption,
    nuevoRubro: string,
    nuevoProdObj: InventoryItem,
    nuevaCant: number
  ): Promise<boolean> => {
    const prodAntiguoObj = inventario.find(
      (i) =>
        i.producto.toLowerCase() === gastoAntiguo.producto.toLowerCase() &&
        i.rubro === gastoAntiguo.rubro
    );

    if (prodAntiguoObj && prodAntiguoObj.id === nuevoProdObj.id) {
      const stockDisponible =
        nuevoProdObj.stock + Number(gastoAntiguo.cantidad);
      if (nuevaCant > stockDisponible) {
        notify(
          'La cantidad gastada supera el stock disponible en inventario.',
          'error'
        );
        return false;
      }
      const stockFinal = Number((stockDisponible - nuevaCant).toFixed(3));
      await db
        .from('productos')
        .update({ stock: stockFinal })
        .eq('id', nuevoProdObj.id);
    } else {
      if (nuevaCant > nuevoProdObj.stock) {
        notify(
          'La cantidad gastada supera el stock disponible en inventario.',
          'error'
        );
        return false;
      }
      if (prodAntiguoObj) {
        const stockDevuelto = Number(
          (prodAntiguoObj.stock + Number(gastoAntiguo.cantidad)).toFixed(3)
        );
        await db
          .from('productos')
          .update({ stock: stockDevuelto })
          .eq('id', prodAntiguoObj.id);
      }
      const stockFinal = Number((nuevoProdObj.stock - nuevaCant).toFixed(3));
      await db
        .from('productos')
        .update({ stock: stockFinal })
        .eq('id', nuevoProdObj.id);
    }

    const { error } = await db
      .from('consumos_diarios')
      .update({
        rubro: nuevoRubro,
        producto: nuevoProdObj.producto,
        cantidad: nuevaCant,
        unidad: nuevoProdObj.unidad || 'Unid',
      })
      .eq('id', gastoAntiguo.id);

    if (error) {
      notify(`Error al actualizar el gasto: ${error.message}`, 'error');
      return false;
    }

    notify(
      'Gasto de insumo actualizado y stock recalculado correctamente.',
      'success'
    );
    await Promise.all([cargarInventarioBD(), cargarConsumosBD()]);
    return true;
  };

  const handleDeleteGasto = (gasto: DailyConsumption) => {
    requestConfirm({
      title: 'Eliminar gasto de insumo',
      description: `¿Desea eliminar el gasto de ${gasto.cantidad} ${
        gasto.unidad || 'Unid'
      } de "${gasto.producto}"? La cantidad será devuelta al inventario actual.`,
      confirmLabel: 'Eliminar y Devolver',
      variant: 'danger',
      action: async () => {
        const prodInv = inventario.find(
          (i) =>
            i.producto.toLowerCase() === gasto.producto.toLowerCase() &&
            i.rubro === gasto.rubro
        );
        if (prodInv) {
          const nuevoStock = Number(
            (prodInv.stock + Number(gasto.cantidad)).toFixed(3)
          );
          await db
            .from('productos')
            .update({ stock: nuevoStock })
            .eq('id', prodInv.id);
        }

        const { error } = await db
          .from('consumos_diarios')
          .delete()
          .eq('id', gasto.id);

        if (!error) {
          notify('Gasto eliminado y stock restaurado.', 'success');
          await Promise.all([cargarInventarioBD(), cargarConsumosBD()]);
        } else {
          notify(`Error: ${error.message}`, 'error');
        }
      },
    });
  };

  // =========================================================================
  // PAYROLL & ATTENDANCE MUTATIONS
  // =========================================================================
  const handleUpdateTasa = (newTasa: number) => {
    setTasaCambio(newTasa);
    try {
      localStorage.setItem('sh_tasa_cambio', String(newTasa));
    } catch {
      // ignore
    }
    notify(`Tasa de cambio actualizada a ${newTasa.toFixed(2)} Bs/$.`, 'success');
  };

  const handleSaveEmployee = async (
    payload: Omit<Employee, 'id'>,
    editId: number | null
  ): Promise<boolean> => {
    const dbRow = {
      cedula: payload.cedula,
      nombre: payload.nombre,
      cargo: payload.cargo,
      sueldo_mensual: payload.sueldoMensual,
      banco: payload.banco,
      telefono: payload.telefono,
    };

    const { error } = editId
      ? await db.from('empleados').update(dbRow).eq('id', editId)
      : await db.from('empleados').insert([dbRow]);

    if (error) {
      notify(`Error al guardar empleado: ${error.message}`, 'error');
      return false;
    }

    notify(
      editId ? 'Empleado actualizado.' : 'Empleado registrado correctamente.',
      'success'
    );
    await cargarEmpleadosBD();
    return true;
  };

  const handleDeleteEmployee = (emp: Employee) => {
    requestConfirm({
      title: 'Eliminar trabajador',
      description: `¿Desea eliminar a "${emp.nombre}" (${emp.cedula}) de la nómina?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
      action: async () => {
        const { error } = await db.from('empleados').delete().eq('id', emp.id);
        if (!error) {
          notify('Trabajador eliminado.', 'success');
          await cargarEmpleadosBD();
        } else {
          notify(`Error: ${error.message}`, 'error');
        }
      },
    });
  };

  const handleToggleAttendance = async (fecha: string, cedula: string) => {
    const reg = asistencias.find(
      (a) => a.fecha === fecha && a.cedula === cedula
    );
    const nuevoEstado = reg ? !reg.presente : true;

    const { error } = await db
      .from('asistencias')
      .upsert([{ cedula, fecha, presente: nuevoEstado }], {
        onConflict: 'cedula,fecha',
      });

    if (!error) {
      await cargarAsistenciasBD();
    } else {
      notify(`Error al actualizar asistencia: ${error.message}`, 'error');
    }
  };

  const handlePayPeriod = (payload: {
    clavePago: string;
    cedula: string;
    mes: string;
    quincena: string;
    diasPagados: number;
    montoUSD: number;
    montoBS: number;
    nombreEmpleado: string;
  }) => {
    if (payload.diasPagados <= 0) {
      notify(
        'Este trabajador tiene 0 días trabajados en este periodo.',
        'error'
      );
      return;
    }

    const etiquetaQuincena =
      payload.quincena === 'Q1'
        ? '1ra Quincena (01 al 15)'
        : '2da Quincena (16 al 31)';

    requestConfirm({
      title: `Confirmar pago a ${payload.nombreEmpleado}`,
      description: `Periodo: ${etiquetaQuincena} (${payload.mes})\nDías trabajados: ${
        payload.diasPagados
      }\nMonto: ${formatUSD(payload.montoUSD)} / ${formatBs(
        payload.montoBS
      )}\nTasa aplicada: ${tasaCambio.toFixed(
        2
      )} Bs/$\n\nLa cuenta pendiente de este corte quedará guardada y se reiniciará a 0.`,
      confirmLabel: 'Confirmar Pago',
      variant: 'primary',
      action: async () => {
        const { error } = await db.from('pagos_nomina').upsert(
          [
            {
              clave_pago: payload.clavePago,
              cedula: payload.cedula,
              mes: payload.mes,
              quincena: payload.quincena,
              dias_pagados: payload.diasPagados,
              monto_usd: payload.montoUSD,
              monto_bs: payload.montoBS,
              tasa_cambio: tasaCambio,
              pagado: true,
              fecha_pago: getTodayISO(),
            },
          ],
          { onConflict: 'clave_pago' }
        );

        if (!error) {
          notify('Pago quincenal registrado en historial.', 'success');
          await cargarPagosNominaBD();
        } else {
          notify(`Error al registrar pago: ${error.message}`, 'error');
        }
      },
    });
  };

  const handleRevertPayment = (clavePago: string) => {
    requestConfirm({
      title: 'Anular registro de pago',
      description:
        '¿Desea anular este registro de pago para volver a calcular los días pendientes?',
      confirmLabel: 'Anular Pago',
      variant: 'danger',
      action: async () => {
        const { error } = await db
          .from('pagos_nomina')
          .delete()
          .eq('clave_pago', clavePago);
        if (!error) {
          notify('Registro de pago anulado.', 'info');
          await cargarPagosNominaBD();
        } else {
          notify(`Error: ${error.message}`, 'error');
        }
      },
    });
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <>
      {!currentUser ? (
        <LoginView
          clients={clientes}
          loadingData={loadingInitial}
          onLoginInternal={handleLoginInternal}
          onLoginClient={handleLoginClient}
        />
      ) : (
        <AppShell
          currentUser={currentUser}
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          onLogout={handleLogout}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        >
          {/* Kitchen Sections */}
          {activeSection === 'secComidas' && (
            <ComidasSection
              clients={clientes}
              preciosPlatos={preciosPlatos}
              registroComidas={registroComidas}
              onSaveDish={handleSaveDish}
              onPreviewPhoto={setPreviewImageUrl}
              onNotify={notify}
            />
          )}

          {activeSection === 'secInsumosCocina' && (
            <InsumosSection
              inventario={inventario}
              consumosDiarios={consumosDiarios}
              onDeductSupply={handleDeductSupply}
              onNotify={notify}
            />
          )}

          {activeSection === 'secDiarioCocina' && (
            <DiarioVisualSection
              registroComidas={registroComidas}
              onPreviewPhoto={setPreviewImageUrl}
              onNotify={notify}
            />
          )}

          {activeSection === 'secNominaCocina' && (
            <AsistenciaCocinaSection
              nomina={nomina}
              asistencias={asistencias}
              onToggleAttendance={handleToggleAttendance}
            />
          )}

          {/* Supervisor Sections */}
          {activeSection === 'secDashboardSup' && (
            <DashboardSection
              registroComidas={registroComidas}
              inventario={inventario}
              preciosPlatos={preciosPlatos}
              clientes={clientes}
              nomina={nomina}
              asistencias={asistencias}
              consumosDiarios={consumosDiarios}
              tasaCambio={tasaCambio}
              onNavigate={setActiveSection}
              onPreviewPhoto={setPreviewImageUrl}
            />
          )}

          {activeSection === 'secUsuariosSup' && (
            <UsuariosSection
              usuarios={usuariosSistema}
              onCreateUser={handleCreateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeSection === 'secClientesSup' && (
            <ClientesSection
              clients={clientes}
              onSaveClient={handleSaveClient}
              onDeleteClient={handleDeleteClient}
            />
          )}

          {activeSection === 'secBienesSup' && (
            <BienesSection
              clients={clientes}
              bienesClientes={bienesClientes}
              onSaveAsset={handleSaveAsset}
              onDeleteAsset={handleDeleteAsset}
            />
          )}

          {activeSection === 'secInventarioSup' && (
            <InventarioSection
              inventario={inventario}
              onAddOrUpdateProduct={handleAddOrUpdateProduct}
              onBulkImportExcel={handleBulkImportExcel}
              onDeleteProduct={handleDeleteProduct}
              onNotify={notify}
            />
          )}

          {activeSection === 'secPreciosPlatos' && (
            <PreciosSection
              preciosPlatos={preciosPlatos}
              onCreateDishType={handleCreateDishType}
              onUpdatePrice={handleUpdatePrice}
              onDeleteDishType={handleDeleteDishType}
            />
          )}

          {activeSection === 'secReportesCocina' && (
            <ReportesCocinaSection
              clients={clientes}
              preciosPlatos={preciosPlatos}
              registroComidas={registroComidas}
              consumosDiarios={consumosDiarios}
              inventario={inventario}
              onTogglePagoComida={handleTogglePagoComida}
              onUpdateComida={handleUpdateComida}
              onDeleteComida={handleDeleteComida}
              onUpdateGasto={handleUpdateGasto}
              onDeleteGasto={handleDeleteGasto}
              onPreviewPhoto={setPreviewImageUrl}
              onNotify={notify}
            />
          )}

          {activeSection === 'secPdfReportes' && (
            <PdfReportesSection
              clients={clientes}
              preciosPlatos={preciosPlatos}
              registroComidas={registroComidas}
              consumosDiarios={consumosDiarios}
              onNotify={notify}
            />
          )}

          {activeSection === 'secNominaSup' && (
            <NominaSection
              tasaCambio={tasaCambio}
              onUpdateTasa={handleUpdateTasa}
              nomina={nomina}
              asistencias={asistencias}
              pagosNomina={pagosNomina}
              onSaveEmployee={handleSaveEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onToggleAttendance={handleToggleAttendance}
              onPayPeriod={handlePayPeriod}
              onRevertPayment={handleRevertPayment}
              onNotify={notify}
            />
          )}

          {/* Client Portal Sections */}
          {activeSection === 'secPortalClienteDeuda' && (
            <PortalDeudaSection
              clienteNombre={currentUser.nombre}
              registroComidas={registroComidas}
              preciosPlatos={preciosPlatos}
              onPreviewPhoto={setPreviewImageUrl}
              onNotify={notify}
            />
          )}

          {activeSection === 'secPortalClienteBienes' && (
            <PortalBienesSection
              clienteNombre={currentUser.nombre}
              bienesClientes={bienesClientes}
            />
          )}
        </AppShell>
      )}

      <ImageModal
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.variant}
        onCancel={closeConfirm}
        onConfirm={async () => {
          const fn = confirmState.action;
          closeConfirm();
          if (fn) await fn();
        }}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }
      />
    </>
  );
}
