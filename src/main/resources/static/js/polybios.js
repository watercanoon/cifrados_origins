document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;
    let operacionActual = "CIFRAR";

    const statusIndicator = document.getElementById('ws-status');
    const textoInput = document.getElementById('textoInput');
    const textoOutput = document.getElementById('textoOutput');
    const idiomaSelect = document.getElementById('idiomaSelect');
    const btnCifrar = document.getElementById('btnCifrar');
    const btnDescifrar = document.getElementById('btnDescifrar');

    function connectWebSocket() {
        const socket = new SockJS('/ws-criptografia');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function (frame) {
            statusIndicator.classList.replace('bg-red-500', 'bg-green-500');
            stompClient.subscribe('/topic/polybios', function (response) {
                const data = JSON.parse(response.body);
                textoOutput.value = data.resultado;
            });
        }, function(error) {
            statusIndicator.classList.replace('bg-green-500', 'bg-red-500');
            setTimeout(connectWebSocket, 5000);
        });
    }

    function triggerProcess() {
        if (!stompClient || !stompClient.connected) return;
        const texto = textoInput.value;
        if(texto.trim() === "") {
            textoOutput.value = "";
            return;
        }

        const payload = {
            texto: texto,
            clave: "", // Polybios no requiere clave
            operacion: operacionActual,
            idioma: idiomaSelect.value
        };

        stompClient.send("/app/polybios", {}, JSON.stringify(payload));
    }

    textoInput.addEventListener('input', triggerProcess);
    idiomaSelect.addEventListener('change', triggerProcess);

    btnCifrar.addEventListener('click', () => {
        operacionActual = "CIFRAR";
        btnCifrar.classList.replace('bg-slate-700', 'bg-blue-600');
        btnCifrar.classList.replace('text-slate-300', 'text-white');
        btnDescifrar.classList.replace('bg-blue-600', 'bg-slate-700');
        btnDescifrar.classList.replace('text-white', 'text-slate-300');
        triggerProcess();
    });

    btnDescifrar.addEventListener('click', () => {
        operacionActual = "DESCIFRAR";
        btnDescifrar.classList.replace('bg-slate-700', 'bg-blue-600');
        btnDescifrar.classList.replace('text-slate-300', 'text-white');
        btnCifrar.classList.replace('bg-blue-600', 'bg-slate-700');
        btnCifrar.classList.replace('text-white', 'text-slate-300');
        triggerProcess();
    });

    connectWebSocket();
});