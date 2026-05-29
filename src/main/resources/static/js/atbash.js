document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;
    const statusIndicator = document.getElementById('ws-status');
    const textoInput = document.getElementById('textoInput');
    const textoOutput = document.getElementById('textoOutput');
    const idiomaSelect = document.getElementById('idiomaSelect');

    function connectWebSocket() {
        const socket = new SockJS('/ws-criptografia');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function (frame) {
            statusIndicator.classList.replace('bg-red-500', 'bg-green-500');
            stompClient.subscribe('/topic/atbash', function (response) {
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
            clave: "",
            operacion: "CIFRAR", // La operación matemática es igual para ida y vuelta
            idioma: idiomaSelect.value
        };

        stompClient.send("/app/atbash", {}, JSON.stringify(payload));
    }

    textoInput.addEventListener('input', triggerProcess);
    idiomaSelect.addEventListener('change', triggerProcess);

    connectWebSocket();
});