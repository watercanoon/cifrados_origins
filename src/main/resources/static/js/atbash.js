let stompClient = null;
let operacionActual = "CIFRAR";

document.addEventListener("DOMContentLoaded", function () {

    const textoInput = document.getElementById("textoInput");
    const textoOutput = document.getElementById("textoOutput");
    const idiomaSelect = document.getElementById("idiomaSelect");

    const btnCifrar = document.getElementById("btnCifrar");
    const btnDescifrar = document.getElementById("btnDescifrar");
    const wsStatus = document.getElementById("ws-status");

    function setStatus(ok) {
        wsStatus.classList.toggle("bg-red-500", !ok);
        wsStatus.classList.toggle("bg-emerald-500", ok);
    }

    function seleccionarBoton() {

        if (operacionActual === "CIFRAR") {

            btnCifrar.className =
                "flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-l-lg";

            btnDescifrar.className =
                "flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-r-lg hover:bg-slate-600";

        } else {

            btnCifrar.className =
                "flex-1 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-l-lg hover:bg-slate-600";

            btnDescifrar.className =
                "flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-r-lg";
        }
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
            operacion: operacionActual
        }));
    }

    btnCifrar.addEventListener("click", () => {
        operacionActual = "CIFRAR";
        seleccionarBoton();
        enviar();
    });

    btnDescifrar.addEventListener("click", () => {
        operacionActual = "DESCIFRAR";
        seleccionarBoton();
        enviar();
    });

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

        }, () => {
            setStatus(false);
            setTimeout(conectar, 2000);
        });
    }

    textoInput.addEventListener("input", enviar);
    idiomaSelect.addEventListener("change", enviar);

    conectar();

    seleccionarBoton();
});