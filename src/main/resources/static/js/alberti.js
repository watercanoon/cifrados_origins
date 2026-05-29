let stompClient = null;

const textoInput = document.getElementById("textoInput");
const textoOutput = document.getElementById("textoOutput");

const giroInput = document.getElementById("giroInput");
const bloqueInput = document.getElementById("bloqueInput");
const dirInput = document.getElementById("dirInput");

const wsStatus = document.getElementById("ws-status");

function setStatus(ok) {
    wsStatus.classList.toggle("bg-red-500", !ok);
    wsStatus.classList.toggle("bg-emerald-500", ok);
}

function enviar() {

    if (!stompClient || !stompClient.connected) return;

    stompClient.send("/app/alberti", {}, JSON.stringify({
        texto: textoInput.value,
        giro: parseInt(giroInput.value || "1"),
        bloque: parseInt(bloqueInput.value || "4"),
        direccion: dirInput.value,
        operacion: "CIFRAR"
    }));
}

function nuevo() {
    textoInput.value = "";
    textoOutput.value = "";
}

document.getElementById("btnCifrar").addEventListener("click", enviar);
document.getElementById("btnNuevo").addEventListener("click", nuevo);

textoInput.addEventListener("input", enviar);
giroInput.addEventListener("input", enviar);
bloqueInput.addEventListener("input", enviar);
dirInput.addEventListener("change", enviar);

function conectar() {
    const socket = new SockJS("/ws-criptografia");
    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect({}, () => {

        setStatus(true);

        stompClient.subscribe("/topic/alberti", msg => {
            const res = JSON.parse(msg.body);
            textoOutput.value = res.resultado;
        });

    }, () => {
        setStatus(false);
        setTimeout(conectar, 2000);
    });
}

conectar();