// src/main/resources/static/js/atbash.js

document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;
    let ultimoCampoEditado = "entrada";

    const inputTexto = document.getElementById("textoEntrada");
    const outputTexto = document.getElementById("textoSalida");
    const idiomaSelect = document.getElementById("idioma");
    const customContainer = document.getElementById("customAlphabetContainer");
    const inputCustom = document.getElementById("alfabetoCustom");

    const gridTop = document.getElementById("alfabetoTop");
    const gridBottom = document.getElementById("alfabetoBottom");
    const charIn = document.getElementById("charIn");
    const charOut = document.getElementById("charOut");
    const connDot = document.getElementById("connDot");
    const connLabel = document.getElementById("connLabel");

    const btnCopiar = document.getElementById("btnCopiar");
    const btnPegar = document.getElementById("btnPegar");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const btnCopiarOriginal = document.getElementById("btnCopiarOriginal");
    const btnPegarCifrado = document.getElementById("btnPegarCifrado");

    const ALFABETO_ES = "ABCDEFGHIJKLMN\u00d1OPQRSTUVWXYZ";
    const ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    function setConnStatus(online) {
        connDot.classList.toggle("connected", online);
        connLabel.textContent = online ? "online" : "offline";
    }

    function limpiarAlfabeto(valor) {
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
        if (idiomaSelect.value === "CUSTOM") {
            const custom = limpiarAlfabeto(inputCustom.value);
            return custom.length >= 2 ? custom : "";
        }

        return idiomaSelect.value === "EN" ? ALFABETO_EN : ALFABETO_ES;
    }

    function obtenerReflejo(alfabeto) {
        return alfabeto.split("").reverse().join("");
    }

    function actualizarMapa() {
        const alfabeto = obtenerAlfabeto();
        const reflejo = obtenerReflejo(alfabeto);

        gridTop.innerHTML = "";
        gridBottom.innerHTML = "";

        if (!alfabeto) {
            gridTop.innerHTML = '<div class="text-xs text-slate-500 px-2 py-1">Ingresa un alfabeto personalizado válido.</div>';
            gridBottom.innerHTML = "";
            charIn.textContent = "-";
            charOut.textContent = "-";
            return;
        }

        for (let i = 0; i < alfabeto.length; i++) {
            const baseCell = document.createElement("div");
            baseCell.className = "letter-cell base-cell";
            baseCell.textContent = alfabeto[i];
            baseCell.dataset.char = alfabeto[i];
            gridTop.appendChild(baseCell);

            const cipherCell = document.createElement("div");
            cipherCell.className = "letter-cell cipher-cell";
            cipherCell.textContent = reflejo[i];
            cipherCell.dataset.char = reflejo[i];
            gridBottom.appendChild(cipherCell);
        }
    }

    function resaltarCaracter(char) {
        document.querySelectorAll(".active-base, .active-cipher").forEach(el => {
            el.classList.remove("active-base", "active-cipher");
        });

        if (!char) {
            charIn.textContent = "-";
            charOut.textContent = "-";
            return;
        }

        const alfabeto = obtenerAlfabeto();
        if (!alfabeto) return;

        const upper = char.toUpperCase();
        const index = alfabeto.indexOf(upper);

        if (index === -1) {
            charIn.textContent = char === " " ? "ESP" : char;
            charOut.textContent = char === " " ? "ESP" : char;
            return;
        }

        const reflejo = obtenerReflejo(alfabeto);
        const salida = reflejo[index];
        const baseCell = gridTop.children[index];
        const cipherCell = gridBottom.children[index];

        if (baseCell) baseCell.classList.add("active-base");
        if (cipherCell) cipherCell.classList.add("active-cipher");

        charIn.textContent = upper;
        charOut.textContent = salida;
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

            // 1. ESCUCHADOR DE ERRORES GLOBALES
            stompClient.subscribe('/user/queue/errores', function(errorResponse) {
                CryptoUX.processWebSocketResponse(errorResponse.body);
            });

            // 2. ESCUCHADOR DE ATBASH
            stompClient.subscribe("/topic/atbash", function (response) {
                // CryptoUX verifica la respuesta
                const data = CryptoUX.processWebSocketResponse(response.body);

                // Si data existe, se procesa exitosamente
                if (data) {
                    if (ultimoCampoEditado === "entrada") {
                        outputTexto.value = data.resultado;
                    } else {
                        inputTexto.value = data.resultado;
                    }
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

        actualizarMapa();
        resaltarCaracter(texto.charAt(texto.length - 1));

        if (!texto) {
            if (origen === "entrada") {
                outputTexto.value = "";
            } else {
                inputTexto.value = "";
            }
            return;
        }

        if (idiomaSelect.value === "CUSTOM" && !obtenerAlfabeto()) {
            CryptoUX.showToast("Alfabeto Inválido", "El alfabeto personalizado necesita al menos 2 letras distintas.", "error");
            return;
        }

        if (!stompClient || !stompClient.connected) return;

        stompClient.send("/app/atbash", {}, JSON.stringify({
            texto,
            operacion: origen === "entrada" ? "CIFRAR" : "DESCIFRAR",
            idioma: idiomaSelect.value,
            alfabetoCustom: limpiarAlfabeto(inputCustom.value)
        }));
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================
    inputTexto.addEventListener("input", () => enviarDatos("entrada"));
    outputTexto.addEventListener("input", () => enviarDatos("salida"));

    idiomaSelect.addEventListener("change", () => {
        customContainer.classList.toggle("hidden", idiomaSelect.value !== "CUSTOM");
        actualizarMapa();
        enviarDatos(ultimoCampoEditado);
    });

    inputCustom.addEventListener("input", () => {
        inputCustom.value = limpiarAlfabeto(inputCustom.value);
        actualizarMapa();
        enviarDatos(ultimoCampoEditado);
    });

    // UX PORTAPAPELES
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
            CryptoUX.showToast("Acceso denegado", "Permiso de portapapeles denegado.", "error");
        }
    });

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

    btnLimpiar.addEventListener("click", () => {
        inputTexto.value = "";
        outputTexto.value = "";
        resaltarCaracter("");
        inputTexto.focus();
    });

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

    btnPegarCifrado.addEventListener("click", async () => {
        try {
            const textoPortapapeles = await navigator.clipboard.readText();
            if (textoPortapapeles) {
                outputTexto.value = textoPortapapeles;
                enviarDatos("salida");
                outputTexto.focus();
                CryptoUX.showToast("Pegado", "Texto insertado correctamente.", "success");
            }
        } catch {
            CryptoUX.showToast("Acceso denegado", "Permiso de portapapeles denegado.", "error");
        }
    });

    // Inicialización
    actualizarMapa();
    connect();
});