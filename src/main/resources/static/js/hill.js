// src/main/resources/static/js/hill.js

document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;
    let ultimoCampoEditado = "original";
    let ultimaOperacion = "CIFRAR";

    const inputTexto = document.getElementById("textoEntrada");
    const outputTexto = document.getElementById("textoSalida");
    const inputClave = document.getElementById("clave");
    const selectIdioma = document.getElementById("idioma");
    const customContainer = document.getElementById("customAlphabetContainer");
    const inputCustom = document.getElementById("alfabetoCustom");

    const displayDim = document.getElementById("matrixDimDisplay");
    const displayDet = document.getElementById("detDisplay");
    const displayInv = document.getElementById("invDisplay");
    const displayStatus = document.getElementById("matrixStatus");
    const matrixGrid = document.getElementById("matrixGrid");
    const vectoresDisplay = document.getElementById("vectoresDisplay");

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

    const ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"; // 27 letras
    const ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";   // 26 letras

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

            // 2. SUSCRIPCIÓN A LA RESPUESTA DE HILL
            stompClient.subscribe("/topic/hill", function (response) {
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
            CryptoUX.showToast("Conexión perdida", "Desconectado del servidor. Reconectando...", "error");
            setTimeout(connect, 3000);
        });
    }

    // Obtener alfabeto activo
    function obtenerAlfabeto() {
        const idioma = selectIdioma.value;
        if (idioma === "CUSTOM") {
            const customVal = inputCustom.value.toUpperCase();
            let cleaned = "";
            for (let i = 0; i < customVal.length; i++) {
                const char = customVal[i];
                if (cleaned.indexOf(char) === -1) {
                    cleaned += char;
                }
            }
            return cleaned;
        } else if (idioma === "EN") {
            return ALFABETO_EN;
        }
        return ALFABETO_ES;
    }

    function actualizarTablaEquivalencias(alfabeto) {
        const headersRow = document.getElementById("alphabetHeadersRow");
        const positionsRow = document.getElementById("alphabetPositionsRow");

        while (headersRow.cells.length > 1) {
            headersRow.deleteCell(1);
        }
        while (positionsRow.cells.length > 1) {
            positionsRow.deleteCell(1);
        }

        for (let i = 0; i < alfabeto.length; i++) {
            const char = alfabeto[i];

            const th = document.createElement("th");
            th.textContent = char;
            th.className = "px-2 py-2 border-b border-slate-850 text-slate-200 font-bold text-xs";
            headersRow.appendChild(th);

            const td = document.createElement("td");
            td.textContent = i;
            td.className = "px-2 py-3 text-violet-400 font-bold text-xs";
            positionsRow.appendChild(td);
        }
    }

    // Limpia caracteres no soportados
    function limpiarTexto(texto, alfabeto) {
        if (!texto) return "";
        let cleaned = "";
        const normalized = texto.toUpperCase();
        for (let i = 0; i < normalized.length; i++) {
            const char = normalized[i];
            if (alfabeto.indexOf(char) !== -1) {
                cleaned += char;
            }
        }
        return cleaned;
    }

    // --- Lógica de Álgebra Lineal en Cliente ---

    function calcularDeterminante(matrix, n) {
        if (n === 1) return matrix[0][0];
        if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

        let det = 0;
        let sign = 1;
        for (let f = 0; f < n; f++) {
            let temp = obtenerCofactor(matrix, 0, f, n);
            det += sign * matrix[0][f] * calcularDeterminante(temp, n - 1);
            sign = -sign;
        }
        return det;
    }

    function obtenerCofactor(matrix, p, q, n) {
        let temp = [];
        for (let row = 0; row < n; row++) {
            if (row === p) continue;
            let tempRow = [];
            for (let col = 0; col < n; col++) {
                if (col === q) continue;
                tempRow.push(matrix[row][col]);
            }
            temp.push(tempRow);
        }
        return temp;
    }

    function inversoModular(a, m) {
        a = (a % m + m) % m;
        for (let x = 1; x < m; x++) {
            if ((a * x) % m === 1) {
                return x;
            }
        }
        return -1;
    }

    // --- Actualización de la Interfaz de Parámetros ---

    function actualizarMatrizYMatematicas() {
        const claveOriginal = inputClave.value.toUpperCase();
        const alfabeto = obtenerAlfabeto();
        const m = alfabeto.length;

        // Actualizar la tabla de equivalencia superior
        actualizarTablaEquivalencias(alfabeto);

        // 1. Validar alfabeto
        if (alfabeto.length < 2) {
            marcarInvalido("Alfabeto incompleto");
            return;
        }

        // 2. Determinar dimensión
        const keyLen = claveOriginal.length;
        const dim = Math.sqrt(keyLen);
        if (dim <= 0 || dim % 1 !== 0 || keyLen === 0) {
            marcarInvalido("Clave no es cuadrado perfecto");
            displayDim.textContent = "-";
            matrixGrid.innerHTML = `<div class="text-slate-500 py-4">Ingresa clave de longitud 4, 9, 16...</div>`;
            return;
        }

        displayDim.textContent = `${dim}x${dim}`;

        // 3. Crear matriz numérica de clave
        let cleanedKey = limpiarTexto(claveOriginal, alfabeto);
        if (cleanedKey.length < keyLen) {
            // Rellenar si tiene caracteres que no están en el alfabeto
            let padded = cleanedKey;
            while (padded.length < keyLen) {
                padded += alfabeto[0];
            }
            cleanedKey = padded;
        }

        const matrix = [];
        let index = 0;
        for (let r = 0; r < dim; r++) {
            let row = [];
            for (let c = 0; c < dim; c++) {
                row.push(alfabeto.indexOf(cleanedKey[index++]));
            }
            matrix.push(row);
        }

        // 4. Calcular determinante e inverso modular
        const det = calcularDeterminante(matrix, dim);
        const detMod = (det % m + m) % m;
        const invDet = inversoModular(detMod, m);

        displayDet.textContent = `${det} (mod ${m} = ${detMod})`;

        // 5. Renderizar grid de matriz
        matrixGrid.style.gridTemplateColumns = `repeat(${dim}, minmax(0, 1fr))`;
        matrixGrid.innerHTML = "";

        for (let r = 0; r < dim; r++) {
            for (let c = 0; c < dim; c++) {
                const valNum = matrix[r][c];
                const charVal = cleanedKey[r * dim + c] || alfabeto[0];

                const cell = document.createElement("div");
                cell.className = "bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col items-center justify-center font-mono";
                cell.innerHTML = `<span class="text-slate-300 font-bold text-sm">${charVal}</span><span class="text-violet-400 text-[10px]">${valNum}</span>`;
                matrixGrid.appendChild(cell);
            }
        }

        // 6. Actualizar badges de validez
        if (invDet !== -1) {
            displayInv.textContent = invDet;
            displayStatus.textContent = "MATRIZ VÁLIDA";
            displayStatus.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
        } else {
            displayInv.textContent = "No existe";
            displayStatus.textContent = "NO INVERTIBLE (INVÁLIDA)";
            displayStatus.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/25";
        }
    }

    function marcarInvalido(motivo) {
        displayDet.textContent = "-";
        displayInv.textContent = "-";
        displayStatus.textContent = motivo.toUpperCase();
        displayStatus.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/25";
    }

    // --- Formación Visual de Vectores ---

    function actualizarVisualizacionDeVectores() {
        const texto = inputTexto.value;
        const alfabeto = obtenerAlfabeto();
        const keyLen = inputClave.value.length;
        const dim = Math.sqrt(keyLen);

        if (!texto) {
            vectoresDisplay.textContent = "Esperando texto...";
            return;
        }

        if (dim <= 0 || dim % 1 !== 0 || keyLen === 0) {
            vectoresDisplay.textContent = "Esperando matriz de clave válida...";
            return;
        }

        const cleaned = limpiarTexto(texto, alfabeto);
        if (!cleaned) {
            vectoresDisplay.textContent = "Ningún caracter soportado en el alfabeto actual.";
            return;
        }

        // Pading simulado con 'X'
        let sb = cleaned;
        const fillChar = alfabeto.indexOf("X") !== -1 ? "X" : alfabeto[alfabeto.length - 1];
        while (sb.length % dim !== 0) {
            sb += fillChar;
        }

        // Agrupar en bloques
        let bloques = [];
        for (let i = 0; i < sb.length; i += dim) {
            bloques.push(sb.substring(i, i + dim));
        }

        vectoresDisplay.textContent = bloques.join(" | ");
    }

    // --- Comunicación por WebSockets ---

    function enviarDatos(texto, operacion) {
        if (!stompClient || !stompClient.connected) return;

        if (!texto) {
            if (operacion === "CIFRAR") {
                outputTexto.value = "";
            } else {
                inputTexto.value = "";
            }
            return;
        }

        ultimaOperacion = operacion;

        stompClient.send("/app/hill", {}, JSON.stringify({
            texto: texto,
            operacion: operacion,
            clave: inputClave.value.toUpperCase() || "FORTALEZA",
            idioma: selectIdioma.value,
            alfabetoCustom: inputCustom.value
        }));
    }

    function cifrarDesdeOriginal() {
        ultimoCampoEditado = "original";
        enviarDatos(inputTexto.value, "CIFRAR");
        actualizarVisualizacionDeVectores();
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

    inputClave.addEventListener("input", (e) => {
        // Permitir solo caracteres alfabéticos
        const val = e.target.value.toUpperCase().replace(/[^A-ZÑ]/g, "");
        e.target.value = val;
        actualizarMatrizYMatematicas();
        actualizarVisualizacionDeVectores();
        recalcularDesdeUltimoCampo();
    });

    selectIdioma.addEventListener("change", (e) => {
        if (e.target.value === "CUSTOM") {
            customContainer.classList.remove("hidden");
        } else {
            customContainer.classList.add("hidden");
        }
        actualizarMatrizYMatematicas();
        actualizarVisualizacionDeVectores();
        recalcularDesdeUltimoCampo();
    });

    inputCustom.addEventListener("input", (e) => {
        const val = e.target.value.toUpperCase().replace(/[^A-ZÑ]/g, "");
        e.target.value = val;
        actualizarMatrizYMatematicas();
        actualizarVisualizacionDeVectores();
        recalcularDesdeUltimoCampo();
    });

    // UX: Copiar al portapapeles moderno
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

    // UX: Pegar en Texto Cifrado y descifrar
    btnPegarCifrado.addEventListener("click", async () => {
        try {
            const textoPortapapeles = await navigator.clipboard.readText();
            if (textoPortapapeles) {
                outputTexto.value = textoPortapapeles;
                descifrarDesdeCifrado();
                outputTexto.focus();
                CryptoUX.showToast("Pegado", "Texto insertado correctamente.", "success");
            }
        } catch (err) {
            CryptoUX.showToast("Permiso denegado", "Concede acceso al portapapeles en tu navegador.", "error");
        }
    });

    // UX: Pegar desde el portapapeles
    btnPegar.addEventListener("click", async () => {
        try {
            const textoPortapapeles = await navigator.clipboard.readText();
            if (textoPortapapeles) {
                inputTexto.value = textoPortapapeles;
                cifrarDesdeOriginal();
                inputTexto.focus();
                CryptoUX.showToast("Pegado", "Texto insertado correctamente.", "success");
            }
        } catch (err) {
            CryptoUX.showToast("Permiso denegado", "Concede acceso al portapapeles en tu navegador.", "error");
        }
    });

    // UX: Copiar Texto Original
    btnCopiarOriginal.addEventListener("click", async () => {
        if (!inputTexto.value) {
            CryptoUX.showToast("Aviso", "No hay texto para copiar.", "info");
            return;
        }
        try {
            await navigator.clipboard.writeText(inputTexto.value);
            CryptoUX.showToast("¡Copiado!", "Texto copiado al portapapeles.", "success");
        } catch {
            inputTexto.select();
            document.execCommand("copy");
        }
    });

    // Limpiar
    btnLimpiar.addEventListener("click", () => {
        inputTexto.value = "";
        outputTexto.value = "";
        ultimoCampoEditado = "original";
        actualizarVisualizacionDeVectores();
        inputTexto.focus();
    });

    // Inicialización
    actualizarMatrizYMatematicas();
    actualizarVisualizacionDeVectores();
    connect();
});