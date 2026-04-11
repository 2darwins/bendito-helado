let productos = JSON.parse(localStorage.getItem("productos")) || [];
let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
let clientes = JSON.parse(localStorage.getItem("clientes")) || {};
let contadorProductos = JSON.parse(localStorage.getItem("contadorProductos")) || {};
let cantidades = JSON.parse(localStorage.getItem("cantidades")) || {};
// NUEVA VARIABLE PARA RECIBOS CONSECUTIVOS
let proximoRecibo = JSON.parse(localStorage.getItem("proximoRecibo")) || 1; 

let carrito = [];
let total = 0;

window.onload = function() {
    mostrarProductos();
    actualizarTop();
};

function mostrarProductos() {
    let contenedor = document.getElementById("productos");
    let listaEliminar = document.getElementById("lista-eliminar");
    if (!contenedor) return;
    contenedor.innerHTML = "";
    if (listaEliminar) listaEliminar.innerHTML = "";

    productos.forEach((p, index) => {
        let div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `<strong>${p.nombre}</strong><img src="${p.imagen}"><span>$${p.precio.toLocaleString()}</span>`;
        div.onclick = () => agregarAlCarrito(index);
        contenedor.appendChild(div);

        if (listaEliminar) {
            let item = document.createElement("div");
            item.style = "display: flex; align-items: center; background: #f9f9f9; padding: 5px; border-radius: 5px; border: 1px solid #eee; gap: 5px;";
            item.innerHTML = `<span style="flex: 1; font-size: 0.7em;">${p.nombre}</span>
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
    lista.innerHTML = "";
    carrito.forEach((p, index) => {
        let li = document.createElement("li");
        li.innerHTML = `<span>${p.cantidad} x $${p.precio.toLocaleString()}</span> <span>${p.nombre}</span> <button onclick="eliminarDelCarrito(${index})" style="color:red; border:none; background:none;">X</button>`;
        lista.appendChild(li);
    });
    document.getElementById("total").innerText = total.toLocaleString();
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
    input.value = (metodo === 'Efectivo') ? "" : total;
    actualizarCambio();
};

window.buscarCliente = function() {
    let ced = document.getElementById("cliente-cedula").value;
    let extra = document.getElementById("datos-cliente-extra");
    if (clientes[ced]) {
        document.getElementById("cliente-nombre").value = clientes[ced].nombre;
        document.getElementById("cliente-correo").value = clientes[ced].correo;
        extra.style.display = "flex";
    } else {
        extra.style.display = (ced.length > 3) ? "flex" : "none";
    }
};

window.registrarCliente = function() {
    let ced = document.getElementById("cliente-cedula").value;
    let nom = document.getElementById("cliente-nombre").value;
    let cor = document.getElementById("cliente-correo").value;
    if (!ced || !nom || !cor) return alert("Datos incompletos");
    clientes[ced] = { nombre: nom, correo: cor };
    localStorage.setItem("clientes", JSON.stringify(clientes));
    alert("Cliente registrado ✅");
};

function enviarFacturaEmail(venta, cliente, itemsCarrito) {
    let detalleTxt = itemsCarrito.map(p => `${p.nombre}\n${p.cantidad}x$${p.precio.toLocaleString()} $${(p.cantidad * p.precio).toLocaleString()}`).join("\n\n");
    let asunto = encodeURIComponent(`Recibo Bendito Helado - ${venta.recibo}`);
    let cuerpo = encodeURIComponent(`"Mira Helado positivo a las cosas" 🤙

Bendito Helado 🤤🍦
Cr 2 # 13-75
Cota Cundinamarca

Fecha: ${venta.fecha} ${venta.hora}
Número de recibo: ${venta.recibo}
Caja registradora: EP-VNBI

---------------------------
${detalleTxt}
---------------------------

Total
$${venta.total.toLocaleString()}

Gracias por su compra! 🤗`);
    window.location.href = `mailto:${cliente.correo}?subject=${asunto}&body=${cuerpo}`;
}

window.procesarPago = function() {
    if (total === 0) return;
    let pagoVal = parseFloat(document.getElementById("pago").value) || 0;
    if (pagoVal < total) return alert("Pago insuficiente");

    let ahora = new Date();
    // CAMBIO A FORMATO BH-01, BH-02...
    let numRecibo = "BH-" + String(proximoRecibo).padStart(2, '0');
    
    let venta = {
        fecha: ahora.toLocaleDateString(),
        año: ahora.getFullYear(), // Agregado para el Excel
        mes: ahora.getMonth() + 1,
        hora: ahora.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        detalle: carrito.map(p => `${p.cantidad} ${p.nombre}`).join(", "),
        total: total, 
        recibo: numRecibo, 
        metodo: document.getElementById("pago").dataset.metodo || "Efectivo"
    };

    ventas.push(venta);
    
    // Incrementar y guardar contador de recibos
    proximoRecibo++;
    localStorage.setItem("proximoRecibo", JSON.stringify(proximoRecibo));

    carrito.forEach(p => { 
        contadorProductos[p.nombre] = (contadorProductos[p.nombre] || 0) + p.cantidad;
        cantidades[p.nombre] = (cantidades[p.nombre] || 0) + p.cantidad;
    });

    localStorage.setItem("ventas", JSON.stringify(ventas));
    localStorage.setItem("contadorProductos", JSON.stringify(contadorProductos));
    localStorage.setItem("cantidades", JSON.stringify(cantidades));

    let ced = document.getElementById("cliente-cedula").value;
    if (ced && clientes[ced]) {
        if (confirm("¿Enviar factura por correo?")) {
            enviarFacturaEmail(venta, clientes[ced], carrito);
        }
    }

    alert("Venta Exitosa ✅");
    carrito = []; total = 0;
    document.getElementById("pago").value = "";
    document.getElementById("cliente-cedula").value = "";
    document.getElementById("datos-cliente-extra").style.display = "none";
    actualizarCarrito();
    actualizarTop();
};

window.agregarProducto = function() {
    let nom = document.getElementById("nombre").value;
    let pre = parseFloat(document.getElementById("precio").value);
    let img = document.getElementById("imagen").files[0];
    if (!nom || !pre || !img) return alert("Faltan datos");
    let reader = new FileReader();
    reader.onload = (e) => {
        productos.push({ nombre: nom, precio: pre, imagen: e.target.result });
        localStorage.setItem("productos", JSON.stringify(productos));
        mostrarProductos();
    };
    reader.readAsDataURL(img);
};

window.eliminarProductoMenu = function(i) {
    if(confirm("¿Eliminar?")) { productos.splice(i, 1); localStorage.setItem("productos", JSON.stringify(productos)); mostrarProductos(); }
};

window.toggleConfig = function() {
    let c = document.getElementById("config");
    c.style.display = (c.style.display === "block") ? "none" : "block";
};

function actualizarTop() {
    let hoy = new Date().toLocaleDateString();
    let tHoy = 0, tMes = 0, tPas = 0;
    let mesAct = new Date().getMonth() + 1, añoAct = new Date().getFullYear();
    let mesPas = (mesAct === 1) ? 12 : mesAct - 1;
    let añoPas = (mesAct === 1) ? añoAct - 1 : añoAct;

    ventas.forEach(v => {
        if (v.fecha === hoy) tHoy += v.total;
        if (v.mes === mesAct && v.año === añoAct) tMes += v.total;
        if (v.mes === mesPas && v.año === añoPas) tPas += v.total;
    });

    document.getElementById("reporte-hoy").innerText = "$" + tHoy.toLocaleString();
    document.getElementById("reporte-mes").innerText = "$" + tMes.toLocaleString();
    document.getElementById("reporte-mes-pasado").innerText = "$" + tPas.toLocaleString();

    let maxVendido = 0;
    let productoTop = "N/A";

    for (let p in contadorProductos) {
        if (contadorProductos[p] > maxVendido) {
            maxVendido = contadorProductos[p];
            productoTop = p;
        }
    }

    let pTopElement = document.getElementById("top");
    if (pTopElement) {
        pTopElement.innerText = productoTop === "N/A" ? "N/A" : `${productoTop} (${maxVendido})`;
    }
}

// --- FUNCIÓN EXPORTAR CORREGIDA PARA EXCEL EN ESPAÑOL (SOLUCIÓN FINAL) ---
window.exportarCSV = function() {
    // Usamos PUNTO Y COMA (;) para que tu Excel separe las columnas automáticamente
    let contenido = "AÑO;FECHA;MES;HORA;RECIBO;DETALLE;CANTIDAD;VALOR UNIT.;VALOR TOTAL;MEDIO DE PAGO\n";
    const meses = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    ventas.forEach(v => {
        let mesNombre = meses[v.mes] || "N/A";
        let items = v.detalle.split(", ");
        
        items.forEach(item => {
            let espacioIdx = item.indexOf(" ");
            let cant = parseInt(item.substring(0, espacioIdx)) || 1;
            let nombreProd = item.substring(espacioIdx + 1);
            
            let pOriginal = productos.find(p => p.nombre === nombreProd);
            let precioU = pOriginal ? pOriginal.precio : (v.total / cant);
            let subtotal = precioU * cant;

            // Fila separada por PUNTO Y COMA
            contenido += `${v.año || ''};${v.fecha};${mesNombre};${v.hora};${v.recibo};${nombreProd};${cant};${precioU};${subtotal};${v.metodo}\n`;
        });
    });

    // Usamos el formato CSV con BOM (\uFEFF) para que Excel reconozca tildes y símbolos
    let blob = new Blob(["\uFEFF" + contenido], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    
    let hoy = new Date().toLocaleDateString().replace(/\//g, "-");
    link.download = `Ventas_Bendito_${hoy}.csv`; 
    
    link.click();
};

window.limpiarHistorial = function() {
    if (confirm("¿Borrar todo?")) { 
        ventas = []; contadorProductos = {}; cantidades = {}; proximoRecibo = 1;
        localStorage.setItem("ventas", JSON.stringify(ventas)); 
        localStorage.setItem("contadorProductos", JSON.stringify(contadorProductos)); 
        localStorage.setItem("cantidades", JSON.stringify(cantidades));
        localStorage.setItem("proximoRecibo", JSON.stringify(proximoRecibo));
        actualizarTop(); 
    }
};
