document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;

    // Referencias DOM - Entradas
    const inputTexto   = document.getElementById('textoEntrada');
    const outputTexto  = document.getElementById('textoSalida');
    const inputClave   = document.getElementById('clave');
    const radiosOperacion = document.querySelectorAll('input[name="operacion"]');

    // Simulador
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
    const btnAnimar  = document.getElementById('btnAnimar');

    // Estado conexión
    const connDot   = document.getElementById('connDot');
    const connLabel = document.getElementById('connLabel');

    // Alfabetos
    const ALFABETOS = {
        "LA": { ext: "ABCDEFGILMNOPQRSTVXZ1234", int: "&xysomqihfdbacegklnprtvz" },
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

    let currentLang = "LA";

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
        stompClient.debug = null;

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
            enviarDatos();
        }, function () {
            setConnStatus(false);
            mostrarError("Conexión interrumpida. Reconectando…");
            setTimeout(connect, 3000);
        });
    }

    // ==========================================
    // MOTOR GRÁFICO DISCOS
    // ==========================================
    function dibujarDisco(container, alfabeto, radio, charClass, reverse = false) {
        container.innerHTML = '';
        const len  = alfabeto.length;
        const step = 360 / len;

        for (let i = 0; i < len; i++) {
            const div = document.createElement('div');
            div.innerText = alfabeto[i];
            div.className = `absolute left-1/2 top-1/2 w-6 h-6 -ml-3 -mt-3 flex items-center justify-center font-mono font-bold transition-all duration-300 ${charClass}`;
            div.setAttribute('data-index', i);
            div.setAttribute('data-char', alfabeto[i]);
            
            const angle = reverse ? -i * step : i * step;
            div.style.transform = `rotate(${angle}deg) translateY(-${radio}px)`;
            container.appendChild(div);
        }
    }

    function renderizarSimulador() {
        const width = window.innerWidth;
        const rExt  = width < 640 ? 110 : 135;
        const rInt  = width < 640 ? 70  : 90;

        dibujarDisco(outerRing,    ALFABETOS[currentLang].ext, rExt, 'outer-char', false);
        dibujarDisco(innerLetters, ALFABETOS[currentLang].int, rInt, 'inner-char', true);
        actualizarRotacion(0);
    }

    window.addEventListener('resize', renderizarSimulador);

    // ==========================================
    // LÓGICA DE ROTACIÓN Y ENVÍO
    // ==========================================
    function parseKeyJS(keyStr) {
        if (!keyStr) return null;
        const p = /K\s*\(\s*([A-Z0-9&])([A-Z0-9&])\s*,\s*(\d+)\s*,\s*(\d+)([DI])\s*\)/i;
        const m = keyStr.trim().match(p);
        if (!m) return null;
        return {
            outerChar: m[1].toUpperCase(),
            innerChar: m[2],
            blockSize: parseInt(m[3]),
            shiftAmount: parseInt(m[4]),
            direction: m[5].toUpperCase()
        };
    }

    function actualizarRotacion(shiftOffset = 0) {
        const keyInfo = parseKeyJS(inputClave.value);
        if (!keyInfo) return;

        const extAlf = ALFABETOS[currentLang].ext;
        const intAlf = ALFABETOS[currentLang].int;

        let idxO = extAlf.indexOf(keyInfo.outerChar);
        if (idxO === -1) idxO = extAlf.toUpperCase().indexOf(keyInfo.outerChar.toUpperCase());

        let idxI = intAlf.indexOf(keyInfo.innerChar);
        if (idxI === -1) {
            const isLower = keyInfo.innerChar === keyInfo.innerChar.toLowerCase();
            const opposite = isLower ? keyInfo.innerChar.toUpperCase() : keyInfo.innerChar.toLowerCase();
            idxI = intAlf.indexOf(opposite);
        }

        if (idxO === -1 || idxI === -1) return;

        const len = extAlf.length;
        const step = 360 / len;

        // R = idxI + idxO + shiftOffset
        // Since we drew inner wheel reversed, rotation angle in degrees clockwise is:
        const angle = (idxI + idxO + shiftOffset) * step;

        innerWheel.style.transform = `rotate(${angle}deg)`;
        diskAngleDisplay.innerText = `${shiftOffset}`;

        const letraAlineadaIndex = (idxI + idxO + shiftOffset + len * 100) % len;
        alignDisplay.innerText = intAlf[letraAlineadaIndex % intAlf.length];
    }

    function enviarDatos() {
        actualizarRotacion(0);
        if (!stompClient || !stompClient.connected) return;

        const texto = inputTexto.value;
        if (!texto) { outputTexto.value = ""; return; }

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
    // ANIMACIÓN PASO A PASO
    // ==========================================
    let animationInterval = null;
    let isAnimating = false;

    function highlightChars(outerChar, innerChar) {
        document.querySelectorAll('.outer-char, .inner-char').forEach(el => {
            el.classList.remove('text-amber-400', 'scale-150', 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]');
        });

        const oEl = outerRing.querySelector(`.outer-char[data-char="${outerChar.toUpperCase()}"]`);
        if (oEl) {
            oEl.classList.add('text-amber-400', 'scale-150', 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]');
        }

        const iEls = innerLetters.querySelectorAll('.inner-char');
        for (let iEl of iEls) {
            if (iEl.getAttribute('data-char') === innerChar) {
                iEl.classList.add('text-amber-400', 'scale-150', 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]');
                break;
            }
        }
    }

    function stopAnimation() {
        if (animationInterval) clearTimeout(animationInterval);
        isAnimating = false;
        btnAnimar.innerHTML = "⚡ Animar";
        btnAnimar.classList.replace('text-red-300', 'text-amber-300');
        document.querySelectorAll('.outer-char, .inner-char').forEach(el => {
            el.classList.remove('text-amber-400', 'scale-150', 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]');
        });
    }

    function animarAlberti() {
        if (isAnimating) {
            stopAnimation();
            return;
        }

        const texto = inputTexto.value;
        if (!texto) {
            mostrarError("Por favor, ingrese un texto para animar.");
            return;
        }

        const keyInfo = parseKeyJS(inputClave.value);
        if (!keyInfo) {
            mostrarError("Clave inválida. Use el formato K(Mb, X, Yd).");
            return;
        }

        const extAlf = ALFABETOS[currentLang].ext;
        const intAlf = ALFABETOS[currentLang].int;

        let idxO = extAlf.indexOf(keyInfo.outerChar);
        if (idxO === -1) idxO = extAlf.toUpperCase().indexOf(keyInfo.outerChar.toUpperCase());
        let idxI = intAlf.indexOf(keyInfo.innerChar);
        if (idxI === -1) {
            const isLower = keyInfo.innerChar === keyInfo.innerChar.toLowerCase();
            const opposite = isLower ? keyInfo.innerChar.toUpperCase() : keyInfo.innerChar.toLowerCase();
            idxI = intAlf.indexOf(opposite);
        }

        if (idxO === -1 || idxI === -1) {
            mostrarError("La letra de coincidencia de la clave no existe en el alfabeto.");
            return;
        }

        const operacion = document.querySelector('input[name="operacion"]:checked').value;
        const isCifrar = (operacion === "CIFRAR");

        let txt = texto;
        let originalIndices = [];
        
        if (currentLang === "LA") {
            let cleaned = "";
            let upper = texto.toUpperCase()
                             .replace("U", "V")
                             .replace("W", "V")
                             .replace("J", "I")
                             .replace("Ñ", "N");
            for (let i = 0; i < upper.length; i++) {
                const c = upper[i];
                if (extAlf.indexOf(c) !== -1) {
                    cleaned += c;
                    originalIndices.push(i);
                }
            }
            txt = isCifrar ? cleaned : cleaned.toLowerCase();
        } else {
            for (let i = 0; i < texto.length; i++) {
                originalIndices.push(i);
            }
            txt = isCifrar ? texto.toUpperCase() : texto.toLowerCase();
        }

        if (txt.length === 0) {
            mostrarError("El texto no contiene caracteres válidos para el alfabeto seleccionado.");
            return;
        }

        isAnimating = true;
        btnAnimar.innerHTML = "⏹ Detener";
        btnAnimar.classList.replace('text-amber-300', 'text-red-300');
        
        outputTexto.value = "";
        let resultado = "";
        let charIndex = 0;

        const directionSign = (keyInfo.direction === 'D') ? 1 : -1;
        const moduloLen = extAlf.length;

        actualizarRotacion(0);

        function step() {
            if (charIndex >= txt.length) {
                stopAnimation();
                mostrarExito("Animación completada con éxito.");
                enviarDatos();
                return;
            }

            const c = txt[charIndex];
            const block = Math.floor(charIndex / keyInfo.blockSize);
            const shiftOffset = directionSign * block * keyInfo.shiftAmount;

            if (charIndex > 0 && charIndex % keyInfo.blockSize === 0) {
                actualizarRotacion(shiftOffset);
                mostrarToast(`Giro del disco: bloque ${block + 1}, offset ${shiftOffset} pos`, 'ok');
            }

            const origIdx = originalIndices[charIndex];
            inputTexto.focus({ preventScroll: true });
            inputTexto.setSelectionRange(origIdx, origIdx + 1);

            let resChar = c;
            if (isCifrar) {
                const idxExt = extAlf.indexOf(c);
                if (idxExt !== -1) {
                    const idxInt = (idxI + shiftOffset - (idxExt - idxO) + moduloLen * 100) % moduloLen;
                    resChar = intAlf[idxInt];
                    highlightChars(c, resChar);
                }
            } else {
                const idxInt = intAlf.indexOf(c);
                if (idxInt !== -1) {
                    const idxExt = (idxO + idxI + shiftOffset - idxInt + moduloLen * 100) % moduloLen;
                    resChar = extAlf[idxExt];
                    highlightChars(resChar, c);
                }
            }

            resultado += resChar;
            outputTexto.value = resultado;
            outputTexto.focus({ preventScroll: true });
            outputTexto.setSelectionRange(resultado.length - 1, resultado.length);

            charIndex++;
            animationInterval = setTimeout(step, 800);
        }

        step();
    }

    // ==========================================
    // CONTROLES DE INTERFAZ Y EVENTOS
    // ==========================================
    inputTexto.addEventListener('input', enviarDatos);
    radiosOperacion.forEach(r => r.addEventListener('change', enviarDatos));
    inputClave.addEventListener('input', enviarDatos);
    btnAnimar.addEventListener('click', animarAlberti);

    // Cambio de Idioma
    idiomaSelector.addEventListener('change', (e) => {
        currentLang = e.target.value;

        if (currentLang === "CUSTOM") {
            customContainer.classList.remove('hidden');
        } else {
            customContainer.classList.add('hidden');
            alertaLongitud.classList.add('hidden');
        }

        // Default keys for different languages
        if (currentLang === "LA") {
            inputClave.value = "K(Mb, 4, 3d)";
        } else if (currentLang === "ES") {
            inputClave.value = "K(Ac, 4, 3d)";
        } else {
            inputClave.value = "K(Aa, 4, 3d)";
        }

        renderizarSimulador();
        enviarDatos();
    });

    function actualizarCustom() {
        const valExt = customExt.value;
        const valInt = customInt.value;

        countExt.innerText = valExt.length;
        countInt.innerText = valInt.length;

        if (valExt.length !== valInt.length && currentLang === "CUSTOM") {
            alertaLongitud.classList.remove('hidden');
        } else {
            alertaLongitud.classList.add('hidden');
        }

        ALFABETOS["CUSTOM"].ext = valExt;
        ALFABETOS["CUSTOM"].int = valInt;

        renderizarSimulador();
        if (valExt.length === valInt.length) {
            enviarDatos();
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
        { element: '#panelParametros', title: 'Configuración Base',     text: 'Ingresa la clave en formato K(Mb, X, Yd) para alinear los discos y definir el período de rotación.' },
        { element: '#panelSimulador',  title: 'Eje Mecánico 3D',      text: 'El láser proyecta la alineación exacta. Letras mayúsculas (Exterior) hacia minúsculas (Interior).' },
        { element: '#panelEntrada',    title: 'Input Seguro',           text: 'Pega tu texto aquí. Los WebSockets envían y procesan el cifrado instantáneamente.' },
        { element: '#panelSalida',     title: 'Mensaje Cifrado',        text: '¡Listo! Tu texto ha sido procesado polialfabéticamente sin recargar la página. Usa "Animar" para ver el proceso paso a paso.' }
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

        setTimeout(() => {
            const rect = target.getBoundingClientRect();
            bubble.classList.remove('hidden');
            const bubbleRect = bubble.getBoundingClientRect();

            let top  = rect.bottom + 15;
            let left = rect.left + (rect.width / 2) - (bubbleRect.width / 2);

            const padding = 15;
            const screenWidth = document.documentElement.clientWidth;
            const screenHeight = window.innerHeight;

            if (left + bubbleRect.width > screenWidth - padding) {
                left = screenWidth - bubbleRect.width - padding;
            }
            if (left < padding) {
                left = padding;
            }

            if (top + bubbleRect.height > screenHeight - padding) {
                top = rect.top - bubbleRect.height - 15;
            }
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