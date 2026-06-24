document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;

    // Referencias DOM - Entradas
    const inputTexto   = document.getElementById('textoEntrada');
    const outputTexto  = document.getElementById('textoSalida');
    const inputClave   = document.getElementById('clave');
    const radiosOperacion = document.querySelectorAll('input[name="operacion"]');
    const radiosIdioma = document.querySelectorAll('input[name="idioma"]'); // Para espacios (ELIMINAR / MANTENER)

    // Simulador
    const filaOrigen      = document.getElementById('filaOrigen');
    const filaDestino     = document.getElementById('filaDestino');
    const svgConectores   = document.getElementById('svgConectores');
    const periodDisplay   = document.getElementById('periodDisplay');

    // Botones de acción
    const btnCopiar  = document.getElementById('btnCopiar');
    const btnPegar   = document.getElementById('btnPegar');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const btnAnimar  = document.getElementById('btnAnimar');

    // Estado conexión
    const connDot   = document.getElementById('connDot');
    const connLabel = document.getElementById('connLabel');

    let isAnimating = false;
    let animationInterval = null;
    let activeTarget = null;
    let animationFrameId = null;

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
            stompClient.subscribe('/topic/grupos', function (response) {
                let data = JSON.parse(response.body);
                if (data.error) {
                    mostrarError(data.error);
                    outputTexto.value = "";
                    outputTexto.classList.remove('text-cyan-650', 'text-cyan-300');
                    outputTexto.classList.add('text-red-500', 'dark:text-red-400');
                } else {
                    outputTexto.value = data.resultado;
                    outputTexto.classList.remove('text-red-500', 'dark:text-red-400');
                    outputTexto.classList.add('text-cyan-650', 'dark:text-cyan-300');
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
    // PARSER DE CLAVE
    // ==========================================
    function parseKey(keyStr) {
        if (!keyStr) return null;
        const tokens = keyStr.trim().split(/\s+/);
        const p = [];
        for (let t of tokens) {
            const val = parseInt(t);
            if (isNaN(val)) return null;
            p.push(val);
        }
        if (p.length === 0) return null;
        
        const seen = new Set();
        for (let val of p) {
            if (val < 1 || val > p.length) return null;
            if (seen.has(val)) return null;
            seen.add(val);
        }
        return p;
    }

    // ==========================================
    // SIMULADOR: CONECTORES Y CELDAS
    // ==========================================
    function dibujarConectores() {
        const p = parseKey(inputClave.value);
        if (!p) {
            svgConectores.innerHTML = '';
            filaOrigen.innerHTML = '';
            filaDestino.innerHTML = '';
            periodDisplay.innerText = "0";
            return;
        }

        const P = p.length;
        periodDisplay.innerText = P;

        // Limpiar filas
        filaOrigen.innerHTML = '';
        filaDestino.innerHTML = '';
        svgConectores.innerHTML = '';

        // Crear celdas
        for (let i = 0; i < P; i++) {
            const boxO = document.createElement('div');
            boxO.className = 'cell-box font-mono font-bold text-slate-400 text-sm';
            boxO.innerHTML = `<span class="text-[9px] text-slate-600 absolute top-0.5">${i + 1}</span><span class="char-val mt-2">-</span>`;
            boxO.setAttribute('data-pos', i + 1);
            filaOrigen.appendChild(boxO);

            const boxD = document.createElement('div');
            boxD.className = 'cell-box font-mono font-bold text-cyan-400 text-sm';
            boxD.innerHTML = `<span class="text-[9px] text-cyan-600/60 absolute top-0.5">${i + 1}</span><span class="char-val mt-2">-</span>`;
            boxD.setAttribute('data-pos', i + 1);
            filaDestino.appendChild(boxD);
        }

        // Trazar curvas SVG
        setTimeout(() => {
            const svgRect = svgConectores.getBoundingClientRect();
            const origBoxes = filaOrigen.querySelectorAll('.cell-box');
            const destBoxes = filaDestino.querySelectorAll('.cell-box');

            for (let i = 0; i < P; i++) {
                const destBox = destBoxes[i];
                const sourceIndex = p[i] - 1;
                const sourceBox = origBoxes[sourceIndex];

                if (!sourceBox || !destBox) continue;

                const sRect = sourceBox.getBoundingClientRect();
                const dRect = destBox.getBoundingClientRect();

                const x1 = sRect.left + sRect.width / 2 - svgRect.left;
                const y1 = 0;
                const x2 = dRect.left + dRect.width / 2 - svgRect.left;
                const y2 = svgRect.height;

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const controlY = (y1 + y2) / 2;
                const d = `M ${x1} ${y1} C ${x1} ${controlY}, ${x2} ${controlY}, ${x2} ${y2}`;
                
                path.setAttribute('d', d);
                path.setAttribute('stroke', 'rgba(6, 182, 212, 0.25)');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('fill', 'none');
                path.setAttribute('class', 'connection-path transition-all duration-300');
                path.setAttribute('data-source', sourceIndex + 1);
                path.setAttribute('data-dest', i + 1);
                svgConectores.appendChild(path);
            }
        }, 80);
    }

    window.addEventListener('resize', dibujarConectores);
    inputClave.addEventListener('input', dibujarConectores);

    // ==========================================
    // ENVÍO DE DATOS
    // ==========================================
    function enviarDatos() {
        if (!stompClient || !stompClient.connected) return;

        const texto = inputTexto.value;
        if (!texto) { outputTexto.value = ""; return; }

        const operacion = document.querySelector('input[name="operacion"]:checked').value;
        const idioma = document.querySelector('input[name="idioma"]:checked').value; // ELIMINAR / MANTENER

        stompClient.send("/app/grupos", {}, JSON.stringify({
            texto: texto,
            operacion: operacion,
            clave: inputClave.value.toString(),
            idioma: idioma
        }));
    }

    inputTexto.addEventListener('input', enviarDatos);
    radiosOperacion.forEach(r => r.addEventListener('change', enviarDatos));
    radiosIdioma.forEach(r => r.addEventListener('change', enviarDatos));
    inputClave.addEventListener('input', enviarDatos);

    // ==========================================
    // ANIMACIÓN PASO A PASO
    // ==========================================
    function stopAnimation() {
        if (animationInterval) clearTimeout(animationInterval);
        isAnimating = false;
        btnAnimar.innerHTML = "⚡ Animar";
        btnAnimar.classList.replace('text-red-300', 'text-amber-300');
        
        // Reset highlights
        document.querySelectorAll('.cell-box').forEach(el => el.classList.remove('active'));
        svgConectores.querySelectorAll('path').forEach(p => {
            p.setAttribute('stroke', 'rgba(6, 182, 212, 0.25)');
            p.setAttribute('stroke-width', '2');
        });
    }

    function animarGrupos() {
        if (isAnimating) {
            stopAnimation();
            return;
        }

        const texto = inputTexto.value;
        if (!texto) {
            mostrarError("Ingrese texto a animar.");
            return;
        }

        const p = parseKey(inputClave.value);
        if (!p) {
            mostrarError("Permutación inválida.");
            return;
        }

        const P = p.length;
        const operacion = document.querySelector('input[name="operacion"]:checked').value;
        const isCifrar = (operacion === "CIFRAR");
        const eliminarEspacios = document.querySelector('input[name="idioma"]:checked').value === "ELIMINAR";

        // Preparar cadena
        let txt = texto;
        if (isCifrar) {
            txt = eliminarEspacios ? texto.replaceAll("\\s+", "").toUpperCase() : texto.toUpperCase();
            
            // Relleno
            let rem = txt.length % P;
            if (rem !== 0) {
                let padLen = P - rem;
                for (let i = 0; i < padLen; i++) {
                    txt += "X";
                }
            }
        } else {
            txt = texto.replaceAll("\\s+", "");
            if (txt.length % P !== 0) {
                mostrarError("La longitud del criptograma debe ser múltiplo del período P.");
                return;
            }
        }

        isAnimating = true;
        btnAnimar.innerHTML = "⏹ Detener";
        btnAnimar.classList.replace('text-amber-300', 'text-red-300');
        
        outputTexto.value = "";
        let finalResult = "";
        let blockIndex = 0;
        let charIndexInBlock = 0;

        // Calcular permutación inversa
        const inv = new Set();
        const invArr = [];
        for (let i = 0; i < P; i++) {
            invArr[p[i] - 1] = i + 1;
        }

        function animarSiguienteCaracter() {
            const textIdx = blockIndex * P + charIndexInBlock;
            if (textIdx >= txt.length) {
                stopAnimation();
                mostrarExito("Animación finalizada.");
                enviarDatos();
                return;
            }

            // Al inicio del bloque, populate celdas de origen
            if (charIndexInBlock === 0) {
                const blockText = txt.substring(blockIndex * P, blockIndex * P + P);
                const origBoxes = filaOrigen.querySelectorAll('.cell-box');
                const destBoxes = filaDestino.querySelectorAll('.cell-box');

                // Limpiar dest
                destBoxes.forEach(b => {
                    b.querySelector('.char-val').innerText = '-';
                    b.classList.remove('active');
                });
                // Populate orig
                for (let i = 0; i < P; i++) {
                    origBoxes[i].querySelector('.char-val').innerText = blockText[i] || 'X';
                }
                
                // Mostrar toast del bloque
                mostrarToast(`Procesando bloque ${blockIndex + 1}: "${blockText}"`, 'ok');
            }

            const origBoxes = filaOrigen.querySelectorAll('.cell-box');
            const destBoxes = filaDestino.querySelectorAll('.cell-box');

            // Reset curves highlights
            svgConectores.querySelectorAll('path').forEach(path => {
                path.setAttribute('stroke', 'rgba(6, 182, 212, 0.25)');
                path.setAttribute('stroke-width', '2');
            });
            origBoxes.forEach(b => b.classList.remove('active'));

            let charValue = '';
            let srcIndex = 0;
            let destIndex = 0;

            if (isCifrar) {
                destIndex = charIndexInBlock; // 0-based
                srcIndex = p[destIndex] - 1;  // 0-based
                charValue = origBoxes[srcIndex].querySelector('.char-val').innerText;
            } else {
                destIndex = charIndexInBlock; // 0-based
                srcIndex = invArr[destIndex] - 1; // 0-based
                charValue = origBoxes[srcIndex].querySelector('.char-val').innerText;
            }

            // Resaltar origen y conector
            origBoxes[srcIndex].classList.add('active');
            const path = svgConectores.querySelector(`path[data-source="${srcIndex + 1}"][data-dest="${destIndex + 1}"]`);
            if (path) {
                path.setAttribute('stroke', '#fbbf24');
                path.setAttribute('stroke-width', '4');
            }

            // Resaltar destino
            setTimeout(() => {
                destBoxes[destIndex].querySelector('.char-val').innerText = charValue;
                destBoxes[destIndex].classList.add('active');

                // Append to result
                let nextResultPart = charValue;
                if (isCifrar && charIndexInBlock === P - 1) {
                    // Si completó bloque y es cifrar, añadir espacio para formatear
                    nextResultPart += " ";
                }
                finalResult += nextResultPart;
                outputTexto.value = finalResult.trim();

                // Foco sin scroll
                inputTexto.focus({ preventScroll: true });
                inputTexto.setSelectionRange(textIdx, textIdx + 1);
                outputTexto.focus({ preventScroll: true });
                outputTexto.setSelectionRange(finalResult.length - 1, finalResult.length);

                charIndexInBlock++;
                if (charIndexInBlock === P) {
                    charIndexInBlock = 0;
                    blockIndex++;
                }

                animationInterval = setTimeout(animarSiguienteCaracter, 600);
            }, 300);
        }

        animarSiguienteCaracter();
    }

    btnAnimar.addEventListener('click', animarGrupos);

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
    function mostrarError(msg) { CryptoUX.showToast("Error", msg, "error"); }
    function mostrarExito(msg) { CryptoUX.showToast("Éxito", msg, "success"); }

    // ==========================================
    // TUTORIAL DRAWER
    // ==========================================
    const tutorialData = [
        { element: '#panelParametros', title: 'Configurar Bloque',   text: 'Ingresa los números de permutación separados por espacios. El período se deduce automáticamente por la cantidad de números.' },
        { element: '#panelSimulador',  title: 'Ruta de Transposición', text: 'Visualiza la correspondencia original contra la mezclada a través de las flechas curvas.' },
        { element: '#panelEntrada',    title: 'Texto del Mensaje',      text: 'Inserta el texto plano. El sistema completará automáticamente con "X" las posiciones faltantes al final.' },
        { element: '#panelSalida',     title: 'Resultado Permutado',   text: 'Copia el texto cifrado final. Puedes ejecutar "Animar" para ver el viaje de cada carácter.' }
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

    function stopTracking() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        activeTarget = null;
    }

    function updateBubblePosition() {
        if (!activeTarget) return;
        const rect = activeTarget.getBoundingClientRect();
        const bubbleRect = bubble.getBoundingClientRect();

        let top = rect.bottom + 15;
        let left = rect.left + (rect.width / 2) - (bubbleRect.width / 2);

        const padding = 15;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        if (left < padding) left = padding;
        if (left + bubbleRect.width > screenWidth - padding) {
            left = screenWidth - bubbleRect.width - padding;
        }

        if (top + bubbleRect.height > screenHeight - padding) {
            top = rect.top - bubbleRect.height - 15;
        }
        if (top < padding) {
            top = padding;
        }

        bubble.style.top = `${top}px`;
        bubble.style.left = `${left}px`;

        animationFrameId = requestAnimationFrame(updateBubblePosition);
    }

    function moverBurbuja(selector) {
        stopTracking();
        document.querySelectorAll('.tutorial-focus').forEach(el => el.classList.remove('tutorial-focus'));
        const target = document.querySelector(selector);
        if (!target) return;
        target.classList.add('tutorial-focus');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            activeTarget = target;
            bubble.classList.remove('hidden');
            updateBubblePosition();
            bubble.classList.remove('opacity-0', 'scale-95');
        }, 300);
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
                btnTutNext.classList.remove("bg-cyan-600", "hover:bg-cyan-500");
                btnTutNext.classList.add("bg-emerald-600", "hover:bg-emerald-500");
            } else {
                btnTutNext.innerHTML = "Siguiente →";
                btnTutNext.classList.remove("bg-emerald-600", "hover:bg-emerald-500");
                btnTutNext.classList.add("bg-cyan-600", "hover:bg-cyan-500");
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
        stopTracking();
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
    dibujarConectores();
});
