let productos = JSON.parse(localStorage.getItem("productos")) || [];
let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
let carrito = [];
let totalActual = 0;
let metodoSeleccionado = "Efectivo";

window.onload = () => {
    dibujarProductos();
    actualizarHistorial();
};

function dibujarProductos() {
    const contenedor = document.getElementById("productos");
    contenedor.innerHTML = "";
    productos.forEach((p, i) => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
            <strong>${p.nombre}</strong>
            <img src="${p.imagen}">
            <span style="color:#e91e63; font-weight:bold;">$${p.precio.toLocaleString()}</span>
            <button class="btn-eliminar" onclick="event.stopPropagation(); eliminarP(${i})">Eliminar</button>
        `;
        div.onclick = () => agregarAlCarrito(p);
        contenedor.appendChild(div);
    });
}

function agregarAlCarrito(p) {
    carrito.push(p);
    totalActual += p.precio;
    renderCarrito();
}

function renderCarrito() {
    document.getElementById("total-monto").innerText = totalActual.toLocaleString();
    const lista = document.getElementById("lista-carrito");
    lista.innerHTML = "";
    carrito.slice(-3).forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${item.nombre}</span> <b>$${item.precio.toLocaleString()}</b>`;
        lista.appendChild(li);
    });
    calcularCambio();
}

// LÓGICA DE PAGO FLUIDA
function seleccionarMetodo(metodo) {
    metodoSeleccionado = metodo;
    const input = document.getElementById("input-pago");
    
    if (metodo === "Efectivo") {
        input.value = "";
        input.readOnly = false;
        input.focus();
    } else {
        // Nequi o Daviplata: Pago exacto automático
        input.value = totalActual;
        input.readOnly = true;
    }
    calcularCambio();
}

function calcularCambio() {
    const recibido = parseFloat(document.getElementById("input-pago").value) || 0;
    const textoCambio = document.getElementById("cambio-texto");
    
    if (totalActual === 0) {
        textoCambio.innerText = "";
        return;
    }

    if (recibido < totalActual) {
        textoCambio.innerHTML = `<span style="color:red;">Faltan: $${(totalActual - recibido).toLocaleString()}</span>`;
    } else {
        const cambio = recibido - totalActual;
        textoCambio.innerHTML = `<span style="color:green;">Cambio: $${cambio.toLocaleString()}</span>`;
    }
}

function finalizarVenta() {
    const recibido = parseFloat(document.getElementById("input-pago").value) || 0;
    if (totalActual === 0) return alert("El carrito está vacío");
    if (recibido < totalActual) return alert("El dinero recibido es insuficiente");

    const nuevaVenta = {
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        total: totalActual,
        metodo: metodoSeleccionado
    };

    ventas.push(nuevaVenta);
    localStorage.setItem("ventas", JSON.stringify(ventas));
    
    alert(`Venta Exitosa (${metodoSeleccionado}). Cambio: $${(recibido - totalActual).toLocaleString()}`);
    
    // Resetear todo
    carrito = [];
    totalActual = 0;
    document.getElementById("input-pago").value = "";
    renderCarrito();
    actualizarHistorial();
}

// EXCEL Y REPORTES
function actualizarHistorial() {
    const hoy = new Date().toLocaleDateString();
    const sumaHoy = ventas.filter(v => v.fecha === hoy).reduce((s, v) => s + v.total, 0);
    document.getElementById("resumen-hoy").innerText = "$" + sumaHoy.toLocaleString();

    const lista = document.getElementById("historial-lista");
    lista.innerHTML = "";
    ventas.slice(-5).reverse().forEach(v => {
        const li = document.createElement("li");
        li.innerText = `${v.hora} - ${v.metodo}: $${v.total.toLocaleString()}`;
        lista.appendChild(li);
    });
}

function exportarCSV() {
    if (ventas.length === 0) return alert("No hay ventas para exportar");
    let csv = "\ufeffFecha,Hora,Metodo,Total\n";
    ventas.forEach(v => {
        csv += `${v.fecha},${v.hora},${v.metodo},${v.total}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Reporte_Ventas_Bendito.csv";
    link.click();
}

// CONFIGURACIÓN
function abrirConfig() {
    const m = document.getElementById("modal-config");
    const p = document.getElementById("productos");
    if (m.style.display === "block") {
        m.style.display = "none";
        p.classList.remove("modo-config");
    } else {
        m.style.display = "block";
        p.classList.add("modo-config");
    }
}

function guardarNuevoProducto() {
    const nombre = document.getElementById("nuevo-nombre").value;
    const precio = parseFloat(document.getElementById("nuevo-precio").value);
    const imgFile = document.getElementById("nueva-imagen").files[0];

    if (!nombre || !precio || !imgFile) return alert("Completa todos los datos");

    const reader = new FileReader();
    reader.onload = (e) => {
        productos.push({ nombre, precio, imagen: e.target.result });
        localStorage.setItem("productos", JSON.stringify(productos));
        dibujarProductos();
        abrirConfig();
        alert("¡Producto Agregado!");
    };
    reader.readAsDataURL(imgFile);
}

function eliminarP(index) {
    if (confirm("¿Eliminar este helado?")) {
        productos.splice(index, 1);
        localStorage.setItem("productos", JSON.stringify(productos));
        dibujarProductos();
    }
}
