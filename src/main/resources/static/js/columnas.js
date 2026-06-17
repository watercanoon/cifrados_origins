// src/main/resources/static/js/columnas.js

document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;
    let ultimoCampoEditado = "original";
    let ultimaOperacion = "CIFRAR";

    const inputTexto = document.getElementById("textoEntrada");
    const outputTexto = document.getElementById("textoSalida");
    
    const selectTipo = document.getElementById("tipoCifrado");
    const inputClave = document.getElementById("clave");
    const inputNumCols = document.getElementById("numCols");
    const colsDisplay = document.getElementById("colsValueDisplay");
    
    const selectAlfabeto = document.getElementById("idioma");
    const inputCustom = document.getElementById("alfabetoCustom");
    const customAlphabetContainer = document.getElementById("customAlphabetContainer");
    const displayAlfabeto = document.getElementById("displayAlfabeto");

    const simpleColsContainer = document.getElementById("simpleColsContainer");
    const claveKeyContainer = document.getElementById("claveKeyContainer");
    
    const displayNc = document.getElementById("displayNc");
    const displayLc = document.getElementById("displayLc");
    const displayNf = document.getElementById("displayNf");
    const keyStatus = document.getElementById("keyStatus");
    
    const matrixTable = document.getElementById("matrixTable");

    const btnCopiar = document.getElementById("btnCopiar");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const btnPegar = document.getElementById("btnPegar");

    const ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    const ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // Conectar WebSocket
    function connect() {
        const socket = new SockJS("/ws-criptografia");
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function () {
            stompClient.subscribe("/topic/columnas", function (response) {
                const data = JSON.parse(response.body);

                if (data.error) {
                    mostrarError(data.error);
                    return;
                }

                if (ultimaOperacion === "CIFRAR") {
                    outputTexto.value = data.resultado;
                } else {
                    inputTexto.value = data.resultado;
                }
            });

            recalcularDesdeUltimoCampo();
        }, function () {
            mostrarError("Desconectado del servidor. Reconectando...");
            setTimeout(connect, 3000);
        });
    }

    // Limpiar alfabeto personalizado
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
        
        // Reemplazar vocales acentuadas
        normalized = normalized.replace(/Á/g, "A")
                               .replace(/É/g, "E")
                               .replace(/Í/g, "I")
                               .replace(/Ó/g, "O")
                               .replace(/Ú/g, "U")
                               .replace(/Ü/g, "U");
                               
        // Si el alfabeto no incluye Ñ pero sí incluye N, convertir Ñ a N
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
        
        let nc = 7;
        let claveLimpia = "";
        let priorities = [];
        let keyIsValid = true;

        if (tipo === "SIMPLE") {
            nc = parseInt(inputNumCols.value);
            displayNc.textContent = nc;
            keyStatus.textContent = "VÁLIDA";
            keyStatus.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
        } else {
            const rawKey = inputClave.value.toUpperCase();
            claveLimpia = limpiarTexto(rawKey, alfabeto);
            nc = claveLimpia.length;
            displayNc.textContent = nc > 0 ? nc : "-";
            
            if (nc < 2) {
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

        if (!keyIsValid || nc <= 0) {
            displayNf.textContent = "-";
            matrixTable.innerHTML = `<tr><td class="text-slate-500 py-6">Configura una clave válida para ver la matriz</td></tr>`;
            return;
        }

        // Calcular número de filas
        const nf = Math.max(1, Math.ceil(cleanedText.length / nc));
        displayNf.textContent = nf;

        // Construir tabla HTML
        matrixTable.innerHTML = "";

        // 1. Cabecera (Letras o Índices)
        const headerRow = document.createElement("tr");
        headerRow.className = "border-b border-slate-800 font-bold bg-slate-900/30 text-slate-200 text-xs";
        
        const firstHeader = document.createElement("th");
        firstHeader.textContent = tipo === "SIMPLE" ? "Cols" : "Clave";
        firstHeader.className = "px-3 py-2 border-r border-slate-800 text-slate-400 font-semibold w-20";
        headerRow.appendChild(firstHeader);

        for (let c = 0; c < nc; c++) {
            const th = document.createElement("th");
            if (tipo === "SIMPLE") {
                th.textContent = `C${c + 1}`;
                th.className = "px-3 py-2 border-r border-slate-850 text-slate-300";
            } else {
                const letter = claveLimpia[c];
                const prio = priorities[c];
                th.innerHTML = `<div class="text-amber-400 font-black text-sm">${letter}</div><div class="text-[10px] text-slate-500 mt-0.5">${prio}</div>`;
                th.className = "px-3 py-1.5 border-r border-slate-850 bg-slate-900/10";
            }
            headerRow.appendChild(th);
        }
        matrixTable.appendChild(headerRow);

        // Determinar el caracter de relleno
        const paddingChar = alfabeto.includes("X") ? "X" : (alfabeto.length > 0 ? alfabeto[alfabeto.length - 1] : "X");

        // 2. Filas de datos
        let textIdx = 0;
        for (let r = 0; r < nf; r++) {
            const row = document.createElement("tr");
            row.className = "border-b border-slate-800/50 hover:bg-slate-900/20 transition-colors";
            
            const rowLabel = document.createElement("td");
            rowLabel.textContent = `Fila ${r + 1}`;
            rowLabel.className = "px-3 py-2 border-r border-slate-800 text-xs text-slate-400 font-semibold bg-slate-900/5";
            row.appendChild(rowLabel);

            for (let c = 0; c < nc; c++) {
                const td = document.createElement("td");
                td.className = "px-3 py-2 border-r border-slate-850 font-mono text-sm";
                
                if (textIdx < cleanedText.length) {
                    td.textContent = cleanedText[textIdx++];
                    td.className += " text-slate-200";
                } else {
                    // Celdas de relleno
                    td.textContent = paddingChar;
                    td.className += " text-slate-600 font-bold bg-slate-900/10";
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
            clave = inputNumCols.value;
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

        stompClient.send("/app/columnas", {}, JSON.stringify({
            texto: texto,
            operacion: operacion,
            clave: clave,
            tipoColumnas: tipo,
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

    inputNumCols.addEventListener("input", (e) => {
        colsDisplay.textContent = e.target.value;
        actualizarMatrizVisual();
        recalcularDesdeUltimoCampo();
    });

    inputClave.addEventListener("input", (e) => {
        // Sanitizar clave con respecto al alfabeto activo
        const alfabeto = obtenerAlfabetoActivo();
        const val = limpiarTexto(e.target.value, alfabeto);
        e.target.value = val;
        actualizarMatrizVisual();
        recalcularDesdeUltimoCampo();
    });

    selectTipo.addEventListener("change", (e) => {
        if (e.target.value === "SIMPLE") {
            simpleColsContainer.classList.remove("hidden");
            claveKeyContainer.classList.add("hidden");
        } else {
            simpleColsContainer.classList.add("hidden");
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

    // Copiar
    btnCopiar.addEventListener("click", () => {
        if (!outputTexto.value) return;
        outputTexto.select();
        document.execCommand("copy");
        
        const originalText = btnCopiar.innerHTML;
        btnCopiar.innerHTML = `Copiado!`;
        btnCopiar.classList.add("bg-cyan-500", "text-white");
        btnCopiar.classList.remove("bg-slate-800", "text-slate-300");
        setTimeout(() => {
            btnCopiar.innerHTML = originalText;
            btnCopiar.classList.remove("bg-cyan-500", "text-white");
            btnCopiar.classList.add("bg-slate-800", "text-slate-300");
        }, 1500);
    });

    // Pegar
    btnPegar.addEventListener("click", async () => {
        try {
            const textoPortapapeles = await navigator.clipboard.readText();
            if (textoPortapapeles) {
                inputTexto.value = textoPortapapeles;
                cifrarDesdeOriginal();
                inputTexto.focus();
            }
        } catch (err) {
            mostrarError("Permiso denegado. Concede acceso al portapapeles en tu navegador.");
        }
    });

    // Limpiar
    btnLimpiar.addEventListener("click", () => {
        inputTexto.value = "";
        outputTexto.value = "";
        ultimoCampoEditado = "original";
        actualizarMatrizVisual();
        inputTexto.focus();
    });

    // Mostrar errores tipo Toast
    function mostrarError(mensaje) {
        const container = document.getElementById("toast-container");
        const toast = document.createElement("div");
        toast.className = "bg-red-500/90 text-white px-4 py-3 rounded shadow-lg border border-red-700 flex items-center gap-3 backdrop-blur-sm animate-fade-in";
        toast.innerHTML = `<span class="text-sm font-medium">${mensaje}</span>`;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.5s ease";
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // Inicializar
    actualizarMatrizVisual();
    connect();
});
