document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;

    // Referencias DOM
    const inputTexto = document.getElementById('textoEntrada');
    const outputTexto = document.getElementById('textoSalida');

    // Controles HUD Espejo
    const gridTop = document.getElementById('alfabetoTop');
    const gridBottom = document.getElementById('alfabetoBottom');
    const charIn = document.getElementById('charIn');
    const charOut = document.getElementById('charOut');

    // Botones UX
    const btnCopiar = document.getElementById('btnCopiar');
    const btnPegar = document.getElementById('btnPegar');
    const btnLimpiar = document.getElementById('btnLimpiar');

    // Configuración del Alfabeto Atbash (26 Letras, A-M y Z-N)
    const alphabetTop = "ABCDEFGHIJKLM".split("");
    const alphabetBot = "ZYXWVUTSRQPON".split("");
    const charMap = {}; // Mapa para búsquedas rápidas al teclear

    // ==========================================
    // MOTOR GRÁFICO: CONSTRUCCIÓN DEL ESPEJO
    // ==========================================
    function inicializarEspejo() {
        alphabetTop.forEach((char, index) => {
            // Fila Superior
            let divTop = document.createElement('div');
            divTop.innerText = char;
            divTop.id = `top-${char}`;
            divTop.className = "letter-cell p-1 rounded text-slate-400";
            gridTop.appendChild(divTop);

            // Fila Inferior
            let charBot = alphabetBot[index];
            let divBot = document.createElement('div');
            divBot.innerText = charBot;
            divBot.id = `bot-${charBot}`;
            divBot.className = "letter-cell p-1 rounded text-slate-500";
            gridBottom.appendChild(divBot);

            // Mapeos para el HUD
            charMap[char] = { peer: charBot, topId: divTop.id, botId: divBot.id };
            charMap[charBot] = { peer: char, topId: divTop.id, botId: divBot.id };
        });
    }

    function animarTecla(charTyped) {
        // Limpiar animaciones previas
        document.querySelectorAll('.highlight-top, .highlight-bottom').forEach(el => {
            el.classList.remove('highlight-top', 'highlight-bottom');
        });

        const c = charTyped.toUpperCase();
        if (charMap[c]) {
            const mapInfo = charMap[c];
            document.getElementById(mapInfo.topId).classList.add('highlight-top');
            document.getElementById(mapInfo.botId).classList.add('highlight-bottom');

            charIn.innerText = c;
            charOut.innerText = mapInfo.peer;
        } else {
            charIn.innerText = charTyped === ' ' ? 'ESP' : charTyped;
            charOut.innerText = charTyped === ' ' ? 'ESP' : charTyped;
        }
    }

    // ==========================================
    // CONEXIÓN WEBSOCKET
    // ==========================================
    function connect() {
        let socket = new SockJS('/ws-criptografia');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function (frame) {
            console.log('Conectado a STOMP (Atbash)');
            stompClient.subscribe('/topic/atbash', function (response) {
                let data = JSON.parse(response.body);
                if(data.error) {
                    mostrarError(data.error);
                    outputTexto.value = "";
                    outputTexto.classList.replace('text-cyan-300', 'text-red-400');
                } else {
                    outputTexto.value = data.resultado;
                    outputTexto.classList.replace('text-red-400', 'text-cyan-300');
                }
            });
        }, function(error) {
            mostrarError("Conexión interrumpida. Reconectando...");
            setTimeout(connect, 3000);
        });
    }

    function enviarDatos() {
        if (!stompClient || !stompClient.connected) return;
        const texto = inputTexto.value;
        if(!texto) {
            outputTexto.value = "";
            charIn.innerText = "-";
            charOut.innerText = "-";
            document.querySelectorAll('.highlight-top, .highlight-bottom').forEach(el => {
                el.classList.remove('highlight-top', 'highlight-bottom');
            });
            return;
        }

        // Animar la última tecla presionada para feedback visual
        animarTecla(texto.charAt(texto.length - 1));

        stompClient.send("/app/atbash", {}, JSON.stringify({
            'texto': texto,
            'operacion': 'CIFRAR' // En Atbash, cifrar y descifrar es igual
        }));
    }

    inputTexto.addEventListener('input', enviarDatos);

    // ==========================================
    // UX / CLIPBOARD
    // ==========================================
    btnPegar.addEventListener('click', async () => {
        try {
            const textoPortapapeles = await navigator.clipboard.readText();
            if (textoPortapapeles) {
                inputTexto.value = textoPortapapeles;
                enviarDatos();
                inputTexto.focus();
            }
        } catch (err) { mostrarError("Permiso de portapapeles denegado."); }
    });

    btnLimpiar.addEventListener('click', () => {
        inputTexto.value = ""; enviarDatos(); inputTexto.focus();
    });

    btnCopiar.addEventListener('click', () => {
        outputTexto.select(); document.execCommand("copy");
    });

    function mostrarError(mensaje) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'bg-red-500/90 text-white px-4 py-3 rounded shadow-lg border border-red-700 flex items-center gap-3 backdrop-blur-sm animate-fade-in';
        toast.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> <span class="text-sm font-medium">${mensaje}</span>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s ease'; setTimeout(() => toast.remove(), 500); }, 3000);
    }

    // ==========================================
    // SISTEMA DE BURBUJAS TUTORIAL INTERACTIVO
    // ==========================================
    const tutorialData = [
        { element: '#panelParametros', title: 'Paso 1: Naturaleza Simétrica', text: 'Atbash no tiene clave matemática. Cifrar la letra "A" devuelve "Z". Volver a cifrar la "Z" devuelve la "A" original.' },
        { element: '#panelSimulador', title: 'Paso 2: El Espejo', text: 'Este es el mapeo interno. Observa cómo al teclear un mensaje, el espejo iluminará los pares reflejados en tiempo real.' },
        { element: '#panelEntrada', title: 'Paso 3: Mensaje', text: 'Escribe aquí tu texto original o cifrado. El motor WebSocket enviará la solicitud instantánea al backend.' },
        { element: '#panelSalida', title: 'Paso 4: Resultado', text: 'El texto devuelto está listo para copiarse. Si pasas este mismo texto por el input, recuperarás tu mensaje.' }
    ];

    let currentStep = 0;
    const overlay = document.getElementById('tutorialOverlay');
    const bubble = document.getElementById('tutorialBubble');
    const tutTitle = document.getElementById('tutTitle');
    const tutText = document.getElementById('tutText');
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
        if(!target) return;

        target.classList.add('tutorial-focus');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            const rect = target.getBoundingClientRect();
            bubble.classList.remove('hidden');

            const bubbleRect = bubble.getBoundingClientRect();
            let top = rect.bottom + 15;
            let left = rect.left + (rect.width / 2) - (bubbleRect.width / 2);

            if (left < 10) left = 10;
            if (left + bubbleRect.width > window.innerWidth - 10) {
                left = window.innerWidth - bubbleRect.width - 10;
            }
            if (top + bubbleRect.height > window.innerHeight - 10) {
                top = rect.top - bubbleRect.height - 15;
            }

            bubble.style.top = `${top}px`;
            bubble.style.left = `${left}px`;
            bubble.classList.remove('opacity-0', 'scale-95');
        }, 300);
    }

    function updateTutorial() {
        bubble.classList.add('opacity-0', 'scale-95');

        setTimeout(() => {
            tutTitle.innerHTML = tutorialData[currentStep].title;
            tutText.innerHTML = tutorialData[currentStep].text;

            Array.from(tutDotsContainer.children).forEach((dot, index) => {
                dot.className = index === currentStep
                    ? "w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] transition-all"
                    : "w-2 h-2 rounded-full bg-slate-700 transition-all";
            });

            btnTutPrev.classList.toggle('hidden', currentStep === 0);

            if (currentStep === tutorialData.length - 1) {
                btnTutNext.innerHTML = "Terminar ✓";
                btnTutNext.classList.replace('bg-cyan-600', 'bg-emerald-600');
                btnTutNext.classList.replace('hover:bg-cyan-500', 'hover:bg-emerald-500');
                btnTutNext.classList.replace('shadow-cyan-500/30', 'shadow-emerald-500/30');
            } else {
                btnTutNext.innerHTML = "Siguiente ❯";
                btnTutNext.classList.replace('bg-emerald-600', 'bg-cyan-600');
                btnTutNext.classList.replace('hover:bg-emerald-500', 'hover:bg-cyan-500');
                btnTutNext.classList.replace('shadow-emerald-500/30', 'shadow-cyan-500/30');
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
        setTimeout(() => {
            bubble.classList.add('hidden');
            overlay.classList.add('hidden');
        }, 300);
    }

    document.getElementById('btnCerrarTutorial').addEventListener('click', closeTutorial);
    btnTutNext.addEventListener('click', () => { currentStep < tutorialData.length - 1 ? (currentStep++, updateTutorial()) : closeTutorial(); });
    btnTutPrev.addEventListener('click', () => { if (currentStep > 0) { currentStep--; updateTutorial(); }});

    inicializarEspejo();
    connect();
});