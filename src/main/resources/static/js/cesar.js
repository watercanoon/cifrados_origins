let stompClient = null;
let operacionActual = "CIFRAR";

const textoInput = document.getElementById("textoInput");
const textoOutput = document.getElementById("textoOutput");
const claveInput = document.getElementById("claveInput");
const idiomaSelect = document.getElementById("idiomaSelect");
const btnCifrar = document.getElementById("btnCifrar");
const btnDescifrar = document.getElementById("btnDescifrar");
const wsStatus = document.getElementById("ws-status");
let alertaEnMostrada = false;

function actualizarEstadoConectado(conectado) {
    wsStatus.classList.toggle("bg-red-500", !conectado);
    wsStatus.classList.toggle("bg-emerald-500", conectado);
    wsStatus.classList.toggle("animate-pulse", !conectado);
    wsStatus.title = conectado ? "Conectado" : "Desconectado";
}

function seleccionarOperacion(operacion) {
    operacionActual = operacion;

    const cifrarActivo = operacion === "CIFRAR";
    btnCifrar.className = cifrarActivo
            ? "flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-l-lg transition-colors"
            : "flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-l-lg hover:bg-slate-600 transition-colors";
    btnDescifrar.className = cifrarActivo
            ? "flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-r-lg hover:bg-slate-600 transition-colors"
            : "flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-r-lg transition-colors";

    enviarCifrado();
}

function obtenerPayload() {
    return {
        texto: textoInput.value,
        clave: claveInput.value || "3",
        operacion: operacionActual,
        idioma: idiomaSelect.value
    };
}

function validarTextoPorIdioma() {
    if (idiomaSelect.value !== "EN") {
        alertaEnMostrada = false;
        return;
    }

    if (!/[ñÑ]/.test(textoInput.value)) {
        return;
    }

    textoInput.value = textoInput.value.replace(/[ñÑ]/g, "");
    textoOutput.value = "";

    if (!alertaEnMostrada) {
        alert("El alfabeto ingles no incluye la letra Ñ.");
        alertaEnMostrada = true;
    }
}

function enviarCifrado() {
    validarTextoPorIdioma();

    if (!stompClient || !stompClient.connected) {
        return;
    }

    if (!textoInput.value.trim()) {
        textoOutput.value = "";
        return;
    }

    stompClient.send("/app/cesar", {}, JSON.stringify(obtenerPayload()));
}

function conectarWebSocket() {
    const socket = new SockJS("/ws-criptografia");
    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect({}, function () {
        actualizarEstadoConectado(true);
        stompClient.subscribe("/topic/cesar", function (mensaje) {
            const respuesta = JSON.parse(mensaje.body);
            textoOutput.value = respuesta.resultado || "";
        });
        enviarCifrado();
    }, function () {
        actualizarEstadoConectado(false);
        setTimeout(conectarWebSocket, 2000);
    });
}

textoInput.addEventListener("input", enviarCifrado);
claveInput.addEventListener("input", enviarCifrado);
idiomaSelect.addEventListener("change", function () {
    alertaEnMostrada = false;
    enviarCifrado();
});
btnCifrar.addEventListener("click", function () {
    seleccionarOperacion("CIFRAR");
});
btnDescifrar.addEventListener("click", function () {
    seleccionarOperacion("DESCIFRAR");
});

actualizarEstadoConectado(false);
conectarWebSocket();
