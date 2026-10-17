// RUBROS FIJOS (CATEGORÍAS PRINCIPALES NO MODIFICABLES)
const RUBROS_FIJOS = [
  "Proteínas",
  "Condimentos y Especias",
  "Víveres",
  "Verduras y Vegetales",
  "Lácteos",
  "Bebidas"
];

// CATALOGO DE PRODUCTOS POR RUBRO (SE AUTOGUARDAN LOS NUEVOS)
const CATALOGO_PRODUCTOS_SUBDIVIDIDOS = {
  "Proteínas": ["Bisteck", "Carne para Mechar", "Carne para Guisar", "Carne Molida", "Pollo Entero", "Muslos de Pollo", "Pechuga de Pollo", "Chuleta de Cerdo"],
  "Condimentos y Especias": ["Sal", "Pimienta Negra", "Comino", "Ajo en Polvo", "Orégano", "Color / Onoto", "Cubito", "Salsa de Soya"],
  "Víveres": ["Arroz", "Harina PAN", "Pasta / Espagueti", "Aceite", "Caraotas Negras", "Lentejas", "Azúcar", "Café"],
  "Verduras y Vegetales": ["Papa", "Cebolla", "Pimentón", "Tomate", "Zanahoria", "Ajo en Rama", "Cilantro", "Plátano"],
  "Lácteos": ["Queso Blanco", "Queso Amarillo", "Mantequilla", "Leche", "Crema de Leche"],
  "Bebidas": ["Jugo Concentrado", "Refresco", "Agua Mineral"]
};

// ESTADO GLOBAL DE LA APLICACIÓN
const state = {
  currentUser: null,
  tasaCambio: 36.50,

  preciosPlatos: {
    "Ejecutivo": 3.50,
    "Especial": 5.00,
    "Sopa": 2.00,
    "Postre": 1.50
  },

  clientes: [
    { id: 1, nombre: "Servicio Interno / Comedor" },
    { id: 2, nombre: "Corporación Alpha C.A." },
    { id: 3, nombre: "Banco Venezolano Crédito" }
  ],

  // INVENTARIO ACTUAL
  inventario: [
    { id: 101, rubro: "Proteínas", producto: "Bisteck", unidad: "Kg", stock: 12.0, stockMin: 5.0 },
    { id: 102, rubro: "Proteínas", producto: "Carne para Mechar", unidad: "Kg", stock: 8.5, stockMin: 4.0 },
    { id: 103, rubro: "Proteínas", producto: "Carne para Guisar", unidad: "Kg", stock: 3.0, stockMin: 5.0 },
    { id: 201, rubro: "Condimentos y Especias", producto: "Sal", unidad: "Kg", stock: 10.0, stockMin: 2.0 },
    { id: 301, rubro: "Víveres", producto: "Arroz", unidad: "Kg", stock: 40.0, stockMin: 15.0 },
    { id: 401, rubro: "Verduras y Vegetales", producto: "Papa", unidad: "Kg", stock: 30.0, stockMin: 10.0 }
  ],

  registroComidas: [],
  consumosDiarios: [],

  nomina: [
    { id: 1, cedula: "V-15890123", nombre: "Helem Espinoza", cargo: "Jefa de Cocina", sueldoMensual: 150.00, banco: "Banesco", telefono: "04141234567" },
    { id: 2, cedula: "V-20123456", nombre: "María Delgado", cargo: "Auxiliar de Cocina", sueldoMensual: 90.00, banco: "Venezuela", telefono: "04249876543" },
    { id: 3, cedula: "V-18456789", nombre: "Carlos Gómez", cargo: "Mantenimiento", sueldoMensual: 30.00, banco: "Mercantil", telefono: "04125554433" }
  ],

  // ASISTENCIAS INICIALES DE PRUEBA (17/10/2026)
  asistencias: [
    { fecha: "2026-10-17", cedula: "V-15890123", presente: true },
    { fecha: "2026-10-17", cedula: "V-20123456", presente: true },
    { fecha: "2026-10-17", cedula: "V-18456789", presente: true }
  ],

  // REGISTRO DE PAGOS DE NÓMINA (PERIODO -> CEDULA -> ESTADO)
  pagosNomina: {} // Clave: `${mes}_${quincena}_${cedula}` -> { pagado: true/false, fechaPago, montoUSD, montoBS }
};

document.addEventListener("DOMContentLoaded", () => {
  const hoyStr = new Date().toISOString().split("T")[0];
  
  if (document.getElementById("fechaAsistenciaCocina")) document.getElementById("fechaAsistenciaCocina").value = hoyStr;
  if (document.getElementById("filtroFechaDiario")) document.getElementById("filtroFechaDiario").value = hoyStr;
  if (document.getElementById("filtroFechaAsistenciaSup")) document.getElementById("filtroFechaAsistenciaSup").value = hoyStr;
  if (document.getElementById("filtroFechaGastosSup")) document.getElementById("filtroFechaGastosSup").value = hoyStr;

  const mesInput = document.getElementById("filtroMesNomina");
  if (mesInput) {
    const hoy = new Date();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    mesInput.value = `${hoy.getFullYear()}-${mm}`;
  }

  setupEvents();
  renderAll();
});

function setupEvents() {
  // Login / Logout
  if (document.getElementById("loginForm")) {
    document.getElementById("loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const user = document.getElementById("usernameInput").value.trim().toLowerCase();
      const pass = document.getElementById("passwordInput").value.trim();

      if (user === "cocina" && pass === "1234") {
        login("Jefa de Cocina", "cocina");
      } else if (user === "supervisor" && pass === "1234") {
        login("Supervisor General", "supervisor");
      } else {
        alert("Credenciales incorrectas. Pruebe cocina/1234 o supervisor/1234");
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

  // Navegación Sidebar
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

  // Tasa
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

  // Forms e Inventario
  if (document.getElementById("regRubroInsumo")) document.getElementById("regRubroInsumo").addEventListener("change", actualizarSubProductosInventario);
  if (document.getElementById("formNuevoInsumoInv")) document.getElementById("formNuevoInsumoInv").addEventListener("submit", cargarInsumoASupervisor);
  
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

  // Excel
  if (document.getElementById("btnDescargarModelo")) document.getElementById("btnDescargarModelo").addEventListener("click", descargarModeloExcel);
  if (document.getElementById("inputExcelInventario")) document.getElementById("inputExcelInventario").addEventListener("change", cargarInventarioExcel);
  if (document.getElementById("btnExportarComidasExcel")) document.getElementById("btnExportarComidasExcel").addEventListener("click", exportarComidasExcel);
  if (document.getElementById("btnExportarNominaExcel")) document.getElementById("btnExportarNominaExcel").addEventListener("click", exportarNominaExcel);

  // Preview Foto
  const inputFoto = document.getElementById("fotoPlato");
  if (inputFoto) {
    inputFoto.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const preview = document.getElementById("previewFoto");
      if (file && preview) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          preview.innerHTML = `<img src="${evt.target.result}" alt="Preview" />`;
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
  renderInventarioSup();
  renderPreciosPlatos();
  renderReportesCocina();
  renderGastosInsumosSup();
  renderListaTrabajadores();
  renderNominaSup();
  renderAsistenciaDiaSup();
  renderDashboardSup();
}

// RUBROS FIJOS Y SUBPRODUCTOS DINÁMICOS
function populateRubrosFijos() {
  const regRubro = document.getElementById("regRubroInsumo");
  const filterRubro = document.getElementById("filterRubroInventario");
  const selectRubroCocina = document.getElementById("selectRubroInsumo");

  if (regRubro) {
    const act = regRubro.value;
    regRubro.innerHTML = "";
    RUBROS_FIJOS.forEach(r => {
      regRubro.innerHTML += `<option value="${r}">${r}</option>`;
    });
    if (act && RUBROS_FIJOS.includes(act)) regRubro.value = act;
  }

  if (filterRubro) {
    const act = filterRubro.value;
    filterRubro.innerHTML = `<option value="">TODOS LOS RUBROS</option>`;
    RUBROS_FIJOS.forEach(r => {
      filterRubro.innerHTML += `<option value="${r}">${r}</option>`;
    });
    filterRubro.value = act;
  }

  if (selectRubroCocina) {
    const act = selectRubroCocina.value;
    selectRubroCocina.innerHTML = `<option value="">Todos los rubros...</option>`;
    RUBROS_FIJOS.forEach(r => {
      selectRubroCocina.innerHTML += `<option value="${r}">${r}</option>`;
    });
    selectRubroCocina.value = act;
  }
}

function actualizarSubProductosInventario() {
  const rubroSel = document.getElementById("regRubroInsumo") ? document.getElementById("regRubroInsumo").value : RUBROS_FIJOS[0];
  const selectProd = document.getElementById("regSelectProductoInsumo");
  if (!selectProd) return;

  selectProd.innerHTML = `<option value="">Seleccione producto guardado...</option>`;
  const listaProds = CATALOGO_PRODUCTOS_SUBDIVIDIDOS[rubroSel] || [];
  listaProds.forEach(p => {
    selectProd.innerHTML += `<option value="${p}">${p}</option>`;
  });
}

function cargarInsumoASupervisor(e) {
  e.preventDefault();
  const rubroFijo = document.getElementById("regRubroInsumo").value;
  const prodLista = document.getElementById("regSelectProductoInsumo").value;
  const prodNuevoManual = document.getElementById("regNuevoProductoManual").value.trim();
  const unidad = document.getElementById("regUnidadInsumo").value;
  const stock = parseFloat(document.getElementById("regStockInsumo").value);
  const stockMin = parseFloat(document.getElementById("regMinInsumo").value);

  const productoFinal = prodNuevoManual !== "" ? prodNuevoManual : prodLista;

  if (!productoFinal) {
    alert("Por favor seleccione un producto de la lista o escriba un nombre de producto nuevo.");
    return;
  }

  // Guardar dinámicamente el nuevo producto en el catálogo del rubro fijo si es nuevo
  if (prodNuevoManual !== "") {
    if (!CATALOGO_PRODUCTOS_SUBDIVIDIDOS[rubroFijo]) {
      CATALOGO_PRODUCTOS_SUBDIVIDIDOS[rubroFijo] = [];
    }
    if (!CATALOGO_PRODUCTOS_SUBDIVIDIDOS[rubroFijo].includes(prodNuevoManual)) {
      CATALOGO_PRODUCTOS_SUBDIVIDIDOS[rubroFijo].push(prodNuevoManual);
    }
  }

  const exist = state.inventario.find(i => i.producto.toLowerCase() === productoFinal.toLowerCase() && i.rubro === rubroFijo);
  if (exist) {
    exist.stock += stock;
    exist.stockMin = stockMin;
    exist.unidad = unidad;
    alert(`Se actualizó el stock de "${exist.producto}" en ${rubroFijo}. Total: ${exist.stock} ${unidad}`);
  } else {
    state.inventario.push({ id: Date.now(), rubro: rubroFijo, producto: productoFinal, unidad, stock, stockMin });
    alert(`Producto "${productoFinal}" registrado y guardado exitosamente en el rubro ${rubroFijo}.`);
  }

  document.getElementById("formNuevoInsumoInv").reset();
  renderAll();
}

function eliminarInsumo(id) {
  if (confirm("¿Desea eliminar este producto del inventario?")) {
    state.inventario = state.inventario.filter(i => i.id !== id);
    renderAll();
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
function populateClientesDropdown() {
  const selCocina = document.getElementById("selectClientePlatoCocina");
  const selReporte = document.getElementById("filtroClienteCobros");

  if (selCocina) {
    selCocina.innerHTML = `<option value="">Seleccione cliente...</option>`;
    state.clientes.forEach(c => {
      selCocina.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`;
    });
  }

  if (selReporte) {
    const act = selReporte.value;
    selReporte.innerHTML = `<option value="">TODOS LOS CLIENTES</option>`;
    state.clientes.forEach(c => {
      selReporte.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`;
    });
    selReporte.value = act;
  }
}

function crearNuevoCliente(e) {
  e.preventDefault();
  const nombre = document.getElementById("nombreClienteInput").value.trim();
  if (nombre) {
    state.clientes.push({ id: Date.now(), nombre });
    document.getElementById("formNuevoCliente").reset();
    alert("Cliente registrado exitosamente.");
    renderAll();
  }
}

function eliminarCliente(id) {
  if (confirm("¿Desea eliminar este cliente autorizado?")) {
    state.clientes = state.clientes.filter(c => c.id !== id);
    renderAll();
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

// INSUMOS COCINA
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

function descontarInsumo(e) {
  e.preventDefault();
  const prodId = parseInt(document.getElementById("selectProductoInsumo").value);
  const cant = parseFloat(document.getElementById("cantGastoInsumo").value);

  const item = state.inventario.find(i => i.id === prodId);
  if (item) {
    if (cant > item.stock) {
      alert("Atención: La cantidad gastada supera el stock disponible.");
      return;
    }
    item.stock -= cant;

    const fechaHoy = new Date().toISOString().split("T")[0];
    state.consumosDiarios.push({
      id: Date.now(),
      fecha: fechaHoy,
      insumoId: item.id,
      producto: item.producto,
      rubro: item.rubro,
      cantidad: cant,
      unidad: item.unidad || 'Unid'
    });

    alert(`Descontadas ${cant} ${item.unidad || 'unidades'} de ${item.producto}`);
    document.getElementById("formGastoInsumo").reset();
    renderAll();
  }
}

function renderDiarioCocina() {
  const fechaInput = document.getElementById("filtroFechaDiario");
  const containerPlatos = document.getElementById("diarioPlatosContainer");
  const tbodyInsumos = document.getElementById("tablaDiarioInsumos");

  if (!fechaInput || !containerPlatos || !tbodyInsumos) return;
  const fechaSel = fechaInput.value;

  containerPlatos.innerHTML = "";
  const platosFecha = state.registroComidas.filter(c => c.fechaFull === fechaSel);

  if (platosFecha.length === 0) {
    containerPlatos.innerHTML = "<p class='description'>No hay registros de platos para esta fecha.</p>";
  } else {
    platosFecha.forEach(p => {
      containerPlatos.innerHTML += `
        <div class="plato-diario-card">
          <img src="${p.fotoUrl}" class="img-thumb" style="width: 60px; height: 60px;" onclick="verFotoModal('${p.fotoUrl}')"/>
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

function populateTiposPlatosDropdown() {
  const select = document.getElementById("selectTipoPlato");
  if (!select) return;
  const valActual = select.value;
  select.innerHTML = `<option value="">Seleccione tipo...</option>`;
  Object.keys(state.preciosPlatos).forEach(tipo => {
    select.innerHTML += `<option value="${tipo}">${tipo}</option>`;
  });
  select.value = valActual;
}

function guardarPlatoDia(e) {
  e.preventDefault();
  const tipo = document.getElementById("selectTipoPlato").value;
  const nombre = document.getElementById("nombrePlato").value.trim();
  const cliente = document.getElementById("selectClientePlatoCocina").value;
  const cantidad = parseInt(document.getElementById("cantServida").value);
  const fileInput = document.getElementById("fotoPlato");

  let fotoUrl = "https://via.placeholder.com/60?text=Plato";
  if (fileInput.files && fileInput.files[0]) {
    fotoUrl = URL.createObjectURL(fileInput.files[0]);
  }

  const fechaObj = new Date();
  const fechaHoy = fechaObj.toISOString().split("T")[0];

  state.registroComidas.push({
    id: Date.now(),
    fechaFull: fechaHoy,
    hora: fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tipo,
    nombre,
    cliente,
    cantidad,
    fotoUrl,
    pagado: false
  });

  document.getElementById("formPlatoDia").reset();
  document.getElementById("previewFoto").classList.add("hidden");
  alert("Plato registrado correctamente.");
  renderAll();
}

function renderPlatosHoy() {
  const tbody = document.getElementById("tablaPlatosHoy");
  if (!tbody) return;
  const hoyStr = new Date().toISOString().split("T")[0];
  tbody.innerHTML = "";
  
  state.registroComidas.filter(c => c.fechaFull === hoyStr).forEach(item => {
    tbody.innerHTML += `
      <tr>
        <td><img src="${item.fotoUrl}" class="img-thumb" onclick="verFotoModal('${item.fotoUrl}')"/></td>
        <td>${item.tipo}</td>
        <td>${item.cliente}</td>
        <td><strong>${item.cantidad}</strong></td>
      </tr>
    `;
  });
}

function togglePagoComida(id) {
  const item = state.registroComidas.find(c => c.id === id);
  if (item) {
    item.pagado = !item.pagado;
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
          <td>${item.fechaFull} ${item.hora}</td>
          <td><img src="${item.fotoUrl}" class="img-thumb" onclick="verFotoModal('${item.fotoUrl}')"/></td>
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

// NÓMINA - CÁLCULO PRECISO Y CONTROL DE PAGO PAGADO/PENDIENTE
function guardarEmpleadoSubmit(e) {
  e.preventDefault();
  const idEdit = document.getElementById("editEmpId").value;
  const cedula = document.getElementById("cedulaEmpleado").value.trim();
  const nombre = document.getElementById("nombreEmpleado").value.trim();
  const cargo = document.getElementById("cargoEmpleado").value.trim();
  const sueldoMensual = parseFloat(document.getElementById("sueldoEmpleado").value);
  const banco = document.getElementById("bancoEmpleado").value.trim();
  const telefono = document.getElementById("telefonoEmpleado").value.trim();

  if (idEdit) {
    const emp = state.nomina.find(e => e.id === parseInt(idEdit));
    if (emp) {
      emp.cedula = cedula;
      emp.nombre = nombre;
      emp.cargo = cargo;
      emp.sueldoMensual = sueldoMensual;
      emp.banco = banco;
      emp.telefono = telefono;
      alert("Empleado actualizado.");
    }
  } else {
    if (state.nomina.some(e => e.cedula === cedula)) {
      alert("Cédula ya registrada.");
      return;
    }
    state.nomina.push({ id: Date.now(), cedula, nombre, cargo, sueldoMensual, banco, telefono });
    alert("Empleado registrado.");
  }

  resetFormEmpleado();
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

function eliminarEmpleado(id) {
  if (confirm("¿Desea eliminar a este trabajador de la nómina?")) {
    state.nomina = state.nomina.filter(e => e.id !== id);
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

function marcarAsistencia(fecha, cedula) {
  let registro = state.asistencias.find(a => a.fecha === fecha && a.cedula === cedula);
  if (registro) {
    registro.presente = !registro.presente;
  } else {
    state.asistencias.push({ fecha, cedula, presente: true });
  }
  renderAll();
}

function renderNominaSup() {
  const tbody = document.getElementById("tablaCalculoNomina");
  const filtroMes = document.getElementById("filtroMesNomina");
  const filtroQuin = document.getElementById("filtroQuincenaNomina");
  if (!tbody || !filtroMes || !filtroQuin) return;

  const mesSel = filtroMes.value; // Formato "YYYY-MM"
  const quincenaSel = filtroQuin.value;
  tbody.innerHTML = "";

  state.nomina.forEach(emp => {
    const pagoDia = emp.sueldoMensual / 30;

    // Conteo flexible de días asistidos en el periodo
    const asistenciasEmp = state.asistencias.filter(a => {
      if (!a.fecha || a.cedula !== emp.cedula || !a.presente) return false;
      
      const coincideMes = a.fecha.startsWith(mesSel);
      if (!coincideMes) return false;

      const dia = parseInt(a.fecha.split("-")[2], 10);
      if (quincenaSel === "Q1") return dia >= 1 && dia <= 15;
      if (quincenaSel === "Q2") return dia >= 16 && dia <= 31;
      return true; // MES COMPLETO
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
            <button class="btn btn-sm ${estaPagado ? 'btn-secondary' : 'btn-success'}" onclick="togglePagoNominaTrabajador('${clavePago}', ${totalUSD}, ${totalBS})">
              ${estaPagado ? 'Marcar Pendiente' : 'Marcar PAGADO'}
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

function togglePagoNominaTrabajador(clavePago, montoUSD, montoBS) {
  if (!state.pagosNomina[clavePago]) {
    state.pagosNomina[clavePago] = { pagado: true, fechaPago: new Date().toLocaleDateString(), montoUSD, montoBS };
    alert("Pago registrado correctamente como PAGADO.");
  } else {
    state.pagosNomina[clavePago].pagado = !state.pagosNomina[clavePago].pagado;
  }
  renderAll();
}

function copiarPagoMovil(strEncoded) {
  const texto = decodeURIComponent(strEncoded);
  navigator.clipboard.writeText(texto).then(() => {
    alert("¡Datos de Pago Móvil copiados al portapapeles!\n\n" + texto);
  }).catch(() => {
    alert("Error al copiar automáticamente.");
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
            ${asistio ? '✅ Asistió a Laborar' : '❌ Inasistencia / Ausente'}
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

// DASHBOARD
function renderDashboardSup() {
  const statComidas = document.getElementById("statComidasHoy");
  if (!statComidas) return;

  const hoyStr = new Date().toISOString().split("T")[0];
  const comidasHoy = state.registroComidas.filter(c => c.fechaFull === hoyStr);
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
        <p class="description" style="margin-bottom: 12px;">Atención Supervisor: Los siguientes productos requieren reposición urgente:</p>
      `;

      bajoStock.forEach(item => {
        alertsHTML += `
          <div class="alert-item">
            <span><strong>[${item.rubro}] ${item.producto}:</strong> Stock Actual: <strong>${item.stock} ${item.unidad || 'Unid'}</strong> (Mínimo: ${item.stockMin})</span>
            <button class="btn btn-sm btn-primary" onclick="irAInventario()"><i class="fas fa-arrow-right"></i> Ir a Reponer</button>
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

// OTROS
function crearNuevoPlato(e) {
  e.preventDefault();
  const nombre = document.getElementById("nombreNuevoPlato").value.trim();
  const precio = parseFloat(document.getElementById("precioNuevoPlato").value);

  if (nombre && !isNaN(precio)) {
    state.preciosPlatos[nombre] = precio;
    document.getElementById("formNuevoPlato").reset();
    alert(`Tipo de plato "${nombre}" creado.`);
    renderAll();
  }
}

function actualizarPrecio(cat) {
  const input = document.getElementById(`price_${cat}`);
  if (!input) return;
  const val = parseFloat(input.value);
  if (val >= 0) {
    state.preciosPlatos[cat] = val;
    alert(`Precio de ${cat} actualizado.`);
    renderAll();
  }
}

function eliminarTipoPlato(cat) {
  if (confirm(`¿Eliminar ${cat}?`)) {
    delete state.preciosPlatos[cat];
    renderAll();
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
        <td>
          <input type="number" step="0.1" value="${state.preciosPlatos[cat]}" id="price_${cat}" style="width: 80px;" />
        </td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="actualizarPrecio('${cat}')"><i class="fas fa-sync"></i></button>
          <button class="btn btn-sm btn-danger" onclick="eliminarTipoPlato('${cat}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  });
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

function cargarInventarioExcel(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
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
            if (!CATALOGO_PRODUCTOS_SUBDIVIDIDOS[rubro].includes(producto)) {
              CATALOGO_PRODUCTOS_SUBDIVIDIDOS[rubro].push(producto);
            }

            const exist = state.inventario.find(inv => inv.producto.toLowerCase() === producto.toLowerCase());
            if (exist) {
              exist.rubro = rubro;
              exist.unidad = unidad;
              exist.stock = stock;
              exist.stockMin = stockMin;
            } else {
              state.inventario.push({ id: Date.now() + i, rubro, producto, unidad, stock, stockMin });
            }
            cargados++;
          }
        }
      }
      alert(`Se cargaron ${cargados} productos.`);
      document.getElementById("inputExcelInventario").value = "";
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
      data.push([
        item.fechaFull,
        item.hora,
        item.cliente,
        item.tipo,
        item.nombre,
        item.cantidad,
        precio,
        precio * item.cantidad,
        item.pagado ? "PAGADO" : "PENDIENTE"
      ]);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Comidas_Cobros");
  const nombreArch = filtroCliente ? `Cobros_${filtroCliente.replace(/\s+/g, '_')}.xlsx` : "Cobros_Comidas_General.xlsx";
  XLSX.writeFile(wb, nombreArch);
}

function exportarNominaExcel() {
  const mesSel = document.getElementById("filtroMesNomina").value;
  const quincenaSel = document.getElementById("filtroQuincenaNomina").value;

  const data = [
    ["Reporte de Liquidacion de Nomina - El Sazón de Helem C.A."],
    [`Mes: ${mesSel}`, `Periodo: ${quincenaSel}`, `Tasa de Cambio: ${state.tasaCambio} Bs/$`],
    [],
    ["Cédula", "Empleado", "Cargo", "Banco", "Teléfono", "Sueldo Mensual (\$)", "Días Trabajados", "Total (\$)", "Monto Final (Bs)", "Estatus Pago"]
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

    const diasTrabajados = asistenciasEmp.length;
    const totalUSD = diasTrabajados * pagoDia;
    const totalBS = totalUSD * state.tasaCambio;
    const clave = `${mesSel}_${quincenaSel}_${emp.cedula}`;
    const est = state.pagosNomina[clave] && state.pagosNomina[clave].pagado ? "PAGADO" : "PENDIENTE";

    data.push([emp.cedula, emp.nombre, emp.cargo, emp.banco || 'N/A', emp.telefono || 'N/A', emp.sueldoMensual, diasTrabajados, totalUSD, totalBS, est]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Nomina_PagoMovil");
  XLSX.writeFile(wb, `Nomina_${mesSel}_${quincenaSel}_Sazon_Helem.xlsx`);
}