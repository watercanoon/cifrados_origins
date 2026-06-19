// src/main/resources/static/js/cesar.js

document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;
    let ultimoCampoEditado = "original";
    let ultimaOperacion = "CIFRAR";

    const inputTexto = document.getElementById("textoEntrada");
    const outputTexto = document.getElementById("textoSalida");
    const inputClave = document.getElementById("clave");
    const displayClave = document.getElementById("claveValueDisplay");
    const selectIdioma = document.getElementById("idioma");
    const customContainer = document.getElementById("customAlphabetContainer");
    const inputCustom = document.getElementById("alfabetoCustom");
    const alfabetoBaseDisplay = document.getElementById("alfabetoBaseDisplay");
    const alfabetoCifradoDisplay = document.getElementById("alfabetoCifradoDisplay");
    const btnCopiar = document.getElementById("btnCopiar");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const btnPegar = document.getElementById("btnPegar");

    const ALFABETO_ES = "ABCDEFGHIJKLMN\u00d1OPQRSTUVWXYZ";
    const ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    function connect() {
        const socket = new SockJS("/ws-criptografia");
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Desactiva los logs molestos en consola

        stompClient.connect({}, function (frame) {

            // 1. SUSCRIPCIÓN GLOBAL DE ERRORES (Atrapa excepciones del backend)
            stompClient.subscribe('/user/queue/errores', function(errorResponse) {
                CryptoUX.processWebSocketResponse(errorResponse.body);
            });

            // 2. SUSCRIPCIÓN A LA RESPUESTA DE CÉSAR
            stompClient.subscribe("/topic/cesar", function (response) {
                // CryptoUX se encarga de parsear y verificar si hay error
                const data = CryptoUX.processWebSocketResponse(response.body);

                // Si 'data' existe, la operación fue exitosa
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
            CryptoUX.showToast("Conexión perdida", "Desconectado del servidor. Reconectando...", "error");
            setTimeout(connect, 3000);
        });
    }

    function obtenerAlfabetoActual() {
        if (selectIdioma.value === "CUSTOM") {
            return inputCustom.value.trim().toUpperCase();
        }
        return selectIdioma.value === "EN" ? ALFABETO_EN : ALFABETO_ES;
    }

    function actualizarAlfabetos() {
        const alfabeto = obtenerAlfabetoActual();

        if (!alfabeto) {
            alfabetoBaseDisplay.textContent = "Ingresa un alfabeto personalizado.";
            alfabetoCifradoDisplay.textContent = "Esperando alfabeto...";
            return;
        }

        const modulo = alfabeto.length;
        const desplazamiento = Number(inputClave.value) % modulo;
        const alfabetoCifrado = alfabeto.slice(desplazamiento) + alfabeto.slice(0, desplazamiento);

        alfabetoBaseDisplay.textContent = alfabeto;
        alfabetoCifradoDisplay.textContent = alfabetoCifrado;
    }

    function enviarDatos(texto, operacion) {
        actualizarAlfabetos();

        if (!stompClient || !stompClient.connected) return;

        if (!texto) {
            if (operacion === "CIFRAR") {
                outputTexto.value = "";
            } else {
                inputTexto.value = "";
            }
            return;
        }

        if (selectIdioma.value === "CUSTOM" && !inputCustom.value.trim()) {
            CryptoUX.showToast("Alfabeto Vacío", "Ingresa un alfabeto personalizado para procesar el texto.", "error");
            return;
        }

        ultimaOperacion = operacion;

        stompClient.send("/app/cesar", {}, JSON.stringify({
            texto: texto,
            operacion: operacion,
            clave: inputClave.value,
            idioma: selectIdioma.value,
            alfabetoCustom: inputCustom.value
        }));
    }

    function cifrarDesdeOriginal() {
        ultimoCampoEditado = "original";
        enviarDatos(inputTexto.value, "CIFRAR");
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

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    inputTexto.addEventListener("input", cifrarDesdeOriginal);
    outputTexto.addEventListener("input", descifrarDesdeCifrado);

    inputClave.addEventListener("input", (e) => {
        displayClave.innerText = e.target.value;
        actualizarAlfabetos();
        recalcularDesdeUltimoCampo();
    });

    inputCustom.addEventListener("input", () => {
        actualizarAlfabetos();
        recalcularDesdeUltimoCampo();
    });

    selectIdioma.addEventListener("change", (e) => {
        if (e.target.value === "CUSTOM") {
            customContainer.classList.remove("hidden");
        } else {
            customContainer.classList.add("hidden");
        }
        actualizarAlfabetos();
        recalcularDesdeUltimoCampo();
    });

    // UX: Copiar al portapapeles moderno
    btnCopiar.addEventListener("click", () => {
        if (!outputTexto.value) {
            CryptoUX.showToast("Aviso", "No hay texto para copiar.", "info");
            return;
        }
        navigator.clipboard.writeText(outputTexto.value).then(() => {
            CryptoUX.showToast("¡Copiado!", "Texto cifrado copiado al portapapeles.", "success");
        }).catch(() => {
            CryptoUX.showToast("Error", "No se pudo copiar el texto.", "error");
        });
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

    btnLimpiar.addEventListener("click", () => {
        inputTexto.value = "";
        outputTexto.value = "";
        ultimoCampoEditado = "original";
        inputTexto.focus();
    });

    // Inicialización
    actualizarAlfabetos();
    connect();
});