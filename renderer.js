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
    let metodoObj = document.getElementById("metodo-pago");
    if (metodoObj && metodoObj.value === "Efectivo") {
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

function mostrarProductos() {
  let contenedor = document.getElementById("productos");
  if (!contenedor) return;
  contenedor.innerHTML = "";
  
  productos.forEach((p, index) => {
    let div = document.createElement("div");
    div.className = "card";
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
  window.actualizarCambioManual();
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
};

// --- INTERRUPTOR DE CONFIGURACIÓN ---
window.toggleConfig = function() {
  let c = document.getElementById("config");
  let productosDiv = document.getElementById("productos");
  if (c.style.display === "none" || c.style.display === "") {
    c.style.display = "block";
    productosDiv.classList.add("modo-config");
  } else {
    c.style.display = "none";
    productosDiv.classList.remove("modo-config");
  }
};

// --- REPORTES E INTERFAZ (Originales) ---
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
