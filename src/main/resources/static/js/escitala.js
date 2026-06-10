document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;

    // Referencias DOM
    const inputTexto  = document.getElementById('textoEntrada');
    const outputTexto = document.getElementById('textoSalida');
    const inputClave  = document.getElementById('clave');
    const displayClave = document.getElementById('claveValueDisplay');
    const radiosOperacion = document.querySelectorAll('input[name="operacion"]');

    const btnCopiar  = document.getElementById('btnCopiar');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const btnPegar   = document.getElementById('btnPegar');

    // Controles 3D
    const btnAutoGiro   = document.getElementById('btnAutoGiro');
    const btnViewHoriz  = document.getElementById('btnViewHoriz');
    const btnViewVert   = document.getElementById('btnViewVert');
    const sceneContainer = document.getElementById('sceneContainer');
    const cylinder      = document.getElementById('cylinder');

    // UI estado conexión
    const connDot   = document.getElementById('connDot');
    const connLabel = document.getElementById('connLabel');

    // Estado Motor 3D
    let autoGiroActivo = false;
    let vistaActual    = 'HORIZONTAL';
    let currentAngle   = 0;
    let animationFrameId = null;
    const faceSize = 40;

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
            stompClient.subscribe('/topic/escitala', function (response) {
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
            mostrarError("Conexión perdida. Reconectando…");
            setTimeout(connect, 3000);
        });
    }

    // ==========================================
    // ENVÍO
    // ==========================================
    function enviarDatos() {
        const texto = inputTexto.value;
        const caras = parseInt(inputClave.value);

        construirCilindro3D(texto, caras);

        if (!texto) { outputTexto.value = ""; return; }
        if (!stompClient || !stompClient.connected) return;

        const operacion = document.querySelector('input[name="operacion"]:checked').value;
        stompClient.send("/app/escitala", {}, JSON.stringify({
            texto, operacion, clave: caras.toString()
        }));
    }

    // ==========================================
    // MOTOR 3D
    // ==========================================
    // ==========================================
// MOTOR 3D REFACTORIZADO: CILINDRO CONTINUO
// ==========================================
    function construirCilindro3D(texto, diametro) {
        cylinder.innerHTML = "";
        // Aseguramos que el contenedor sostenga la profundidad
        cylinder.style.transformStyle = "preserve-3d";

        let txt = texto.replace(/\s+/g, '').toUpperCase();
        let longitudOriginal = txt.length;
        let relleno = 0;

        if (longitudOriginal > 0) {
            while (txt.length % diametro !== 0) { txt += "X"; relleno++; }
        }

        let caracteresPorVuelta = longitudOriginal > 0 ? txt.length / diametro : 0;

        document.getElementById("statLongitud").textContent = longitudOriginal;
        document.getElementById("statVueltas").textContent  = diametro;
        document.getElementById("statRelleno").textContent  = relleno;

        // MATEMÁTICA CIRCULAR REAL: Circunferencia = diametro * tamañoCara
        // Radio real = Circunferencia / (2 * PI)
        const textRadius = Math.max(Math.round((diametro * faceSize) / (2 * Math.PI)), 22);
        const anglePerFace = 360 / diametro;

        // -------------------------------------------------------------
        // CAPA 1: EL BASTÓN (Cilindro holográfico continuo)
        // -------------------------------------------------------------
        const bastonGroup = document.createElement("div");
        bastonGroup.className = "absolute inset-0";
        bastonGroup.style.transformStyle = "preserve-3d";

        const rodFaces = 36; // 36 caras finas simulan un círculo perfecto sin coste de CPU
        const rodAngle = 360 / rodFaces;
        const rodRadius = textRadius - 4; // Ligeramente por debajo del pergamino
        const rodFaceSize = (2 * rodRadius * Math.tan(Math.PI / rodFaces)) + 1; // +1px solapa para evitar fisuras

        for (let i = 0; i < rodFaces; i++) {
            const rFace = document.createElement("div");
            rFace.style.position = "absolute";
            rFace.style.backfaceVisibility = "hidden";
            // Estilo de bastón: color profundo con leve borde simulando textura cilíndrica
            rFace.className = "bg-slate-800/95 border-x border-slate-700/40";

            if (vistaActual === 'HORIZONTAL') {
                rFace.style.width = "100%";
                rFace.style.height = `${rodFaceSize}px`;
                rFace.style.top = `calc(50% - ${rodFaceSize/2}px)`;
                rFace.style.transform = `rotateX(${i * rodAngle}deg) translateZ(${rodRadius}px)`;
            } else {
                rFace.style.height = "100%";
                rFace.style.width = `${rodFaceSize}px`;
                rFace.style.left = `calc(50% - ${rodFaceSize/2}px)`;
                rFace.style.transform = `rotateY(${i * rodAngle}deg) translateZ(${rodRadius}px)`;
            }
            bastonGroup.appendChild(rFace);
        }
        cylinder.appendChild(bastonGroup);

        // Ajuste dinámico de la caja del simulador
        sceneContainer.className = vistaActual === 'HORIZONTAL'
            ? "scene-3d w-full h-40 sm:h-48 flex items-center justify-center relative rounded-xl border border-cyan-500/15 bg-slate-950/60 overflow-visible transition-all duration-500 my-1"
            : "scene-3d w-full h-64 sm:h-72 flex items-center justify-center relative rounded-xl border border-cyan-500/15 bg-slate-950/60 overflow-visible transition-all duration-500 my-1";

        cylinder.style.width  = vistaActual === 'HORIZONTAL' ? "100%" : `${faceSize}px`;
        cylinder.style.height = vistaActual === 'HORIZONTAL' ? `${faceSize}px` : "100%";

        // -------------------------------------------------------------
        // CAPA 2: EL PERGAMINO (Texto flotante transparente)
        // -------------------------------------------------------------
        for (let i = 0; i < diametro; i++) {
            const face = document.createElement("div");
            let textoCara = "";

            if (longitudOriginal > 0) {
                for (let j = 0; j < caracteresPorVuelta; j++) {
                    textoCara += txt.charAt(i * caracteresPorVuelta + j);
                }
            } else {
                textoCara = "·".repeat(8);
            }

            face.style.position = "absolute";
            face.style.backfaceVisibility = "hidden";

            // Estilos: Hemos eliminado los fondos sólidos. Ahora el texto proyecta una luz sobre el cilindro.
            if (vistaActual === 'HORIZONTAL') {
                face.className = "face-3d flex flex-row items-center justify-center font-mono font-black text-lg tracking-[0.4em] text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]";
                face.style.width     = "100%";
                face.style.height    = `${faceSize}px`;
                face.style.top       = `calc(50% - ${faceSize/2}px)`;
                face.style.transform = `rotateX(${i * anglePerFace}deg) translateZ(${textRadius}px)`;
                face.textContent     = textoCara;
            } else {
                face.className = "face-3d flex flex-col items-center justify-center font-mono font-black text-lg text-cyan-300 gap-1 py-3 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]";
                face.style.width     = `${faceSize}px`;
                face.style.height    = "100%";
                face.style.left      = `calc(50% - ${faceSize/2}px)`;
                face.style.transform = `rotateY(${i * anglePerFace}deg) translateZ(${textRadius}px)`;

                for (let char of textoCara) {
                    const span = document.createElement('span');
                    span.textContent = char;
                    face.appendChild(span);
                }
            }
            cylinder.appendChild(face);
        }

        aplicarGiro(currentAngle);
    }

    function aplicarGiro(angulo) {
        if (vistaActual === 'HORIZONTAL') {
            cylinder.style.transform = `rotateX(${angulo}deg)`;
        } else {
            cylinder.style.transform = `rotateY(${angulo}deg)`;
        }
    }

    function rotarCilindro() {
        if (autoGiroActivo) {
            currentAngle -= 0.6;
            aplicarGiro(currentAngle);
            animationFrameId = requestAnimationFrame(rotarCilindro);
        }
    }

    // ==========================================
    // EVENTOS UI
    // ==========================================
    function setView(horiz) {
        vistaActual = horiz ? 'HORIZONTAL' : 'VERTICAL';
        btnViewHoriz.classList.toggle('active', horiz);
        btnViewVert.classList.toggle('active', !horiz);
        construirCilindro3D(inputTexto.value, parseInt(inputClave.value));
    }

    btnViewHoriz.addEventListener('click', () => setView(true));
    btnViewVert.addEventListener('click', () => setView(false));

    btnAutoGiro.addEventListener('click', () => {
        autoGiroActivo = !autoGiroActivo;
        btnAutoGiro.classList.toggle('active', autoGiroActivo);

        if (autoGiroActivo) {
            btnAutoGiro.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Pausar`;
            cylinder.style.transition = 'none';
            rotarCilindro();
        } else {
            btnAutoGiro.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Girar`;
            cancelAnimationFrame(animationFrameId);
            const anglePerFace = 360 / parseInt(inputClave.value);
            currentAngle = Math.round(currentAngle / anglePerFace) * anglePerFace;
            cylinder.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)';
            aplicarGiro(currentAngle);
        }
    });

    inputClave.addEventListener('input', (e) => {
        displayClave.innerText = e.target.value;
        // Actualizar fill CSS del slider
        const min = +e.target.min, max = +e.target.max, val = +e.target.value;
        e.target.style.setProperty('--fill', ((val - min) / (max - min) * 100) + '%');
        enviarDatos();
    });

    inputTexto.addEventListener('input', enviarDatos);
    radiosOperacion.forEach(r => r.addEventListener('change', () => {
        enviarDatos();
        inputTexto.focus();
    }));

    // ==========================================
    // PORTAPAPELES
    // ==========================================
    btnPegar.addEventListener('click', async () => {
        try {
            const textoPortapapeles = await navigator.clipboard.readText();
            if (textoPortapapeles) {
                inputTexto.value = textoPortapapeles;
                enviarDatos();
                inputTexto.focus();
            }
        } catch {
            mostrarError("Permiso denegado. Concede acceso al portapapeles en tu navegador.");
        }
    });

    btnLimpiar.addEventListener('click', () => {
        inputTexto.value = "";
        enviarDatos();
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
        const toast = document.createElement('div');
        const isError = tipo === 'error';
        toast.className = `flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-sm text-sm font-medium animate-fade-in transition-opacity ${
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
        { element: '#clave',          title: 'La Clave',       text: 'Selecciona el número de caras del cilindro. Esta clave define cómo se mezclan las letras.' },
        { element: '#textoEntrada',   title: 'El Mensaje',     text: 'Escribe aquí tu texto plano. Al escribir, observa cómo interactúa con el motor 3D.' },
        { element: '#sceneContainer', title: 'El Cilindro',    text: 'Este es el bastón holográfico. Las letras se enrollan aquí provocando la transposición.' },
        { element: '#textoSalida',    title: 'El Resultado',   text: 'Tu mensaje cifrado aparece aquí listo para ser copiado. ¡Misión cumplida!' }
    ];

    let currentStep = 0;
    const overlay    = document.getElementById('tutorialOverlay');
    const bubble     = document.getElementById('tutorialBubble');
    const tutTitle   = document.getElementById('tutTitle');
    const tutText    = document.getElementById('tutText');
    const btnTutNext = document.getElementById('btnTutNext');
    const btnTutPrev = document.getElementById('btnTutPrev');
    const tutDots    = document.getElementById('tutDots').children;

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

            Array.from(tutDots).forEach((dot, i) => {
                dot.className = i === currentStep
                    ? "w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] transition-all"
                    : "w-2 h-2 rounded-full bg-slate-700 transition-all";
            });

            btnTutPrev.classList.toggle('hidden', currentStep === 0);

            if (currentStep === tutorialData.length - 1) {
                btnTutNext.innerHTML = "Terminar ✓";
                btnTutNext.className = btnTutNext.className.replace('bg-cyan-600', 'bg-emerald-600').replace('hover:bg-cyan-500', 'hover:bg-emerald-500');
            } else {
                btnTutNext.innerHTML = "Siguiente →";
                btnTutNext.className = btnTutNext.className.replace('bg-emerald-600', 'bg-cyan-600').replace('hover:bg-emerald-500', 'hover:bg-cyan-500');
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
        if (currentStep < tutorialData.length - 1) { currentStep++; updateTutorial(); }
        else closeTutorial();
    });
    btnTutPrev.addEventListener('click', () => {
        if (currentStep > 0) { currentStep--; updateTutorial(); }
    });

    // INIT
    connect();
    construirCilindro3D("", 4);
});
