let productos = JSON.parse(localStorage.getItem("productos")) || [];
let carrito = [];
let total = 0;
let ventas = JSON.parse(localStorage.getItem("ventas")) || [];

window.onload = function () {
  mostrarProductos();
  mostrarHistorial();
  actualizarReporteHoy();
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
      <button class="btn-eliminar" onclick="event.stopPropagation(); eliminarProducto(${index})">Eliminar</button>
    `;
    div.onclick = () => agregarAlCarrito(index);
    contenedor.appendChild(div);
  });
}

window.agregarProducto = function() {
  const nombre = document.getElementById("nombre").value;
  const precio = parseFloat(document.getElementById("precio").value);
  const inputImagen = document.getElementById("imagen");

  if (!nombre || isNaN(precio) || inputImagen.files.length === 0) {
    alert("Faltan datos."); return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    productos.push({ nombre, precio, imagen: e.target.result });
    localStorage.setItem("productos", JSON.stringify(productos));
    mostrarProductos();
    toggleConfig();
    alert("Guardado!");
  };
  reader.readAsDataURL(inputImagen.files[0]);
};

window.eliminarProducto = function(index) {
  if (confirm("¿Borrar helado?")) {
    productos.splice(index, 1);
    localStorage.setItem("productos", JSON.stringify(productos));
    mostrarProductos();
  }
};

function agregarAlCarrito(index) {
  carrito.push(productos[index]);
  total += productos[index].precio;
  actualizarCarrito();
}

function actualizarCarrito() {
  let lista = document.getElementById("carrito");
  lista.innerHTML = "";
  carrito.forEach((p, i) => {
    let li = document.createElement("li");
    li.innerHTML = `${p.nombre} - $${p.precio} <button onclick="quitar(${i})">X</button>`;
    lista.appendChild(li);
  });
  document.getElementById("total").innerText = total.toLocaleString();
}

window.quitar = function(i) {
  total -= carrito[i].precio;
  carrito.splice(i, 1);
  actualizarCarrito();
};

window.pagoRapido = function(metodo) {
  let input = document.getElementById("pago");
  let sel = document.getElementById("metodo-pago");
  sel.value = metodo;
  if (metodo === 'Efectivo') {
    input.value = ""; input.readOnly = false; input.focus();
  } else {
    input.value = total; input.readOnly = true;
  }
};

window.procesarPago = function() {
  let pago = parseFloat(document.getElementById("pago").value) || 0;
  if (pago < total || total === 0) return alert("Pago insuficiente");

  ventas.push({
    fecha: new Date().toLocaleDateString(),
    total: total,
    metodo: document.getElementById("metodo-pago").value
  });

  localStorage.setItem("ventas", JSON.stringify(ventas));
  alert("Venta Exitosa. Cambio: $" + (pago - total));
  
  carrito = []; total = 0;
  actualizarCarrito();
  mostrarHistorial();
  actualizarReporteHoy();
  document.getElementById("pago").value = "";
};

window.exportarCSV = function() {
  let csv = "Fecha,Metodo,Total\n";
  ventas.forEach(v => csv += `${v.fecha},${v.metodo},${v.total}\n`);
  let blob = new Blob([csv], { type: 'text/csv' });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ventas.csv";
  link.click();
};

function mostrarHistorial() {
  let h = document.getElementById("historial");
  h.innerHTML = "";
  ventas.slice(-5).reverse().forEach(v => {
    let li = document.createElement("li");
    li.innerText = `${v.fecha} - ${v.metodo}: $${v.total}`;
    h.appendChild(li);
  });
}

function actualizarReporteHoy() {
  let hoy = new Date().toLocaleDateString();
  let suma = ventas.filter(v => v.fecha === hoy).reduce((s, v) => s + v.total, 0);
  document.getElementById("resultado-reporte").innerText = "$" + suma.toLocaleString();
}

window.toggleConfig = function() {
  let c = document.getElementById("config");
  let p = document.getElementById("productos");
  if (c.style.display === "block") {
    c.style.display = "none"; p.classList.remove("modo-config");
  } else {
    c.style.display = "block"; p.classList.add("modo-config");
  }
};
