let productos = JSON.parse(localStorage.getItem("productos")) || [];
let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
let cantidades = JSON.parse(localStorage.getItem("cantidades")) || {};
let carrito = [];
let total = 0;
let metodoSeleccionado = "Efectivo";

window.onload = function() {
    mostrarProductos();
    mostrarHistorial();
    mostrarCantidades();
    actualizarReporteHoy();
};

function mostrarProductos() {
    let contenedor = document.getElementById("productos");
    contenedor.innerHTML = "";
    productos.forEach((p, index) => {
        let div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
            <strong>${p.nombre}</strong>
            <img src="${p.imagen}">
            <span style="color:#e91e63; font-weight:bold;">$${p.precio.toLocaleString()}</span>
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
    reader.onload = function(e) {
        productos.push({ nombre, precio, imagen: e.target.result });
        localStorage.setItem("productos", JSON.stringify(productos));
        mostrarProductos();
        toggleConfig();
        alert("¡Guardado!");
    };
    reader.readAsDataURL(inputImagen.files[0]);
};

window.eliminarProducto = function(index) {
    if (confirm("¿Borrar este helado?")) {
        productos.splice(index, 1);
        localStorage.setItem("productos", JSON.stringify(productos));
        mostrarProductos();
    }
};

function agregarAlCarrito(index) {
    let p = productos[index];
    carrito.push(p);
    total += p.precio;
    actualizarCarrito();
}

function actualizarCarrito() {
    document.getElementById("total").innerText = total.toLocaleString();
    let lista = document.getElementById("carrito");
    lista.innerHTML = "";
    carrito.slice(-3).forEach((p, i) => {
        let li = document.createElement("li");
        li.innerHTML = `<span>${p.nombre}</span> <b>$${p.precio.toLocaleString()}</b>`;
        lista.appendChild(li);
    });
    actualizarCambioManual();
}

window.pagoRapido = function(metodo) {
    metodoSeleccionado = metodo;
    let inputPago = document.getElementById("pago");
    if (metodo === 'Efectivo') {
        inputPago.value = "";
        inputPago.readOnly = false;
        inputPago.focus();
    } else {
        inputPago.value = total;
        inputPago.readOnly = true;
    }
    actualizarCambioManual();
};

window.actualizarCambioManual = function() {
    let recibido = parseFloat(document.getElementById("pago").value) || 0;
    let elCambio = document.getElementById("cambio");
    if (recibido >= total) {
        elCambio.innerHTML = `<span style="color:green;">Cambio: $${(recibido - total).toLocaleString()}</span>`;
    } else {
        elCambio.innerHTML = `<span style="color:red;">Faltan: $${(total - recibido).toLocaleString()}</span>`;
    }
};

window.procesarPago = function() {
    let recibido = parseFloat(document.getElementById("pago").value) || 0;
    if (total === 0) return alert("Carrito vacío");
    if (recibido < total) return alert("Dinero insuficiente");

    let nombres = carrito.map(p => p.nombre).join(", ");
    let venta = {
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        detalle: nombres,
        total: total,
        metodo: metodoSeleccionado
    };

    ventas.push(venta);
    carrito.forEach(p => cantidades[p.nombre] = (cantidades[p.nombre] || 0) + 1);

    localStorage.setItem("ventas", JSON.stringify(ventas));
    localStorage.setItem("cantidades", JSON.stringify(cantidades));

    alert("Venta Exitosa. Cambio: $" + (recibido - total).toLocaleString());
    
    carrito = []; total = 0;
    actualizarCarrito();
    mostrarHistorial();
    mostrarCantidades();
    actualizarReporteHoy();
    document.getElementById("pago").value = "";
};

window.exportarCSV = function() {
    let csv = "\ufeffFecha,Hora,Detalle,Metodo,Total\n";
    ventas.forEach(v => csv += `${v.fecha},${v.hora},"${v.detalle}",${v.metodo},${v.total}\n`);
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Reporte_Ventas.csv";
    link.click();
};

function mostrarHistorial() {
    let h = document.getElementById("historial");
    h.innerHTML = "";
    ventas.slice(-5).reverse().forEach(v => {
        let li = document.createElement("li");
        li.innerText = `${v.hora} - ${v.metodo}: $${v.total.toLocaleString()}`;
        h.appendChild(li);
    });
}

function mostrarCantidades() {
    let c = document.getElementById("cantidades");
    c.innerHTML = "";
    for (let p in cantidades) {
        let li = document.createElement("li");
        li.innerText = `${p}: ${cantidades[p]} uds`;
        c.appendChild(li);
    }
}

function actualizarReporteHoy() {
    let hoy = new Date().toLocaleDateString();
    let suma = ventas.filter(v => v.fecha === hoy).reduce((s, v) => s + v.total, 0);
    document.getElementById("reporte-hoy").innerText = "$" + suma.toLocaleString();
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

window.limpiarHistorial = function() {
    if(confirm("¿Borrar historial?")) {
        ventas = []; cantidades = {};
        localStorage.setItem("ventas", "[]");
        localStorage.setItem("cantidades", "{}");
        location.reload();
    }
};
