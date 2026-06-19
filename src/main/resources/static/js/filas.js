// src/main/resources/static/js/filas.js

document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;
    let ultimoCampoEditado = "original";
    let ultimaOperacion = "CIFRAR";

    const inputTexto = document.getElementById("textoEntrada");
    const outputTexto = document.getElementById("textoSalida");

    const selectTipo = document.getElementById("tipoCifrado");
    const inputClave = document.getElementById("clave");
    const inputNumRows = document.getElementById("numRows");
    const rowsDisplay = document.getElementById("rowsValueDisplay");

    const selectAlfabeto = document.getElementById("idioma");
    const inputCustom = document.getElementById("alfabetoCustom");
    const customAlphabetContainer = document.getElementById("customAlphabetContainer");
    const displayAlfabeto = document.getElementById("displayAlfabeto");

    const simpleRowsContainer = document.getElementById("simpleRowsContainer");
    const claveKeyContainer = document.getElementById("claveKeyContainer");

    const displayNf = document.getElementById("displayNf");
    const displayLc = document.getElementById("displayLc");
    const displayNc = document.getElementById("displayNc");
    const keyStatus = document.getElementById("keyStatus");

    const matrixTable = document.getElementById("matrixTable");

    const btnCopiar = document.getElementById("btnCopiar");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const btnPegar = document.getElementById("btnPegar");
    const btnCopiarOriginal = document.getElementById("btnCopiarOriginal");
    const btnPegarCifrado = document.getElementById("btnPegarCifrado");
    const connDot = document.getElementById("connDot");
    const connLabel = document.getElementById("connLabel");

    function setConnStatus(online) {
        if (connDot && connLabel) {
            connDot.classList.toggle("connected", online);
            connLabel.textContent = online ? "online" : "offline";
        }
    }

    const ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    const ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // ==========================================
    // CONEXIÓN WEBSOCKET Y NOTIFICACIONES
    // ==========================================
    function connect() {
        const socket = new SockJS("/ws-criptografia");
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function () {
            setConnStatus(true);

            // 1. SUSCRIPCIÓN A ERRORES GLOBALES
            stompClient.subscribe('/user/queue/errores', function(errorResponse) {
                CryptoUX.processWebSocketResponse(errorResponse.body);
            });

            // 2. SUSCRIPCIÓN AL RESULTADO DE FILAS
            stompClient.subscribe("/topic/filas", function (response) {
                const data = CryptoUX.processWebSocketResponse(response.body);

                if (data) {
                    if (ultimaOperacion === "CIFRAR") {
                        outputTexto.value = data.resultado;
                    } else {
                        inputTexto.value = data.resultado;
                    }
                }
            });

            recalcularDesdeUltimoCampo();
        }, function () {
            setConnStatus(false);
            CryptoUX.showToast("Conexión perdida", "Desconectado. Reconectando...", "error");
            setTimeout(connect, 3000);
        });
    }

    // Limpiar alfabeto
    function limpiarAlfabeto(valor) {
        const visto = new Set();
        let resultado = "";
        for (const char of (valor || "").toUpperCase()) {
            if (!/[\p{L}]/u.test(char)) continue; // Mantener solo letras
            if (visto.has(char)) continue;
            visto.add(char);
            resultado += char;
        }
        return resultado;
    }

    // Obtener alfabeto activo
    function obtenerAlfabetoActivo() {
        if (selectAlfabeto.value === "CUSTOM") {
            const custom = limpiarAlfabeto(inputCustom.value);
            return custom.length >= 2 ? custom : ALFABETO_ES;
        }
        return selectAlfabeto.value === "EN" ? ALFABETO_EN : ALFABETO_ES;
    }

    // Normalizar texto basándose en el alfabeto activo
    function limpiarTexto(text, alfabeto) {
        if (!text) return "";
        let normalized = text.toUpperCase();

        normalized = normalized.replace(/Á/g, "A")
            .replace(/É/g, "E")
            .replace(/Í/g, "I")
            .replace(/Ó/g, "O")
            .replace(/Ú/g, "U")
            .replace(/Ü/g, "U");

        if (alfabeto.indexOf("Ñ") === -1 && alfabeto.indexOf("N") !== -1) {
            normalized = normalized.replace(/Ñ/g, "N");
        }

        let cleaned = "";
        for (let i = 0; i < normalized.length; i++) {
            const char = normalized[i];
            if (alfabeto.indexOf(char) !== -1) {
                cleaned += char;
            }
        }
        return cleaned;
    }

    function tieneDuplicados(word) {
        for (let i = 0; i < word.length; i++) {
            const c = word[i];
            if (word.indexOf(c, i + 1) !== -1) {
                return true;
            }
        }
        return false;
    }

    // Calcular prioridades alfabéticas (1 a N) de acuerdo al alfabeto activo
    function obtenerPrioridadesAlfabeticas(clave, alfabeto) {
        const chars = clave.split("").map((c, i) => ({
            c,
            originalIndex: i,
            alphabetIndex: alfabeto.indexOf(c)
        }));
        chars.sort((a, b) => {
            if (a.alphabetIndex !== b.alphabetIndex) return a.alphabetIndex - b.alphabetIndex;
            return a.originalIndex - b.originalIndex;
        });
        const priorities = new Array(clave.length);
        for (let p = 0; p < chars.length; p++) {
            priorities[chars[p].originalIndex] = p + 1;
        }
        return priorities;
    }

    // --- Renderizado Dinámico de la Matriz ---
    function actualizarMatrizVisual() {
        const tipo = selectTipo.value;
        const texto = inputTexto.value;

        const alfabeto = obtenerAlfabetoActivo();
        if (displayAlfabeto) {
            displayAlfabeto.textContent = alfabeto;
        }

        const cleanedText = limpiarTexto(texto, alfabeto);

        let nf = 4;
        let claveLimpia = "";
        let priorities = [];
        let keyIsValid = true;

        if (tipo === "SIMPLE") {
            nf = parseInt(inputNumRows.value);
            displayNf.textContent = nf;
            keyStatus.textContent = "VÁLIDA";
            keyStatus.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
        } else {
            const rawKey = inputClave.value.toUpperCase();
            claveLimpia = limpiarTexto(rawKey, alfabeto);
            nf = claveLimpia.length;
            displayNf.textContent = nf > 0 ? nf : "-";

            if (nf < 2) {
                marcarClaveInvalida("Clave muy corta");
                keyIsValid = false;
            } else if (tieneDuplicados(claveLimpia)) {
                marcarClaveInvalida("Letras repetidas");
                keyIsValid = false;
            } else {
                keyStatus.textContent = "VÁLIDA";
                keyStatus.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
                priorities = obtenerPrioridadesAlfabeticas(claveLimpia, alfabeto);
            }
        }

        displayLc.textContent = cleanedText.length;

        if (!keyIsValid || nf <= 0) {
            displayNc.textContent = "-";
            matrixTable.innerHTML = `<tr><td class="text-slate-500 py-6">Configura una clave válida para ver la matriz</td></tr>`;
            return;
        }

        // Calcular número de columnas
        const nc = Math.max(1, Math.ceil(cleanedText.length / nf));
        displayNc.textContent = nc;

        // Construir tabla HTML
        matrixTable.innerHTML = "";

        // 1. Cabecera (Cols C1, C2...)
        const headerRow = document.createElement("tr");
        headerRow.className = "border-b border-slate-800 font-bold bg-slate-900/30 text-slate-200 text-xs";

        const firstHeader = document.createElement("th");
        firstHeader.textContent = tipo === "SIMPLE" ? "Filas" : "Clave";
        firstHeader.className = "px-3 py-2 border-r border-slate-800 text-slate-400 font-semibold w-24";
        headerRow.appendChild(firstHeader);

        for (let c = 0; c < nc; c++) {
            const th = document.createElement("th");
            th.textContent = `C${c + 1}`;
            th.className = "px-3 py-2 border-r border-slate-850 text-slate-300";
            headerRow.appendChild(th);
        }
        matrixTable.appendChild(headerRow);

        // Determinar el caracter de relleno
        const paddingChar = alfabeto.includes("X") ? "X" : (alfabeto.length > 0 ? alfabeto[alfabeto.length - 1] : "X");

        // Construir la matriz de datos volcando el texto VERTICALMENTE (columna por columna)
        const grid = Array.from({ length: nf }, () => new Array(nc).fill(paddingChar));
        let textIdx = 0;
        for (let c = 0; c < nc; c++) {
            for (let r = 0; r < nf; r++) {
                if (textIdx < cleanedText.length) {
                    grid[r][c] = cleanedText[textIdx++];
                } else {
                    grid[r][c] = paddingChar;
                }
            }
        }

        // 2. Filas de datos
        for (let r = 0; r < nf; r++) {
            const row = document.createElement("tr");
            row.className = "border-b border-slate-800/50 hover:bg-slate-900/20 transition-colors";

            const rowLabel = document.createElement("td");
            rowLabel.className = "px-3 py-2 border-r border-slate-800 text-xs font-semibold bg-slate-900/5";
            if (tipo === "SIMPLE") {
                rowLabel.textContent = `Fila ${r + 1}`;
                rowLabel.className += " text-slate-400";
            } else {
                const letter = claveLimpia[r];
                const prio = priorities[r];
                rowLabel.innerHTML = `<span class="text-fuchsia-400 font-black">${letter}</span> <span class="text-[10px] text-slate-500 font-bold">(${prio})</span>`;
            }
            row.appendChild(rowLabel);

            for (let c = 0; c < nc; c++) {
                const td = document.createElement("td");
                td.className = "px-3 py-2 border-r border-slate-850 font-mono text-sm";
                td.textContent = grid[r][c];

                // Resaltar celdas de relleno
                // En transposición vertical, el relleno está al final del texto original
                // Se deduce si el índice correspondiente al rellenar verticalmente supera cleanedText.length
                const originalTextPos = c * nf + r;
                if (originalTextPos >= cleanedText.length) {
                    td.className += " text-slate-600 font-bold bg-slate-900/10";
                } else {
                    td.className += " text-slate-200";
                }

                row.appendChild(td);
            }
            matrixTable.appendChild(row);
        }
    }

    function marcarClaveInvalida(motivo) {
        keyStatus.textContent = motivo.toUpperCase();
        keyStatus.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/25";
    }

    // --- Comunicación con WebSocket ---
    function enviarDatos(texto, operacion) {
        if (!stompClient || !stompClient.connected) return;

        const tipo = selectTipo.value;
        const alfabeto = obtenerAlfabetoActivo();
        let clave = "";

        if (tipo === "SIMPLE") {
            clave = inputNumRows.value;
        } else {
            clave = limpiarTexto(inputClave.value.toUpperCase(), alfabeto);
        }

        if (!texto) {
            if (operacion === "CIFRAR") {
                outputTexto.value = "";
            } else {
                inputTexto.value = "";
            }
            return;
        }

        ultimaOperacion = operacion;

        stompClient.send("/app/filas", {}, JSON.stringify({
            texto: texto,
            operacion: operacion,
            clave: clave,
            tipoFilas: tipo,
            idioma: selectAlfabeto.value,
            alfabetoCustom: inputCustom.value.toUpperCase()
        }));
    }

    function cifrarDesdeOriginal() {
        ultimoCampoEditado = "original";
        enviarDatos(inputTexto.value, "CIFRAR");
        actualizarMatrizVisual();
    }

    function descifrarDesdeCifrado() {
        ultimoCampoEditado = "cifrado";
        enviarDatos(outputTexto.value, "DESCIFRAR");
    }

    function recalcularDesdeUltimoCampo() {
        if (ultimoCampoEditado === "cifrado") {
            descifrarDesdeCifrado();
        } else {
            cifrarDesdeOriginal();
        }
    }

    // --- Escuchadores de Eventos ---
    inputTexto.addEventListener("input", cifrarDesdeOriginal);
    outputTexto.addEventListener("input", descifrarDesdeCifrado);

    inputNumRows.addEventListener("input", (e) => {
        rowsDisplay.textContent = e.target.value;
        actualizarMatrizVisual();
        recalcularDesdeUltimoCampo();
    });

    inputClave.addEventListener("input", (e) => {
        const alfabeto = obtenerAlfabetoActivo();
        const val = limpiarTexto(e.target.value, alfabeto);
        e.target.value = val;
        actualizarMatrizVisual();
        recalcularDesdeUltimoCampo();
    });

    selectTipo.addEventListener("change", (e) => {
        if (e.target.value === "SIMPLE") {
            simpleRowsContainer.classList.remove("hidden");
            claveKeyContainer.classList.add("hidden");
        } else {
            simpleRowsContainer.classList.add("hidden");
            claveKeyContainer.classList.remove("hidden");
        }
        actualizarMatrizVisual();
        recalcularDesdeUltimoCampo();
    });

    selectAlfabeto.addEventListener("change", (e) => {
        if (e.target.value === "CUSTOM") {
            customAlphabetContainer.classList.remove("hidden");
        } else {
            customAlphabetContainer.classList.add("hidden");
        }
        actualizarMatrizVisual();
        recalcularDesdeUltimoCampo();
    });

    inputCustom.addEventListener("input", (e) => {
        e.target.value = limpiarAlfabeto(e.target.value);
        actualizarMatrizVisual();
        recalcularDesdeUltimoCampo();
    });

    // UX: Copiar
    btnCopiar.addEventListener("click", () => {
        if (!outputTexto.value) {
            CryptoUX.showToast("Aviso", "No hay texto para copiar.", "info");
            return;
        }
        navigator.clipboard.writeText(outputTexto.value).then(() => {
            CryptoUX.showToast("¡Copiado!", "Texto cifrado copiado.", "success");
        }).catch(() => {
            outputTexto.select();
            document.execCommand("copy");
        });
    });

    // UX: Pegar en Texto Cifrado y descifrar
    btnPegarCifrado.addEventListener("click", async () => {
        try {
            const texto = await navigator.clipboard.readText();
            outputTexto.value = texto;
            descifrarDesdeCifrado();
        } catch {
            CryptoUX.showToast("Error", "No se pudo acceder al portapapeles.", "error");
        }
    });

    // UX: Pegar
    btnPegar.addEventListener("click", async () => {
        try {
            const texto = await navigator.clipboard.readText();
            inputTexto.value = texto;
            cifrarDesdeOriginal();
            inputTexto.focus();
            CryptoUX.showToast("Pegado", "Texto insertado correctamente.", "success");
        } catch {
            CryptoUX.showToast("Error", "No se pudo acceder al portapapeles.", "error");
        }
    });

    // UX: Copiar Texto Original
    btnCopiarOriginal.addEventListener("click", () => {
        if (!inputTexto.value) {
            CryptoUX.showToast("Aviso", "No hay texto para copiar.", "info");
            return;
        }
        navigator.clipboard.writeText(inputTexto.value).then(() => {
            CryptoUX.showToast("¡Copiado!", "Texto original copiado.", "success");
        }).catch(() => {
            inputTexto.select();
            document.execCommand("copy");
        });
    });

    // Limpiar
    btnLimpiar.addEventListener("click", () => {
        inputTexto.value = "";
        outputTexto.value = "";
        ultimoCampoEditado = "original";
        actualizarMatrizVisual();
        inputTexto.focus();
    });

    // Inicializar
    actualizarMatrizVisual();
    connect();
});