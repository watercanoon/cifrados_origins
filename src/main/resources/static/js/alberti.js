document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;
    let operacionActual = "CIFRAR";

    // Variables del DOM
    const statusIndicator = document.getElementById('ws-status');
    const textoInput = document.getElementById('textoInput');
    const textoOutput = document.getElementById('textoOutput');
    const alfabetoExtInput = document.getElementById('alfabetoExtInput');
    const alfabetoIntInput = document.getElementById('alfabetoIntInput');
    const periodoInput = document.getElementById('periodoInput');
    const giroInput = document.getElementById('giroInput');
    const btnCifrar = document.getElementById('btnCifrar');
    const btnDescifrar = document.getElementById('btnDescifrar');

    // Discos
    const discoExterior = document.getElementById('discoExterior');
    const discoInterior = document.getElementById('discoInterior');

    // Función para renderizar letras en círculo
    function renderizarDisco(contenedor, alfabeto, radioPorcentaje) {
        contenedor.innerHTML = '';
        const cantidad = alfabeto.length;
        const anguloPorLetra = 360 / cantidad;

        for (let i = 0; i < cantidad; i++) {
            const span = document.createElement('span');
            span.className = 'letra-disco';
            span.innerText = alfabeto[i];

            // Colocar la letra rotando su eje y alejándola del centro
            span.style.transform = `rotate(${i * anguloPorLetra}deg) translateY(-${radioPorcentaje}%)`;

            // Para que las letras no queden de cabeza en la parte inferior, las contrarotamos si queremos,
            // pero en los discos criptográficos reales las letras giran con el disco.
            contenedor.appendChild(span);
        }
    }

    // Actualizar visualmente los discos
    function actualizarDiscos() {
        renderizarDisco(discoExterior, alfabetoExtInput.value, 42);
        renderizarDisco(discoInterior, alfabetoIntInput.value, 38);
    }

    // Simular el giro gráfico basado en la entrada de texto
    function simularGiro() {
        const textoLimpio = textoInput.value.replace(/\s/g, ''); // Ignorar espacios para el salto
        const periodo = parseInt(periodoInput.value) || 4;
        const saltosGiro = parseInt(giroInput.value) || 3;
        const alfabetoIntLength = alfabetoIntInput.value.length;

        if(alfabetoIntLength === 0) return;

        // Cuántas veces ha rotado el disco
        const rotaciones = Math.floor(textoLimpio.length / periodo);

        // Grados a girar (cada salto mueve 'giro' posiciones)
        const anguloPorPosicion = 360 / alfabetoIntLength;
        const rotacionTotalGrados = rotaciones * saltosGiro * anguloPorPosicion;

        // Aplicar CSS al disco interior
        discoInterior.style.transform = `rotate(${rotacionTotalGrados}deg)`;
    }

    // --- LÓGICA DE WEBSOCKETS ---
    function connectWebSocket() {
        const socket = new SockJS('/ws-criptografia');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function (frame) {
            statusIndicator.classList.replace('bg-red-500', 'bg-green-500');
            stompClient.subscribe('/topic/alberti', function (response) {
                const data = JSON.parse(response.body);
                textoOutput.value = data.resultado;
            });
        }, function(error) {
            statusIndicator.classList.replace('bg-green-500', 'bg-red-500');
            setTimeout(connectWebSocket, 5000);
        });
    }

    function triggerProcess() {
        simularGiro(); // Actualiza la animación visual

        if (!stompClient || !stompClient.connected) return;

        const texto = textoInput.value;
        if(texto.trim() === "") {
            textoOutput.value = "";
            return;
        }

        // Empaquetar la clave compleja de Alberti (Ej: "4-3" para periodo 4 y giro 3)
        // Se envía al backend junto con los alfabetos como si fueran idiomas para que el servicio los procese.
        const payload = {
            texto: texto,
            clave: `${periodoInput.value}-${giroInput.value}`,
            operacion: operacionActual,
            idioma: `${alfabetoExtInput.value}|${alfabetoIntInput.value}`
        };

        stompClient.send("/app/alberti", {}, JSON.stringify(payload));
    }

    // Event Listeners
    alfabetoExtInput.addEventListener('input', actualizarDiscos);
    alfabetoIntInput.addEventListener('input', actualizarDiscos);
    textoInput.addEventListener('input', triggerProcess);
    periodoInput.addEventListener('input', triggerProcess);
    giroInput.addEventListener('input', triggerProcess);

    btnCifrar.addEventListener('click', () => {
        operacionActual = "CIFRAR";
        btnCifrar.classList.replace('bg-slate-700', 'bg-indigo-600');
        btnCifrar.classList.replace('text-slate-300', 'text-white');
        btnDescifrar.classList.replace('bg-indigo-600', 'bg-slate-700');
        btnDescifrar.classList.replace('text-white', 'text-slate-300');
        triggerProcess();
    });

    btnDescifrar.addEventListener('click', () => {
        operacionActual = "DESCIFRAR";
        btnDescifrar.classList.replace('bg-slate-700', 'bg-indigo-600');
        btnDescifrar.classList.replace('text-slate-300', 'text-white');
        btnCifrar.classList.replace('bg-indigo-600', 'bg-slate-700');
        btnCifrar.classList.replace('text-white', 'text-slate-300');
        triggerProcess();
    });

    // Inicializar visualmente y conectar
    actualizarDiscos();
    connectWebSocket();
});