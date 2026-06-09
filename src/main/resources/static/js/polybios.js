document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;

    // Referencias DOM
    const inputTexto   = document.getElementById('textoEntrada');
    const outputTexto  = document.getElementById('textoSalida');
    const inputClave   = document.getElementById('clave');
    const keyChip      = document.getElementById('keyChip');
    const radiosOperacion = document.querySelectorAll('input[name="operacion"]');
    const idiomaSelector = document.getElementById('idiomaSelector');

    const btnCopiar  = document.getElementById('btnCopiar');
    const btnPegar   = document.getElementById('btnPegar');
    const btnLimpiar = document.getElementById('btnLimpiar');

    const connDot   = document.getElementById('connDot');
    const connLabel = document.getElementById('connLabel');

    const polibiosGridEl = document.getElementById('polibiosGrid');

    // Estado de la UI
    let currentKeyword = null;

    // ==========================================
    // MOTOR CUADRADO POLIBIOS (CLIENT-SIDE)
    // ==========================================
    function buildPolibiosSquare(keyword, idioma) {
        let kw = (keyword || "").toUpperCase();
        let alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // Base en inglés (25 letras, sin J)

        if (idioma === "ES") {
            // En español, tratamos la Ñ como N y la J como I.
            kw = kw.replace(/Ñ/g, 'N').replace(/J/g, 'I').replace(/[^A-Z]/g, '');
        } else {
            kw = kw.replace(/J/g, 'I').replace(/[^A-Z]/g, '');
        }

        const seen = new Set();
        const sq   = [];

        for (const ch of kw) {
            if (!seen.has(ch)) { seen.add(ch); sq.push(ch); }
        }
        for (const ch of alphabet) {
            if (!seen.has(ch)) { seen.add(ch); sq.push(ch); }
        }
        return sq;
    }

    function initGrid(keyword) {
        const idioma = idiomaSelector.value;
        const cleanKeyword = (keyword || "").trim().toUpperCase();
        currentKeyword = cleanKeyword;

        const sq = buildPolibiosSquare(cleanKeyword, idioma);
        polibiosGridEl.innerHTML = '';

        const emptyCell = document.createElement('div');
        emptyCell.className = 'pol-cell empty';
        polibiosGridEl.appendChild(emptyCell);

        for (let c = 1; c <= 5; c++) {
            const cell = document.createElement('div');
            cell.className = 'pol-cell header-row';
            cell.textContent = c;
            polibiosGridEl.appendChild(cell);
        }

        for (let r = 0; r < 5; r++) {
            const rowHeader = document.createElement('div');
            rowHeader.className = 'pol-cell header-col';
            rowHeader.textContent = r + 1;
            polibiosGridEl.appendChild(rowHeader);

            for (let c = 0; c < 5; c++) {
                const letter = sq[r * 5 + c];
                const cell   = document.createElement('div');
                cell.className = 'pol-cell letter';
                cell.dataset.coords = `${r+1}${c+1}`;
                cell.dataset.letter = letter;

                // Renderizado condicional según idioma
                if (letter === 'I') {
                    cell.textContent = 'I/J';
                } else if (idioma === "ES" && letter === 'N') {
                    cell.textContent = 'N/Ñ';
                } else {
                    cell.textContent = letter;
                }

                polibiosGridEl.appendChild(cell);
            }
        } // Fin del for de filas
    }

    // Iluminación táctica sin destruir el DOM
    function highlightCell(targetVal, isCoord = false) {
        document.querySelectorAll('.pol-cell.highlighted').forEach(el => el.classList.remove('highlighted'));
        if (!targetVal) return;

        let selector = '';
        if (isCoord) {
            selector = `.pol-cell.letter[data-coords="${targetVal}"]`;
        } else {
            let letter = targetVal.toUpperCase().replace('Ñ', 'N').replace('J', 'I');
            if (!/[A-Z]/.test(letter)) return;
            selector = `.pol-cell.letter[data-letter="${letter}"]`;
        }

        const cell = document.querySelector(selector);
        if (cell) cell.classList.add('highlighted');
    }

    // ==========================================
    // STATS CORREGIDOS
    // ==========================================
    function updateStats(texto) {
        const operacion = document.querySelector('input[name="operacion"]:checked').value;
        let longitud = 0, pares = 0;

        if (operacion === 'CIFRAR') {
            const clean = texto.replace(/[^A-Za-zÑñ]/g, '');
            longitud = clean.length;
            pares = clean.length;
        } else {
            const clean = texto.replace(/[^1-5]/g, '');
            pares = Math.floor(clean.length / 2);
            longitud = pares;
        }

        document.getElementById('statLongitud').textContent = longitud;
        document.getElementById('statPares').textContent    = pares;
        document.getElementById('statRatio').textContent    = longitud > 0 ? '2×' : '—';
    }

    // ==========================================
    // CONEXIÓN WEBSOCKET
    // ==========================================
    function setConnStatus(online) {
        connDot.className = `conn-dot ${online ? 'connected' : 'disconnected'}`;
        connLabel.textContent = online ? 'online' : 'offline';
    }

    function connect() {
        const socket = new SockJS('/ws-criptografia');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function () {
            setConnStatus(true);
            stompClient.subscribe('/topic/polybios', function (response) {
                const data = JSON.parse(response.body);
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
            mostrarError("Conexión perdida. Reconectando…");
            setTimeout(connect, 3000);
        });
    }

    // ==========================================
    // ENVÍO
    // ==========================================
    function enviarDatos() {
        const texto     = inputTexto.value;
        const clave     = inputClave.value.trim();
        const operacion = document.querySelector('input[name="operacion"]:checked').value;
        const idioma    = idiomaSelector.value;

        keyChip.textContent = clave.toUpperCase() || 'SIN CLAVE';

        initGrid(clave);
        updateStats(texto);

        if (!texto) { outputTexto.value = ""; return; }
        if (!stompClient || !stompClient.connected) return;

        stompClient.send("/app/polybios", {}, JSON.stringify({ texto, operacion, clave, idioma }));
    }

    // ==========================================
    // EVENTOS
    // ==========================================
    inputTexto.addEventListener('input', enviarDatos);
    inputClave.addEventListener('input', enviarDatos);
    idiomaSelector.addEventListener('change', enviarDatos);
    radiosOperacion.forEach(r => r.addEventListener('change', enviarDatos));

    // Resaltador visual optimizado
    inputTexto.addEventListener('keyup', (e) => {
        const operacion = document.querySelector('input[name="operacion"]:checked').value;
        const pos = e.target.selectionStart;
        const val = e.target.value;

        if (operacion === 'CIFRAR') {
            const char = val[Math.max(0, pos - 1)];
            highlightCell(char, false);
        } else {
            const cleanCoords = val.substring(0, pos).replace(/[^1-5]/g, '');
            if (cleanCoords.length >= 2) {
                const coords = cleanCoords.slice(-2);
                highlightCell(coords, true);
            }
        }
    });

    // ==========================================
    // PORTAPAPELES
    // ==========================================
    btnPegar.addEventListener('click', async () => {
        try {
            const texto = await navigator.clipboard.readText();
            if (texto) { inputTexto.value = texto; enviarDatos(); inputTexto.focus(); }
        } catch { mostrarError("Permiso de portapapeles denegado."); }
    });

    btnLimpiar.addEventListener('click', () => {
        inputTexto.value = "";
        enviarDatos();
        document.querySelectorAll('.pol-cell.highlighted').forEach(el => el.classList.remove('highlighted'));
        inputTexto.focus();
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
        const toast     = document.createElement('div');
        const isError   = tipo === 'error';
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
    // TUTORIAL
    // ==========================================
    const tutorialData = [
        { element: '#panelParametros', title: 'La Palabra Clave',  text: 'Ingresa una palabra clave para reordenar el alfabeto en la cuadrícula. Sin clave, se usa el orden estándar A-Z.' },
        { element: '#panelSimulador',  title: 'La Cuadrícula 5×5', text: 'Cada celda tiene coordenadas (fila, columna). Al escribir, la letra actual se resalta en el cuadrado.' },
        { element: '#panelEntrada',    title: 'El Mensaje',         text: 'Escribe el texto plano. Solo las letras son procesadas; números y espacios se ignoran automáticamente.' },
        { element: '#panelSalida',     title: 'Las Coordenadas',    text: 'Cada letra se convierte en un par de dígitos. Para descifrar, pega los pares y cambia la operación.' }
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
            const rect       = target.getBoundingClientRect();
            bubble.classList.remove('hidden');
            const bubbleRect = bubble.getBoundingClientRect();

            let top  = rect.bottom + 15;
            let left = rect.left + (rect.width / 2) - (bubbleRect.width / 2);
            if (left < 10) left = 10;
            if (left + bubbleRect.width > window.innerWidth - 10)
                left = window.innerWidth - bubbleRect.width - 10;
            if (top + bubbleRect.height > window.innerHeight - 10)
                top = rect.top - bubbleRect.height - 15;

            bubble.style.top  = `${top}px`;
            bubble.style.left = `${left}px`;
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
    initGrid("");
});