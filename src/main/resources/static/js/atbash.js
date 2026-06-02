let stompClient = null;

document.addEventListener("DOMContentLoaded", function () {

    const textoInput = document.getElementById("textoInput");
    const textoOutput = document.getElementById("textoOutput");
    const idiomaSelect = document.getElementById("idiomaSelect");
    const wsStatus = document.getElementById("ws-status");

    function setStatus(ok) {
        wsStatus.classList.toggle("bg-red-500", !ok);
        wsStatus.classList.toggle("bg-emerald-500", ok);
    }

    function enviar() {

        if (!stompClient || !stompClient.connected) return;

        if (!textoInput.value.trim()) {
            textoOutput.value = "";
            return;
        }

        stompClient.send("/app/atbash", {}, JSON.stringify({
            texto: textoInput.value,
            idioma: idiomaSelect.value,
            operacion: "CIFRAR"
        }));
    }

    function conectar() {

        const socket = new SockJS("/ws-criptografia");
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, () => {

            setStatus(true);

            stompClient.subscribe("/topic/atbash", msg => {
                const res = JSON.parse(msg.body);
                textoOutput.value = res.resultado;
            });
            enviar();

        }, () => {
            setStatus(false);
            setTimeout(conectar, 2000);
        });
    }

    textoInput.addEventListener("input", enviar);
    idiomaSelect.addEventListener("change", enviar);

    conectar();
});
