// src/main/resources/static/js/alberti.js

document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;

    // Referencias DOM - Entradas
    const inputTexto   = document.getElementById('textoEntrada');
    const outputTexto  = document.getElementById('textoSalida');
    const inputClave   = document.getElementById('clave');
    const displayClave = document.getElementById('claveValueDisplay');
    const maxDisplay   = document.getElementById('maxDisplay');
    const radiosOperacion = document.querySelectorAll('input[name="operacion"]');

    // Referencias DOM - Controles Táctiles
    const btnRestar = document.getElementById('btnRestar');
    const btnSumar  = document.getElementById('btnSumar');

    // Simulador 3D
    const idiomaSelector    = document.getElementById('idiomaSelector');
    const outerRing         = document.getElementById('outerRing');
    const innerWheel        = document.getElementById('innerWheel');
    const innerLetters      = document.getElementById('innerLetters');
    const diskAngleDisplay  = document.getElementById('diskAngleDisplay');
    const alignDisplay      = document.getElementById('alignDisplay');

    // Botones de acción
    const btnCopiar  = document.getElementById('btnCopiar');
    const btnPegar   = document.getElementById('btnPegar');
    const btnLimpiar = document.getElementById('btnLimpiar');

    // Estado conexión
    const connDot   = document.getElementById('connDot');
    const connLabel = document.getElementById('connLabel');

    // Alfabetos
    const ALFABETOS = {
        "ES": { ext: "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ", int: "cdefghijklmnñopqrstuvwxyzab" },
        "EN": { ext: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",  int: "cdefghijklmnopqrstuvwxyzab" },
        "CUSTOM": { ext: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", int: "cdefghijklmnopqrstuvwxyzab" }
    };

    const customContainer = document.getElementById('customAlphabetContainer');
    const customExt = document.getElementById('customExt');
    const customInt = document.getElementById('customInt');
    const countExt  = document.getElementById('countExt');
    const countInt  = document.getElementById('countInt');
    const alertaLongitud = document.getElementById('alertaLongitud');

    let currentLang = "ES";

    // ==========================================
    // CONEXIÓN WEBSOCKET Y NOTIFICACIONES
    // ==========================================
    function setConnStatus(online) {
        if (online) {
            connDot.className = 'conn-dot connected';
            connLabel.textContent = 'online';
        } else {
            connDot.className = 'conn-dot disconnected';
            connLabel.textContent = 'offline';
        }
    }

    function connect() {
        let socket = new SockJS('/ws-criptografia');
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Oculta logs en consola

        stompClient.connect({}, function () {
            setConnStatus(true);

            // 1. ESCUCHADOR DE ERRORES GLOBALES
            stompClient.subscribe('/user/queue/errores', function(errorResponse) {
                CryptoUX.processWebSocketResponse(errorResponse.body);
            });

            // 2. ESCUCHADOR DE RESPUESTAS ALBERTI
            stompClient.subscribe('/topic/alberti', function (response) {
                // CryptoUX intercepta automáticamente si el backend arroja error en el JSON
                const data = CryptoUX.processWebSocketResponse(response.body);

                if (data) {
                    // Si todo está bien, pintamos el texto
                    outputTexto.value = data.resultado;
                    outputTexto.classList.replace('text-red-400', 'text-cyan-600');
                    // Opcional para dark mode, aseguramos legibilidad
                    outputTexto.classList.add('dark:text-cyan-300');
                } else {
                    // Si hubo error, limpiamos y ponemos en rojo
                    outputTexto.value = "";
                    outputTexto.classList.replace('text-cyan-600', 'text-red-500');
                    outputTexto.classList.replace('dark:text-cyan-300', 'dark:text-red-400');
                }
            });
        }, function () {
            setConnStatus(false);
            CryptoUX.showToast("Conexión perdida", "Desconectado del servidor. Reconectando...", "error");
            setTimeout(connect, 3000);
        });
    }

    // ==========================================
    // MOTOR GRÁFICO DISCOS
    // ==========================================
    function dibujarDisco(container, alfabeto, radio, charClass) {
        container.innerHTML = '';
        const len  = alfabeto.length;
        const step = 360 / len;

        for (let i = 0; i < len; i++) {
            const div = document.createElement('div');
            div.innerText = alfabeto[i];
            div.className = `absolute left-1/2 top-1/2 w-6 h-6 -ml-3 -mt-3 flex items-center justify-center font-mono font-bold transition-colors ${charClass}`;
            div.style.transform = `rotate(${i * step}deg) translateY(-${radio}px)`;
            container.appendChild(div);
        }
    }

    function renderizarSimulador() {
        const width = window.innerWidth;
        const rExt  = width < 640 ? 110 : 135;
        const rInt  = width < 640 ? 70  : 90;

        dibujarDisco(outerRing,    ALFABETOS[currentLang].ext, rExt, 'outer-char');
        dibujarDisco(innerLetters, ALFABETOS[currentLang].int, rInt, 'inner-char');
        actualizarRotacion();
    }

    window.addEventListener('resize', renderizarSimulador);

    // ==========================================
    // LÓGICA DE ROTACIÓN Y ENVÍO (DTO)
    // ==========================================
    function actualizarRotacion() {
        const giro = parseInt(inputClave.value);
        const len  = ALFABETOS[currentLang].ext.length;
        const anguloGiro = giro * (360 / len);

        innerWheel.style.transform = `rotate(-${anguloGiro}deg)`;
        diskAngleDisplay.innerText = `${giro}`;

        const letraAlineada = ALFABETOS[currentLang].int[giro % len];
        alignDisplay.innerText = letraAlineada;
    }

    function enviarDatos() {
        actualizarRotacion();
        if (!stompClient || !stompClient.connected) return;

        const texto = inputTexto.value;
        if (!texto) { outputTexto.value = ""; return; }

        if (currentLang === "CUSTOM" && (!customExt.value.trim() || !customInt.value.trim())) {
            CryptoUX.showToast("Alfabeto incompleto", "Debes rellenar los alfabetos personalizados.", "error");
            return;
        }

        const operacion = document.querySelector('input[name="operacion"]:checked').value;

        stompClient.send("/app/alberti", {}, JSON.stringify({
            texto: texto,
            operacion: operacion,
            clave: inputClave.value.toString(),
            idioma: currentLang,
            alfabetoCustomExt: customExt.value,
            alfabetoCustomInt: customInt.value
        }));
    }

    // ==========================================
    // CONTROLES DE INTERFAZ Y EVENTOS
    // ==========================================
    inputTexto.addEventListener('input', enviarDatos);
    radiosOperacion.forEach(r => r.addEventListener('change', enviarDatos));

    // Lógica Slider
    function updateSliderFill(val) {
        const min = +inputClave.min;
        const max = +inputClave.max;
        inputClave.style.setProperty('--fill', ((val - min) / (max - min) * 100) + '%');
        displayClave.innerText = val;
    }

    inputClave.addEventListener('input', (e) => {
        updateSliderFill(e.target.value);
        enviarDatos();
    });

    // Lógica Botones +/-
    btnRestar.addEventListener('click', () => {
        let val = parseInt(inputClave.value);
        if (val > parseInt(inputClave.min)) {
            inputClave.value = val - 1;
            updateSliderFill(inputClave.value);
            enviarDatos();
        }
    });

    btnSumar.addEventListener('click', () => {
        let val = parseInt(inputClave.value);
        if (val < parseInt(inputClave.max)) {
            inputClave.value = val + 1;
            updateSliderFill(inputClave.value);
            enviarDatos();
        }
    });

    // Cambio de Idioma
    idiomaSelector.addEventListener('change', (e) => {
        currentLang = e.target.value;

        if (currentLang === "CUSTOM") {
            customContainer.classList.remove('hidden');
        } else {
            customContainer.classList.add('hidden');
            alertaLongitud.classList.add('hidden');
        }

        const len = ALFABETOS[currentLang].ext.length;
        inputClave.max = len > 0 ? len - 1 : 0;
        maxDisplay.innerText = inputClave.max;

        if (parseInt(inputClave.value) > parseInt(inputClave.max)) {
            inputClave.value = inputClave.max;
        }
        updateSliderFill(inputClave.value);

        renderizarSimulador();
        enviarDatos();
    });

    function actualizarCustom() {
        const valExt = customExt.value;
        const valInt = customInt.value;

        countExt.innerText = valExt.length;
        countInt.innerText = valInt.length;

        // Mostrar alerta si las longitudes no coinciden
        if (valExt.length !== valInt.length && currentLang === "CUSTOM") {
            alertaLongitud.classList.remove('hidden');
        } else {
            alertaLongitud.classList.add('hidden');
        }

        ALFABETOS["CUSTOM"].ext = valExt;
        ALFABETOS["CUSTOM"].int = valInt;

        const len = valExt.length;
        if (len > 0) {
            inputClave.max = len - 1;
            maxDisplay.innerText = len - 1;
            if (parseInt(inputClave.value) > len - 1) {
                inputClave.value = len - 1;
                updateSliderFill(len - 1);
            }
            renderizarSimulador();
            if (valExt.length === valInt.length) {
                enviarDatos();
            }
        }
    }

    customExt.addEventListener('input', actualizarCustom);
    customInt.addEventListener('input', actualizarCustom);

    // ==========================================
    // PORTAPAPELES Y UX
    // ==========================================
    btnPegar.addEventListener('click', async () => {
        try {
            const texto = await navigator.clipboard.readText();
            if (texto) {
                inputTexto.value = texto;
                enviarDatos();
                inputTexto.focus();
                CryptoUX.showToast("Pegado", "Texto insertado correctamente.", "success");
            }
        } catch {
            CryptoUX.showToast("Acceso denegado", "No se pudo acceder al portapapeles.", "error");
        }
    });

    btnLimpiar.addEventListener('click', () => {
        inputTexto.value = "";
        enviarDatos();
        inputTexto.focus();
    });

    btnCopiar.addEventListener('click', async () => {
        if (!outputTexto.value) {
            CryptoUX.showToast("Aviso", "No hay texto para copiar.", "info");
            return;
        }
        try {
            await navigator.clipboard.writeText(outputTexto.value);
            CryptoUX.showToast("¡Copiado!", "Resultado copiado al portapapeles.", "success");
        } catch {
            outputTexto.select();
            document.execCommand("copy");
        }
    });

    // ==========================================
    // TUTORIAL DRAWER
    // ==========================================
    const tutorialData = [
        { element: '#panelParametros', title: 'Configuración Base',     text: 'Usa los controles (+) y (-) o el slider para rotar el disco interior de Alberti con precisión.' },
        { element: '#panelSimulador',  title: 'Eje Mecánico 3D',      text: 'El láser proyecta la alineación exacta. Letras mayúsculas (Exterior) hacia minúsculas (Interior).' },
        { element: '#panelEntrada',    title: 'Input Seguro',           text: 'Pega tu texto aquí. Los WebSockets envían y procesan el cifrado instantáneamente.' },
        { element: '#panelSalida',     title: 'Mensaje Cifrado',        text: '¡Listo! Tu texto ha sido procesado polialfabéticamente sin recargar la página.' }
    ];

    let currentStep = 0;
    const overlay    = document.getElementById('tutorialOverlay');
    const bubble     = document.getElementById('tutorialBubble');
    const tutTitle   = document.getElementById('tutTitle');
    const tutText    = document.getElementById('tutText');
    const btnTutNext = document.getElementById('btnTutNext');
    const btnTutPrev = document.getElementById('btnTutPrev');
    const tutDotsContainer = document.getElementById('tutDots');

    tutorialData.forEach(() => {
        const span = document.createElement('span');
        span.className = "w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700";
        tutDotsContainer.appendChild(span);
    });

    function moverBurbuja(selector) {
        document.querySelectorAll('.tutorial-focus').forEach(el => el.classList.remove('tutorial-focus'));
        const target = document.querySelector(selector);
        if (!target) return;
        target.classList.add('tutorial-focus');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            const rect = target.getBoundingClientRect();
            bubble.classList.remove('hidden');
            const bubbleRect = bubble.getBoundingClientRect();

            let top  = rect.bottom + 15;
            let left = rect.left + (rect.width / 2) - (bubbleRect.width / 2);

            const padding = 15;
            const screenWidth = document.documentElement.clientWidth;
            const screenHeight = window.innerHeight;

            if (left + bubbleRect.width > screenWidth - padding) { left = screenWidth - bubbleRect.width - padding; }
            if (left < padding) { left = padding; }
            if (top + bubbleRect.height > screenHeight - padding) { top = rect.top - bubbleRect.height - 15; }
            if (top < padding) { top = padding; }

            bubble.style.top  = `${top}px`;
            bubble.style.left = `${left}px`;
            bubble.classList.remove('opacity-0', 'scale-95');
        }, 450);
    }

    function updateTutorial() {
        bubble.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            tutTitle.innerHTML = tutorialData[currentStep].title;
            tutText.innerHTML  = tutorialData[currentStep].text;

            Array.from(tutDotsContainer.children).forEach((dot, i) => {
                dot.className = i === currentStep
                    ? "w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_6px_#22d3ee] transition-all"
                    : "w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 transition-all";
            });

            btnTutPrev.classList.toggle('hidden', currentStep === 0);

            if (currentStep === tutorialData.length - 1) {
                btnTutNext.innerHTML = "Terminar ✓";
                btnTutNext.style.background = '#059669';
            } else {
                btnTutNext.innerHTML = "Siguiente →";
                btnTutNext.style.background = '';
            }

            moverBurbuja(tutorialData[currentStep].element);
        }, 200);
    }

    document.getElementById('btnTutorial').addEventListener('click', () => {
        currentStep = 0;
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
        updateTutorial();
    });

    function closeTutorial() {
        document.querySelectorAll('.tutorial-focus').forEach(el => el.classList.remove('tutorial-focus'));
        bubble.classList.add('opacity-0', 'scale-95');
        overlay.classList.add('opacity-0');
        setTimeout(() => { bubble.classList.add('hidden'); overlay.classList.add('hidden'); }, 300);
    }

    document.getElementById('btnCerrarTutorial').addEventListener('click', closeTutorial);
    btnTutNext.addEventListener('click', () => {
        currentStep < tutorialData.length - 1 ? (currentStep++, updateTutorial()) : closeTutorial();
    });
    btnTutPrev.addEventListener('click', () => {
        if (currentStep > 0) { currentStep--; updateTutorial(); }
    });

    // INIT
    connect();
    renderizarSimulador();
});