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
    let listaEliminar = document.getElementById("lista-eliminar");
    if (!contenedor) return;
    
    contenedor.innerHTML = "";
    if (listaEliminar) listaEliminar.innerHTML = "";

    productos.forEach((p, index) => {
        // Tarjeta para vender
        let div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `<strong>${p.nombre}</strong><img src="${p.imagen}"><span>$${p.precio.toLocaleString()}</span>`;
        div.onclick = () => agregarAlCarrito(index);
        contenedor.appendChild(div);

        // Item para eliminar en config
        if (listaEliminar) {
            let item = document.createElement("div");
            item.style = "display: flex; align-items: center; background: #f9f9f9; padding: 5px; border-radius: 5px; border: 1px solid #eee; gap: 5px;";
            item.innerHTML = `<img src="${p.imagen}" style="width: 25px; height: 25px; object-fit: cover; border-radius: 3px;">
                              <span style="flex: 1; font-size: 0.7em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.nombre}</span>
                              <button onclick="eliminarProductoMenu(${index})" style="background:red; color:white; border:none; border-radius:3px; padding: 4px 6px; font-size: 0.7em;">🗑️</button>`;
            listaEliminar.appendChild(item);
        }
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
    if (!lista) return;
    lista.innerHTML = "";
    carrito.forEach((p, index) => {
        let li = document.createElement("li");
        li.innerHTML = `<span>${p.cantidad} x $${p.precio.toLocaleString()}</span> 
                        <span>${p.nombre}</span> 
                        <button onclick="eliminarDelCarrito(${index})" style="color:red; border:none; background:none; font-weight:bold; cursor:pointer;">X</button>`;
        lista.appendChild(li);
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
    let ahora = new Date();
    let venta = {
        fecha: ahora.toLocaleDateString(),
        dia: ahora.getDate(), mes: ahora.getMonth() + 1, año: ahora.getFullYear(),
        hora: ahora.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        detalle: carrito.map(p => `${p.cantidad} ${p.nombre}`).join(" - "),
        total: total, metodo: metodoUsado
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
    document.getElementById("pago").value = "";
    document.getElementById("cambio").innerText = "0";
    actualizarCarrito();
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
    c.style.display = (c.style.display === "block") ? "none" : "block";
};

window.exportarCSV = function() {
    if (ventas.length === 0) return alert("No hay ventas");
    let csv = "\uFEFFFECHA,HORA,PRODUCTOS,TOTAL,METODO\n";
    ventas.forEach(v => { csv += `${v.fecha},${v.hora},"${v.detalle}",${v.total},${v.metodo}\n`; });
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Ventas.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

function actualizarTop() {
    let ahora = new Date();
    let hoyStr = ahora.toLocaleDateString();
    let mesAct = ahora.getMonth() + 1;
    let añoAct = ahora.getFullYear();
    let mesPas = ahora.getMonth();
    let añoPas = mesPas === 0 ? añoAct - 1 : añoAct;
    if (mesPas === 0) mesPas = 12;

    let tHoy = 0, tMes = 0, tPas = 0;
    ventas.forEach(v => {
        if (v.fecha === hoyStr) tHoy += v.total;
        if (v.mes === mesAct && v.año === añoAct) tMes += v.total;
        if (v.mes === mesPas && v.año === añoPas) tPas += v.total;
    });

    document.getElementById("reporte-hoy").innerText = "$" + tHoy.toLocaleString();
    document.getElementById("reporte-mes").innerText = "$" + tMes.toLocaleString();
    document.getElementById("reporte-mes-pasado").innerText = "$" + tPas.toLocaleString();

    let max = 0, pTop = "N/A";
    for (let p in contadorProductos) { if (contadorProductos[p] > max) { max = contadorProductos[p]; pTop = p; } }
    document.getElementById("top").innerText = `${pTop} (${max} uds)`;
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
    if (confirm("¿Borrar historial de ventas?")) {
        ventas = []; contadorProductos = {}; cantidades = {};
        localStorage.setItem("ventas", JSON.stringify(ventas));
        localStorage.setItem("contadorProductos", JSON.stringify(contadorProductos));
        localStorage.setItem("cantidades", JSON.stringify(cantidades));
        actualizarTop(); mostrarCantidades();
    }
};
