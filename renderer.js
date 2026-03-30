// =====================
// VARIABLES GLOBALES
// =====================
let productos = [];
let carrito = [];
let total = 0;
let contadorProductos = {};
let cantidades = {};

// =====================
// CARGAR DATOS
// =====================
window.onload = function () {
  let datosProductos = localStorage.getItem("productos");
  let datosContador = localStorage.getItem("contadorProductos");
  let datosCantidades = localStorage.getItem("cantidades");

  if (datosProductos) {
    productos = JSON.parse(datosProductos);
    mostrarProductos();
  }

  if (datosContador) {
    contadorProductos = JSON.parse(datosContador);
    actualizarTop();
  }

  if (datosCantidades) {
    cantidades = JSON.parse(datosCantidades);
    mostrarCantidades();
  }
};

// =====================
// AGREGAR PRODUCTO
// =====================
window.agregarProducto = function() {
  let nombre = document.getElementById("nombre").value;
  let precio = parseFloat(document.getElementById("precio").value);
  let inputImagen = document.getElementById("imagen");

  if (!nombre || isNaN(precio) || inputImagen.files.length === 0) {
    alert("Completa todos los campos");
    return;
  }

  let reader = new FileReader();
  reader.onload = function (e) {
    let producto = {
      nombre,
      precio,
      imagen: e.target.result
    };

    productos.push(producto);
    localStorage.setItem("productos", JSON.stringify(productos));

    mostrarProductos();

    document.getElementById("nombre").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("imagen").value = "";
    alert("Producto guardado");
  };

  reader.readAsDataURL(inputImagen.files[0]);
}

// =====================
// MOSTRAR PRODUCTOS (MOSAICO AJUSTADO)
// =====================
function mostrarProductos() {
  let contenedor = document.getElementById("productos");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  productos.forEach((p, index) => {
    let div = document.createElement("div");
    div.className = "card";

    // Orden: Nombre -> Imagen -> Precio -> Botón Eliminar (oculto por CSS fuera de config)
    div.innerHTML = `
      <strong>${p.nombre}</strong>
      <img src="${p.imagen}" class="img-producto">
      <span>$${p.precio.toLocaleString()}</span>
      <button class="btn-eliminar" onclick="event.stopPropagation(); window.eliminarProductoPermanente(${index})">Eliminar</button>
    `;

    div.onclick = () => agregarAlCarrito(index);
    contenedor.appendChild(div);
  });
}

// Nueva función para borrar productos del menú (Configuración)
window.eliminarProductoPermanente = function(index) {
  if (confirm("¿Seguro que quieres borrar este helado del menú?")) {
    productos.splice(index, 1);
    localStorage.setItem("productos", JSON.stringify(productos));
    mostrarProductos();
  }
};

// =====================
// AGREGAR AL CARRITO
// =====================
function agregarAlCarrito(index) {
  let producto = productos[index];
  carrito.push(producto);
  total += producto.precio;
  actualizarCarrito();
}

// =====================
// ACTUALIZAR CARRITO
// =====================
function actualizarCarrito() {
  let lista = document.getElementById("carrito");
  if (!lista) return;
  lista.innerHTML = "";

  carrito.forEach((p, index) => {
    let item = document.createElement("li");
    item.innerHTML = `
      ${p.nombre} - $${p.precio.toLocaleString()}
      <button onclick="eliminarDelCarrito(${index})">❌</button>
    `;
    lista.appendChild(item);
  });

  document.getElementById("total").innerText = total.toLocaleString();
  actualizarCambio(); // Actualiza el cálculo si hay un valor en el input
}

// =====================
// ELIMINAR DEL CARRITO
// =====================
window.eliminarDelCarrito = function(index) {
  total -= carrito[index].precio;
  carrito.splice(index, 1);
  actualizarCarrito();
}

// =====================
// LÓGICA DE PAGO Y CAMBIO
// =====================
window.actualizarCambio = function() {
  let inputPago = document.getElementById("pago");
  let cambioTexto = document.getElementById("cambio");
  let pagoRecibido = parseFloat(inputPago.value) || 0;

  if (pagoRecibido >= total && total > 0) {
    cambioTexto.innerText = (pagoRecibido - total).toLocaleString();
    cambioTexto.style.color = "green";
  } else {
    cambioTexto.innerText = "0";
    cambioTexto.style.color = "red";
  }
};

// =====================
// PROCESAR PAGO
// =====================
window.procesarPago = function() {
  if (carrito.length === 0) {
    alert("No hay productos");
    return;
  }

  let pago = parseFloat(document.getElementById("pago").value);

  if (isNaN(pago) || pago < total) {
    alert("Pago insuficiente");
    return;
  }

  // Aquí puedes agregar la lógica para guardar en el historial/Excel si lo deseas
  
  carrito.forEach(p => {
    contadorProductos[p.nombre] = (contadorProductos[p.nombre] || 0) + 1;
    cantidades[p.nombre] = (cantidades[p.nombre] || 0) + 1;
  });

  localStorage.setItem("contadorProductos", JSON.stringify(contadorProductos));
  localStorage.setItem("cantidades", JSON.stringify(cantidades));

  actualizarTop();
  mostrarCantidades();

  alert("¡Venta Exitosa!");

  carrito = [];
  total = 0;
  actualizarCarrito();
  document.getElementById("pago").value = "";
  document.getElementById("pago").readOnly = false;
  document.getElementById("cambio").innerText = "0";
}

// =====================
// MÁS VENDIDO
// =====================
function actualizarTop() {
  let top = "";
  let max = 0;

  for (let p in contadorProductos) {
    if (contadorProductos[p] > max) {
      max = contadorProductos[p];
      top = p;
    }
  }

  let elTop = document.getElementById("top");
  if(elTop) elTop.innerText = top ? `${top} (${max})` : "Sin ventas";
}

// =====================
// CANTIDADES
// =====================
function mostrarCantidades() {
  let lista = document.getElementById("cantidades");
  if(!lista) return;
  lista.innerHTML = "";

  for (let p in cantidades) {
    let li = document.createElement("li");
    li.innerText = `${p}: ${cantidades[p]}`;
    lista.appendChild(li);
  }
}

// =====================
// CONFIGURACIÓN (CON MODO ELIMINAR)
// =====================
window.toggleConfig = function() {
  let config = document.getElementById("config");
  let contenedorProductos = document.getElementById("productos");
  
  if (config.style.display === "none" || config.style.display === "") {
    config.style.display = "block";
    contenedorProductos.classList.add("modo-config"); // Activa botones rojos
  } else {
    config.style.display = "none";
    contenedorProductos.classList.remove("modo-config"); // Oculta botones rojos
  }
}

// =====================
// PAGOS RÁPIDOS MEJORADOS
// =====================
window.pagoRapido = function(metodo) {
  let inputPago = document.getElementById("pago");
  
  if (metodo === 'Nequi' || metodo === 'Daviplata') {
    inputPago.value = total; // Pone el total automático
    inputPago.readOnly = true; // No deja editar para evitar errores
  } else if (metodo === 'Efectivo') {
    inputPago.value = ""; // Limpia para escribir el billete
    inputPago.readOnly = false;
    inputPago.focus();
  } else {
    inputPago.value = metodo; // Para botones de valores fijos (2000, 5000, etc)
    inputPago.readOnly = false;
  }
  actualizarCambio();
}
