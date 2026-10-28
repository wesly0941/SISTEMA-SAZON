// =========================================================================
// CONFIGURACIÓN DE SUPABASE
// =========================================================================
const SUPABASE_URL = 'https://smmmynjbxuasfslgdwtk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dk4Ca_QZdpaB_WQk7xLr_A_UCFj0YXV';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RUBROS_FIJOS = [
  "Proteínas",
  "Condimentos y Especias",
  "Víveres",
  "Verduras y Vegetales",
  "Lácteos",
  "Bebidas"
];

const state = {
  currentUser: null,
  tasaCambio: 36.50,
  preciosPlatos: { "Ejecutivo": 3.50, "Especial": 5.00, "Sopa": 2.00, "Postre": 1.50 },
  clientes: [],
  inventario: [],
  registroComidas: [],
  consumosDiarios: [],
  nomina: [],
  asistencias: [],
  pagosNomina: {},
  usuariosSistema: []
};

document.addEventListener("DOMContentLoaded", async () => {
  const hoyStr = new Date().toISOString().split("T")[0];
  
  if (document.getElementById("fechaAsistenciaCocina")) document.getElementById("fechaAsistenciaCocina").value = hoyStr;
  if (document.getElementById("filtroFechaDiario")) document.getElementById("filtroFechaDiario").value = hoyStr;
  if (document.getElementById("filtroFechaAsistenciaSup")) document.getElementById("filtroFechaAsistenciaSup").value = hoyStr;
  if (document.getElementById("filtroFechaGastosSup")) document.getElementById("filtroFechaGastosSup").value = hoyStr;
  if (document.getElementById("pdfFechaComidas")) document.getElementById("pdfFechaComidas").value = hoyStr;
  if (document.getElementById("pdfFechaInsumosInterno")) document.getElementById("pdfFechaInsumosInterno").value = hoyStr;

  const mesInput = document.getElementById("filtroMesNomina");
  if (mesInput) {
    const hoy = new Date();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    mesInput.value = `${hoy.getFullYear()}-${mm}`;
  }

  setupEvents();
  await cargarTodoDesdeSupabase();
});

async function cargarTodoDesdeSupabase() {
  await Promise.all([
    cargarUsuariosBD(),
    cargarClientesBD(),
    cargarInventarioBD(),
    cargarPreciosPlatosBD(),
    cargarEmpleadosBD(),
    cargarAsistenciasBD(),
    cargarPagosNominaBD(),
    cargarComidasBD(),
    cargarConsumosBD()
  ]);
  renderAll();
}

function setupEvents() {
  if (document.getElementById("loginForm")) {
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = document.getElementById("usernameInput").value.trim();
      const pass = document.getElementById("passwordInput").value.trim();

      const usuarioEncontrado = state.usuariosSistema.find(u => u.usuario === user && u.password === pass);

      if (usuarioEncontrado) {
        const nombreRol = usuarioEncontrado.rol === 'supervisor' ? 'Supervisor General' : 'Jefa de Cocina';
        login(nombreRol, usuarioEncontrado.rol);
      } else {
        alert("Usuario o contraseña incorrectos.");
      }
    });
  }

  if (document.getElementById("logoutBtn")) {
    document.getElementById("logoutBtn").addEventListener("click", () => {
      document.getElementById("appView").classList.add("hidden");
      document.getElementById("loginView").classList.remove("hidden");
      state.currentUser = null;
    });
  }

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".content-section").forEach(s => s.classList.add("hidden"));
      
      const targetBtn = e.currentTarget;
      targetBtn.classList.add("active");
      const targetSec = targetBtn.getAttribute("data-target");
      if (document.getElementById(targetSec)) {
        document.getElementById(targetSec).classList.remove("hidden");
      }
    });
  });

  if (document.getElementById("btnActualizarTasa")) {
    document.getElementById("btnActualizarTasa").addEventListener("click", () => {
      const val = parseFloat(document.getElementById("tasaCambioInput").value);
      if (val > 0) {
        state.tasaCambio = val;
        alert(`Tasa actualizada a ${val.toFixed(2)} Bs/$`);
        renderAll();
      }
    });
  }

  if (document.getElementById("regRubroInsumo")) document.getElementById("regRubroInsumo").addEventListener("change", actualizarSubProductosInventario);
  if (document.getElementById("formNuevoInsumoInv")) document.getElementById("formNuevoInsumoInv").addEventListener("submit", cargarInsumoASupervisor);
  if (document.getElementById("formNuevoUsuario")) document.getElementById("formNuevoUsuario").addEventListener("submit", crearNuevoUsuarioSistema);
  
  if (document.getElementById("formPlatoDia")) document.getElementById("formPlatoDia").addEventListener("submit", guardarPlatoDia);
  if (document.getElementById("formGastoInsumo")) document.getElementById("formGastoInsumo").addEventListener("submit", descontarInsumo);
  if (document.getElementById("selectRubroInsumo")) document.getElementById("selectRubroInsumo").addEventListener("change", populateInsumosDropdownCocina);

  if (document.getElementById("formNuevoCliente")) document.getElementById("formNuevoCliente").addEventListener("submit", crearNuevoCliente);
  if (document.getElementById("searchInsumoInput")) document.getElementById("searchInsumoInput").addEventListener("input", renderInventarioSup);
  if (document.getElementById("filterRubroInventario")) document.getElementById("filterRubroInventario").addEventListener("change", renderInventarioSup);

  if (document.getElementById("formNuevoPlato")) document.getElementById("formNuevoPlato").addEventListener("submit", crearNuevoPlato);
  if (document.getElementById("formNuevoEmpleado")) document.getElementById("formNuevoEmpleado").addEventListener("submit", guardarEmpleadoSubmit);

  if (document.getElementById("filtroFechaDiario")) document.getElementById("filtroFechaDiario").addEventListener("change", renderDiarioCocina);
  if (document.getElementById("filtroClienteCobros")) document.getElementById("filtroClienteCobros").addEventListener("change", renderReportesCocina);
  if (document.getElementById("filtroFechaGastosSup")) document.getElementById("filtroFechaGastosSup").addEventListener("change", renderGastosInsumosSup);

  if (document.getElementById("filtroMesNomina")) document.getElementById("filtroMesNomina").addEventListener("change", renderNominaSup);
  if (document.getElementById("filtroQuincenaNomina")) document.getElementById("filtroQuincenaNomina").addEventListener("change", renderNominaSup);
  if (document.getElementById("filtroFechaAsistenciaSup")) document.getElementById("filtroFechaAsistenciaSup").addEventListener("change", renderAsistenciaDiaSup);

  if (document.getElementById("btnDescargarModelo")) document.getElementById("btnDescargarModelo").addEventListener("click", descargarModeloExcel);
  if (document.getElementById("inputExcelInventario")) document.getElementById("inputExcelInventario").addEventListener("change", cargarInventarioExcel);
  if (document.getElementById("btnExportarComidasExcel")) document.getElementById("btnExportarComidasExcel").addEventListener("click", exportarComidasExcel);
  if (document.getElementById("btnExportarNominaExcel")) document.getElementById("btnExportarNominaExcel").addEventListener("click", exportarNominaExcel);

  const inputFoto = document.getElementById("fotoPlato");
  if (inputFoto) {
    inputFoto.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const preview = document.getElementById("previewFoto");
      if (file && preview) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          preview.innerHTML = `<img src="${evt.target.result}" id="tempBase64Img" alt="Preview" />`;
          preview.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

function login(nombreRol, tipoRol) {
  state.currentUser = { nombre: nombreRol, role: tipoRol };
  document.getElementById("loginView").classList.add("hidden");
  document.getElementById("appView").classList.remove("hidden");
  document.getElementById("userBadge").innerText = nombreRol;

  if (tipoRol === "cocina") {
    document.getElementById("menuCocina").classList.remove("hidden");
    document.getElementById("menuSupervisor").classList.add("hidden");
    const firstBtn = document.querySelector('#menuCocina .nav-btn');
    if (firstBtn) firstBtn.click();
  } else {
    document.getElementById("menuSupervisor").classList.remove("hidden");
    document.getElementById("menuCocina").classList.add("hidden");
    const firstBtn = document.querySelector('#menuSupervisor .nav-btn');
    if (firstBtn) firstBtn.click();
  }

  renderAll();
}

function renderAll() {
  populateRubrosFijos();
  actualizarSubProductosInventario();
  populateClientesDropdown();
  populateTiposPlatosDropdown();
  populateInsumosDropdownCocina();
  renderPlatosHoy();
  renderNominaCocina();
  renderDiarioCocina();
  renderClientesSup();
  renderUsuariosSup();
  renderInventarioSup();
  renderPreciosPlatos();
  renderReportesCocina();
  renderGastosInsumosSup();
  renderListaTrabajadores();
  renderNominaSup();
  renderAsistenciaDiaSup();
  renderDashboardSup();
}

// SUPABASE: USUARIOS
async function cargarUsuariosBD() {
  const { data, error } = await db.from('usuarios').select('*');
  if (!error && data) state.usuariosSistema = data;
}

async function crearNuevoUsuarioSistema(e) {
  e.preventDefault();
  const usuario = document.getElementById("nuevoUserNombre").value.trim();
  const password = document.getElementById("nuevoUserPass").value.trim();
  const rol = document.getElementById("nuevoUserRol").value;

  const { error } = await db.from('usuarios').insert([{ usuario, password, rol }]);
  if (!error) {
    alert("Usuario creado exitosamente.");
    document.getElementById("formNuevoUsuario").reset();
    await cargarUsuariosBD();
    renderUsuariosSup();
  } else {
    alert("Error al crear usuario.");
  }
}

async function eliminarUsuarioSistema(id) {
  if (confirm("¿Desea eliminar este usuario?")) {
    const { error } = await db.from('usuarios').delete().eq('id', id);
    if (!error) {
      await cargarUsuariosBD();
      renderUsuariosSup();
    }
  }
}

function renderUsuariosSup() {
  const tbody = document.getElementById("tablaUsuariosSup");
  if (!tbody) return;
  tbody.innerHTML = "";
  state.usuariosSistema.forEach(u => {
    tbody.innerHTML += `
      <tr>
        <td>#${u.id}</td>
        <td><strong>${u.usuario}</strong></td>
        <td><span class="badge">${u.rol.toUpperCase()}</span></td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="eliminarUsuarioSistema(${u.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  });
}

// INVENTARIO
async function cargarInventarioBD() {
  const { data, error } = await db.from('productos').select('*');
  if (!error && data) {
    state.inventario = data.map(i => ({
      id: i.id,
      rubro: i.rubro,
      producto: i.nombre,
      unidad: i.unidad,
      stock: parseFloat(i.stock),
      stockMin: parseFloat(i.stock_min)
    }));
  }
}

function populateRubrosFijos() {
  const regRubro = document.getElementById("regRubroInsumo");
  const filterRubro = document.getElementById("filterRubroInventario");
  const selectRubroCocina = document.getElementById("selectRubroInsumo");

  if (regRubro) {
    const act = regRubro.value;
    regRubro.innerHTML = "";
    RUBROS_FIJOS.forEach(r => { regRubro.innerHTML += `<option value="${r}">${r}</option>`; });
    if (act && RUBROS_FIJOS.includes(act)) regRubro.value = act;
  }

  if (filterRubro) {
    const act = filterRubro.value;
    filterRubro.innerHTML = `<option value="">TODOS LOS RUBROS</option>`;
    RUBROS_FIJOS.forEach(r => { filterRubro.innerHTML += `<option value="${r}">${r}</option>`; });
    filterRubro.value = act;
  }

  if (selectRubroCocina) {
    const act = selectRubroCocina.value;
    selectRubroCocina.innerHTML = `<option value="">Todos los rubros...</option>`;
    RUBROS_FIJOS.forEach(r => { selectRubroCocina.innerHTML += `<option value="${r}">${r}</option>`; });
    selectRubroCocina.value = act;
  }
}

function actualizarSubProductosInventario() {
  const rubroSel = document.getElementById("regRubroInsumo") ? document.getElementById("regRubroInsumo").value : RUBROS_FIJOS[0];
  const selectProd = document.getElementById("regSelectProductoInsumo");
  if (!selectProd) return;

  selectProd.innerHTML = `<option value="">Seleccione producto guardado...</option>`;
  const prodsGuardados = state.inventario.filter(i => i.rubro === rubroSel);
  prodsGuardados.forEach(p => {
    selectProd.innerHTML += `<option value="${p.producto}">${p.producto}</option>`;
  });
}

async function cargarInsumoASupervisor(e) {
  e.preventDefault();
  const rubroFijo = document.getElementById("regRubroInsumo").value;
  const prodLista = document.getElementById("regSelectProductoInsumo").value;
  const prodNuevoManual = document.getElementById("regNuevoProductoManual").value.trim();
  const unidad = document.getElementById("regUnidadInsumo").value;
  const stock = parseFloat(document.getElementById("regStockInsumo").value);
  const stockMin = parseFloat(document.getElementById("regMinInsumo").value);

  const productoFinal = prodNuevoManual !== "" ? prodNuevoManual : prodLista;
  if (!productoFinal) {
    alert("Seleccione un producto guardado o escriba uno nuevo.");
    return;
  }

  const exist = state.inventario.find(i => i.producto.toLowerCase() === productoFinal.toLowerCase() && i.rubro === rubroFijo);

  if (exist) {
    const nuevoStock = exist.stock + stock;
    const { error } = await db.from('productos').update({ stock: nuevoStock, stock_min: stockMin, unidad }).eq('id', exist.id);
    if (!error) {
      alert(`Stock actualizado a ${nuevoStock} ${unidad}`);
      await cargarInventarioBD();
    }
  } else {
    const { error } = await db.from('productos').insert([{
      rubro: rubroFijo,
      nombre: productoFinal,
      unidad,
      stock,
      stock_min: stockMin
    }]);

    if (!error) {
      alert(`Producto "${productoFinal}" guardado.`);
      await cargarInventarioBD();
    }
  }

  document.getElementById("formNuevoInsumoInv").reset();
  renderAll();
}

async function eliminarInsumo(id) {
  if (confirm("¿Eliminar este producto?")) {
    const { error } = await db.from('productos').delete().eq('id', id);
    if (!error) {
      await cargarInventarioBD();
      renderAll();
    }
  }
}

function renderInventarioSup() {
  const tbody = document.getElementById("tablaInventarioSup");
  if (!tbody) return;

  const search = document.getElementById("searchInsumoInput") ? document.getElementById("searchInsumoInput").value.toLowerCase() : "";
  const filterRubro = document.getElementById("filterRubroInventario") ? document.getElementById("filterRubroInventario").value : "";

  tbody.innerHTML = "";
  state.inventario.forEach(item => {
    const matchSearch = item.producto.toLowerCase().includes(search) || item.rubro.toLowerCase().includes(search);
    const matchRubro = !filterRubro || item.rubro === filterRubro;

    if (matchSearch && matchRubro) {
      const bajo = item.stock <= item.stockMin;
      tbody.innerHTML += `
        <tr style="${bajo ? 'background-color: #FFF0F0;' : ''}">
          <td><span class="badge">${item.rubro}</span></td>
          <td><strong>${item.producto}</strong></td>
          <td><strong>${item.stock}</strong></td>
          <td>${item.unidad || 'Unid'}</td>
          <td>${item.stockMin}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="eliminarInsumo(${item.id})"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `;
    }
  });
}

// CLIENTES
async function cargarClientesBD() {
  const { data, error } = await db.from('clientes').select('*');
  if (!error && data) state.clientes = data;
}

function populateClientesDropdown() {
  const selCocina = document.getElementById("selectClientePlatoCocina");
  const selReporte = document.getElementById("filtroClienteCobros");
  const selPdf = document.getElementById("pdfSelectCliente");

  if (selCocina) {
    selCocina.innerHTML = `<option value="">Seleccione cliente...</option>`;
    state.clientes.forEach(c => { selCocina.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`; });
  }

  if (selReporte) {
    const act = selReporte.value;
    selReporte.innerHTML = `<option value="">TODOS LOS CLIENTES</option>`;
    state.clientes.forEach(c => { selReporte.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`; });
    selReporte.value = act;
  }

  if (selPdf) {
    selPdf.innerHTML = `<option value="">TODOS LOS CLIENTES</option>`;
    state.clientes.forEach(c => { selPdf.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`; });
  }
}

async function crearNuevoCliente(e) {
  e.preventDefault();
  const nombre = document.getElementById("nombreClienteInput").value.trim();
  if (nombre) {
    const { error } = await db.from('clientes').insert([{ nombre }]);
    if (!error) {
      alert("Cliente guardado.");
      document.getElementById("formNuevoCliente").reset();
      await cargarClientesBD();
      renderAll();
    }
  }
}

async function eliminarCliente(id) {
  if (confirm("¿Desea eliminar este cliente?")) {
    const { error } = await db.from('clientes').delete().eq('id', id);
    if (!error) {
      await cargarClientesBD();
      renderAll();
    }
  }
}

function renderClientesSup() {
  const tbody = document.getElementById("tablaClientesSup");
  if (!tbody) return;
  tbody.innerHTML = "";
  state.clientes.forEach(c => {
    tbody.innerHTML += `
      <tr>
        <td>#${c.id}</td>
        <td><strong>${c.nombre}</strong></td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="eliminarCliente(${c.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  });
}

// PRECIOS PLATOS
async function cargarPreciosPlatosBD() {
  const { data, error } = await db.from('precios_platos').select('*');
  if (!error && data && data.length > 0) {
    state.preciosPlatos = {};
    data.forEach(p => {
      state.preciosPlatos[p.nombre] = parseFloat(p.precio);
    });
  }
}

async function crearNuevoPlato(e) {
  e.preventDefault();
  const nombre = document.getElementById("nombreNuevoPlato").value.trim();
  const precio = parseFloat(document.getElementById("precioNuevoPlato").value);

  if (nombre && !isNaN(precio)) {
    const { error } = await db.from('precios_platos').upsert([{ nombre, precio }], { onConflict: 'nombre' });
    if (!error) {
      state.preciosPlatos[nombre] = precio;
      document.getElementById("formNuevoPlato").reset();
      alert(`Tipo de plato "${nombre}" guardado.`);
      await cargarPreciosPlatosBD();
      renderAll();
    } else {
      alert("Error al guardar plato: " + error.message);
    }
  }
}

async function actualizarPrecio(cat) {
  const input = document.getElementById(`price_${cat}`);
  if (!input) return;
  const precio = parseFloat(input.value);
  if (precio >= 0) {
    const { error } = await db.from('precios_platos').update({ precio }).eq('nombre', cat);
    if (!error) {
      state.preciosPlatos[cat] = precio;
      alert(`Precio de "${cat}" actualizado.`);
      renderAll();
    }
  }
}

async function eliminarTipoPlato(cat) {
  if (confirm(`¿Eliminar ${cat}?`)) {
    const { error } = await db.from('precios_platos').delete().eq('nombre', cat);
    if (!error) {
      delete state.preciosPlatos[cat];
      await cargarPreciosPlatosBD();
      renderAll();
    }
  }
}

function renderPreciosPlatos() {
  const tbody = document.getElementById("tablaPreciosPlatos");
  if (!tbody) return;
  tbody.innerHTML = "";
  Object.keys(state.preciosPlatos).forEach(cat => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${cat}</strong></td>
        <td><input type="number" step="0.1" value="${state.preciosPlatos[cat]}" id="price_${cat}" style="width: 80px;" /></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="actualizarPrecio('${cat}')"><i class="fas fa-sync"></i></button>
          <button class="btn btn-sm btn-danger" onclick="eliminarTipoPlato('${cat}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  });
}

// COCINA E INSUMOS
async function cargarConsumosBD() {
  const { data, error } = await db.from('consumos_diarios').select('*');
  if (!error && data) state.consumosDiarios = data;
}

function populateInsumosDropdownCocina() {
  const selectRubro = document.getElementById("selectRubroInsumo");
  const selectProd = document.getElementById("selectProductoInsumo");
  if (!selectRubro || !selectProd) return;

  const rubro = selectRubro.value;
  selectProd.innerHTML = "";

  const filtrados = state.inventario.filter(i => !rubro || i.rubro === rubro);
  filtrados.forEach(prod => {
    const opt = document.createElement("option");
    opt.value = prod.id;
    opt.innerText = `[${prod.rubro}] ${prod.producto} (Disp: ${prod.stock} ${prod.unidad || 'Unid'})`;
    selectProd.appendChild(opt);
  });
}

async function descontarInsumo(e) {
  e.preventDefault();
  const prodId = parseInt(document.getElementById("selectProductoInsumo").value);
  const cant = parseFloat(document.getElementById("cantGastoInsumo").value);

  const item = state.inventario.find(i => i.id === prodId);
  if (item) {
    if (cant > item.stock) {
      alert("La cantidad gastada supera el stock disponible.");
      return;
    }
    const nuevoStock = item.stock - cant;
    const fechaHoy = new Date().toISOString().split("T")[0];

    await db.from('productos').update({ stock: nuevoStock }).eq('id', item.id);
    await db.from('consumos_diarios').insert([{
      fecha: fechaHoy,
      producto: item.producto,
      rubro: item.rubro,
      cantidad: cant,
      unidad: item.unidad || 'Unid'
    }]);

    alert(`Descontadas ${cant} ${item.unidad || 'unidades'} de ${item.producto}`);
    document.getElementById("formGastoInsumo").reset();
    await cargarInventarioBD();
    await cargarConsumosBD();
    renderAll();
  }
}

function renderDiarioCocina() {
  const fechaInput = document.getElementById("filtroFechaDiario");
  const containerPlatos = document.getElementById("diarioPlatosContainer");
  const tbodyInsumos = document.getElementById("tablaDiarioInsumos");
  const labelFechaVisual = document.getElementById("labelFechaReporteVisual");

  if (!fechaInput || !containerPlatos || !tbodyInsumos) return;
  const fechaSel = fechaInput.value;

  if (labelFechaVisual) labelFechaVisual.innerText = `Fecha del Reporte: ${fechaSel}`;

  containerPlatos.innerHTML = "";
  const platosFecha = state.registroComidas.filter(c => c.fecha_full === fechaSel);

  if (platosFecha.length === 0) {
    containerPlatos.innerHTML = "<p class='description'>No hay registros de platos para esta fecha.</p>";
  } else {
    platosFecha.forEach(p => {
      containerPlatos.innerHTML += `
        <div class="plato-diario-card">
          <img src="${p.foto_url}" class="img-thumb" style="width: 60px; height: 60px;" onclick="verFotoModal('${p.foto_url}')"/>
          <div>
            <strong>${p.nombre} (${p.tipo})</strong><br/>
            <small>Cliente: ${p.cliente} | Cantidad: <strong>${p.cantidad} Raciones</strong></small>
          </div>
        </div>
      `;
    });
  }

  tbodyInsumos.innerHTML = "";
  const consumosFecha = state.consumosDiarios.filter(c => c.fecha === fechaSel);

  if (consumosFecha.length === 0) {
    tbodyInsumos.innerHTML = `<tr><td colspan="3" class="description">No hay consumos de insumos registrados en esta fecha.</td></tr>`;
  } else {
    consumosFecha.forEach(c => {
      tbodyInsumos.innerHTML += `
        <tr>
          <td><strong>${c.producto}</strong></td>
          <td><span class="badge">${c.rubro}</span></td>
          <td><strong>${c.cantidad} ${c.unidad || 'Unid'}</strong></td>
        </tr>
      `;
    });
  }
}

// DESCARGAR REPORTE VISUAL EN IMAGEN PARA COCINA
function descargarReporteImagenCocina() {
  const cardVisual = document.getElementById("reporteCocinaVisualCard");
  if (!cardVisual) return;

  html2canvas(cardVisual, { scale: 2, useCORS: true }).then(canvas => {
    const enlace = document.createElement("a");
    enlace.download = `Reporte_Cocina_${document.getElementById("filtroFechaDiario").value}.png`;
    enlace.href = canvas.toDataURL("image/png");
    enlace.click();
  }).catch(err => {
    alert("Error al generar la imagen del reporte.");
  });
}

// COMIDAS SERVIDAS
async function cargarComidasBD() {
  const { data, error } = await db.from('comidas_servidas').select('*');
  if (!error && data) state.registroComidas = data;
}

function populateTiposPlatosDropdown() {
  const select = document.getElementById("selectTipoPlato");
  const selectPdf = document.getElementById("pdfSelectTipoComida");

  if (select) {
    const valActual = select.value;
    // SIN PRECIOS PARA EL ROL DE COCINA
    select.innerHTML = `<option value="">Seleccione tipo...</option>`;
    Object.keys(state.preciosPlatos).forEach(tipo => {
      select.innerHTML += `<option value="${tipo}">${tipo}</option>`;
    });
    select.value = valActual;
  }

  if (selectPdf) {
    selectPdf.innerHTML = `<option value="">TODAS LAS COMIDAS</option>`;
    Object.keys(state.preciosPlatos).forEach(tipo => {
      selectPdf.innerHTML += `<option value="${tipo}">${tipo}</option>`;
    });
  }
}

async function guardarPlatoDia(e) {
  e.preventDefault();
  const tipo = document.getElementById("selectTipoPlato").value;
  const nombre = document.getElementById("nombrePlato").value.trim();
  const cliente = document.getElementById("selectClientePlatoCocina").value;
  const cantidad = parseInt(document.getElementById("cantServida").value);
  const imgElem = document.getElementById("tempBase64Img");

  let fotoUrl = "https://via.placeholder.com/60?text=Plato"; 
  if (imgElem && imgElem.src) {
    fotoUrl = imgElem.src;
  }

  const fechaObj = new Date();
  const fechaHoy = fechaObj.toISOString().split("T")[0];
  const horaStr = fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const { error } = await db.from('comidas_servidas').insert([{
    fecha_full: fechaHoy,
    hora: horaStr,
    tipo,
    nombre,
    cliente,
    cantidad,
    foto_url: fotoUrl,
    pagado: false
  }]);

  if (!error) {
    document.getElementById("formPlatoDia").reset();
    document.getElementById("previewFoto").classList.add("hidden");
    alert("¡Plato registrado correctamente!");
    await cargarComidasBD();
    renderAll();
  } else {
    alert("Error al guardar: " + error.message);
  }
}

function renderPlatosHoy() {
  const tbody = document.getElementById("tablaPlatosHoy");
  if (!tbody) return;
  const hoyStr = new Date().toISOString().split("T")[0];
  tbody.innerHTML = "";
  
  state.registroComidas.filter(c => c.fecha_full === hoyStr).forEach(item => {
    tbody.innerHTML += `
      <tr>
        <td><img src="${item.foto_url}" class="img-thumb" onclick="verFotoModal('${item.foto_url}')"/></td>
        <td>${item.tipo}</td>
        <td>${item.cliente}</td>
        <td><strong>${item.cantidad}</strong></td>
      </tr>
    `;
  });
}

async function togglePagoComida(id) {
  const item = state.registroComidas.find(c => c.id === id);
  if (item) {
    const nuevoEstado = !item.pagado;
    await db.from('comidas_servidas').update({ pagado: nuevoEstado }).eq('id', id);
    await cargarComidasBD();
    renderAll();
  }
}

function verFotoModal(url) {
  const modal = document.getElementById("imageModal");
  const imgFull = document.getElementById("imgModalFull");
  if (modal && imgFull) {
    imgFull.src = url;
    modal.classList.remove("hidden");
  }
}

function cerrarModalFoto() {
  const modal = document.getElementById("imageModal");
  if (modal) modal.classList.add("hidden");
}

function renderReportesCocina() {
  const tbody = document.getElementById("tablaReportesPlatos");
  const filtroCliente = document.getElementById("filtroClienteCobros") ? document.getElementById("filtroClienteCobros").value : "";
  if (!tbody) return;

  tbody.innerHTML = "";
  state.registroComidas.forEach(item => {
    if (!filtroCliente || item.cliente === filtroCliente) {
      const precio = state.preciosPlatos[item.tipo] || 0;
      const totalNeto = (precio * item.cantidad).toFixed(2);
      tbody.innerHTML += `
        <tr>
          <td>${item.fecha_full} ${item.hora || ''}</td>
          <td><img src="${item.foto_url}" class="img-thumb" onclick="verFotoModal('${item.foto_url}')"/></td>
          <td><strong>${item.cliente}</strong></td>
          <td>${item.tipo}</td>
          <td>${item.nombre}</td>
          <td>${item.cantidad}</td>
          <td>$${precio.toFixed(2)}</td>
          <td><strong>$${totalNeto}</strong></td>
          <td>
            <span class="${item.pagado ? 'badge-paid' : 'badge-pending'}">
              ${item.pagado ? 'PAGADO' : 'PENDIENTE'}
            </span>
          </td>
          <td>
            <button class="btn btn-sm ${item.pagado ? 'btn-secondary' : 'btn-success'}" onclick="togglePagoComida(${item.id})">
              ${item.pagado ? 'Pendiente' : 'Pagado'}
            </button>
          </td>
        </tr>
      `;
    }
  });
}

function renderGastosInsumosSup() {
  const tbody = document.getElementById("tablaGastosInsumosSup");
  const fechaInput = document.getElementById("filtroFechaGastosSup");
  if (!tbody || !fechaInput) return;

  const fechaSel = fechaInput.value;
  tbody.innerHTML = "";

  const consumosFecha = state.consumosDiarios.filter(c => c.fecha === fechaSel);

  if (consumosFecha.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="description">No hay consumo de insumos registrado en la fecha seleccionada.</td></tr>`;
  } else {
    consumosFecha.forEach(c => {
      tbody.innerHTML += `
        <tr>
          <td><span class="badge">${c.rubro}</span></td>
          <td><strong>${c.producto}</strong></td>
          <td><strong>${c.cantidad}</strong></td>
          <td>${c.unidad || 'Unid'}</td>
        </tr>
      `;
    });
  }
}

// REPORTE 1: SOLO PARA EL CLIENTE (CON TEXTO MULTILÍNEA / WRAPPING AUTOMÁTICO)
async function generarPDFSoloCliente() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const clienteSel = document.getElementById("pdfSelectCliente").value;
  const fechaSel = document.getElementById("pdfFechaComidas").value;
  const tipoSel = document.getElementById("pdfSelectTipoComida").value;

  const comidasFiltradas = state.registroComidas.filter(c => {
    const matchFecha = c.fecha_full === fechaSel;
    const matchCliente = !clienteSel || c.cliente === clienteSel;
    const matchTipo = !tipoSel || c.tipo === tipoSel;
    return matchFecha && matchCliente && matchTipo;
  });

  doc.setFillColor(139, 30, 63); 
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("EL SAZÓN DE HELEM C.A.", 14, 13);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("FICHA DIARIA DE SERVICIO DE COMIDAS", 14, 21);
  doc.text(`Fecha: ${fechaSel}`, 14, 27);
  if (clienteSel) doc.text(`Cliente: ${clienteSel}`, 145, 27);

  let y = 42;

  doc.setTextColor(139, 30, 63);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Relación de Platos Servidos y Fichas", 14, y);
  y += 8;

  if (comidasFiltradas.length === 0) {
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("No existen registros de comidas para los filtros seleccionados.", 14, y);
  } else {
    let granTotalUSD = 0;

    comidasFiltradas.forEach((item, index) => {
      const precioUnit = state.preciosPlatos[item.tipo] || 0;
      const totalNeto = precioUnit * item.cantidad;
      granTotalUSD += totalNeto;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const lineasNombre = doc.splitTextToSize(`${index + 1}. ${item.nombre}`, 105);
      const alturaTexto = lineasNombre.length * 6;
      const alturaCaja = Math.max(42, alturaTexto + 28);

      if (y + alturaCaja > 275) { doc.addPage(); y = 20; }

      doc.setDrawColor(212, 175, 55);
      doc.setFillColor(252, 250, 246);
      doc.roundedRect(14, y, 182, alturaCaja, 3, 3, 'FD');

      if (item.foto_url && item.foto_url.startsWith("data:image")) {
        try {
          const formatoImg = item.foto_url.includes("image/png") ? "PNG" : "JPEG";
          doc.addImage(item.foto_url, formatoImg, 18, y + 4, 32, 32);
        } catch (e) {
          doc.setDrawColor(200, 200, 200);
          doc.rect(18, y + 4, 32, 32);
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text("Sin Foto", 25, y + 21);
        }
      } else {
        doc.setDrawColor(200, 200, 200);
        doc.rect(18, y + 4, 32, 32);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("Foto N/A", 25, y + 21);
      }

      doc.setTextColor(139, 30, 63);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(lineasNombre, 55, y + 8);

      let cursorY = y + 8 + alturaTexto;

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Cliente: ${item.cliente} | Categoría: ${item.tipo}`, 55, cursorY);
      cursorY += 5;
      doc.text(`Cantidad Servida: ${item.cantidad} Raciones`, 55, cursorY);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(139, 30, 63);
      doc.text(`Precio Unit.: $${precioUnit.toFixed(2)}`, 135, cursorY - 5);
      doc.text(`Subtotal: $${totalNeto.toFixed(2)}`, 135, cursorY);

      y += alturaCaja + 6;
    });

    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFillColor(212, 175, 55);
    doc.rect(14, y, 182, 10, 'F');
    doc.setTextColor(139, 30, 63);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL FACTURADO (SIN IVA): $${granTotalUSD.toFixed(2)} USD`, 18, y + 7);
  }

  const nombreArchivo = clienteSel ? `Ficha_Cliente_${clienteSel.replace(/\s+/g, '_')}_${fechaSel}.pdf` : `Ficha_Comidas_${fechaSel}.pdf`;
  doc.save(nombreArchivo);
}

// REPORTE 2: CONSOLIDADO INTERNO (CON TEXTO MULTILÍNEA / WRAPPING AUTOMÁTICO)
async function generarPDFConsolidadoInterno() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const fechaSel = document.getElementById("pdfFechaInsumosInterno") ? document.getElementById("pdfFechaInsumosInterno").value : new Date().toISOString().split("T")[0];

  const comidasFiltradas = state.registroComidas.filter(c => c.fecha_full === fechaSel);
  const consumosFiltrados = state.consumosDiarios.filter(c => c.fecha === fechaSel);

  doc.setFillColor(11, 37, 69); 
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("EL SAZÓN DE HELEM C.A.", 14, 13);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("REPORTE INTERNO CONSOLIDADO: SERVICIO E INSUMOS GASTADOS", 14, 21);
  doc.text(`Fecha del Reporte: ${fechaSel}`, 14, 27);

  let y = 42;

  doc.setTextColor(139, 30, 63);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("1. Relación de Platos Servidos a Clientes", 14, y);
  y += 8;

  if (comidasFiltradas.length === 0) {
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("No existen registros de comidas para esta fecha.", 14, y);
    y += 12;
  } else {
    let granTotalUSD = 0;

    comidasFiltradas.forEach((item, index) => {
      const precioUnit = state.preciosPlatos[item.tipo] || 0;
      const totalNeto = precioUnit * item.cantidad;
      granTotalUSD += totalNeto;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const lineasNombre = doc.splitTextToSize(`${index + 1}. ${item.nombre}`, 105);
      const alturaTexto = lineasNombre.length * 6;
      const alturaCaja = Math.max(42, alturaTexto + 28);

      if (y + alturaCaja > 275) { doc.addPage(); y = 20; }

      doc.setDrawColor(212, 175, 55);
      doc.setFillColor(252, 250, 246);
      doc.roundedRect(14, y, 182, alturaCaja, 3, 3, 'FD');

      if (item.foto_url && item.foto_url.startsWith("data:image")) {
        try {
          const formatoImg = item.foto_url.includes("image/png") ? "PNG" : "JPEG";
          doc.addImage(item.foto_url, formatoImg, 18, y + 4, 32, 32);
        } catch (e) {
          doc.rect(18, y + 4, 32, 32);
          doc.setFontSize(8);
          doc.text("Sin Foto", 25, y + 21);
        }
      } else {
        doc.rect(18, y + 4, 32, 32);
        doc.setFontSize(8);
        doc.text("Foto N/A", 25, y + 21);
      }

      doc.setTextColor(139, 30, 63);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(lineasNombre, 55, y + 8);

      let cursorY = y + 8 + alturaTexto;

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Cliente: ${item.cliente} | Categoría: ${item.tipo}`, 55, cursorY);
      cursorY += 5;
      doc.text(`Cantidad Servida: ${item.cantidad} Raciones`, 55, cursorY);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(139, 30, 63);
      doc.text(`Precio Unit.: $${precioUnit.toFixed(2)}`, 135, cursorY - 5);
      doc.text(`Subtotal: $${totalNeto.toFixed(2)}`, 135, cursorY);

      y += alturaCaja + 6;
    });

    if (y + 15 > 275) { doc.addPage(); y = 20; }
    doc.setFillColor(212, 175, 55);
    doc.rect(14, y, 182, 10, 'F');
    doc.setTextColor(139, 30, 63);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL FACTURADO DEL DÍA (SIN IVA): $${granTotalUSD.toFixed(2)} USD`, 18, y + 7);
    y += 18;
  }

  if (y > 230) { doc.addPage(); y = 20; }

  doc.setTextColor(139, 30, 63);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("2. Relación de Insumos y Productos Gastados en la Preparación", 14, y);
  y += 8;

  doc.setFillColor(11, 37, 69);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Rubro", 18, y + 5);
  doc.text("Producto / Insumo", 75, y + 5);
  doc.text("Cantidad Exacta Utilizada", 145, y + 5);

  y += 11;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);

  if (consumosFiltrados.length === 0) {
    doc.text("No se registraron consumos de insumos para esta fecha.", 18, y);
  } else {
    consumosFiltrados.forEach(c => {
      if (y > 275) { doc.addPage(); y = 20; }
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

// NÓMINA, ASISTENCIA Y PAGOS
async function cargarEmpleadosBD() {
  const { data, error } = await db.from('empleados').select('*');
  if (!error && data) {
    state.nomina = data.map(e => ({
      id: e.id,
      cedula: e.cedula,
      nombre: e.nombre,
      cargo: e.cargo,
      sueldoMensual: parseFloat(e.sueldo_mensual),
      banco: e.banco,
      telefono: e.telefono
    }));
  }
}

async function cargarAsistenciasBD() {
  const { data, error } = await db.from('asistencias').select('*');
  if (!error && data) state.asistencias = data;
}

async function cargarPagosNominaBD() {
  const { data, error } = await db.from('pagos_nomina').select('*');
  if (!error && data) {
    state.pagosNomina = {};
    data.forEach(p => {
      state.pagosNomina[p.clave_pago] = {
        pagado: p.pagado,
        montoUSD: parseFloat(p.monto_usd),
        montoBS: parseFloat(p.monto_bs)
      };
    });
  }
}

async function guardarEmpleadoSubmit(e) {
  e.preventDefault();
  const idEdit = document.getElementById("editEmpId").value;
  const cedula = document.getElementById("cedulaEmpleado").value.trim();
  const nombre = document.getElementById("nombreEmpleado").value.trim();
  const cargo = document.getElementById("cargoEmpleado").value.trim();
  const sueldoMensual = parseFloat(document.getElementById("sueldoEmpleado").value);
  const banco = document.getElementById("bancoEmpleado").value.trim();
  const telefono = document.getElementById("telefonoEmpleado").value.trim();

  if (idEdit) {
    await db.from('empleados').update({ cedula, nombre, cargo, sueldo_mensual: sueldoMensual, banco, telefono }).eq('id', parseInt(idEdit));
    alert("Empleado actualizado.");
  } else {
    await db.from('empleados').insert([{ cedula, nombre, cargo, sueldo_mensual: sueldoMensual, banco, telefono }]);
    alert("Empleado guardado.");
  }

  resetFormEmpleado();
  await cargarEmpleadosBD();
  renderAll();
}

function editarEmpleado(id) {
  const emp = state.nomina.find(e => e.id === id);
  if (emp) {
    document.getElementById("editEmpId").value = emp.id;
    document.getElementById("cedulaEmpleado").value = emp.cedula;
    document.getElementById("nombreEmpleado").value = emp.nombre;
    document.getElementById("cargoEmpleado").value = emp.cargo;
    document.getElementById("sueldoEmpleado").value = emp.sueldoMensual;
    document.getElementById("bancoEmpleado").value = emp.banco || "";
    document.getElementById("telefonoEmpleado").value = emp.telefono || "";
    document.getElementById("tituloFormEmpleado").innerText = "Editar Empleado";
    document.getElementById("btnSubmitEmpleado").innerHTML = `<i class="fas fa-sync"></i> Actualizar`;
    document.getElementById("btnCancelEditEmp").classList.remove("hidden");
  }
}

async function eliminarEmpleado(id) {
  if (confirm("¿Eliminar trabajador?")) {
    await db.from('empleados').delete().eq('id', id);
    await cargarEmpleadosBD();
    renderAll();
  }
}

function resetFormEmpleado() {
  document.getElementById("editEmpId").value = "";
  document.getElementById("formNuevoEmpleado").reset();
  document.getElementById("tituloFormEmpleado").innerText = "Registrar Empleado y Datos de Pago";
  document.getElementById("btnSubmitEmpleado").innerHTML = `<i class="fas fa-user-plus"></i> Guardar Empleado`;
  document.getElementById("btnCancelEditEmp").classList.add("hidden");
}

function renderListaTrabajadores() {
  const tbody = document.getElementById("tablaListaTrabajadores");
  if (!tbody) return;
  tbody.innerHTML = "";
  state.nomina.forEach(emp => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${emp.cedula}</strong></td>
        <td>${emp.nombre}</td>
        <td>${emp.cargo}</td>
        <td>${emp.banco || 'N/A'} - ${emp.telefono || 'N/A'}</td>
        <td>$${emp.sueldoMensual.toFixed(2)}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="editarEmpleado(${emp.id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="eliminarEmpleado(${emp.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  });
}

function renderNominaCocina() {
  const tbody = document.getElementById("tablaNominaCocina");
  const fechaInput = document.getElementById("fechaAsistenciaCocina");
  if (!tbody || !fechaInput) return;

  const fechaSeleccionada = fechaInput.value;
  tbody.innerHTML = "";

  state.nomina.forEach(emp => {
    const registro = state.asistencias.find(a => a.fecha === fechaSeleccionada && a.cedula === emp.cedula);
    const estaPresente = registro ? registro.presente : false;

    tbody.innerHTML += `
      <tr>
        <td><strong>${emp.cedula}</strong></td>
        <td>${emp.nombre}</td>
        <td>${emp.cargo}</td>
        <td>
          <span style="color: ${estaPresente ? 'green' : 'red'}; font-weight: bold;">
            ${estaPresente ? '✅ Asistió' : '❌ Ausente'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm ${estaPresente ? 'btn-danger' : 'btn-secondary'}" onclick="marcarAsistencia('${fechaSeleccionada}', '${emp.cedula}')">
            ${estaPresente ? 'Marcar Ausente' : 'Marcar Presente'}
          </button>
        </td>
      </tr>
    `;
  });
}

async function marcarAsistencia(fecha, cedula) {
  let registro = state.asistencias.find(a => a.fecha === fecha && a.cedula === cedula);
  const nuevoEstado = registro ? !registro.presente : true;

  const { error } = await db.from('asistencias').upsert([{
    cedula, fecha, presente: nuevoEstado
  }], { onConflict: 'cedula,fecha' });

  if (!error) {
    await cargarAsistenciasBD();
    renderAll();
  }
}

function renderNominaSup() {
  const tbody = document.getElementById("tablaCalculoNomina");
  const filtroMes = document.getElementById("filtroMesNomina");
  const filtroQuin = document.getElementById("filtroQuincenaNomina");
  if (!tbody || !filtroMes || !filtroQuin) return;

  const mesSel = filtroMes.value;
  const quincenaSel = filtroQuin.value;
  tbody.innerHTML = "";

  state.nomina.forEach(emp => {
    const pagoDia = emp.sueldoMensual / 30;
    const asistenciasEmp = state.asistencias.filter(a => {
      if (!a.fecha || a.cedula !== emp.cedula || !a.presente) return false;
      if (!a.fecha.startsWith(mesSel)) return false;
      const dia = parseInt(a.fecha.split("-")[2], 10);
      if (quincenaSel === "Q1") return dia >= 1 && dia <= 15;
      if (quincenaSel === "Q2") return dia >= 16 && dia <= 31;
      return true;
    });

    const diasTrabajados = asistenciasEmp.length;
    const totalUSD = diasTrabajados * pagoDia;
    const totalBS = totalUSD * state.tasaCambio;
    const montoBsFormatted = totalBS.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    const clavePago = `${mesSel}_${quincenaSel}_${emp.cedula}`;
    const estaPagado = state.pagosNomina[clavePago] && state.pagosNomina[clavePago].pagado;
    const textoCopiar = `PAGO MOVIL:\nCedula: ${emp.cedula}\nBanco: ${emp.banco || 'N/A'}\nTelefono: ${emp.telefono || 'N/A'}\nMonto: ${montoBsFormatted} Bs. (${diasTrabajados} dias)`;

    tbody.innerHTML += `
      <tr>
        <td><strong>${emp.cedula}</strong></td>
        <td>${emp.nombre}</td>
        <td><strong>${diasTrabajados} días</strong></td>
        <td><strong>$${totalUSD.toFixed(2)}</strong></td>
        <td><strong style="color: var(--color-primary); font-size:1.05em;">${montoBsFormatted} Bs.</strong></td>
        <td><small>${emp.banco || 'N/A'}<br/>${emp.telefono || 'N/A'}</small></td>
        <td>
          <span class="${estaPagado ? 'badge-paid' : 'badge-pending'}">
            ${estaPagado ? 'PAGADO' : 'PENDIENTE'}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:5px;">
            <button class="btn btn-sm ${estaPagado ? 'btn-secondary' : 'btn-success'}" onclick="togglePagoNominaTrabajador('${clavePago}', '${emp.cedula}', '${mesSel}', '${quincenaSel}', ${totalUSD}, ${totalBS})">
              ${estaPagado ? 'Pendiente' : 'PAGADO'}
            </button>
            <button class="btn btn-sm btn-secondary" onclick="copiarPagoMovil('${encodeURIComponent(textoCopiar)}')">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

async function togglePagoNominaTrabajador(clavePago, cedula, mes, quincena, montoUSD, montoBS) {
  const actual = state.pagosNomina[clavePago];
  const nuevoEstado = actual ? !actual.pagado : true;

  const { error } = await db.from('pagos_nomina').upsert([{
    clave_pago: clavePago, cedula, mes, quincena, monto_usd: montoUSD, monto_bs: montoBS, pagado: nuevoEstado
  }], { onConflict: 'clave_pago' });

  if (!error) {
    await cargarPagosNominaBD();
    renderAll();
  }
}

function copiarPagoMovil(strEncoded) {
  const texto = decodeURIComponent(strEncoded);
  navigator.clipboard.writeText(texto).then(() => {
    alert("¡Datos copiados al portapapeles!\n\n" + texto);
  });
}

function renderAsistenciaDiaSup() {
  const tbody = document.getElementById("tablaAsistenciaDiaSup");
  const fechaInput = document.getElementById("filtroFechaAsistenciaSup");
  if (!tbody || !fechaInput) return;

  const fechaSel = fechaInput.value;
  tbody.innerHTML = "";

  state.nomina.forEach(emp => {
    const reg = state.asistencias.find(a => a.fecha === fechaSel && a.cedula === emp.cedula);
    const asistio = reg ? reg.presente : false;

    tbody.innerHTML += `
      <tr>
        <td><strong>${emp.cedula}</strong></td>
        <td>${emp.nombre}</td>
        <td>${emp.cargo}</td>
        <td>
          <span style="color: ${asistio ? 'green' : 'red'}; font-weight: bold;">
            ${asistio ? '✅ Asistió' : '❌ Ausente'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm ${asistio ? 'btn-danger' : 'btn-success'}" onclick="marcarAsistencia('${fechaSel}', '${emp.cedula}')">
            ${asistio ? 'Marcar Ausente' : 'Marcar Presente'}
          </button>
        </td>
      </tr>
    `;
  });
}

function renderDashboardSup() {
  const statComidas = document.getElementById("statComidasHoy");
  if (!statComidas) return;

  const hoyStr = new Date().toISOString().split("T")[0];
  const comidasHoy = state.registroComidas.filter(c => c.fecha_full === hoyStr);
  const totalServidos = comidasHoy.reduce((acc, curr) => acc + curr.cantidad, 0);

  let totalVentas = 0;
  comidasHoy.forEach(item => {
    totalVentas += item.cantidad * (state.preciosPlatos[item.tipo] || 0);
  });

  statComidas.innerText = totalServidos;
  document.getElementById("statVentasHoy").innerText = `$${totalVentas.toFixed(2)}`;

  const centerBox = document.getElementById("alertasCenterBox");
  if (centerBox) {
    const bajoStock = state.inventario.filter(i => i.stock <= i.stockMin);

    if (bajoStock.length === 0) {
      centerBox.innerHTML = `
        <h3 style="color: green;"><i class="fas fa-check-circle"></i> Estado del Inventario: Óptimo</h3>
        <p class="description">Todos los productos cuentan con existencias suficientes.</p>
      `;
    } else {
      let alertsHTML = `
        <h3><i class="fas fa-exclamation-triangle" style="color: var(--color-danger);"></i> ALERTAS DE INVENTARIO (STOCK BAJO)</h3>
        <p class="description" style="margin-bottom: 12px;">Atención Supervisor:</p>
      `;

      bajoStock.forEach(item => {
        alertsHTML += `
          <div class="alert-item">
            <span><strong>[${item.rubro}] ${item.producto}:</strong> Stock: <strong>${item.stock} ${item.unidad || 'Unid'}</strong> (Mín: ${item.stockMin})</span>
            <button class="btn btn-sm btn-primary" onclick="irAInventario()"><i class="fas fa-arrow-right"></i> Reponer</button>
          </div>
        `;
      });
      centerBox.innerHTML = alertsHTML;
    }
  }
}

function irAInventario() {
  const btnInv = document.querySelector('[data-target="secInventarioSup"]');
  if (btnInv) btnInv.click();
}

function descargarModeloExcel() {
  const data = [
    ["Rubro", "Producto", "Unidad", "Stock Actual", "Stock Minimo"],
    ["Proteínas", "Bisteck", "Kg", 15, 5],
    ["Condimentos y Especias", "Ajo en Polvo", "Gramos", 500, 100]
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Modelo_Inventario");
  XLSX.writeFile(wb, "Modelo_Inventario_Sazon_Helem.xlsx");
}

async function cargarInventarioExcel(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(evt) {
    try {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      let cargados = 0;
      for (let i = 1; i < json.length; i++) {
        const row = json[i];
        if (row && row.length >= 5) {
          const rubro = String(row[0]).trim();
          const producto = String(row[1]).trim();
          const unidad = String(row[2]).trim();
          const stock = parseFloat(row[3]) || 0;
          const stockMin = parseFloat(row[4]) || 0;

          if (RUBROS_FIJOS.includes(rubro)) {
            await db.from('productos').insert([{ rubro, nombre: producto, unidad, stock, stock_min: stockMin }]);
            cargados++;
          }
        }
      }
      alert(`Se cargaron ${cargados} productos.`);
      document.getElementById("inputExcelInventario").value = "";
      await cargarInventarioBD();
      renderAll();
    } catch (err) {
      alert("Error leyendo el Excel.");
    }
  };
  reader.readAsArrayBuffer(file);
}

function exportarComidasExcel() {
  const filtroCliente = document.getElementById("filtroClienteCobros") ? document.getElementById("filtroClienteCobros").value : "";
  const data = [
    ["Fecha", "Hora", "Cliente / Empresa", "Tipo de Plato", "Descripción", "Cantidad", "Precio Unit. (\$)", "Total Neto (\$)", "Estatus Pago"]
  ];

  state.registroComidas.forEach(item => {
    if (!filtroCliente || item.cliente === filtroCliente) {
      const precio = state.preciosPlatos[item.tipo] || 0;
      data.push([item.fecha_full, item.hora, item.cliente, item.tipo, item.nombre, item.cantidad, precio, precio * item.cantidad, item.pagado ? "PAGADO" : "PENDIENTE"]);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Comidas_Cobros");
  XLSX.writeFile(wb, "Cobros_Comidas.xlsx");
}

function exportarNominaExcel() {
  const mesSel = document.getElementById("filtroMesNomina").value;
  const quincenaSel = document.getElementById("filtroQuincenaNomina").value;
  const data = [
    ["Reporte de Nomina - El Sazón de Helem C.A."],
    [`Mes: ${mesSel}`, `Periodo: ${quincenaSel}`, `Tasa: ${state.tasaCambio} Bs/$`],
    [],
    ["Cédula", "Empleado", "Cargo", "Banco", "Teléfono", "Sueldo ($)", "Días", "Total ($)", "Bs", "Estatus"]
  ];

  state.nomina.forEach(emp => {
    const pagoDia = emp.sueldoMensual / 30;
    const asistenciasEmp = state.asistencias.filter(a => {
      if (!a.fecha || a.cedula !== emp.cedula || !a.presente) return false;
      if (!a.fecha.startsWith(mesSel)) return false;
      const dia = parseInt(a.fecha.split("-")[2], 10);
      if (quincenaSel === "Q1") return dia >= 1 && dia <= 15;
      if (quincenaSel === "Q2") return dia >= 16 && dia <= 31;
      return true;
    });
    const dias = asistenciasEmp.length;
    const usd = dias * pagoDia;
    const bs = usd * state.tasaCambio;
    const est = state.pagosNomina[`${mesSel}_${quincenaSel}_${emp.cedula}`]?.pagado ? "PAGADO" : "PENDIENTE";
    data.push([emp.cedula, emp.nombre, emp.cargo, emp.banco, emp.telefono, emp.sueldoMensual, dias, usd, bs, est]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Nomina");
  XLSX.writeFile(wb, `Nomina_${mesSel}_${quincenaSel}.xlsx`);
}

function populateClientesDropdown() {
  const selCocina = document.getElementById("selectClientePlatoCocina");
  const selReporte = document.getElementById("filtroClienteCobros");
  const selPdf = document.getElementById("pdfSelectCliente");

  if (selCocina) {
    selCocina.innerHTML = `<option value="">Seleccione cliente...</option>`;
    state.clientes.forEach(c => { selCocina.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`; });
  }

  if (selReporte) {
    const act = selReporte.value;
    selReporte.innerHTML = `<option value="">TODOS LOS CLIENTES</option>`;
    state.clientes.forEach(c => { selReporte.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`; });
    selReporte.value = act;
  }

  if (selPdf) {
    selPdf.innerHTML = `<option value="">TODOS LOS CLIENTES</option>`;
    state.clientes.forEach(c => { selPdf.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`; });
  }
}

function populateTiposPlatosDropdown() {
  const select = document.getElementById("selectTipoPlato");
  const selectPdf = document.getElementById("pdfSelectTipoComida");

  if (select) {
    const valActual = select.value;
    select.innerHTML = `<option value="">Seleccione tipo...</option>`;
    Object.keys(state.preciosPlatos).forEach(tipo => {
      select.innerHTML += `<option value="${tipo}">${tipo}</option>`;
    });
    select.value = valActual;
  }

  if (selectPdf) {
    selectPdf.innerHTML = `<option value="">TODAS LAS COMIDAS</option>`;
    Object.keys(state.preciosPlatos).forEach(tipo => {
      selectPdf.innerHTML += `<option value="${tipo}">${tipo}</option>`;
    });
  }
}