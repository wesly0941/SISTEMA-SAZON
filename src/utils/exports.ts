import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import {
  AttendanceRecord,
  DailyConsumption,
  Employee,
  PayrollPayment,
  RUBROS_FIJOS,
  ServedDish,
} from '../types';

export function descargarModeloExcel(): void {
  const data = [
    ['Rubro', 'Producto', 'Unidad', 'Stock Actual', 'Stock Minimo'],
    ['Proteínas', 'Bisteck', 'Kg', 15, 5],
    ['Condimentos y Especias', 'Ajo en Polvo', 'Gramos', 500, 100],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Modelo_Inventario');
  XLSX.writeFile(wb, 'Modelo_Inventario_Sazon_Helem.xlsx');
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export async function parseInventarioExcel(file: File): Promise<{
  items: Array<{
    rubro: string;
    nombre: string;
    unidad: string;
    stock: number;
    stock_min: number;
  }>;
  skipped: number;
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

  const items: Array<{
    rubro: string;
    nombre: string;
    unidad: string;
    stock: number;
    stock_min: number;
  }> = [];
  let skipped = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 5) {
      if (row && row.some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== '')) {
        skipped++;
      }
      continue;
    }

    const rawRubro = String(row[0] ?? '').trim();
    const matchedRubro = RUBROS_FIJOS.find(
      (r) => normalizeText(r) === normalizeText(rawRubro)
    );
    const producto = String(row[1] ?? '').trim();
    const unidad = String(row[2] ?? 'Unid').trim() || 'Unid';
    const stock = Number(row[3]) || 0;
    const stock_min = Number(row[4]) || 0;

    if (matchedRubro && producto) {
      items.push({
        rubro: matchedRubro,
        nombre: producto,
        unidad,
        stock,
        stock_min,
      });
    } else {
      skipped++;
    }
  }

  return { items, skipped };
}

export function exportarComidasExcel(
  comidas: ServedDish[],
  preciosPlatos: Record<string, number>
): void {
  const data: (string | number)[][] = [
    [
      'Fecha',
      'Hora',
      'Cliente / Empresa',
      'Tipo de Plato',
      'Descripción',
      'Cantidad Raciones',
      'Precio Unit. ($)',
      'Total Neto ($)',
      'Estatus Pago',
    ],
  ];

  comidas.forEach((item) => {
    const precio = preciosPlatos[item.tipo] || 0;
    const cant = Number(item.cantidad) || 0;
    const totalNeto = precio * cant;
    data.push([
      item.fecha_limpia || item.fecha_full,
      item.hora || '',
      item.cliente,
      item.tipo,
      item.nombre,
      cant,
      precio,
      totalNeto,
      item.pagado ? 'PAGADO' : 'PENDIENTE',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Detalle_Comidas');
  XLSX.writeFile(wb, 'Reporte_Detallado_Comidas_Servidas.xlsx');
}

export function exportarExcelPortalCliente(
  clienteActual: string,
  comidasCliente: ServedDish[],
  preciosPlatos: Record<string, number>,
  desdeFecha: string,
  hastaFecha: string
): void {
  const data: (string | number)[][] = [
    [`Estado de Cuenta - ${clienteActual}`],
    [`Rango de fechas: ${desdeFecha || 'Inicio'} hasta ${hastaFecha || 'Hoy'}`],
    [],
    [
      'Fecha',
      'Hora',
      'Tipo de Plato',
      'Descripción',
      'Cantidad (Raciones)',
      'Precio Unit. ($)',
      'Total Neto ($)',
      'Estatus',
    ],
  ];

  let totalRaciones = 0;
  let totalUSD = 0;

  comidasCliente.forEach((item) => {
    const precio = preciosPlatos[item.tipo] || 0;
    const cant = Number(item.cantidad) || 0;
    const totalNeto = precio * cant;
    totalRaciones += cant;
    totalUSD += totalNeto;

    data.push([
      item.fecha_limpia || item.fecha_full,
      item.hora || '',
      item.tipo,
      item.nombre,
      cant,
      precio,
      totalNeto,
      item.pagado ? 'PAGADO' : 'PENDIENTE',
    ]);
  });

  data.push([]);
  data.push(['TOTALES ACUMULADOS', '', '', '', totalRaciones, '', totalUSD, '']);

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Estado_de_Cuenta');
  XLSX.writeFile(
    wb,
    `Estado_Cuenta_${clienteActual.replace(/\s+/g, '_')}_${desdeFecha || 'inicio'}_a_${hastaFecha || 'hoy'}.xlsx`
  );
}

export function exportarNominaExcel(
  nomina: Employee[],
  asistencias: AttendanceRecord[],
  pagosNomina: Record<string, PayrollPayment>,
  mesSel: string,
  quincenaSel: string,
  tasaCambio: number
): void {
  const data: (string | number)[][] = [
    ['Reporte de Nomina Quincenal (Base 20 Días) - El Sazón de Helem C.A.'],
    [`Mes: ${mesSel}`, `Periodo: ${quincenaSel}`, `Tasa Actual: ${tasaCambio} Bs/$`],
    [],
    [
      'Cédula',
      'Empleado',
      'Cargo',
      'Banco',
      'Teléfono',
      'Sueldo Base ($)',
      'Días',
      'Total ($)',
      'Tasa Guardada',
      'Total (Bs)',
      'Estatus',
    ],
  ];

  nomina.forEach((emp) => {
    const pagoDia = emp.sueldoMensual / 20;
    const clavePago = `${mesSel}_${quincenaSel}_${emp.cedula}`;
    const regPago = pagosNomina[clavePago];

    if (regPago && regPago.pagado) {
      data.push([
        emp.cedula,
        emp.nombre,
        emp.cargo,
        emp.banco,
        emp.telefono,
        emp.sueldoMensual,
        regPago.diasPagados,
        regPago.montoUSD,
        regPago.tasaCambio,
        regPago.montoBS,
        'PAGADO',
      ]);
    } else {
      const asistenciasEmp = asistencias.filter((a) => {
        if (!a.fecha || a.cedula !== emp.cedula || !a.presente) return false;
        if (!a.fecha.startsWith(mesSel)) return false;
        const dia = parseInt(a.fecha.split('-')[2], 10);
        if (quincenaSel === 'Q1') return dia >= 1 && dia <= 15;
        if (quincenaSel === 'Q2') return dia >= 16 && dia <= 31;
        return true;
      });
      const dias = asistenciasEmp.length;
      const usd = dias * pagoDia;
      const bs = usd * tasaCambio;
      data.push([
        emp.cedula,
        emp.nombre,
        emp.cargo,
        emp.banco,
        emp.telefono,
        emp.sueldoMensual,
        dias,
        usd,
        tasaCambio,
        bs,
        'PENDIENTE',
      ]);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Nomina');
  XLSX.writeFile(wb, `Nomina_Base20_${mesSel}_${quincenaSel}.xlsx`);
}

function drawDishCardsOnPdf(
  doc: jsPDF,
  comidas: ServedDish[],
  preciosPlatos: Record<string, number>,
  startY: number
): { y: number; granTotalUSD: number } {
  let y = startY;
  let granTotalUSD = 0;

  comidas.forEach((item, index) => {
    const precioUnit = preciosPlatos[item.tipo] || 0;
    const totalNeto = precioUnit * item.cantidad;
    granTotalUSD += totalNeto;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const lineasNombre = doc.splitTextToSize(`${index + 1}. ${item.nombre}`, 105);
    const alturaTexto = lineasNombre.length * 6;
    const alturaCaja = Math.max(42, alturaTexto + 28);

    if (y + alturaCaja > 275) {
      doc.addPage();
      y = 20;
    }

    doc.setDrawColor(212, 175, 55);
    doc.setFillColor(252, 250, 246);
    doc.roundedRect(14, y, 182, alturaCaja, 3, 3, 'FD');

    if (item.foto_url && item.foto_url.startsWith('data:image')) {
      try {
        const formatoImg = item.foto_url.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(item.foto_url, formatoImg, 18, y + 4, 32, 32);
      } catch {
        doc.rect(18, y + 4, 32, 32);
        doc.setFontSize(8);
        doc.text('Sin Foto', 25, y + 21);
      }
    } else {
      doc.rect(18, y + 4, 32, 32);
      doc.setFontSize(8);
      doc.text('Foto N/A', 25, y + 21);
    }

    doc.setTextColor(139, 30, 63);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(lineasNombre, 55, y + 8);

    let cursorY = y + 8 + alturaTexto;

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${item.cliente} | Categoría: ${item.tipo}`, 55, cursorY);
    cursorY += 5;
    doc.text(`Cantidad Servida: ${item.cantidad} Raciones`, 55, cursorY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 30, 63);
    doc.text(`Precio Unit.: $${precioUnit.toFixed(2)}`, 135, cursorY - 5);
    doc.text(`Subtotal: $${totalNeto.toFixed(2)}`, 135, cursorY);

    y += alturaCaja + 6;
  });

  return { y, granTotalUSD };
}

export function generarPDFSoloCliente(
  comidas: ServedDish[],
  preciosPlatos: Record<string, number>,
  clienteSel: string,
  fechaSel: string,
  tipoSel: string
): void {
  const doc = new jsPDF('p', 'mm', 'a4');

  const comidasFiltradas = comidas.filter((c) => {
    const fechaItem =
      c.fecha_limpia || (c.fecha_full ? String(c.fecha_full).substring(0, 10) : '');
    const matchFecha = fechaItem === fechaSel;
    const matchCliente = !clienteSel || c.cliente === clienteSel;
    const matchTipo = !tipoSel || c.tipo === tipoSel;
    return matchFecha && matchCliente && matchTipo;
  });

  doc.setFillColor(139, 30, 63);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('EL SAZÓN DE HELEM C.A.', 14, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('FICHA DIARIA DE SERVICIO DE COMIDAS', 14, 21);
  doc.text(`Fecha: ${fechaSel}`, 14, 27);
  if (clienteSel) doc.text(`Cliente: ${clienteSel}`, 145, 27);

  let y = 42;
  doc.setTextColor(139, 30, 63);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Relación de Platos Servidos y Fichas', 14, y);
  y += 8;

  if (comidasFiltradas.length === 0) {
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No existen registros de comidas para los filtros seleccionados.', 14, y);
  } else {
    const res = drawDishCardsOnPdf(doc, comidasFiltradas, preciosPlatos, y);
    y = res.y;
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(212, 175, 55);
    doc.rect(14, y, 182, 10, 'F');
    doc.setTextColor(139, 30, 63);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL FACTURADO (SIN IVA): $${res.granTotalUSD.toFixed(2)} USD`, 18, y + 7);
  }

  const clienteSlug = (clienteSel || 'Todos_los_Clientes').replace(/\s+/g, '_');
  doc.save(`Ficha_Cliente_${clienteSlug}_${fechaSel}.pdf`);
}

export function generarPDFConsolidadoInterno(
  comidas: ServedDish[],
  consumos: DailyConsumption[],
  preciosPlatos: Record<string, number>,
  fechaSel: string
): void {
  const doc = new jsPDF('p', 'mm', 'a4');

  const comidasFiltradas = comidas.filter(
    (c) =>
      (c.fecha_limpia || (c.fecha_full ? String(c.fecha_full).substring(0, 10) : '')) ===
      fechaSel
  );
  const consumosFiltrados = consumos.filter(
    (c) =>
      (c.fecha_limpia || (c.fecha ? String(c.fecha).substring(0, 10) : '')) === fechaSel
  );

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('EL SAZÓN DE HELEM C.A.', 14, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('REPORTE INTERNO CONSOLIDADO: SERVICIO E INSUMOS GASTADOS', 14, 21);
  doc.text(`Fecha del Reporte: ${fechaSel}`, 14, 27);

  let y = 42;
  doc.setTextColor(139, 30, 63);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Relación de Platos Servidos a Clientes', 14, y);
  y += 8;

  if (comidasFiltradas.length === 0) {
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No existen registros de comidas para esta fecha.', 14, y);
    y += 12;
  } else {
    const res = drawDishCardsOnPdf(doc, comidasFiltradas, preciosPlatos, y);
    y = res.y;
    if (y + 15 > 275) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(212, 175, 55);
    doc.rect(14, y, 182, 10, 'F');
    doc.setTextColor(139, 30, 63);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `TOTAL FACTURADO DEL DÍA (SIN IVA): $${res.granTotalUSD.toFixed(2)} USD`,
      18,
      y + 7
    );
    y += 18;
  }

  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setTextColor(139, 30, 63);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Relación de Insumos y Productos Gastados en la Preparación', 14, y);
  y += 8;

  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('Rubro', 18, y + 5);
  doc.text('Producto / Insumo', 75, y + 5);
  doc.text('Cantidad Exacta Utilizada', 145, y + 5);

  y += 11;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);

  if (consumosFiltrados.length === 0) {
    doc.text('No se registraron consumos de insumos para esta fecha.', 18, y);
  } else {
    consumosFiltrados.forEach((c) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(c.rubro, 18, y);
      doc.text(c.producto, 75, y);
      doc.text(`${c.cantidad} ${c.unidad || 'Unid'}`, 145, y);
      y += 8;
      doc.setDrawColor(230, 230, 230);
      doc.line(14, y - 3, 196, y - 3);
    });
  }

  doc.save(`Reporte_Consolidado_Interno_${fechaSel}.pdf`);
}

export async function descargarReporteImagen(
  element: HTMLElement,
  fecha: string
): Promise<void> {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: '#FFFFFF',
    cacheBust: true,
  });
  const link = document.createElement('a');
  link.download = `Reporte_Cocina_${fecha}.png`;
  link.href = dataUrl;
  link.click();
}
