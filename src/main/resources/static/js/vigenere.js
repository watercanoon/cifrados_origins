// src/main/resources/static/js/vigenere.js

document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;
    let ultimoCampoEditado = "entrada";
    let ultimoToastClave = 0;

    const inputTexto = document.getElementById("textoEntrada");
    const outputTexto = document.getElementById("textoSalida");
    const inputClave = document.getElementById("clave");
    const selectIdioma = document.getElementById("idioma");
    const customContainer = document.getElementById("customAlphabetContainer");
    const inputCustom = document.getElementById("alfabetoCustom");

    const tabla = document.getElementById("vigenereTable");
    const tableInfo = document.getElementById("tableInfo");
    const charTexto = document.getElementById("charTexto");
    const charClave = document.getElementById("charClave");
    const charResultado = document.getElementById("charResultado");
    const connDot = document.getElementById("connDot");
    const connLabel = document.getElementById("connLabel");

    const btnCopiar = document.getElementById("btnCopiar");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const btnPegar = document.getElementById("btnPegar");
    const btnCopiarOriginal = document.getElementById("btnCopiarOriginal");
    const btnPegarCifrado = document.getElementById("btnPegarCifrado");

    const ALFABETO_ES = "ABCDEFGHIJKLMN\u00d1OPQRSTUVWXYZ";
    const ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    function setConnStatus(online) {
        connDot.classList.toggle("connected", online);
        connLabel.textContent = online ? "online" : "offline";
    }

    function limpiarLetrasUnicas(valor) {
        const visto = new Set();
        let resultado = "";

        for (const char of (valor || "").toUpperCase()) {
            if (!/[\p{L}]/u.test(char)) continue;
            if (visto.has(char)) continue;
            visto.add(char);
            resultado += char;
        }

        return resultado;
    }

    function obtenerAlfabeto() {
        if (selectIdioma.value === "CUSTOM") {
            const custom = limpiarLetrasUnicas(inputCustom.value);
            return custom.length >= 2 ? custom : "";
        }

        return selectIdioma.value === "EN" ? ALFABETO_EN : ALFABETO_ES;
    }

    function limpiarClave(valor) {
        const alfabeto = obtenerAlfabeto();
        let resultado = "";

        for (const char of (valor || "").toUpperCase()) {
            if (alfabeto.includes(char)) resultado += char;
        }

        return resultado;
    }

    function construirTabla() {
        const alfabeto = obtenerAlfabeto();
        tabla.innerHTML = "";

        if (!alfabeto) {
            tabla.innerHTML = '<tr><td class="text-slate-500 px-3 py-2">Ingresa un alfabeto personalizado valido.</td></tr>';
            tableInfo.textContent = "";
            return;
        }

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        const corner = document.createElement("th");
        corner.className = "corner top-head";
        corner.textContent = "K/T";
        headerRow.appendChild(corner);

        for (const letra of alfabeto) {
            const th = document.createElement("th");
            th.className = "top-head";
            th.textContent = letra;
            th.dataset.col = letra;
            headerRow.appendChild(th);
        }

        thead.appendChild(headerRow);
        tabla.appendChild(thead);

        const tbody = document.createElement("tbody");
        for (let fila = 0; fila < alfabeto.length; fila++) {
            const tr = document.createElement("tr");
            const rowHead = document.createElement("th");
            rowHead.className = "side-head";
            rowHead.textContent = alfabeto[fila];
            rowHead.dataset.row = alfabeto[fila];
            tr.appendChild(rowHead);

            for (let col = 0; col < alfabeto.length; col++) {
                const td = document.createElement("td");
                td.textContent = alfabeto[(fila + col) % alfabeto.length];
                td.dataset.rowIndex = String(fila);
                td.dataset.colIndex = String(col);
                tr.appendChild(td);
            }

            tbody.appendChild(tr);
        }

        tabla.appendChild(tbody);
        tableInfo.textContent = `${alfabeto.length} x ${alfabeto.length}`;
    }

    function obtenerInfoUltimoCaracter(texto, operacion) {
        const alfabeto = obtenerAlfabeto();
        const clave = limpiarClave(inputClave.value);

        if (!alfabeto || !clave || !texto) return null;

        let letrasValidas = 0;
        let ultima = null;

        for (const char of texto) {
            const upper = char.toUpperCase();
            const indexTexto = alfabeto.indexOf(upper);
            if (indexTexto === -1) continue;

            const keyChar = clave[letrasValidas % clave.length];
            const indexClave = alfabeto.indexOf(keyChar);
            let indexCol = indexTexto;
            let indexSalida = (indexTexto + indexClave) % alfabeto.length;

            if (operacion === "DESCIFRAR") {
                indexSalida = (indexTexto - indexClave + alfabeto.length) % alfabeto.length;
                indexCol = indexSalida;
            }

            ultima = {
                texto: upper,
                clave: keyChar,
                salida: alfabeto[indexSalida],
                rowIndex: indexClave,
                colIndex: indexCol
            };

            letrasValidas++;
        }

        return ultima;
    }

    function resaltarTabla() {
        document.querySelectorAll(".active-row, .active-col, .active-cell").forEach(el => {
            el.classList.remove("active-row", "active-col", "active-cell");
        });

        const texto = ultimoCampoEditado === "entrada" ? inputTexto.value : outputTexto.value;
        const operacion = ultimoCampoEditado === "entrada" ? "CIFRAR" : "DESCIFRAR";
        const info = obtenerInfoUltimoCaracter(texto, operacion);

        if (!info) {
            charTexto.textContent = "-";
            charClave.textContent = "-";
            charResultado.textContent = "-";
            return;
        }

        charTexto.textContent = info.texto;
        charClave.textContent = info.clave;
        charResultado.textContent = info.salida;

        const rowCells = tabla.querySelectorAll(`td[data-row-index="${info.rowIndex}"]`);
        const colCells = tabla.querySelectorAll(`td[data-col-index="${info.colIndex}"]`);
        rowCells.forEach(cell => cell.classList.add("active-row"));
        colCells.forEach(cell => cell.classList.add("active-col"));

        const activeCell = tabla.querySelector(`td[data-row-index="${info.rowIndex}"][data-col-index="${info.colIndex}"]`);
        if (activeCell) {
            activeCell.classList.add("active-cell");
            activeCell.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
    }

    // ==========================================
    // CONEXIÓN WEBSOCKET Y NOTIFICACIONES
    // ==========================================
    function connect() {
        const socket = new SockJS("/ws-criptografia");
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function () {
            setConnStatus(true);

            // 1. SUSCRIPCIÓN GLOBAL DE ERRORES (Atrapa excepciones del backend)
            stompClient.subscribe('/user/queue/errores', function(errorResponse) {
                CryptoUX.processWebSocketResponse(errorResponse.body);
            });

            // 2. SUSCRIPCIÓN A LA RESPUESTA DE VIGENERE
            stompClient.subscribe("/topic/vigenere", function (response) {
                const data = CryptoUX.processWebSocketResponse(response.body);

                if (data) {
                    if (ultimoCampoEditado === "entrada") {
                        outputTexto.value = data.resultado;
                    } else {
                        inputTexto.value = data.resultado;
                    }

                    resaltarTabla();
                }
            });
        }, function () {
            setConnStatus(false);
            CryptoUX.showToast("Conexión perdida", "Desconectado del servidor. Reconectando...", "error");
            setTimeout(connect, 3000);
        });
    }

    function enviarDatos(origen) {
        ultimoCampoEditado = origen;
        const texto = origen === "entrada" ? inputTexto.value : outputTexto.value;
        const operacion = origen === "entrada" ? "CIFRAR" : "DESCIFRAR";
        const clave = limpiarClave(inputClave.value);
        const alfabetoCustom = limpiarLetrasUnicas(inputCustom.value);

        resaltarTabla();

        if (!texto) {
            if (origen === "entrada") outputTexto.value = "";
            else inputTexto.value = "";
            return;
        }

        if (selectIdioma.value === "CUSTOM" && !obtenerAlfabeto()) {
            CryptoUX.showToast("Alfabeto Inválido", "El alfabeto personalizado necesita al menos 2 letras distintas.", "error");
            return;
        }

        if (!clave) {
            avisarClave();
            return;
        }

        if (!stompClient || !stompClient.connected) return;

        stompClient.send("/app/vigenere", {}, JSON.stringify({
            texto,
            operacion,
            clave,
            idioma: selectIdioma.value,
            alfabetoCustom
        }));
    }

    function avisarClave() {
        const ahora = Date.now();
        if (ahora - ultimoToastClave > 1800) {
            CryptoUX.showToast("Clave Requerida", "La clave necesita al menos una letra del alfabeto seleccionado.", "error");
            ultimoToastClave = ahora;
        }
    }

    inputTexto.addEventListener("input", () => enviarDatos("entrada"));
    outputTexto.addEventListener("input", () => enviarDatos("salida"));

    inputClave.addEventListener("input", () => {
        inputClave.value = inputClave.value.toUpperCase();
        resaltarTabla();
        enviarDatos(ultimoCampoEditado);
    });

    inputCustom.addEventListener("input", () => {
        inputCustom.value = limpiarLetrasUnicas(inputCustom.value);
        construirTabla();
        enviarDatos(ultimoCampoEditado);
    });

    selectIdioma.addEventListener("change", () => {
        customContainer.classList.toggle("hidden", selectIdioma.value !== "CUSTOM");
        construirTabla();
        enviarDatos(ultimoCampoEditado);
    });

    // UX: Pegar desde el portapapeles (Texto Original)
    btnPegar.addEventListener("click", async () => {
        try {
            const textoPortapapeles = await navigator.clipboard.readText();
            if (textoPortapapeles) {
                inputTexto.value = textoPortapapeles;
                enviarDatos("entrada");
                inputTexto.focus();
                CryptoUX.showToast("Pegado", "Texto insertado correctamente.", "success");
            }
        } catch {
            CryptoUX.showToast("Acceso denegado", "Permiso denegado. Concede acceso al portapapeles en tu navegador.", "error");
        }
    });

    // UX: Copiar Texto Original al portapapeles
    btnCopiarOriginal.addEventListener("click", async () => {
        if (!inputTexto.value) {
            CryptoUX.showToast("Aviso", "No hay texto original para copiar.", "info");
            return;
        }

        try {
            await navigator.clipboard.writeText(inputTexto.value);
            CryptoUX.showToast("¡Copiado!", "Texto original copiado al portapapeles.", "success");
        } catch {
            inputTexto.select();
            document.execCommand("copy");
        }
    });

    btnLimpiar.addEventListener("click", () => {
        inputTexto.value = "";
        outputTexto.value = "";
        resaltarTabla();
        inputTexto.focus();
    });

    // UX: Pegar Texto Cifrado desde el portapapeles
    btnPegarCifrado.addEventListener("click", async () => {
        try {
            const textoPortapapeles = await navigator.clipboard.readText();
            if (textoPortapapeles) {
                outputTexto.value = textoPortapapeles;
                enviarDatos("salida");
                outputTexto.focus();
                CryptoUX.showToast("Pegado", "Texto cifrado insertado correctamente.", "success");
            }
        } catch {
            CryptoUX.showToast("Acceso denegado", "Permiso denegado. Concede acceso al portapapeles en tu navegador.", "error");
        }
    });

    // UX: Copiar al portapapeles moderno (Texto Cifrado)
    btnCopiar.addEventListener("click", async () => {
        if (!outputTexto.value) {
            CryptoUX.showToast("Aviso", "No hay texto para copiar.", "info");
            return;
        }

        try {
            await navigator.clipboard.writeText(outputTexto.value);
            CryptoUX.showToast("¡Copiado!", "Texto copiado al portapapeles.", "success");
        } catch {
            outputTexto.select();
            document.execCommand("copy");
        }
    });

    // Inicialización
    construirTabla();
    resaltarTabla();
    connect();
});