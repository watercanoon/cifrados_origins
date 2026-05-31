let stompClient = null;

function conectarWebSocket() {
    const socket = new SockJS('/ws-criptografia');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        stompClient.subscribe('/topic/escitala', function (respuesta) {
            const datos = JSON.parse(respuesta.body);
            mostrarResultado(datos.resultado);
        });
    }, function (error) {
    });
}

function enviarCifrar() {
    const texto = document.getElementById("textoInput").value;
    const clave = document.getElementById("claveInput").value;

    if (!texto.trim()) {
        alert("Por favor, escribe un texto primero.");
        return;
    }

    stompClient.send("/app/cifrar/escitala", {}, JSON.stringify({
        'texto': texto,
        'clave': clave
    }));
}

function enviarDescifrar() {
    const texto = document.getElementById("textoInput").value;
    const clave = document.getElementById("claveInput").value;

    if (!texto.trim()) {
        alert("Por favor, escribe un texto primero.");
        return;
    }

    stompClient.send("/app/descifrar/escitala", {}, JSON.stringify({
        'texto': texto,
        'clave': clave
    }));
}

function mostrarResultado(resultado) {
    const box = document.getElementById("resultadoBox");
    box.textContent = resultado;
}

document.getElementById("btnCifrar").addEventListener("click", enviarCifrar);
document.getElementById("btnDescifrar").addEventListener("click", enviarDescifrar);

window.onload = conectarWebSocket;