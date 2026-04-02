let productos = JSON.parse(localStorage.getItem("productos")) || [];
let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
let contadorProductos = JSON.parse(localStorage.getItem("contadorProductos")) || {};
let cantidades = JSON.parse(localStorage.getItem("cantidades")) || {};
let carrito = [];
let total = 0;

window.onload = function() {
    mostrarProductos();
    actualizarTop();
    mostrarCantidades();
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
            <span>$${p.precio.toLocaleString()}</span>
            <button class="btn-eliminar" onclick="event.stopPropagation(); eliminarProductoMenu(${index})">Eliminar</button>
        `;
        div.onclick = () => agregarAlCarrito(index);
        contenedor.appendChild(div);
    });
}

function agregarAlCarrito(index) {
    let p = productos[index];
    let item = carrito.find(i => i.nombre === p.nombre);
    if (item) { item.cantidad++; } 
    else { carrito.push({ ...p, cantidad: 1 }); }
    total += p.precio;
    actualizarCarrito();
}

function actualizarCarrito() {
    let lista = document.getElementById("carrito");
    lista.innerHTML = "";
    carrito.forEach((p, index) => {
        let li = document.createElement("li");
        li.innerHTML = `<span>${p.cantidad} x $${p.precio.toLocaleString()}</span> 
                <span>${p.nombre}</span> 
                <button onclick="eliminarDelCarrito(${index})" style="color:red; border:none; background:none; font-weight:bold; cursor:pointer;">X</button>`;
    });
    document.getElementById("total").innerText = total.toLocaleString();
    actualizarCambio();
}

window.eliminarDelCarrito = function(index) {
    total -= carrito[index].precio;
    if (carrito[index].cantidad > 1) { carrito[index].cantidad--; } 
    else { carrito.splice(index, 1); }
    actualizarCarrito();
}

window.actualizarCambio = function() {
    let pago = parseFloat(document.getElementById("pago").value) || 0;
    let cambio = pago >= total ? pago - total : 0;
    document.getElementById("cambio").innerText = cambio.toLocaleString();
};

window.pagoRapido = function(metodo) {
    let input = document.getElementById("pago");
    // Guardamos el método en un atributo temporal para el Excel
    input.dataset.metodo = metodo; 
    if (metodo === 'Efectivo') { input.value = ""; input.readOnly = false; input.focus(); } 
    else { input.value = total; input.readOnly = true; }
    actualizarCambio();
};

window.procesarPago = function() {
    if (total === 0) return;
    let pago = parseFloat(document.getElementById("pago").value) || 0;
    if (pago < total) return alert("Pago insuficiente");

    let metodoUsado = document.getElementById("pago").dataset.metodo || "Efectivo";
    let fechaActual = new Date();

    let venta = {
        fecha: fechaActual.toLocaleDateString(),
        dia: fechaActual.getDate(),
        mes: fechaActual.getMonth() + 1,
        año: fechaActual.getFullYear(),
        hora: fechaActual.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        detalle: carrito.map(p => `${p.cantidad} ${p.nombre}`).join(" - "),
        total: total,
        metodo: metodoUsado
document.getElementById("pago").value = "";
document.getElementById("cambio").innerText = "0";
    };
    
    ventas.push(venta);
    carrito.forEach(p => {
        contadorProductos[p.nombre] = (contadorProductos[p.nombre] || 0) + p.cantidad;
        cantidades[p.nombre] = (cantidades[p.nombre] || 0) + p.cantidad;
    });

    localStorage.setItem("ventas", JSON.stringify(ventas));
    localStorage.setItem("contadorProductos", JSON.stringify(contadorProductos));
    localStorage.setItem("cantidades", JSON.stringify(cantidades));

    alert("¡Venta exitosa!");
    carrito = []; total = 0;
    actualizarCarrito();
    document.getElementById("pago").value = "";
    document.getElementById("pago").dataset.metodo = "";
    actualizarTop();
    mostrarCantidades();
};

window.agregarProducto = function() {
    let nombre = document.getElementById("nombre").value;
    let precio = parseFloat(document.getElementById("precio").value);
    let img = document.getElementById("imagen").files[0];
    if (!nombre || !precio || !img) return alert("Faltan datos");

    let reader = new FileReader();
    reader.onload = function(e) {
        productos.push({ nombre, precio, imagen: e.target.result });
        localStorage.setItem("productos", JSON.stringify(productos));
        mostrarProductos();
        toggleConfig();
    };
    reader.readAsDataURL(img);
};

window.eliminarProductoMenu = function(index) {
    if(confirm("¿Borrar helado del menú?")) {
        productos.splice(index, 1);
        localStorage.setItem("productos", JSON.stringify(productos));
        mostrarProductos();
    }
};

window.toggleConfig = function() {
    let c = document.getElementById("config");
    let p = document.getElementById("productos");
    if (c.style.display === "block") { c.style.display = "none"; p.classList.remove("modo-config"); } 
    else { c.style.display = "block"; p.classList.add("modo-config"); }
};

// =====================
// FUNCIONES DE REPORTES (AGREGADAS)
// =====================

window.exportarCSV = function() {
    if (ventas.length === 0) return alert("No hay ventas");
    
    let csv = "\uFEFFFECHA,DIA,MES,AÑO,HORA,PRODUCTOS,TOTAL,METODO\n";
    ventas.forEach(v => {
        csv += `${v.fecha},${v.dia || ''},${v.mes || ''},${v.año || ''},${v.hora},"${v.detalle}",${v.total},${v.metodo || 'Efectivo'}\n`;
    });

    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Reporte_Ventas.csv");
    document.body.appendChild(link); // Lo añadimos al cuerpo para que el cel lo vea
    link.click();
    document.body.removeChild(link); // Lo borramos después de usarlo
};

function actualizarTop() {
    let topElement = document.getElementById("top");
    if (!topElement) return;
    let max = 0;
    let productoTop = "N/A";
    for (let p in contadorProductos) {
        if (contadorProductos[p] > max) {
            max = contadorProductos[p];
            productoTop = p;
        }
    }
    topElement.innerText = `${productoTop} (${max} unidades)`;
    
    // Total ventas hoy
    let hoy = new Date().toLocaleDateString();
    let totalHoy = ventas.filter(v => v.fecha === hoy).reduce((sum, v) => sum + v.total, 0);
    document.getElementById("reporte-hoy").innerText = "$" + totalHoy.toLocaleString();
}

function mostrarCantidades() {
    let lista = document.getElementById("cantidades");
    if (!lista) return;
    lista.innerHTML = "";
    for (let p in cantidades) {
        let li = document.createElement("li");
        li.innerText = `${p}: ${cantidades[p]} vendidos`;
        lista.appendChild(li);
    }
}

window.limpiarHistorial = function() {
    if (confirm("¿Seguro que quieres borrar TODAS las ventas? Esto no se puede deshacer.")) {
        ventas = [];
        contadorProductos = {};
        cantidades = {};
        localStorage.setItem("ventas", JSON.stringify(ventas));
        localStorage.setItem("contadorProductos", JSON.stringify(contadorProductos));
        localStorage.setItem("cantidades", JSON.stringify(cantidades));
        actualizarTop();
        mostrarCantidades();
        alert("Historial borrado");
    }
};
