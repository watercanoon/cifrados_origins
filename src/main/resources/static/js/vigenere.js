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

    function connect() {
        const socket = new SockJS("/ws-criptografia");
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function () {
            setConnStatus(true);
            stompClient.subscribe("/topic/vigenere", function (response) {
                const data = JSON.parse(response.body);

                if (data.error) {
                    mostrarError(data.error);
                    return;
                }

                if (ultimoCampoEditado === "entrada") {
                    outputTexto.value = data.resultado;
                } else {
                    inputTexto.value = data.resultado;
                }

                resaltarTabla();
            });
        }, function () {
            setConnStatus(false);
            mostrarError("Conexión perdida. Reconectando...");
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
            mostrarError("El alfabeto personalizado necesita al menos 2 letras distintas.");
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
            mostrarError("La clave necesita al menos una letra del alfabeto seleccionado.");
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

    btnPegar.addEventListener("click", async () => {
        try {
            const textoPortapapeles = await navigator.clipboard.readText();
            if (textoPortapapeles) {
                inputTexto.value = textoPortapapeles;
                enviarDatos("entrada");
                inputTexto.focus();
            }
        } catch {
            mostrarError("Permiso denegado. Concede acceso al portapapeles en tu navegador.");
        }
    });

    btnLimpiar.addEventListener("click", () => {
        inputTexto.value = "";
        outputTexto.value = "";
        resaltarTabla();
        inputTexto.focus();
    });

    btnCopiar.addEventListener("click", async () => {
        if (!outputTexto.value) return;

        try {
            await navigator.clipboard.writeText(outputTexto.value);
            mostrarExito("Texto copiado al portapapeles");
        } catch {
            outputTexto.select();
            document.execCommand("copy");
        }
    });

    function mostrarToast(mensaje, tipo) {
        const container = document.getElementById("toast-container");
        const toast = document.createElement("div");
        const isError = tipo === "error";
        toast.className = `px-4 py-3 rounded-xl shadow-xl border backdrop-blur-sm text-sm font-medium ${
            isError
                ? "bg-red-950/90 text-red-200 border-red-700/50"
                : "bg-emerald-950/90 text-emerald-200 border-emerald-700/50"
        }`;
        toast.textContent = mensaje;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity .35s ease";
            setTimeout(() => toast.remove(), 350);
        }, 2800);
    }

    function mostrarError(mensaje) {
        mostrarToast(mensaje, "error");
    }

    function mostrarExito(mensaje) {
        mostrarToast(mensaje, "ok");
    }

    construirTabla();
    resaltarTabla();
    connect();
});
