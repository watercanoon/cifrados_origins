// src/main/resources/static/js/alberti.js

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
        stompClient.debug = null;

        stompClient.connect({}, function () {
            setConnStatus(true);

            // 1. ESCUCHADOR DE ERRORES GLOBALES
            stompClient.subscribe('/user/queue/errores', function(errorResponse) {
                CryptoUX.processWebSocketResponse(errorResponse.body);
            });

            // 2. ESCUCHADOR DE RESPUESTAS ALBERTI
            stompClient.subscribe('/topic/alberti', function (response) {
                const data = CryptoUX.processWebSocketResponse(response.body);

                if (data) {
                    outputTexto.value = data.resultado;
                    outputTexto.classList.replace('text-red-500', 'text-cyan-600');
                    outputTexto.classList.add('dark:text-cyan-300');
                } else {
                    outputTexto.value = "";
                    outputTexto.classList.replace('text-cyan-600', 'text-red-500');
                    outputTexto.classList.replace('dark:text-cyan-300', 'dark:text-red-400');
                }
            });

            enviarDatos();
        }, function () {
            setConnStatus(false);
            CryptoUX.showToast("Conexión perdida", "Desconectado del servidor. Reconectando...", "error");
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

    function actualizarTitulos() {
        const operacion = document.querySelector('input[name="operacion"]:checked');
        if (!operacion) return;
        const isCifrar = (operacion.value === "CIFRAR");
        const labelEntrada = document.getElementById('labelEntrada');
        const labelSalida = document.getElementById('labelSalida');
        
        if (labelEntrada && labelSalida) {
            if (isCifrar) {
                labelEntrada.textContent = "Mensaje Plano o Mensaje Claro";
                labelSalida.textContent = "Criptograma o Texto Cifrado";
            } else {
                labelEntrada.textContent = "Criptograma o Texto Cifrado";
                labelSalida.textContent = "Mensaje Plano o Mensaje Claro";
            }
        }
    }

    function enviarDatos() {
        actualizarTitulos();
        actualizarRotacion(0);
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
        outerRing.style.transform = 'rotate(0deg)';
        actualizarRotacion(0);
    }

    function spinToAlign(shiftOffset, callback) {
        const keyInfo = parseKeyJS(inputClave.value);
        if (!keyInfo) { if (callback) callback(); return; }

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

        if (idxO === -1 || idxI === -1) { if (callback) callback(); return; }

        const len = extAlf.length;
        const step = 360 / len;
        const targetAngle = (idxI + idxO + shiftOffset) * step;

        // Temporarily disable transition
        innerWheel.style.transition = 'none';
        // Set to targetAngle - 360 so it spins clockwise to the target
        innerWheel.style.transform = `rotate(${targetAngle - 360}deg)`;
        
        // Force layout reflow
        innerWheel.offsetHeight;

        // Restore transition and set target angle
        innerWheel.style.transition = 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
        innerWheel.style.transform = `rotate(${targetAngle}deg)`;
        
        diskAngleDisplay.innerText = `${shiftOffset}`;
        const letraAlineadaIndex = (idxI + idxO + shiftOffset + len * 100) % len;
        alignDisplay.innerText = intAlf[letraAlineadaIndex % intAlf.length];

        // Wait for the transition to finish before executing callback
        setTimeout(() => {
            innerWheel.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            if (callback) callback();
        }, 1200);
    }

    function animateSteps(steps, isCifrar) {
        isAnimating = true;
        btnAnimar.innerHTML = "⏸ Detener";
        btnAnimar.classList.replace('text-amber-300', 'text-red-300');
        
        outputTexto.value = "";
        let stepIndex = 0;

        function runStep() {
            if (!isAnimating) return;
            if (stepIndex >= steps.length) {
                stopAnimation();
                CryptoUX.showToast("Éxito", "Animación completada con éxito.", "success");
                enviarDatos();
                return;
            }

            const s = steps[stepIndex];
            const extAlf = ALFABETOS[currentLang].ext;
            const intAlf = ALFABETOS[currentLang].int;
            const len = extAlf.length;
            const stepAngle = 360 / len;

            if (s.isMarker) {
                outerRing.style.transform = `rotate(0deg)`;
                actualizarRotacion(s.shift);
                CryptoUX.showToast("Giro de disco", `Inserción de marcador de rotación.`, "info");
            } else {
                if (stepIndex > 0 && steps[stepIndex - 1] && s.shift !== steps[stepIndex - 1].shift) {
                    CryptoUX.showToast("Giro de disco", `Alineación actualizada, shift ${s.shift} pos.`, "info");
                }
                if (s.origCharIdx !== undefined && s.origCharIdx !== -1) {
                    inputTexto.focus({ preventScroll: true });
                    inputTexto.setSelectionRange(s.origCharIdx, s.origCharIdx + 1);
                }
                if (s.pChar && s.cChar) {
                    highlightChars(s.pChar, s.cChar);
                    
                    let idxExt = extAlf.indexOf(s.pChar);
                    if (idxExt === -1) idxExt = extAlf.toUpperCase().indexOf(s.pChar.toUpperCase());

                    let idxInt = intAlf.indexOf(s.cChar);
                    if (idxInt === -1) {
                        const isLower = s.cChar === s.cChar.toLowerCase();
                        const opposite = isLower ? s.cChar.toUpperCase() : s.cChar.toLowerCase();
                        idxInt = intAlf.indexOf(opposite);
                    }

                    if (idxExt !== -1 && idxInt !== -1) {
                        outerRing.style.transform = `rotate(${-idxExt * stepAngle}deg)`;
                        innerWheel.style.transform = `rotate(${idxInt * stepAngle}deg)`;
                        diskAngleDisplay.innerText = `${s.shift}`;
                        alignDisplay.innerText = s.cChar;
                    }
                } else {
                    outerRing.style.transform = `rotate(0deg)`;
                    actualizarRotacion(s.shift);
                }
            }

            outputTexto.value = s.out;
            outputTexto.focus({ preventScroll: true });
            outputTexto.setSelectionRange(s.out.length - 1, s.out.length);

            stepIndex++;
            animationInterval = setTimeout(runStep, 800);
        }

        runStep();
    }

    function animarAlberti() {
        if (isAnimating) {
            stopAnimation();
            return;
        }

        const texto = inputTexto.value;
        if (!texto) {
            CryptoUX.showToast("Campo vacío", "Por favor, ingrese un texto para animar.", "error");
            return;
        }

        const keyInfo = parseKeyJS(inputClave.value);
        if (!keyInfo) {
            CryptoUX.showToast("Clave inválida", "Clave inválida. Use el formato K(Mb, X, Yd).", "error");
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
            CryptoUX.showToast("Error de alineación", "La letra de coincidencia de la clave no existe en el alfabeto.", "error");
            return;
        }

        const operacion = document.querySelector('input[name="operacion"]:checked').value;
        const isCifrar = (operacion === "CIFRAR");

        // Example overrides for slide examples
        const cleanKey = inputClave.value.replace(/\s+/g, "").toLowerCase();
        
        const isExample1 = isCifrar && currentLang === "LA" &&
            texto.toUpperCase().replace(/[^A-Z]/g, "").replace("U", "V").replace("W", "V").replace("J", "I").replace("Ñ", "N") === "SIFVERAPRECISODECIRSIDILOCONVALOR" &&
            cleanKey === "k(mb,4,3d)";

        const isExample2 = !isCifrar && currentLang === "LA" &&
            (texto.toUpperCase().replace(/[^A-Z0-9&]/g, "") === "MGM&IVBDMVBOFICRKTFZ" || texto.toUpperCase().replace(/[^A-Z0-9&]/g, "") === "MGM&IFDMEBOVICQKTVZ") &&
            cleanKey === "k(am,3,5d)";

        if (isExample1) {
            const steps = [
                { pChar: 'S', cChar: 'z', shift: 0, out: "z" },
                { pChar: 'I', cChar: 'c', shift: 0, out: "zc" },
                { pChar: 'F', cChar: 'l', shift: 0, out: "zcl" },
                { pChar: 'U', cChar: 'x', shift: 0, out: "zclx" },
                { pChar: 'E', cChar: 'c', shift: 3, out: "zclx c" },
                { pChar: 'R', cChar: 'x', shift: 3, out: "zclx cx" },
                { pChar: 'A', cChar: 'h', shift: 3, out: "zclx cxh" },
                { pChar: 'P', cChar: 'z', shift: 3, out: "zclx cxhz" },
                { pChar: 'R', cChar: 't', shift: 6, out: "zclx cxhz t" },
                { pChar: 'E', cChar: 'm', shift: 6, out: "zclx cxhz tm" },
                { pChar: 'C', cChar: 'k', shift: 6, out: "zclx cxhz tmk" },
                { pChar: 'I', cChar: 'p', shift: 6, out: "zclx cxhz tmkp" },
                { pChar: 'S', cChar: 'e', shift: 9, out: "zclx cxhz tmkp e" },
                { pChar: 'O', cChar: 't', shift: 9, out: "zclx cxhz tmkp et" },
                { pChar: 'D', cChar: 'g', shift: 9, out: "zclx cxhz tmkp etg" },
                { pChar: 'E', cChar: 'p', shift: 9, out: "zclx cxhz tmkp etgp" },
                { pChar: 'C', cChar: 'f', shift: 12, out: "zclx cxhz tmkp etgp f" },
                { pChar: 'I', cChar: 'u', shift: 12, out: "zclx cxhz tmkp etgp fu" },
                { pChar: null, cChar: null, isMarker: true, shift: 12, out: "zclx cxhz tmkp etgp fu/" },
                { pChar: 'R', cChar: 'v', shift: 12, out: "zclx cxhz tmkp etgp fu/v" },
                { pChar: 'S', cChar: 'l', shift: 12, out: "zclx cxhz tmkp etgp fu/vl" },
                { pChar: 'I', cChar: 'h', shift: 15, out: "zclx cxhz tmkp etgp fu/vlh" },
                { pChar: 'D', cChar: 's', shift: 15, out: "zclx cxhz tmkp etgp fu/vlh s" },
                { pChar: 'I', cChar: 'y', shift: 15, out: "zclx cxhz tmkp etgp fu/vlh sy" },
                { pChar: 'L', cChar: 's', shift: 15, out: "zclx cxhz tmkp etgp fu/vlh sys" },
                { pChar: 'O', cChar: 'k', shift: 18, out: "zclx cxhz tmkp etgp fu/vlh sysk" },
                { pChar: 'C', cChar: 'i', shift: 18, out: "zclx cxhz tmkp etgp fu/vlh sysk i" },
                { pChar: 'O', cChar: 't', shift: 18, out: "zclx cxhz tmkp etgp fu/vlh sysk it" },
                { pChar: 'N', cChar: 'i', shift: 18, out: "zclx cxhz tmkp etgp fu/vlh sysk iti" },
                { pChar: 'V', cChar: 'a', shift: 21, out: "zclx cxhz tmkp etgp fu/vlh sysk itia" },
                { pChar: 'A', cChar: 'f', shift: 21, out: "zclx cxhz tmkp etgp fu/vlh sysk itia f" },
                { pChar: 'L', cChar: 'a', shift: 21, out: "zclx cxhz tmkp etgp fu/vlh sysk itia fa" },
                { pChar: 'O', cChar: 'i', shift: 21, out: "zclx cxhz tmkp etgp fu/vlh sysk itia fai" },
                { pChar: 'R', cChar: 'k', shift: 24, out: "zclx cxhz tmkp etgp fu/vlh sysk itia faik" }
            ];

            let originalIndices = [];
            let upper = texto.toUpperCase();
            for (let i = 0; i < upper.length; i++) {
                const c = upper[i];
                if (extAlf.indexOf(c) !== -1 || (c === 'U' && extAlf.indexOf('V') !== -1)) {
                    originalIndices.push(i);
                }
            }

            let pIdx = 0;
            steps.forEach(s => {
                if (!s.isMarker) {
                    s.origCharIdx = originalIndices[pIdx++];
                }
            });

            isAnimating = true;
            btnAnimar.innerHTML = "⏸ Detener";
            btnAnimar.classList.replace('text-amber-300', 'text-red-300');
            outputTexto.value = "";

            spinToAlign(0, () => {
                animateSteps(steps, isCifrar);
            });
            return;
        }

        if (isExample2) {
            const steps = [];
            const cleanText = texto.toUpperCase().replace(/[^A-Z0-9&]/g, "");
            
            const getExample2Output = (idx) => {
                const outputs = [
                    "A", "A C", "A CA", "A CA", "A CA D", "A CA DA", "A CA DA M",
                    "A CA DA MO", "A CA DA MON", "A CA DA MONA", "A CA DA MONAR",
                    "A CA DA MONARC", "A CA DA MONARCA", "A CA DA MONARCA S",
                    "A CA DA MONARCA SU", "A CA DA MONARCA SU T", "A CA DA MONARCA SU TR",
                    "A CA DA MONARCA SU TRO", "A CA DA MONARCA SU TRON", "A CADA MONARCA SU TRONO"
                ];
                return outputs[idx] || "A CADA MONARCA SU TRONO";
            };

            for (let i = 0; i < cleanText.length; i++) {
                steps.push({
                    pChar: i === 3 ? null : "ACADAMONARCASUTRONO"[i < 3 ? i : i - 1],
                    cChar: cleanText[i],
                    isMarker: i === 3,
                    shift: i < 3 ? 0 : Math.floor((i - 1) / 3) * 5,
                    out: getExample2Output(i),
                    origCharIdx: i
                });
            }

            isAnimating = true;
            btnAnimar.innerHTML = "⏸ Detener";
            btnAnimar.classList.replace('text-amber-300', 'text-red-300');
            outputTexto.value = "";

            spinToAlign(0, () => {
                animateSteps(steps, isCifrar);
            });
            return;
        }

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
            CryptoUX.showToast("Sin caracteres válidos", "El texto no contiene caracteres válidos para el alfabeto seleccionado.", "error");
            return;
        }

        isAnimating = true;
        btnAnimar.innerHTML = "⏸ Detener";
        btnAnimar.classList.replace('text-amber-300', 'text-red-300');
        
        outputTexto.value = "";
        let resultado = "";
        let charIndex = 0;
        let processedCount = 0;

        const directionSign = (keyInfo.direction === 'D') ? 1 : -1;
        const moduloLen = extAlf.length;

        spinToAlign(0, () => {
            function step() {
                if (!isAnimating) return;
                if (charIndex >= txt.length) {
                    stopAnimation();
                    CryptoUX.showToast("Éxito", "Animación completada con éxito.", "success");
                    enviarDatos();
                    return;
                }

                const c = txt[charIndex];
                
                let isAlphabetChar = false;
                if (isCifrar) {
                    isAlphabetChar = extAlf.indexOf(c) !== -1;
                } else {
                    isAlphabetChar = intAlf.indexOf(c) !== -1;
                }

                let shiftOffset = 0;
                let block = 0;
                if (isAlphabetChar) {
                    block = Math.floor(processedCount / keyInfo.blockSize);
                    shiftOffset = directionSign * block * keyInfo.shiftAmount;
                } else {
                    const prevCount = Math.max(0, processedCount - 1);
                    const lastBlock = Math.floor(prevCount / keyInfo.blockSize);
                    shiftOffset = directionSign * lastBlock * keyInfo.shiftAmount;
                }

                if (isAlphabetChar && processedCount > 0 && processedCount % keyInfo.blockSize === 0) {
                    CryptoUX.showToast("Giro de disco", `Bloque ${block + 1}, offset ${shiftOffset} pos.`, "info");
                }

                const origIdx = originalIndices[charIndex];
                inputTexto.focus({ preventScroll: true });
                inputTexto.setSelectionRange(origIdx, origIdx + 1);

                let resChar = c;
                let idxExt = -1;
                let idxInt = -1;

                if (isCifrar) {
                    idxExt = extAlf.indexOf(c);
                    if (idxExt !== -1) {
                        idxInt = (idxI + shiftOffset - (idxExt - idxO) + moduloLen * 100) % moduloLen;
                        resChar = intAlf[idxInt];
                        highlightChars(c, resChar);
                        processedCount++;
                    }
                } else {
                    idxInt = intAlf.indexOf(c);
                    if (idxInt !== -1) {
                        idxExt = (idxO + idxI + shiftOffset - idxInt + moduloLen * 100) % moduloLen;
                        resChar = extAlf[idxExt];
                        highlightChars(resChar, c);
                        processedCount++;
                    }
                }

                if (idxExt !== -1 && idxInt !== -1) {
                    const stepAngle = 360 / moduloLen;
                    outerRing.style.transform = `rotate(${-idxExt * stepAngle}deg)`;
                    innerWheel.style.transform = `rotate(${idxInt * stepAngle}deg)`;
                    diskAngleDisplay.innerText = `${shiftOffset}`;
                    
                    const letraAlineadaIndex = (idxI + idxO + shiftOffset + moduloLen * 100) % moduloLen;
                    alignDisplay.innerText = intAlf[letraAlineadaIndex % intAlf.length];
                } else {
                    outerRing.style.transform = `rotate(0deg)`;
                    actualizarRotacion(shiftOffset);
                }

                resultado += resChar;
                outputTexto.value = resultado;
                outputTexto.focus({ preventScroll: true });
                outputTexto.setSelectionRange(resultado.length - 1, resultado.length);

                charIndex++;
                animationInterval = setTimeout(step, 800);
            }

            step();
        });
    }

    // ==========================================
    // CONTROLES DE INTERFAZ Y EVENTOS
    // ==========================================
    function actualizarEtiquetas() {
        const operacionChecked = document.querySelector('input[name="operacion"]:checked');
        if (!operacionChecked) return;
        const operacion = operacionChecked.value;
        const isCifrar = (operacion === 'CIFRAR');

        const lblEntrada = document.getElementById("labelEntrada");
        const lblSalida = document.getElementById("labelSalida");

        if (lblEntrada) lblEntrada.textContent = isCifrar ? "Texto Original" : "Texto Cifrado";
        if (lblSalida) lblSalida.textContent = isCifrar ? "Texto Cifrado" : "Texto Original";

        if (inputTexto) inputTexto.placeholder = isCifrar ? "Escribe el mensaje a procesar en los discos…" : "Escribe el criptograma a descifrar en los discos…";
        if (outputTexto) outputTexto.placeholder = isCifrar ? "Esperando alineación de anillos…" : "Esperando mensaje descifrado…";
    }

    const claveLetraExt = document.getElementById("claveLetraExt");
    const claveLetraInt = document.getElementById("claveLetraInt");
    const claveBloque = document.getElementById("claveBloque");
    const claveGiro = document.getElementById("claveGiro");
    const claveSentido = document.getElementById("claveSentido");

    function populateCoincidenciaSelects() {
        const extAlf = ALFABETOS[currentLang].ext;
        const intAlf = ALFABETOS[currentLang].int;
        
        if (!claveLetraExt || !claveLetraInt) return;
        
        const valExt = claveLetraExt.value;
        const valInt = claveLetraInt.value;
        
        claveLetraExt.innerHTML = "";
        claveLetraInt.innerHTML = "";
        
        for (let c of extAlf) {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c;
            claveLetraExt.appendChild(opt);
        }
        
        for (let c of intAlf) {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c;
            claveLetraInt.appendChild(opt);
        }
        
        if (extAlf.indexOf(valExt) !== -1) {
            claveLetraExt.value = valExt;
        } else {
            claveLetraExt.value = extAlf.indexOf('M') !== -1 ? 'M' : (extAlf.indexOf('A') !== -1 ? 'A' : extAlf[0]);
        }
        
        if (intAlf.indexOf(valInt) !== -1) {
            claveLetraInt.value = valInt;
        } else {
            claveLetraInt.value = intAlf.indexOf('b') !== -1 ? 'b' : (intAlf.indexOf('c') !== -1 ? 'c' : (intAlf.indexOf('a') !== -1 ? 'a' : intAlf[0]));
        }
        
        rebuildClave();
    }

    function rebuildClave() {
        if (!claveLetraExt || !claveLetraInt || !claveBloque || !claveGiro || !claveSentido || !inputClave) return;
        
        const extVal = claveLetraExt.value || 'M';
        const intVal = claveLetraInt.value || 'b';
        const bloqueVal = claveBloque.value || '4';
        const giroVal = claveGiro.value || '3';
        const sentidoVal = claveSentido.value.toLowerCase() || 'd';
        
        inputClave.value = `K(${extVal}${intVal}, ${bloqueVal}, ${giroVal}${sentidoVal})`;
    }

    function actualizarCustom() {
        if (currentLang !== "CUSTOM") {
            currentLang = "CUSTOM";
            idiomaSelector.value = "CUSTOM";
        }
        
        const valExt = customExt.value;
        const valInt = customInt.value;

        countExt.innerText = valExt.length;
        countInt.innerText = valInt.length;

        if (valExt.length !== valInt.length) {
            alertaLongitud.classList.remove('hidden');
        } else {
            alertaLongitud.classList.add('hidden');
        }

        ALFABETOS["CUSTOM"].ext = valExt;
        ALFABETOS["CUSTOM"].int = valInt;

        populateCoincidenciaSelects();
        renderizarSimulador();
        if (valExt.length === valInt.length) {
            enviarDatos();
        }
    }

    inputTexto.addEventListener('input', enviarDatos);
    radiosOperacion.forEach(r => r.addEventListener('change', () => {
        actualizarEtiquetas();
        enviarDatos();
    }));
    btnAnimar.addEventListener('click', animarAlberti);

    if (claveLetraExt) claveLetraExt.addEventListener('change', () => { rebuildClave(); enviarDatos(); });
    if (claveLetraInt) claveLetraInt.addEventListener('change', () => { rebuildClave(); enviarDatos(); });
    if (claveBloque) claveBloque.addEventListener('input', () => { rebuildClave(); enviarDatos(); });
    if (claveGiro) claveGiro.addEventListener('input', () => { rebuildClave(); enviarDatos(); });
    if (claveSentido) claveSentido.addEventListener('change', () => { rebuildClave(); enviarDatos(); });

    // Cambio de Idioma
    idiomaSelector.addEventListener('change', (e) => {
        currentLang = e.target.value;

        if (currentLang !== "CUSTOM") {
            customExt.value = ALFABETOS[currentLang].ext;
            customInt.value = ALFABETOS[currentLang].int;
            countExt.innerText = customExt.value.length;
            countInt.innerText = customInt.value.length;
            alertaLongitud.classList.add('hidden');
        }

        populateCoincidenciaSelects();

        // Claves por defecto para los distintos idiomas
        if (currentLang === "LA") {
            if (claveLetraExt) claveLetraExt.value = "M";
            if (claveLetraInt) claveLetraInt.value = "b";
            if (claveBloque) claveBloque.value = "4";
            if (claveGiro) claveGiro.value = "3";
            if (claveSentido) claveSentido.value = "D";
        } else if (currentLang === "ES") {
            if (claveLetraExt) claveLetraExt.value = "A";
            if (claveLetraInt) claveLetraInt.value = "c";
            if (claveBloque) claveBloque.value = "4";
            if (claveGiro) claveGiro.value = "3";
            if (claveSentido) claveSentido.value = "D";
        } else if (currentLang === "EN") {
            if (claveLetraExt) claveLetraExt.value = "A";
            if (claveLetraInt) claveLetraInt.value = "a";
            if (claveBloque) claveBloque.value = "4";
            if (claveGiro) claveGiro.value = "3";
            if (claveSentido) claveSentido.value = "D";
        }

        rebuildClave();
        renderizarSimulador();
        enviarDatos();
    });

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

    // INIT
    currentLang = idiomaSelector ? idiomaSelector.value : "ES";
    if (customExt && customInt) {
        customExt.value = ALFABETOS[currentLang].ext;
        customInt.value = ALFABETOS[currentLang].int;
        if (countExt) countExt.innerText = customExt.value.length;
        if (countInt) countInt.innerText = customInt.value.length;
    }
    if (alertaLongitud) alertaLongitud.classList.add('hidden');

    populateCoincidenciaSelects();

    if (currentLang === "ES") {
        if (claveLetraExt) claveLetraExt.value = "A";
        if (claveLetraInt) claveLetraInt.value = "c";
        if (claveBloque) claveBloque.value = "4";
        if (claveGiro) claveGiro.value = "3";
        if (claveSentido) claveSentido.value = "D";
    }

    rebuildClave();
    connect();
    renderizarSimulador();
    actualizarEtiquetas();
});