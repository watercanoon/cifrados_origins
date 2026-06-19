// src/main/resources/static/js/playfair.js

document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;
    let ultimoCampoEditado = "original";
    let ultimaOperacion = "CIFRAR";

    const inputTexto = document.getElementById("textoEntrada");
    const outputTexto = document.getElementById("textoSalida");
    const inputClave = document.getElementById("clave");
    const matrixGrid = document.getElementById("matrixGrid");
    const btnCopiar = document.getElementById("btnCopiar");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const btnPegar = document.getElementById("btnPegar");
    const btnCopiarOriginal = document.getElementById("btnCopiarOriginal");
    const btnPegarCifrado = document.getElementById("btnPegarCifrado");
    const connDot = document.getElementById("connDot");
    const connLabel = document.getElementById("connLabel");
    const digrafosDisplay = document.getElementById("digrafosDisplay");
    const selectIdioma = document.getElementById("idioma");
    const customContainer = document.getElementById("customAlphabetContainer");
    const inputCustom = document.getElementById("alfabetoCustom");

    const ALFABETO = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // La 'J' se une a la 'I'

    function setConnStatus(online) {
        if (connDot && connLabel) {
            connDot.classList.toggle("connected", online);
            connLabel.textContent = online ? "online" : "offline";
        }
    }

    // ==========================================
    // CONEXIÓN WEBSOCKET Y NOTIFICACIONES
    // ==========================================
    function connect() {
        const socket = new SockJS("/ws-criptografia");
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Desactiva logs excesivos en la consola

        stompClient.connect({}, function () {
            setConnStatus(true);

            // 1. SUSCRIPCIÓN GLOBAL DE ERRORES (Atrapa excepciones del backend)
            stompClient.subscribe('/user/queue/errores', function(errorResponse) {
                CryptoUX.processWebSocketResponse(errorResponse.body);
            });

            // 2. SUSCRIPCIÓN A LA RESPUESTA DE PLAYFAIR
            stompClient.subscribe("/topic/playfair", function (response) {
                const data = CryptoUX.processWebSocketResponse(response.body);

                if (data) {
                    if (ultimaOperacion === "CIFRAR") {
                        outputTexto.value = data.resultado;
                    } else {
                        inputTexto.value = data.resultado.toLowerCase();
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

    function obtenerAlfabetoBase() {
        const idioma = selectIdioma.value;
        if (idioma === "CUSTOM") {
            let customVal = inputCustom.value.toUpperCase().replace(/J/g, "I");
            let cleaned = "";
            for (let i = 0; i < customVal.length; i++) {
                const char = customVal[i];
                if (char >= 'A' && char <= 'Z' && cleaned.indexOf(char) === -1) {
                    cleaned += char;
                }
            }
            for (let i = 0; i < ALFABETO.length; i++) {
                const char = ALFABETO[i];
                if (cleaned.length >= 25) break;
                if (cleaned.indexOf(char) === -1) {
                    cleaned += char;
                }
            }
            return cleaned;
        }
        return ALFABETO;
    }

    // Generar y actualizar visualmente la matriz 5x5
    function actualizarMatrizVisual() {
        const claveOriginal = inputClave.value.toUpperCase();
        const idioma = selectIdioma.value;
        const alfabetoBase = obtenerAlfabetoBase();

        // 1. Normalizar clave
        let claveProcesada = claveOriginal.replace(/J/g, "I");
        if (idioma === "ES") {
            claveProcesada = claveProcesada.replace(/Ñ/g, "N");
        }

        // 2. Limpiar clave de caracteres duplicados y no permitidos por el alfabeto base
        let claveLimpia = "";
        for (let i = 0; i < claveProcesada.length; i++) {
            const char = claveProcesada[i];
            if (alfabetoBase.indexOf(char) !== -1 && claveLimpia.indexOf(char) === -1) {
                claveLimpia += char;
            }
        }

        // 3. Combinar clave limpia con el resto del alfabeto base
        let combinacion = claveLimpia;
        for (let i = 0; i < alfabetoBase.length; i++) {
            const char = alfabetoBase[i];
            if (combinacion.indexOf(char) === -1) {
                combinacion += char;
            }
        }

        // 4. Renderizar la cuadrícula 5x5
        matrixGrid.innerHTML = "";
        for (let i = 0; i < combinacion.length; i++) {
            const char = combinacion[i];
            const isFromKey = claveLimpia.indexOf(char) !== -1;

            const cell = document.createElement("div");

            if (char === 'I') {
                cell.textContent = 'I/J';
            } else if (char === 'N' && idioma === "ES") {
                cell.textContent = 'N/Ñ';
            } else {
                cell.textContent = char;
            }

            cell.className = `h-10 flex items-center justify-center rounded-lg text-sm transition-all border font-mono ` +
                (isFromKey
                    ? "bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-sm shadow-orange-500/5"
                    : "bg-slate-900 text-slate-400 border-slate-800");

            matrixGrid.appendChild(cell);
        }
    }

    // Envía los datos al servidor por WebSocket
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

        stompClient.send("/app/playfair", {}, JSON.stringify({
            texto: texto,
            operacion: operacion,
            clave: inputClave.value.toUpperCase(),
            idioma: selectIdioma.value,
            alfabetoCustom: inputCustom.value
        }));
    }

    function mostrarDigrafos(texto) {
        if (!texto) {
            digrafosDisplay.textContent = "Esperando texto...";
            return;
        }

        const idioma = selectIdioma.value;
        const alfabetoBase = obtenerAlfabetoBase();

        // 1. Limpiar texto
        let cleaned = texto.toUpperCase().replace(/J/g, "I");
        if (idioma === "ES") {
            cleaned = cleaned.replace(/Ñ/g, "N");
        }

        // Quedarse solo con caracteres del alfabeto base
        let filtered = "";
        for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i];
            if (alfabetoBase.indexOf(char) !== -1) {
                filtered += char;
            }
        }

        if (!filtered) {
            digrafosDisplay.textContent = "Esperando letras válidas...";
            return;
        }

        let pairs = [];
        for (let i = 0; i < filtered.length; i += 2) {
            if (i === filtered.length - 1) {
                pairs.push(filtered[i] + "X");
            } else if (filtered[i] === filtered[i + 1]) {
                const fillChar = (filtered[i] === 'X') ? 'Q' : 'X';
                pairs.push(filtered[i] + fillChar);
                i--;
            } else {
                pairs.push(filtered[i] + filtered[i + 1]);
            }
        }

        digrafosDisplay.textContent = pairs.join(" | ");
    }

    function cifrarDesdeOriginal() {
        ultimoCampoEditado = "original";
        enviarDatos(inputTexto.value, "CIFRAR");
        mostrarDigrafos(inputTexto.value);
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

    // Escuchadores de eventos
    inputTexto.addEventListener("input", cifrarDesdeOriginal);
    outputTexto.addEventListener("input", descifrarDesdeCifrado);

    inputClave.addEventListener("input", (e) => {
        const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
        e.target.value = val;
        actualizarMatrizVisual();
        recalcularDesdeUltimoCampo();
    });

    selectIdioma.addEventListener("change", (e) => {
        if (e.target.value === "CUSTOM") {
            customContainer.classList.remove("hidden");
        } else {
            customContainer.classList.add("hidden");
        }
        actualizarMatrizVisual();
        recalcularDesdeUltimoCampo();
    });

    inputCustom.addEventListener("input", (e) => {
        const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
        e.target.value = val;
        actualizarMatrizVisual();
        recalcularDesdeUltimoCampo();
    });

    // UX: Copiar resultado al portapapeles
    btnCopiar.addEventListener("click", () => {
        if (!outputTexto.value) {
            CryptoUX.showToast("Aviso", "No hay texto para copiar.", "info");
            return;
        }
        navigator.clipboard.writeText(outputTexto.value).then(() => {
            CryptoUX.showToast("¡Copiado!", "Texto cifrado copiado al portapapeles.", "success");
        }).catch(() => {
            outputTexto.select();
            document.execCommand("copy");
        });
    });

    // UX: Pegar contenido en Texto Cifrado y descifrar
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

    // UX: Pegar contenido desde el portapapeles en Texto Original
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

    // UX: Copiar Texto Original al portapapeles
    btnCopiarOriginal.addEventListener("click", () => {
        if (!inputTexto.value) {
            CryptoUX.showToast("Aviso", "No hay texto para copiar.", "info");
            return;
        }
        navigator.clipboard.writeText(inputTexto.value).then(() => {
            CryptoUX.showToast("¡Copiado!", "Texto original copiado al portapapeles.", "success");
        }).catch(() => {
            inputTexto.select();
            document.execCommand("copy");
        });
    });

    // Limpiar campos
    btnLimpiar.addEventListener("click", () => {
        inputTexto.value = "";
        outputTexto.value = "";
        ultimoCampoEditado = "original";
        mostrarDigrafos("");
        inputTexto.focus();
    });

    // Inicializar interfaz
    actualizarMatrizVisual();
    connect();
});