let productos = [];
let carrito = [];
let total = 0;
let contadorProductos = {};
let cantidades = {};
let ventas = []; 

window.onload = function () {
  productos = JSON.parse(localStorage.getItem("productos")) || [];
  contadorProductos = JSON.parse(localStorage.getItem("contadorProductos")) || {};
  cantidades = JSON.parse(localStorage.getItem("cantidades")) || {};
  ventas = JSON.parse(localStorage.getItem("ventas")) || [];

  mostrarProductos();
  mostrarHistorial();
  actualizarTop();
  mostrarCantidades();
  
  document.body.onclick = function() {
    let inputPago = document.getElementById("pago");
    let metodo = document.getElementById("metodo-pago") ? document.getElementById("metodo-pago").value : "Efectivo";
    if (metodo === "Efectivo" && inputPago) {
        inputPago.readOnly = false;
        inputPago.disabled = false;
    }
  };
};

// --- GESTIÓN DE PRODUCTOS ---
window.agregarProducto = function() {
  const nombre = document.getElementById("nombre").value;
  const precio = parseFloat(document.getElementById("precio").value);
  const inputImagen = document.getElementById("imagen");

  if (!nombre || isNaN(precio) || inputImagen.files.length === 0) {
    alert("Faltan datos.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const MAX_WIDTH = 300;
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const fotoLiviana = canvas.toDataURL('image/jpeg', 0.7);

      try {
        productos.push({ nombre, precio, imagen: fotoLiviana });
        localStorage.setItem("productos", JSON.stringify(productos));
        mostrarProductos();
        document.getElementById("nombre").value = "";
        document.getElementById("precio").value = "";
        document.getElementById("imagen").value = "";
        alert("¡" + nombre + " guardado con éxito!");
      } catch (error) {
        alert("⚠️ Error de memoria: La imagen es muy grande.");
      }
    };
  };
  reader.readAsDataURL(inputImagen.files[0]);
};

// --- ✨ MOSTRAR PRODUCTOS (ORDEN Y BOTÓN) ✨ ---
function mostrarProductos() {
  let contenedor = document.getElementById("productos");
  if (!contenedor) return;
  contenedor.innerHTML = "";
  
  productos.forEach((p, index) => {
    let div = document.createElement("div");
    div.className = "card";
    // Ordenamos: Nombre arriba, Imagen centro, Precio abajo
    // El botón tiene la clase "btn-eliminar" para que tu CSS lo oculte/muestre
    div.innerHTML = `
      <strong>${p.nombre}</strong>
      <img src="${p.imagen}">
      <span>$${p.precio.toLocaleString()}</span>
      <button class="btn-eliminar" onclick="event.stopPropagation(); window.eliminarProducto(${index})">Eliminar</button>
    `;
    div.onclick = () => agregarAlCarrito(index);
    contenedor.appendChild(div);
  });
}

window.eliminarProducto = function(index) {
  if (confirm("¿Seguro que quieres borrar este helado?")) {
    productos.splice(index, 1);
    localStorage.setItem("productos", JSON.stringify(productos));
    mostrarProductos();
  }
};

// --- CARRITO ---
function agregarAlCarrito(index) {
  let p = productos[index];
  carrito.push(p);
  total += p.precio;
  actualizarCarrito();
}

function actualizarCarrito() {
  let lista = document.getElementById("carrito");
  if (!lista) return;
  lista.innerHTML = "";
  carrito.forEach((p, index) => {
    let item = document.createElement("li");
    item.innerHTML = `<strong>${p.nombre}</strong> <button onclick="eliminarDelCarrito(${index})">❌</button>`;
    lista.appendChild(item);
  });
  document.getElementById("total").innerText = total.toLocaleString();
  if(window.actualizarCambioManual) window.actualizarCambioManual();
}

function eliminarDelCarrito(index) {
  total -= carrito[index].precio;
  carrito.splice(index, 1);
  actualizarCarrito();
}

// --- CALCULADORA ---
window.actualizarCambioManual = function() {
  let inputPago = document.getElementById("pago");
  let elCambio = document.getElementById("cambio");
  if(!inputPago || !elCambio) return;
  let valorRecibido = parseFloat(inputPago.value) || 0;

  if (valorRecibido >= total && total > 0) {
    let cambio = valorRecibido - total;
    elCambio.innerHTML = `<span style="color:green; font-weight:bold;">Cambio: $${cambio.toLocaleString()}</span>`;
  } else {
    elCambio.innerHTML = `<span style="color:red;">Falta: $${(total - valorRecibido).toLocaleString()}</span>`;
  }
};

window.pagoRapido = function(valor) {
  let inputPago = document.getElementById("pago");
  let selectorMetodo = document.getElementById("metodo-pago");
  if(!inputPago || !selectorMetodo) return;
  
  inputPago.disabled = false;
  inputPago.readOnly = false;
  inputPago.style.backgroundColor = "white";

  if (valor === 'Nequi' || valor === 'Daviplata') {
    selectorMetodo.value = valor;
    inputPago.value = total; 
    inputPago.readOnly = true; 
    inputPago.style.backgroundColor = "#f0f0f0";
  } else if (valor === 'Efectivo') {
    selectorMetodo.value = "Efectivo";
    inputPago.value = ""; 
    inputPago.focus();
  } else {
    selectorMetodo.value = "Efectivo";
    inputPago.value = valor;
  }
  window.actualizarCambioManual();
};

window.procesarPago = function() {
  if (carrito.length === 0) return;
  let inputPago = document.getElementById("pago");
  let valorPagado = parseFloat(inputPago.value) || 0;
  if (valorPagado < total) return;

  let nombresProductos = carrito.map(p => p.nombre).join(", ");

  ventas.push({
    id: Date.now(),
    fecha: new Date().toLocaleDateString(),
    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    productosDetalle: nombresProductos,
    total: total,
    pago: valorPagado,
    cambio: valorPagado - total,
    metodo: document.getElementById("metodo-pago").value
  });

  carrito.forEach(p => {
    contadorProductos[p.nombre] = (contadorProductos[p.nombre] || 0) + 1;
    cantidades[p.nombre] = (cantidades[p.nombre] || 0) + 1;
  });

  localStorage.setItem("ventas", JSON.stringify(ventas));
  localStorage.setItem("contadorProductos", JSON.stringify(contadorProductos));
  localStorage.setItem("cantidades", JSON.stringify(cantidades));

  const cambioFinal = valorPagado - total;
  carrito = [];
  total = 0;
  actualizarCarrito();
  actualizarTop();
  mostrarCantidades();
  mostrarHistorial();
  
  inputPago.value = "";
  inputPago.readOnly = false;
  document.getElementById("metodo-pago").value = "Efectivo";
  document.getElementById("cambio").innerText = "Venta Exitosa. Cambio: $" + cambioFinal.toLocaleString();
  
  setTimeout(() => inputPago.focus(), 50);
};

// --- REPORTES Y EXCEL ---
window.verReporte = function(periodo) {
    const ahora = new Date();
    let totalFiltrado = 0;
    let cantidadVentas = 0;

    ventas.forEach(v => {
        const partes = v.fecha.split('/');
        const fechaVenta = new Date(partes[2], partes[1] - 1, partes[0]);
        let coincide = false;

        if (periodo === 'hoy') coincide = fechaVenta.toDateString() === ahora.toDateString();
        else if (periodo === 'mes') coincide = (fechaVenta.getMonth() === ahora.getMonth() && fechaVenta.getFullYear() === ahora.getFullYear());
        else if (periodo === 'pasado') {
            let m = ahora.getMonth() - 1; let a = ahora.getFullYear();
            if (m < 0) { m = 11; a--; }
            coincide = (fechaVenta.getMonth() === m && fechaVenta.getFullYear() === a);
        }
        if (coincide) { totalFiltrado += v.total; cantidadVentas++; }
    });
    let res = document.getElementById("resultado-reporte");
    if(res) res.innerHTML = `Vendido ${periodo}: $${totalFiltrado.toLocaleString()} (${cantidadVentas} ventas)`;
};

window.limpiarHistorial = function() {
    if (confirm("¿Borrar todas las ventas? (Los productos no se borran)")) {
        ventas = [];
        contadorProductos = {};
        cantidades = {};
        localStorage.setItem("ventas", JSON.stringify(ventas));
        localStorage.setItem("contadorProductos", JSON.stringify(contadorProductos));
        localStorage.setItem("cantidades", JSON.stringify(cantidades));
        location.reload();
    }
};

window.exportarCSV = function() {
  if (ventas.length === 0) return alert("No hay ventas.");
  let csv = "\ufeffFecha;Hora;Detalle de Productos;Método;Total;Pago;Cambio\n";
  ventas.forEach(v => {
    let detalle = v.productosDetalle || "Venta anterior";
    csv += `${v.fecha};${v.hora};${detalle};${v.metodo};$${v.total};$${v.pago};$${v.cambio}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Reporte_Ventas.csv`);
  link.click();
};

// --- INTERFAZ ---
function actualizarTop() {
  let top = "Ninguno"; let max = 0;
  for (let p in contadorProductos) {
    if (contadorProductos[p] > max) { max = contadorProductos[p]; top = p; }
  }
  let elTop = document.getElementById("top");
  if(elTop) elTop.innerText = top;
}

function mostrarCantidades() {
  let lista = document.getElementById("cantidades");
  if(!lista) return;
  lista.innerHTML = "";
  for (let p in cantidades) {
    let item = document.createElement("li");
    item.innerText = `${p}: ${cantidades[p]} uds`;
    lista.appendChild(item);
  }
}

function mostrarHistorial() {
  let lista = document.getElementById("historial");
  if(!lista) return;
  lista.innerHTML = "";
  [...ventas].reverse().slice(0, 5).forEach(v => {
    let item = document.createElement("li");
    item.innerHTML = `<strong>${v.hora}</strong> - $${v.total.toLocaleString()} (${v.metodo})`;
    lista.appendChild(item);
  });
}

// --- ✨ INTERRUPTOR DE CONFIGURACIÓN ✨ ---
// Esta función ahora es la ÚNICA que controla la visibilidad
window.toggleConfig = function() {
  let c = document.getElementById("config");
  let productosDiv = document.getElementById("productos");
  
  if (!c || !productosDiv) return;

  if (c.style.display === "none" || c.style.display === "") {
    c.style.display = "block";
    productosDiv.classList.add("modo-config"); // ESTO muestra los botones rojos
  } else {
    c.style.display = "none";
    productosDiv.classList.remove("modo-config"); // ESTO los esconde
  }
};
