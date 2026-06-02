let stompClient = null;

const textoInput = document.getElementById("textoInput");
const textoOutput = document.getElementById("textoOutput");
const wsStatus = document.getElementById("ws-status");
let alertaLetrasMostrada = false;

function actualizarEstadoConectado(conectado) {
    wsStatus.classList.toggle("bg-red-500", !conectado);
    wsStatus.classList.toggle("bg-emerald-500", conectado);
    wsStatus.classList.toggle("animate-pulse", !conectado);
    wsStatus.title = conectado ? "Conectado" : "Desconectado";
}

function enviarCifrado() {
    const textoOriginal = textoInput.value;
    const soloDigitos = textoOriginal.replace(/\D/g, "");

    if (textoOriginal !== soloDigitos) {
        textoInput.value = soloDigitos;
        textoOutput.value = "";

        if (/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(textoOriginal) && !alertaLetrasMostrada) {
            alert("ROT5 solo acepta numeros del 0 al 9.");
            alertaLetrasMostrada = true;
        }
    }

    if (!stompClient || !stompClient.connected) {
        return;
    }

    if (!textoInput.value.trim()) {
        textoOutput.value = "";
        return;
    }

    stompClient.send("/app/rot5", {}, JSON.stringify({
        texto: textoInput.value,
        operacion: "CIFRAR"
    }));
}

function conectarWebSocket() {
    const socket = new SockJS("/ws-criptografia");
    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect({}, function () {
        actualizarEstadoConectado(true);
        stompClient.subscribe("/topic/rot5", function (mensaje) {
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

actualizarEstadoConectado(false);
conectarWebSocket();
