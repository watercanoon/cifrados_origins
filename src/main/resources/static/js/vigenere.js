// src/main/resources/static/js/vigenere.js

document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;

    const inputTexto = document.getElementById('textoEntrada');
    const outputTexto = document.getElementById('textoSalida');
    const inputClave = document.getElementById('clave');
    const selectIdioma = document.getElementById('idioma');
    const customContainer = document.getElementById('customAlphabetContainer');
    const inputCustom = document.getElementById('alfabetoCustom');
    const radiosOperacion = document.querySelectorAll('input[name="operacion"]');
    const btnCopiar = document.getElementById('btnCopiar');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const btnPegar = document.getElementById('btnPegar');

    function connect() {
        let socket = new SockJS('/ws-criptografia');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function (frame) {
            console.log('Conectado a STOMP (Vigenère): ' + frame);
            stompClient.subscribe('/topic/vigenere', function (response) {
                let data = JSON.parse(response.body);

                if(data.error) {
                    mostrarError(data.error);
                    outputTexto.value = "Esperando clave válida...";
                    outputTexto.classList.replace('text-purple-300', 'text-red-400');
                } else {
                    outputTexto.value = data.resultado;
                    outputTexto.classList.replace('text-red-400', 'text-purple-300');
                }
            });
        }, function(error) {
            mostrarError("Conexión perdida. Reconectando...");
            setTimeout(connect, 3000);
        });
    }

    function enviarDatos() {
        if (!stompClient || !stompClient.connected) return;

        // 1. PRIMERO declaramos la variable
        const texto = inputTexto.value;

        // 2. LUEGO validamos
        if(!texto) {
            outputTexto.value = ""; // Al vaciar el value, el navegador renderiza el placeholder
            return;
        }

        // 3. Obtenemos el resto de valores
        const operacion = document.querySelector('input[name="operacion"]:checked').value;
        const clave = inputClave.value;
        const idioma = selectIdioma.value;
        const alfabetoCustom = inputCustom.value;

        // 4. Enviamos
        stompClient.send("/app/vigenere", {}, JSON.stringify({
            'texto': texto,
            'operacion': operacion,
            'clave': clave,
            'idioma': idioma,
            'alfabetoCustom': alfabetoCustom
        }));
    }

    // Eventos
    inputTexto.addEventListener('input', enviarDatos);
    inputClave.addEventListener('input', enviarDatos);
    inputCustom.addEventListener('input', enviarDatos);
    radiosOperacion.forEach(radio => radio.addEventListener('change', enviarDatos));

    selectIdioma.addEventListener('change', (e) => {
        if (e.target.value === 'CUSTOM') customContainer.classList.remove('hidden');
        else customContainer.classList.add('hidden');
        enviarDatos();
    });

    btnCopiar.addEventListener('click', () => {
        outputTexto.select();
        document.execCommand("copy");
    });
    // Utilidades UX
    btnPegar.addEventListener('click', async () => {
        try {
            // Solicita el texto del portapapeles de forma nativa
            const textoPortapapeles = await navigator.clipboard.readText();

            if (textoPortapapeles) {
                inputTexto.value = textoPortapapeles;
                enviarDatos(); // Desencadena el cifrado en tiempo real automáticamente
                inputTexto.focus();
            }
        } catch (err) {
            // Manejo de UX en caso de que el navegador bloquee los permisos de lectura
            mostrarError("Permiso denegado. Concede acceso al portapapeles en tu navegador.");
        }
    });

    btnLimpiar.addEventListener('click', () => {
        inputTexto.value = "";
        enviarDatos();
        inputTexto.focus();
    });

    function mostrarError(mensaje) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'bg-red-500/90 text-white px-4 py-3 rounded shadow-lg border border-red-700 flex items-center gap-3 backdrop-blur-sm animate-fade-in';
        toast.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> <span class="text-sm font-medium">${mensaje}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s ease'; setTimeout(() => toast.remove(), 500); }, 3000);
    }

    connect();
});