let stompClient = null;

document.addEventListener("DOMContentLoaded", function () {

    const textoInput = document.getElementById("textoInput");
    const textoOutput = document.getElementById("textoOutput");
    const wsStatus = document.getElementById("ws-status");
    const btn = document.getElementById("btnCifrar");

    function setStatus(ok) {
        wsStatus.classList.toggle("bg-red-500", !ok);
        wsStatus.classList.toggle("bg-green-500", ok);
    }

    function enviar() {

        if (!stompClient || !stompClient.connected) return;

        if (!textoInput.value.trim()) {
            textoOutput.value = "";
            return;
        }

        stompClient.send("/app/rot47", {}, JSON.stringify({
            texto: textoInput.value,
            operacion: "CIFRAR"
        }));
    }

    btn.addEventListener("click", enviar);

    textoInput.addEventListener("input", enviar);

    function conectar() {

        const socket = new SockJS("/ws-criptografia");
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, () => {

            setStatus(true);

            stompClient.subscribe("/topic/rot47", msg => {
                const res = JSON.parse(msg.body);
                textoOutput.value = res.resultado;
            });

        }, () => {
            setStatus(false);
            setTimeout(conectar, 2000);
        });
    }

    conectar();
});