// src/main/resources/static/js/rot47.js

document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;

    const inputTexto = document.getElementById('textoEntrada');
    const outputTexto = document.getElementById('textoSalida');
    const btnCopiar = document.getElementById('btnCopiar');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const btnPegar = document.getElementById('btnPegar');

    // ==========================================
    // CONEXIÓN WEBSOCKET Y NOTIFICACIONES
    // ==========================================
    function connect() {
        const socket = new SockJS('/ws-criptografia');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function () {

            // 1. SUSCRIPCIÓN GLOBAL DE ERRORES (Atrapa excepciones del backend)
            stompClient.subscribe('/user/queue/errores', function(errorResponse) {
                CryptoUX.processWebSocketResponse(errorResponse.body);
            });

            // 2. SUSCRIPCIÓN A LA RESPUESTA DE ROT47
            stompClient.subscribe('/topic/rot47', function (response) {
                const data = CryptoUX.processWebSocketResponse(response.body);

                if (data) {
                    outputTexto.value = data.resultado;
                    outputTexto.classList.replace('text-red-400', 'text-indigo-300');
                } else {
                    outputTexto.value = "";
                    outputTexto.classList.replace('text-indigo-300', 'text-red-400');
                }
            });
        }, function (error) {
            CryptoUX.showToast("Conexión perdida", "Desconectado del servidor. Reconectando...", "error");
            setTimeout(connect, 3000);
        });
    }

    function enviarDatos() {
        if (!stompClient || !stompClient.connected) return;

        const texto = inputTexto.value;

        if (!texto) {
            outputTexto.value = "";
            return;
        }

        stompClient.send("/app/rot47", {}, JSON.stringify({
            'texto': texto
        }));
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================
    inputTexto.addEventListener('input', enviarDatos);

    // UX: Copiar al portapapeles moderno
    btnCopiar.addEventListener('click', () => {
        if (!outputTexto.value) {
            CryptoUX.showToast("Aviso", "No hay texto para copiar.", "info");
            return;
        }
        navigator.clipboard.writeText(outputTexto.value).then(() => {
            CryptoUX.showToast("¡Copiado!", "Texto copiado al portapapeles.", "success");
        }).catch(() => {
            outputTexto.select();
            document.execCommand("copy");
        });
    });

    // UX: Pegar desde el portapapeles
    btnPegar.addEventListener('click', async () => {
        try {
            const textoPortapapeles = await navigator.clipboard.readText();

            if (textoPortapapeles) {
                inputTexto.value = textoPortapapeles;
                enviarDatos();
                inputTexto.focus();
                CryptoUX.showToast("Pegado", "Texto insertado correctamente.", "success");
            }
        } catch (err) {
            CryptoUX.showToast("Permiso denegado", "Concede acceso al portapapeles en tu navegador.", "error");
        }
    });

    btnLimpiar.addEventListener('click', () => {
        inputTexto.value = "";
        enviarDatos();
        inputTexto.focus();
    });

    // Inicialización
    connect();
});