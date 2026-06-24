document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;

    // Referencias DOM - Entradas
    const inputTexto   = document.getElementById('textoEntrada');
    const outputTexto  = document.getElementById('textoSalida');
    const numSeriesSelect = document.getElementById('numSeries');
    const seriesInputsContainer = document.getElementById('seriesInputsContainer');
    const radiosOperacion = document.querySelectorAll('input[name="operacion"]');

    // Simulador
    const simuladorGrid = document.getElementById('simuladorGrid');
    const submessagesContainer = document.getElementById('submessagesContainer');
    const seriesLegend = document.getElementById('seriesLegend');

    // Botones de acción
    const btnCopiar   = document.getElementById('btnCopiar');
    const btnPegar    = document.getElementById('btnPegar');
    const btnLimpiar  = document.getElementById('btnLimpiar');
    const btnAnimar   = document.getElementById('btnAnimar');

    // Estado conexión
    const connDot   = document.getElementById('connDot');
    const connLabel = document.getElementById('connLabel');

    let isAnimating = false;
    let animationInterval = null;

    // Catálogo de series
    const SERIES_CATALOG = [
        { value: 'FIBONACCI', label: 'Sucesión de Fibonacci' },
        { value: 'CUADRADOS', label: 'Cuadrados Perfectos' },
        { value: 'CUBOS', label: 'Cubos Perfectos' },
        { value: 'COMPUESTOS', label: 'Números Compuestos' },
        { value: 'PRIMOS', label: 'Primos' },
        { value: 'PARES', label: 'Pares' },
        { value: 'IMPARES', label: 'Impares' },
        { value: 'NATURALES', label: 'Naturales' },
        { value: 'MULTIPLOS_3', label: 'Múltiplos de 3' },
        { value: 'MULTIPLOS_4', label: 'Múltiplos de 4' },
        { value: 'MULTIPLOS_5', label: 'Múltiplos de 5' },
        { value: 'MULTIPLOS_6', label: 'Múltiplos de 6' }
    ];

    const DEFAULTS = ['PARES', 'IMPARES', 'NATURALES', 'PRIMOS', 'FIBONACCI', 'CUADRADOS', 'CUBOS', 'COMPUESTOS'];

    function normalizarTexto(val) {
        if (!val) return "";
        return val.toUpperCase()
            .replace(/[ÁÄÂÀ]/g, "A")
            .replace(/[ÉËÊÈ]/g, "E")
            .replace(/[ÍÏÎÌ]/g, "I")
            .replace(/[ÓÖÔÒ]/g, "O")
            .replace(/[ÚÜÛÙ]/g, "U")
            .replace(/[^A-ZÑ]/g, "");
    }

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
            stompClient.subscribe('/topic/series', function (response) {
                let data = JSON.parse(response.body);
                if (data.error) {
                    mostrarError(data.error);
                    outputTexto.value = "";
                    outputTexto.classList.remove('text-teal-650', 'text-teal-300');
                    outputTexto.classList.add('text-red-500', 'dark:text-red-400');
                } else {
                    outputTexto.value = data.resultado;
                    outputTexto.classList.remove('text-red-500', 'dark:text-red-400');
                    outputTexto.classList.add('text-teal-650', 'dark:text-teal-300');
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
    // GESTIÓN DINÁMICA DE SELECTORES Y CLAVE
    // ==========================================
    function renderSeriesSelects() {
        const count = parseInt(numSeriesSelect.value) || 3;
        
        // Guardar valores previos si existen
        const prevValues = [];
        seriesInputsContainer.querySelectorAll('select').forEach(sel => {
            prevValues.push(sel.value);
        });

        seriesInputsContainer.innerHTML = '';
        const currentAssignedValues = [];

        for (let i = 0; i < count; i++) {
            const selectDiv = document.createElement('div');
            selectDiv.className = 'flex flex-col gap-1';
            
            const label = document.createElement('label');
            label.className = 'text-[9px] uppercase font-bold text-slate-500';
            label.innerText = `Serie ${i + 1}`;

            const select = document.createElement('select');
            select.className = 'bg-slate-900 border border-slate-700 rounded-lg text-teal-300 text-xs p-2.5 outline-none focus:border-teal-500/80 transition font-mono series-dropdown';
            select.setAttribute('data-index', i);

            // Poblar opciones
            SERIES_CATALOG.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.innerText = opt.label;
                select.appendChild(option);
            });

            // Establecer valor inicial
            let initialVal = prevValues[i];
            if (!initialVal || currentAssignedValues.includes(initialVal)) {
                // Buscar un default que no esté tomado en la asignación actual
                initialVal = DEFAULTS.find(d => !currentAssignedValues.includes(d)) || 'NATURALES';
            }
            select.value = initialVal;
            currentAssignedValues.push(initialVal);

            selectDiv.appendChild(label);
            selectDiv.appendChild(select);
            seriesInputsContainer.appendChild(selectDiv);

            // Escuchar cambios
            select.addEventListener('change', () => {
                updateAvailableOptions();
                dibujarSimulador();
                enviarDatos();
            });
        }

        updateAvailableOptions();
        dibujarSimulador();
        enviarDatos();
    }

    function updateAvailableOptions() {
        const selects = seriesInputsContainer.querySelectorAll('.series-dropdown');
        const selectedValues = Array.from(selects).map(sel => sel.value);

        selects.forEach(sel => {
            const currentValue = sel.value;
            const options = sel.querySelectorAll('option');

            options.forEach(opt => {
                const optVal = opt.value;
                if (optVal !== currentValue && selectedValues.includes(optVal)) {
                    opt.disabled = true;
                    opt.style.color = '#475569'; // gris oscuro
                } else {
                    opt.disabled = false;
                    opt.style.color = '';
                }
            });
        });
    }

    function getClaveValue() {
        const selects = seriesInputsContainer.querySelectorAll('.series-dropdown');
        const list = [];
        selects.forEach(sel => {
            if (sel.value) list.push(sel.value);
        });
        return list.join(', ');
    }

    numSeriesSelect.addEventListener('change', renderSeriesSelects);

    // ==========================================
    // PARSER DE CLAVE
    // ==========================================
    function parseSeries(keyStr) {
        if (!keyStr || !keyStr.trim()) return [];
        const parts = keyStr.split(',');
        const list = [];
        for (let part of parts) {
            let token = part.trim().toUpperCase();
            if (token.startsWith("MULTIPLOS_") || token.startsWith("M")) {
                let numStr = token.startsWith("MULTIPLOS_") ? token.substring(10) : token.substring(1);
                let k = parseInt(numStr);
                if (!isNaN(k) && k > 0) {
                    list.push({ type: 'MULTIPLOS', k: k, name: `Múltiplos de ${k}` });
                }
            } else if (token === "IMPARES" || token === "I") {
                list.push({ type: 'IMPARES', k: 0, name: "Impares" });
            } else if (token === "PARES" || token === "P") {
                list.push({ type: 'PARES', k: 0, name: "Pares" });
            } else if (token === "PRIMOS" || token === "PR") {
                list.push({ type: 'PRIMOS', k: 0, name: "Primos" });
            } else if (token === "NATURALES" || token === "N") {
                list.push({ type: 'NATURALES', k: 0, name: "Naturales" });
            } else if (token === "FIBONACCI" || token === "FIB") {
                list.push({ type: 'FIBONACCI', k: 0, name: "Fibonacci" });
            } else if (token === "CUADRADOS" || token === "CUAD") {
                list.push({ type: 'CUADRADOS', k: 0, name: "Cuadrados Perfectos" });
            } else if (token === "CUBOS") {
                list.push({ type: 'CUBOS', k: 0, name: "Cubos Perfectos" });
            } else if (token === "COMPUESTOS" || token === "COMP") {
                list.push({ type: 'COMPUESTOS', k: 0, name: "Números Compuestos" });
            }
        }
        return list;
    }

    function isPrime(n) {
        if (n < 2) return false;
        for (let i = 2; i * i <= n; i++) {
            if (n % i === 0) return false;
        }
        return true;
    }

    function generateCandidates(sd, N) {
        const list = [];
        if (sd.type === 'PRIMOS') {
            for (let i = 1; i <= N; i++) {
                if (isPrime(i)) list.push(i);
            }
        } else if (sd.type === 'MULTIPLOS') {
            for (let i = sd.k; i <= N; i += sd.k) {
                list.push(i);
            }
        } else if (sd.type === 'IMPARES') {
            for (let i = 1; i <= N; i += 2) {
                list.push(i);
            }
        } else if (sd.type === 'PARES') {
            for (let i = 2; i <= N; i += 2) {
                list.push(i);
            }
        } else if (sd.type === 'NATURALES') {
            for (let i = 1; i <= N; i++) {
                list.push(i);
            }
        } else if (sd.type === 'FIBONACCI') {
            let a = 1;
            let b = 2;
            if (N >= 1) list.push(1);
            if (N >= 2) list.push(2);
            while (true) {
                let next = a + b;
                if (next > N) break;
                list.add ? list.push(next) : list.push(next); // standard safe push
                a = b;
                b = next;
            }
        } else if (sd.type === 'CUADRADOS') {
            for (let i = 1; i * i <= N; i++) {
                list.push(i * i);
            }
        } else if (sd.type === 'CUBOS') {
            for (let i = 1; i * i * i <= N; i++) {
                list.push(i * i * i);
            }
        } else if (sd.type === 'COMPUESTOS') {
            for (let i = 2; i <= N; i++) {
                if (!isPrime(i)) list.push(i);
            }
        }
        return list;
    }

    function buildIndexMapping(descriptors, N) {
        const indexMap = [];
        const cellMapping = {}; // index (1-based) -> seriesIndex (or -1 for leftovers)
        const taken = new Array(N + 1).fill(false);

        for (let sIdx = 0; sIdx < descriptors.length; sIdx++) {
            const sd = descriptors[sIdx];
            const candidates = generateCandidates(sd, N);
            for (let cand of candidates) {
                if (cand >= 1 && cand <= N && !taken[cand]) {
                    indexMap.push(cand);
                    taken[cand] = true;
                    cellMapping[cand] = sIdx;
                }
            }
        }

        // Leftovers
        for (let i = 1; i <= N; i++) {
            if (!taken[i]) {
                indexMap.push(i);
                taken[i] = true;
                cellMapping[i] = -1;
            }
        }

        return { indexMap, cellMapping };
    }

    // ==========================================
    // SIMULADOR
    // ==========================================
    function dibujarSimulador() {
        const operacionEl = document.querySelector('input[name="operacion"]:checked');
        const isCifrar = operacionEl ? (operacionEl.value === "CIFRAR") : true;

        const labelInputDesc = document.getElementById('labelInputDesc');
        const labelOutputDesc = document.getElementById('labelOutputDesc');
        if (labelInputDesc && labelOutputDesc) {
            if (isCifrar) {
                labelInputDesc.textContent = "Mensaje plano o Mensaje Claro";
                labelOutputDesc.textContent = "Criptograma o Texto Cifrado";
            } else {
                labelInputDesc.textContent = "Criptograma o Texto Cifrado";
                labelOutputDesc.textContent = "Mensaje plano o Mensaje Claro";
            }
        }

        if (isAnimating) return;

        const texto = inputTexto.value;
        if (!texto) {
            simuladorGrid.innerHTML = '';
            submessagesContainer.innerHTML = '';
            seriesLegend.innerHTML = '';
            return;
        }

        const rawText = normalizarTexto(texto);
        const N = rawText.length;
        const descriptors = parseSeries(getClaveValue());

        if (descriptors.length === 0) {
            simuladorGrid.innerHTML = '';
            submessagesContainer.innerHTML = '';
            seriesLegend.innerHTML = '';
            return;
        }

        // Render Legend
        seriesLegend.innerHTML = '';
        descriptors.forEach((sd, idx) => {
            const colorClass = `color-s${idx % 4}`;
            seriesLegend.innerHTML += `
              <div class="flex items-center gap-1.5 border rounded-lg px-2 py-0.5 ${colorClass}">
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                <span>S${idx + 1}: ${sd.name}</span>
              </div>
            `;
        });
        seriesLegend.innerHTML += `
            <div class="flex items-center gap-1.5 border rounded-lg px-2 py-0.5 color-leftover">
              <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
              <span>Sobrantes: Naturales</span>
            </div>
        `;

        // Build mapping
        const { indexMap, cellMapping } = buildIndexMapping(descriptors, N);

        // Pre-calculate decrypted text if descifrar
        const clearChars = new Array(N);
        if (!isCifrar) {
            for (let i = 0; i < N; i++) {
                const origPos = indexMap[i] - 1;
                if (origPos >= 0 && origPos < N) {
                    clearChars[origPos] = rawText[i];
                }
            }
        }

        // Render Grid
        simuladorGrid.innerHTML = '';

        for (let i = 1; i <= N; i++) {
            const sIdx = cellMapping[i];
            const colorClass = sIdx === -1 ? 'color-leftover' : `color-s${sIdx % 4}`;
            const char = isCifrar ? (rawText[i - 1] || '') : (clearChars[i - 1] || '-');
            
            simuladorGrid.innerHTML += `
              <div class="cell-box font-mono font-bold text-xs ${colorClass}" id="cell-${i}">
                <span class="text-[8px] opacity-60 absolute top-0.5">${i}</span>
                <span class="char-val mt-2">${char}</span>
              </div>
            `;
        }

        // Render Submessages
        submessagesContainer.innerHTML = '';
        const submessages = {};
        descriptors.forEach((sd, idx) => {
            submessages[idx] = [];
        });
        submessages[-1] = [];

        for (let i = 1; i <= N; i++) {
            const sIdx = cellMapping[i];
            submessages[sIdx].push({ index: i, char: rawText[i - 1] });
        }

        descriptors.forEach((sd, idx) => {
            const colorClass = `color-s${idx % 4}`;
            const charsStr = isCifrar ? (submessages[idx].map(item => item.char).join('') || '') : '';
            submessagesContainer.innerHTML += `
              <div class="flex flex-col gap-1 p-2 bg-slate-900/60 border border-slate-800 rounded-xl" id="submsg-row-${idx}">
                <div class="flex justify-between text-[10px] font-bold ${colorClass}">
                  <span>S${idx + 1} (${sd.name})</span>
                  <span class="opacity-70 font-mono">${submessages[idx].map(item => item.index).join(', ')}</span>
                </div>
                <div class="text-sm font-mono text-white tracking-wider min-h-[1.25rem] submsg-chars">${charsStr || '-'}</div>
              </div>
            `;
        });

        if (submessages[-1].length > 0) {
            const charsStr = isCifrar ? (submessages[-1].map(item => item.char).join('') || '') : '';
            submessagesContainer.innerHTML += `
              <div class="flex flex-col gap-1 p-2 bg-slate-900/60 border border-slate-800 rounded-xl" id="submsg-row-leftover">
                <div class="flex justify-between text-[10px] font-bold color-leftover">
                  <span>Sobrantes (Naturales)</span>
                  <span class="opacity-70 font-mono">${submessages[-1].map(item => item.index).join(', ')}</span>
                </div>
                <div class="text-sm font-mono text-white tracking-wider min-h-[1.25rem] submsg-chars">${charsStr || '-'}</div>
              </div>
            `;
        }
    }

    function actualizarEtiquetas() {
        const operacionChecked = document.querySelector('input[name="operacion"]:checked');
        if (!operacionChecked) return;
        const operacion = operacionChecked.value;
        const isCifrar = (operacion === 'CIFRAR');

        const lblEntrada = document.getElementById("labelEntrada");
        const descEntrada = document.getElementById("descEntrada");
        const lblSalida = document.getElementById("labelSalida");
        const descSalida = document.getElementById("descSalida");

        if (lblEntrada) lblEntrada.textContent = isCifrar ? "Texto Original" : "Texto Cifrado";
        if (descEntrada) descEntrada.textContent = isCifrar ? "Mensaje plano a procesar por series" : "Criptograma a descifrar por series";
        if (lblSalida) lblSalida.textContent = isCifrar ? "Texto Cifrado" : "Texto Original";
        if (descSalida) descSalida.textContent = isCifrar ? "Resultado del proceso de series" : "Mensaje original obtenido";

        if (inputTexto) inputTexto.placeholder = isCifrar ? "Escribe la frase a procesar..." : "Escribe el criptograma a descifrar...";
        if (outputTexto) outputTexto.placeholder = isCifrar ? "El resultado aparecerá aquí..." : "El texto original descifrado se mostrará aquí...";
    }

    // Listeners to redraw and re-send in real time
    inputTexto.addEventListener('input', () => {
        dibujarSimulador();
        enviarDatos();
    });
    radiosOperacion.forEach(r => r.addEventListener('change', () => {
        actualizarEtiquetas();
        dibujarSimulador();
        enviarDatos();
    }));

    // ==========================================
    // ENVÍO DE DATOS (WEBSOCKETS)
    // ==========================================
    function enviarDatos() {
        if (!stompClient || !stompClient.connected) return;

        const texto = inputTexto.value;
        if (!texto) { outputTexto.value = ""; return; }

        const operacion = document.querySelector('input[name="operacion"]:checked').value;
        const clave = getClaveValue();

        stompClient.send("/app/series", {}, JSON.stringify({
            texto: texto,
            operacion: operacion,
            clave: clave
        }));
    }

    // ==========================================
    // ANIMACIÓN PASO A PASO
    // ==========================================
    function stopAnimation() {
        if (animationInterval) clearTimeout(animationInterval);
        isAnimating = false;
        btnAnimar.innerHTML = "⚡ Animar Simulación";
        btnAnimar.classList.replace('bg-red-500/10', 'bg-amber-500/10');
        btnAnimar.classList.replace('text-red-400', 'text-amber-400');
        btnAnimar.classList.replace('border-red-500/30', 'border-amber-500/30');
        
        dibujarSimulador();
    }

    function animarSeries() {
        if (isAnimating) {
            stopAnimation();
            return;
        }

        const texto = inputTexto.value;
        if (!texto) {
            mostrarError("Ingrese texto a animar.");
            return;
        }

        const rawText = normalizarTexto(texto);
        const N = rawText.length;
        const descriptors = parseSeries(getClaveValue());

        if (descriptors.length === 0) {
            mostrarError("Clave de series inválida.");
            return;
        }

        isAnimating = true;
        btnAnimar.innerHTML = "⏹ Detener Simulación";
        btnAnimar.classList.replace('bg-amber-500/10', 'bg-red-500/10');
        btnAnimar.classList.replace('text-amber-400', 'text-red-400');
        btnAnimar.classList.replace('border-amber-500/30', 'border-red-500/30');

        outputTexto.value = "";
        
        const { indexMap, cellMapping } = buildIndexMapping(descriptors, N);

        const operacion = document.querySelector('input[name="operacion"]:checked').value;
        const isCifrar = (operacion === "CIFRAR");

        for (let i = 1; i <= N; i++) {
            const cell = document.getElementById(`cell-${i}`);
            if (cell) {
                cell.querySelector('.char-val').innerText = isCifrar ? rawText[i - 1] : '-';
                cell.classList.remove('active-cell');
            }
        }

        const submsgRows = {};
        descriptors.forEach((sd, idx) => {
            const row = document.getElementById(`submsg-row-${idx}`);
            if (row) {
                row.querySelector('.submsg-chars').innerText = '';
                submsgRows[idx] = row;
            }
        });
        const leftoverRow = document.getElementById('submsg-row-leftover');
        if (leftoverRow) {
            leftoverRow.querySelector('.submsg-chars').innerText = '';
            submsgRows[-1] = leftoverRow;
        }

        let stepIdx = 0;
        let submsgBuffers = {};
        descriptors.forEach((sd, idx) => { submsgBuffers[idx] = ""; });
        submsgBuffers[-1] = "";

        function animarPaso() {
            if (stepIdx >= N) {
                if (isCifrar) {
                    const listOutputs = [];
                    descriptors.forEach((sd, idx) => {
                        if (submsgBuffers[idx]) listOutputs.push(submsgBuffers[idx]);
                    });
                    if (submsgBuffers[-1]) listOutputs.push(submsgBuffers[-1]);
                    outputTexto.value = listOutputs.join(" ");
                } else {
                    let decResult = "";
                    for (let i = 1; i <= N; i++) {
                        decResult += document.getElementById(`cell-${i}`).querySelector('.char-val').innerText;
                    }
                    outputTexto.value = decResult;
                }
                stopAnimation();
                mostrarExito("Animación completada con éxito.");
                enviarDatos();
                return;
            }

            for (let i = 1; i <= N; i++) {
                const cell = document.getElementById(`cell-${i}`);
                if (cell) cell.classList.remove('active-cell');
            }

            const targetPos = indexMap[stepIdx];
            const activeCell = document.getElementById(`cell-${targetPos}`);
            const seriesIdx = cellMapping[targetPos];

            if (isCifrar) {
                if (activeCell) activeCell.classList.add('active-cell');

                const char = rawText[targetPos - 1];
                submsgBuffers[seriesIdx] += char;

                const row = submsgRows[seriesIdx];
                if (row) {
                    row.querySelector('.submsg-chars').innerText = submsgBuffers[seriesIdx];
                    row.classList.add('active-cell');
                    setTimeout(() => row.classList.remove('active-cell'), 400);
                }

                let partialOut = "";
                descriptors.forEach((sd, idx) => {
                    if (submsgBuffers[idx]) partialOut += submsgBuffers[idx] + " ";
                });
                if (submsgBuffers[-1]) partialOut += submsgBuffers[-1] + " ";
                outputTexto.value = partialOut.trim();

                inputTexto.focus({ preventScroll: true });
                inputTexto.setSelectionRange(targetPos - 1, targetPos);
                outputTexto.focus({ preventScroll: true });
                outputTexto.setSelectionRange(outputTexto.value.length - 1, outputTexto.value.length);

            } else {
                const char = rawText[stepIdx];
                if (activeCell) {
                    activeCell.querySelector('.char-val').innerText = char;
                    activeCell.classList.add('active-cell');
                }

                submsgBuffers[seriesIdx] += char;
                const row = submsgRows[seriesIdx];
                if (row) {
                    row.querySelector('.submsg-chars').innerText = submsgBuffers[seriesIdx];
                    row.classList.add('active-cell');
                    setTimeout(() => row.classList.remove('active-cell'), 400);
                }

                let partialOut = "";
                for (let i = 1; i <= N; i++) {
                    const cellVal = document.getElementById(`cell-${i}`).querySelector('.char-val').innerText;
                    partialOut += (cellVal === '-' ? ' ' : cellVal);
                }
                outputTexto.value = partialOut;

                inputTexto.focus({ preventScroll: true });
                inputTexto.setSelectionRange(stepIdx, stepIdx + 1);
                outputTexto.focus({ preventScroll: true });
                outputTexto.setSelectionRange(targetPos - 1, targetPos);
            }

            stepIdx++;
            animationInterval = setTimeout(animarPaso, 400);
        }

        animarPaso();
    }

    btnAnimar.addEventListener('click', animarSeries);

    // ==========================================
    // PORTAPAPELES Y UTILIDADES
    // ==========================================
    btnPegar.addEventListener('click', async () => {
        try {
            const texto = await navigator.clipboard.readText();
            if (texto) { inputTexto.value = texto; dibujarSimulador(); enviarDatos(); inputTexto.focus({ preventScroll: true }); }
        } catch { mostrarError("Permiso de portapapeles denegado."); }
    });

    btnLimpiar.addEventListener('click', () => {
        inputTexto.value = ""; dibujarSimulador(); enviarDatos(); inputTexto.focus({ preventScroll: true });
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
    // TOASTS Y ERRORES
    // ==========================================
    function mostrarError(msg) { CryptoUX.showToast("Error", msg, "error"); }
    function mostrarExito(msg) { CryptoUX.showToast("Éxito", msg, "success"); }

    // Inicializar
    renderSeriesSelects();
    actualizarEtiquetas();
    connect();
});
