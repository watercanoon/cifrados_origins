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
        stompClient.debug = null;

        stompClient.connect({}, function () {
            stompClient.subscribe("/topic/cesar", function (response) {
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
            mostrarError("Ingresa un alfabeto personalizado para procesar el texto.");
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

    btnCopiar.addEventListener("click", () => {
        outputTexto.select();
        document.execCommand("copy");
    });

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

    btnLimpiar.addEventListener("click", () => {
        inputTexto.value = "";
        outputTexto.value = "";
        ultimoCampoEditado = "original";
        inputTexto.focus();
    });

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

    actualizarAlfabetos();
    connect();
});
