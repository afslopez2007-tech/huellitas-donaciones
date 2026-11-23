// HUELLITAS DEL CAUCA - funciones del portal

const formulario = document.getElementById("formularioDonacion");
const lista = document.getElementById("listaDonaciones");
const buscar = document.getElementById("buscar");
const filtroTipo = document.getElementById("filtroTipo");
const filtroEstado = document.getElementById("filtroEstado");
const fotoInput = document.getElementById("foto");
const vistaPrevia = document.getElementById("vistaPrevia");
const mensaje = document.getElementById("mensaje");

let donaciones = [];
try {
  donaciones = JSON.parse(localStorage.getItem("huellitasDonaciones")) || [];
} catch (error) {
  donaciones = [];
}
let fotoSeleccionada = "";
let editandoId = null;

const necesidades = [
  { icono: "🍖", titulo: "Alimento", descripcion: "Concentrado para perros y gatos." },
  { icono: "💊", titulo: "Medicinas", descripcion: "Insumos y productos veterinarios." },
  { icono: "🧼", titulo: "Implementos de aseo", descripcion: "Jabón, desinfectante y elementos de limpieza." },
  { icono: "🛏️", titulo: "Muebles", descripcion: "Camas, cobijas y artículos para el refugio." }
];

// Muestra las necesidades del refugio.
function cargarCatalogo() {
  const catalogo = document.getElementById("catalogoNecesidades");
  catalogo.innerHTML = "";

  necesidades.forEach(function(item) {
    catalogo.innerHTML += `
      <section class="col-md-6 col-lg-3">
        <article class="need-card">
          <span>${item.icono}</span>
          <h3>${item.titulo}</h3>
          <p>${item.descripcion}</p>
        </article>
      </section>`;
  });
}

// Permite seleccionar y previsualizar una fotografía.
fotoInput.addEventListener("change", function() {
  const archivo = fotoInput.files[0];
  if (!archivo) return;

  if (!archivo.type.startsWith("image/")) {
    mostrarAviso("Selecciona una imagen válida.", "danger");
    fotoInput.value = "";
    return;
  }

  const lector = new FileReader();
  lector.onload = function(evento) {
    fotoSeleccionada = evento.target.result;
    vistaPrevia.src = fotoSeleccionada;
    vistaPrevia.classList.remove("d-none");
  };
  lector.readAsDataURL(archivo);
});

// Registra una nueva donación o guarda los cambios de una existente.
formulario.addEventListener("submit", function(evento) {
  evento.preventDefault();
  evento.stopPropagation();

  if (!formulario.checkValidity()) {
    formulario.classList.add("was-validated");
    return;
  }

  const donacion = {
    id: editandoId || Date.now().toString(),
    donante: document.getElementById("nombreDonante").value.trim(),
    tipoDonante: document.getElementById("tipoDonante").value,
    nombre: document.getElementById("nombreDonacion").value.trim(),
    tipo: document.getElementById("tipoDonacion").value,
    cantidad: Number(document.getElementById("cantidad").value),
    estado: document.getElementById("estado").value,
    foto: fotoSeleccionada,
    fecha: editandoId
      ? (donaciones.find(item => item.id === editandoId)?.fecha || new Date().toLocaleDateString())
      : new Date().toLocaleDateString()
  };

  if (editandoId) {
    donaciones = donaciones.map(item => item.id === editandoId ? donacion : item);
    mostrarAviso("La donación fue actualizada.", "success");
  } else {
    donaciones.unshift(donacion);
    mostrarAviso("La donación se registró correctamente.", "success");
  }

  guardar();
  mostrarDonaciones();
  limpiarFormulario();
});

// Guarda la información en el almacenamiento del navegador.
function guardar() {
  try {
    localStorage.setItem("huellitasDonaciones", JSON.stringify(donaciones));
    actualizarResumen();
  } catch (error) {
    mostrarAviso("No se pudo guardar. La fotografía puede ser demasiado grande.", "danger");
  }
}

// Actualiza los números que aparecen en la parte superior.
function actualizarResumen() {
  document.getElementById("totalDonaciones").textContent = donaciones.length;
  document.getElementById("totalAlimentos").textContent = donaciones.filter(item => item.tipo === "Alimento").length;
  document.getElementById("totalMedicinas").textContent = donaciones.filter(item => item.tipo === "Medicina").length;
  document.getElementById("totalEntregadas").textContent = donaciones.filter(item => item.estado === "Entregada").length;
}

// Presenta las donaciones y aplica la búsqueda y los filtros.
function mostrarDonaciones() {
  const texto = buscar.value.toLowerCase().trim();
  const tipo = filtroTipo.value;
  const estadoFiltro = filtroEstado.value;

  const filtradas = donaciones.filter(function(item) {
    const coincideTexto = item.nombre.toLowerCase().includes(texto) || item.donante.toLowerCase().includes(texto);
    return coincideTexto && (!tipo || item.tipo === tipo) && (!estadoFiltro || item.estado === estadoFiltro);
  });

  lista.innerHTML = "";
  document.getElementById("sinResultados").classList.toggle("d-none", filtradas.length !== 0);

  filtradas.forEach(function(item) {
    const columna = document.createElement("section");
    columna.className = "col-md-6 col-xl-4";

    const tarjeta = document.createElement("article");
    tarjeta.className = "donation-card";

    if (item.foto) {
      const imagen = document.createElement("img");
      imagen.className = "donation-photo";
      imagen.src = item.foto;
      imagen.alt = "Fotografía de " + item.nombre;
      tarjeta.appendChild(imagen);
    } else {
      const imagenVacia = document.createElement("section");
      imagenVacia.className = "donation-placeholder";
      imagenVacia.textContent = iconoTipo(item.tipo);
      tarjeta.appendChild(imagenVacia);
    }

    const cuerpo = document.createElement("section");
    cuerpo.className = "donation-body";

    const estado = document.createElement("span");
    estado.className = "status " + item.estado.toLowerCase();
    estado.textContent = item.estado;

    const titulo = document.createElement("h3");
    titulo.textContent = item.nombre;

    const detalle = document.createElement("p");
    detalle.className = "donation-meta";
    detalle.textContent = "Donante: " + item.donante + " · " + item.tipoDonante +
      " | Tipo: " + item.tipo + " | Cantidad: " + item.cantidad + " | Fecha: " + item.fecha;

    const acciones = document.createElement("section");
    acciones.className = "card-actions";

    const botonEditar = crearBoton("Editar", "btn btn-sm btn-outline-success", () => editarDonacion(item.id));
    const botonEstado = crearBoton(
      item.estado === "Entregada" ? "Marcar pendiente" : "Marcar entregada",
      "btn btn-sm btn-outline-primary",
      () => cambiarEstado(item.id)
    );
    const botonEliminar = crearBoton("Eliminar", "btn btn-sm btn-outline-danger", () => eliminarDonacion(item.id));

    acciones.append(botonEditar, botonEstado, botonEliminar);
    cuerpo.append(estado, titulo, detalle, acciones);
    tarjeta.appendChild(cuerpo);
    columna.appendChild(tarjeta);
    lista.appendChild(columna);
  });

  actualizarResumen();
}

// Crea botones y conecta la acción correspondiente.
function crearBoton(texto, clases, accion) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = clases;
  boton.textContent = texto;
  boton.addEventListener("click", accion);
  return boton;
}

// Devuelve un icono según la categoría de la donación.
function iconoTipo(tipo) {
  if (tipo === "Alimento") return "🍖";
  if (tipo === "Medicina") return "💊";
  if (tipo === "Implementos de aseo") return "🧼";
  if (tipo === "Muebles") return "🛏️";
  return "🎁";
}

// Carga los datos de una donación en el formulario para modificarlos.
function editarDonacion(id) {
  const donacion = donaciones.find(item => item.id === id);
  if (!donacion) return;

  editandoId = id;
  document.getElementById("nombreDonante").value = donacion.donante;
  document.getElementById("tipoDonante").value = donacion.tipoDonante;
  document.getElementById("nombreDonacion").value = donacion.nombre;
  document.getElementById("tipoDonacion").value = donacion.tipo;
  document.getElementById("cantidad").value = donacion.cantidad;
  document.getElementById("estado").value = donacion.estado;

  fotoSeleccionada = donacion.foto || "";
  if (fotoSeleccionada) {
    vistaPrevia.src = fotoSeleccionada;
    vistaPrevia.classList.remove("d-none");
  } else {
    vistaPrevia.classList.add("d-none");
  }

  document.getElementById("btnGuardar").textContent = "Guardar cambios";
  document.getElementById("btnCancelar").classList.remove("d-none");
  document.getElementById("registro").scrollIntoView({ behavior: "smooth" });
}

// Cambia el estado de una donación entre pendiente y entregada.
function cambiarEstado(id) {
  donaciones = donaciones.map(function(item) {
    if (item.id === id) {
      item.estado = item.estado === "Entregada" ? "Pendiente" : "Entregada";
    }
    return item;
  });
  guardar();
  mostrarDonaciones();
  mostrarAviso("Se actualizó el estado de la donación.", "success");
}

// Elimina un registro después de pedir confirmación.
function eliminarDonacion(id) {
  if (!confirm("¿Seguro que deseas eliminar este registro?")) return;

  donaciones = donaciones.filter(item => item.id !== id);
  if (editandoId === id) limpiarFormulario();

  guardar();
  mostrarDonaciones();
  mostrarAviso("El registro fue eliminado.", "warning");
}

// Deja el formulario listo para un nuevo registro.
function limpiarFormulario() {
  formulario.reset();
  formulario.classList.remove("was-validated");
  editandoId = null;
  fotoSeleccionada = "";
  vistaPrevia.src = "";
  vistaPrevia.classList.add("d-none");
  document.getElementById("btnGuardar").textContent = "Guardar donación";
  document.getElementById("btnCancelar").classList.add("d-none");
}

// Muestra un mensaje en pantalla y una notificación de Bootstrap.
function mostrarAviso(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = "alert alert-" + tipo + " mt-3";
  setTimeout(() => mensaje.classList.add("d-none"), 3500);

  document.getElementById("toastTexto").textContent = texto;
  if (window.bootstrap) {
    bootstrap.Toast.getOrCreateInstance(document.getElementById("toastAviso")).show();
  }
}

// Conecta los controles de la página con sus funciones.
document.getElementById("btnCancelar").addEventListener("click", limpiarFormulario);
document.getElementById("btnLimpiar").addEventListener("click", () => setTimeout(limpiarFormulario, 0));
buscar.addEventListener("input", mostrarDonaciones);
filtroTipo.addEventListener("change", mostrarDonaciones);
filtroEstado.addEventListener("change", mostrarDonaciones);

// Inicia el catálogo y carga los registros guardados.
cargarCatalogo();
mostrarDonaciones();
