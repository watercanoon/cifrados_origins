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

    // Alfabetos (CORREGIDO: 'l' añadida en ES interior para igualar 27 caracteres)
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
    // CONEXIÓN WEBSOCKET
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
        stompClient.debug = null; // Oculta logs en consola de prod

        stompClient.connect({}, function () {
            setConnStatus(true);
            stompClient.subscribe('/topic/alberti', function (response) {
                let data = JSON.parse(response.body);
                if (data.error) {
                    mostrarError(data.error);
                    outputTexto.value = "";
                    outputTexto.classList.replace('text-cyan-300', 'text-red-400');
                } else {
                    outputTexto.value = data.resultado;
                    outputTexto.classList.replace('text-red-400', 'text-cyan-300');
                }
            });
        }, function () {
            setConnStatus(false);
            mostrarError("Conexión interrumpida. Reconectando…");
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
            div.className = `absolute left-1/2 top-1/2 w-6 h-6 -ml-3 -mt-3 flex items-center justify-center font-mono font-bold ${charClass}`;
            // Ajuste trigonométrico para rotación
            div.style.transform = `rotate(${i * step}deg) translateY(-${radio}px)`;
            container.appendChild(div);
        }
    }

    function renderizarSimulador() {
        const width = window.innerWidth;
        const rExt  = width < 640 ? 110 : 135; // Expandido para el nuevo UI
        const rInt  = width < 640 ? 70  : 90;

        dibujarDisco(outerRing,    ALFABETOS[currentLang].ext, rExt, 'outer-char');
        dibujarDisco(innerLetters, ALFABETOS[currentLang].int, rInt, 'inner-char');
        actualizarRotacion();
    }

    window.addEventListener('resize', renderizarSimulador);

    // ==========================================
    // LÓGICA DE ROTACIÓN Y ENVÍO (DTO Actualizado)
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

        const operacion = document.querySelector('input[name="operacion"]:checked').value;

        // Enviar con el nuevo parámetro de idioma
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
    // PORTAPAPELES Y UTILIDADES
    // ==========================================
    btnPegar.addEventListener('click', async () => {
        try {
            const texto = await navigator.clipboard.readText();
            if (texto) { inputTexto.value = texto; enviarDatos(); inputTexto.focus(); }
        } catch { mostrarError("Permiso de portapapeles denegado."); }
    });

    btnLimpiar.addEventListener('click', () => {
        inputTexto.value = ""; enviarDatos(); inputTexto.focus();
    });

    btnCopiar.addEventListener('click', async () => {
        if (!outputTexto.value) return;
        try {
            await navigator.clipboard.writeText(outputTexto.value);
            mostrarExito("Resultado copiado al portapapeles");
        } catch {
            outputTexto.select();
            document.execCommand("copy");
        }
    });

    // ==========================================
    // TOASTS
    // ==========================================
    function mostrarToast(mensaje, tipo) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const isError = tipo === 'error';
        toast.className = `flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-sm text-sm font-medium animate-fade-in ${
            isError
                ? 'bg-red-950/90 text-red-200 border-red-700/50'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-700/50'
        }`;
        toast.innerHTML = isError
            ? `<svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg><span>${mensaje}</span>`
            : `<svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg><span>${mensaje}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity .4s ease';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
    function mostrarError(msg) { mostrarToast(msg, 'error'); }
    function mostrarExito(msg) { mostrarToast(msg, 'ok'); }

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
        span.className = "w-2 h-2 rounded-full bg-slate-700";
        tutDotsContainer.appendChild(span);
    });

    function moverBurbuja(selector) {
        document.querySelectorAll('.tutorial-focus').forEach(el => el.classList.remove('tutorial-focus'));
        const target = document.querySelector(selector);
        if (!target) return;
        target.classList.add('tutorial-focus');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Aumentamos a 450ms para asegurar que la animación de scroll termine por completo
        setTimeout(() => {
            const rect = target.getBoundingClientRect();
            bubble.classList.remove('hidden');
            const bubbleRect = bubble.getBoundingClientRect();

            let top  = rect.bottom + 15;
            let left = rect.left + (rect.width / 2) - (bubbleRect.width / 2);

            // === LÓGICA DE COLISIÓN MEJORADA (Anti-desbordes) ===
            const padding = 15;
            const screenWidth = document.documentElement.clientWidth;
            const screenHeight = window.innerHeight;

            // 1. Límite derecho
            if (left + bubbleRect.width > screenWidth - padding) {
                left = screenWidth - bubbleRect.width - padding;
            }
            // 2. Límite izquierdo (Tiene prioridad para móviles)
            if (left < padding) {
                left = padding;
            }

            // 3. Límite inferior (Si choca abajo, lo proyectamos arriba del panel)
            if (top + bubbleRect.height > screenHeight - padding) {
                top = rect.top - bubbleRect.height - 15;
            }
            // 4. Límite superior
            if (top < padding) {
                top = padding;
            }

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
                    ? "w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] transition-all"
                    : "w-2 h-2 rounded-full bg-slate-700 transition-all";
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