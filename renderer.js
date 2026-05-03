let productos = JSON.parse(localStorage.getItem("productos")) || [];
let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
let clientes = JSON.parse(localStorage.getItem("clientes")) || {};
let contadorProductos = JSON.parse(localStorage.getItem("contadorProductos")) || {};
let cantidades = JSON.parse(localStorage.getItem("cantidades")) || {};
// NUEVA VARIABLE PARA INVENTARIO DE CAJAS
let inventario = JSON.parse(localStorage.getItem("inventario")) || {};
let proximoRecibo = JSON.parse(localStorage.getItem("proximoRecibo")) || 1; 

let carrito = [];
let total = 0;

window.onload = function() {
    mostrarProductos();
    actualizarTop();
    actualizarVistaInventario(); // Nueva función para el stock
};

// --- MODIFICACIÓN: AHORA ABRE EL SELECTOR AL HACER CLIC ---
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
        
        // Cambio: En lugar de agregar directo, abre la pestaña de sabores
        div.onclick = () => abrirSelectorSabores(index);
        
        contenedor.appendChild(div);

        if (listaEliminar) {
            let item = document.createElement("div");
            item.style = "display: flex; align-items: center; background: #f9f9f9; padding: 5px; border-radius: 5px; border: 1px solid #eee; gap: 5px; margin-bottom: 5px;";
            item.innerHTML = `<span style="flex: 1; font-size: 0.7em;">${p.nombre}</span>
                              <button onclick="eliminarProductoMenu(${index})" style="background:red; color:white; border:none; border-radius:3px; padding: 4px 6px; font-size: 0.7em;">🗑️</button>`;
            listaEliminar.appendChild(item);
        }
    });
}

// --- NUEVA FUNCIÓN: PESTAÑA DE SABORES INTELIGENTE ---
function abrirSelectorSabores(indexProducto) {
    let p = productos[indexProducto];
    let saboresDisponibles = Object.keys(inventario);

    // Si no hay cajas registradas, agrega el producto genérico
    if (saboresDisponibles.length === 0) {
        ejecutarAgregarAlCarrito(p.nombre, p.precio, null);
        return;
    }

    // ORDENAMIENTO DINÁMICO: Los que más se venden aparecen primero
    saboresDisponibles.sort((a, b) => {
        let vA = 0; let vB = 0;
        for (let key in contadorProductos) {
            if (key.includes(`(${a})`)) vA += contadorProductos[key];
            if (key.includes(`(${b})`)) vB += contadorProductos[key];
        }
        return vB - vA;
    });

    let modal = document.createElement("div");
    modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:5000; display:flex; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;";
    
    let contenido = document.createElement("div");
    contenido.style = "background:white; width:100%; max-width:400px; border-radius:15px; padding:20px; text-align:center;";
    contenido.innerHTML = `<h3 style="margin:0 0 15px 0;">Selecciona el Sabor</h3>
                           <div id="lista-btns-sabores" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; max-height:350px; overflow-y:auto; padding:5px;"></div>
                           <button onclick="this.parentElement.parentElement.remove()" style="margin-top:15px; width:100%; padding:10px; border:none; background:#eee; border-radius:8px; font-weight:bold;">VOLVER</button>`;
    
    modal.appendChild(contenido);
    document.body.appendChild(modal);

    let contenedorBotones = modal.querySelector("#lista-btns-sabores");
    saboresDisponibles.forEach((sabor, i) => {
        let btn = document.createElement("button");
        // Resaltar los 2 primeros como sugerencia
        btn.style = `padding:15px 5px; border-radius:8px; font-weight:bold; cursor:pointer; border:${i < 2 ? '2px solid #e91e63' : '1px solid #ccc'}; background:${i < 2 ? '#fff5f8' : '#f9f9f9'};`;
        btn.innerHTML = `${i === 0 ? '🔥 ' : ''}${sabor}`;
        btn.onclick = () => {
            ejecutarAgregarAlCarrito(p.nombre, p.precio, sabor);
            modal.remove();
        };
        contenedorBotones.appendChild(btn);
    });
}

// Lógica de carrito separada para manejar el sabor
function ejecutarAgregarAlCarrito(nombreBase, precio, sabor) {
    let nombreFinal = sabor ? `${nombreBase} (${sabor})` : nombreBase;
    let item = carrito.find(i => i.nombre === nombreFinal);
    if (item) { item.cantidad++; } 
    else { carrito.push({ nombre: nombreFinal, precio: precio, cantidad: 1, saborAsociado: sabor }); }
    total += precio;
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

// --- PROCESAR PAGO ACTUALIZADO (DESCUENTA DE CAJA) ---
window.procesarPago = function() {
    if (total === 0) return;
    let pagoVal = parseFloat(document.getElementById("pago").value) || 0;
    if (pagoVal < total) return alert("Pago insuficiente");

    let ahora = new Date();
    let numRecibo = "BH-" + String(proximoRecibo).padStart(2, '0');
    
    let venta = {
        fecha: ahora.toLocaleDateString(),
        año: ahora.getFullYear(),
        mes: ahora.getMonth() + 1,
        hora: ahora.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        detalle: carrito.map(p => `${p.cantidad} ${p.nombre}`).join(", "),
        total: total, 
        recibo: numRecibo, 
        metodo: document.getElementById("pago").dataset.metodo || "Efectivo"
    };

    ventas.push(venta);
    proximoRecibo++;
    localStorage.setItem("proximoRecibo", JSON.stringify(proximoRecibo));

    carrito.forEach(p => { 
        contadorProductos[p.nombre] = (contadorProductos[p.nombre] || 0) + p.cantidad;
        cantidades[p.nombre] = (cantidades[p.nombre] || 0) + p.cantidad;
        
        // DESCUENTO REAL DE LA CAJA
        if (p.saborAsociado && inventario[p.saborAsociado] !== undefined) {
            inventario[p.saborAsociado] -= p.cantidad;
        }
    });

    localStorage.setItem("ventas", JSON.stringify(ventas));
    localStorage.setItem("contadorProductos", JSON.stringify(contadorProductos));
    localStorage.setItem("cantidades", JSON.stringify(cantidades));
    localStorage.setItem("inventario", JSON.stringify(inventario));

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
    actualizarVistaInventario();
};

// --- ESTADÍSTICAS AMPLIADAS ---
function actualizarTop() {
    let hoyObj = new Date();
    let hoy = hoyObj.toLocaleDateString();
    
    let ayerObj = new Date();
    ayerObj.setDate(hoyObj.getDate() - 1);
    let ayer = ayerObj.toLocaleDateString();

    let tHoy = 0, tAyer = 0, tMes = 0, tPas = 0;
    let mesAct = hoyObj.getMonth() + 1, añoAct = hoyObj.getFullYear();
    let mesPas = (mesAct === 1) ? 12 : mesAct - 1;
    let añoPas = (mesAct === 1) ? añoAct - 1 : añoAct;

    ventas.forEach(v => {
        if (v.fecha === hoy) tHoy += v.total;
        if (v.fecha === ayer) tAyer += v.total;
        if (v.mes === mesAct && v.año === añoAct) tMes += v.total;
        if (v.mes === mesPas && v.año === añoPas) tPas += v.total;
    });

    if(document.getElementById("reporte-hoy")) document.getElementById("reporte-hoy").innerText = "$" + tHoy.toLocaleString();
    if(document.getElementById("reporte-ayer")) document.getElementById("reporte-ayer").innerText = "$" + tAyer.toLocaleString();
    if(document.getElementById("reporte-mes")) document.getElementById("reporte-mes").innerText = "$" + tMes.toLocaleString();
    if(document.getElementById("reporte-mes-pasado")) document.getElementById("reporte-mes-pasado").innerText = "$" + tPas.toLocaleString();

    // Lógica para Top 1 y Top 2
    let ordenados = Object.entries(contadorProductos).sort((a, b) => b[1] - a[1]);
    
    if (document.getElementById("top")) {
        document.getElementById("top").innerText = ordenados[0] ? `${ordenados[0][0]} (${ordenados[0][1]})` : "N/A";
    }
    if (document.getElementById("top2")) {
        document.getElementById("top2").innerText = ordenados[1] ? `${ordenados[1][0]} (${ordenados[1][1]})` : "N/A";
    }
}

// --- GESTIÓN DE INVENTARIO DE CAJAS ---
window.comprarCaja = function(sabor) {
    let cantidad = prompt(`¿Cuántas porciones agregar a la caja de ${sabor}?`, "100");
    if (cantidad === null) return;
    inventario[sabor] = (inventario[sabor] || 0) + parseInt(cantidad);
    localStorage.setItem("inventario", JSON.stringify(inventario));
    actualizarVistaInventario();
};

function actualizarVistaInventario() {
    let divInv = document.getElementById("lista-inventario");
    if (!divInv) return;
    divInv.innerHTML = "";
    for (let sabor in inventario) {
        divInv.innerHTML += `
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:8px; border-bottom:1px solid #eee; font-size:0.85em;">
            <span><b>${sabor}</b>: ${inventario[sabor]} porc.</span>
            <button onclick="comprarCaja('${sabor}')" style="background:#4CAF50; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.8em;">+ Carga</button>
        </div>`;
    }
    // Botón para crear nueva caja de sabor si no existe
    divInv.innerHTML += `<button onclick="nuevoSaborInventario()" style="width:100%; margin-top:10px; padding:8px; background:#333; color:white; border:none; border-radius:5px; font-size:0.8em;">+ CONTROLAR NUEVO SABOR</button>`;
}

window.nuevoSaborInventario = function() {
    let sabor = prompt("Nombre del sabor de la caja nueva:");
    if(sabor) {
        inventario[sabor] = 0;
        comprarCaja(sabor);
    }
};

// --- MANTENEMOS TUS FUNCIONES ORIGINALES DE CLIENTES Y CONFIG ---
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

window.exportarCSV = function() {
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
            contenido += `${v.año || ''};${v.fecha};${mesNombre};${v.hora};${v.recibo};${nombreProd};${cant};${precioU};${subtotal};${v.metodo}\n`;
        });
    });
    let blob = new Blob(["\uFEFF" + contenido], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    let hoy = new Date().toLocaleDateString().replace(/\//g, "-");
    link.download = `Ventas_Bendito_${hoy}.csv`; link.click();
};

window.limpiarHistorial = function() {
    if (confirm("¿Borrar todo?")) { 
        ventas = []; contadorProductos = {}; cantidades = {}; proximoRecibo = 1; inventario = {};
        localStorage.clear();
        location.reload();
    }
};
