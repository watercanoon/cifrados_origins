// src/main/resources/static/js/rot13.js

document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;
    let ultimoCampoEditado = "original";
    let ultimaOperacion = "CIFRAR";

    const inputTexto = document.getElementById("textoEntrada");
    const outputTexto = document.getElementById("textoSalida");
    const selectIdioma = document.getElementById("idioma");
    const customContainer = document.getElementById("customAlphabetContainer");
    const inputCustom = document.getElementById("alfabetoCustom");
    const alfabetoBaseDisplay = document.getElementById("alfabetoBaseDisplay");
    const alfabetoCifradoDisplay = document.getElementById("alfabetoCifradoDisplay");
    const btnCopiar = document.getElementById("btnCopiar");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const btnPegar = document.getElementById("btnPegar");
    const btnCopiarOriginal = document.getElementById("btnCopiarOriginal");
    const btnPegarCifrado = document.getElementById("btnPegarCifrado");

    const ALFABETO_ES = "ABCDEFGHIJKLMN\u00d1OPQRSTUVWXYZ";
    const ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // ==========================================
    // CONEXIÓN WEBSOCKET Y NOTIFICACIONES
    // ==========================================
    function connect() {
        const socket = new SockJS("/ws-criptografia");
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function () {

            // 1. SUSCRIPCIÓN GLOBAL DE ERRORES (Atrapa excepciones del backend)
            stompClient.subscribe('/user/queue/errores', function(errorResponse) {
                CryptoUX.processWebSocketResponse(errorResponse.body);
            });

            // 2. SUSCRIPCIÓN A LA RESPUESTA DE ROT13
            stompClient.subscribe("/topic/rot13", function (response) {
                const data = CryptoUX.processWebSocketResponse(response.body);

                if (data) {
                    if (ultimaOperacion === "CIFRAR") {
                        outputTexto.value = data.resultado;
                    } else {
                        inputTexto.value = data.resultado;
                    }
                }
            });

            recalcularDesdeUltimoCampo();
        }, function () {
            CryptoUX.showToast("Conexión perdida", "Desconectado del servidor. Reconectando...", "error");
            setTimeout(connect, 3000);
        });
    }

    function obtenerAlfabetoActual() {
        if (selectIdioma.value === "CUSTOM") {
            return inputCustom.value.trim().toUpperCase();
        }

        return selectIdioma.value === "ES" ? ALFABETO_ES : ALFABETO_EN;
    }

    function actualizarAlfabetos() {
        const alfabeto = obtenerAlfabetoActual();

        if (!alfabeto) {
            alfabetoBaseDisplay.textContent = "Ingresa un alfabeto personalizado.";
            alfabetoCifradoDisplay.textContent = "Esperando alfabeto...";
            return;
        }

        const desplazamiento = 13 % alfabeto.length;
        const alfabetoCifrado = alfabeto.slice(desplazamiento) + alfabeto.slice(0, desplazamiento);

        alfabetoBaseDisplay.textContent = alfabeto;
        alfabetoCifradoDisplay.textContent = alfabetoCifrado;
    }

    function enviarDatos(texto, operacion) {
        actualizarAlfabetos();

        if (!stompClient || !stompClient.connected) return;

        if (!texto) {
            if (operacion === "CIFRAR") {
                outputTexto.value = "";
            } else {
                inputTexto.value = "";
            }
            return;
        }

        if (selectIdioma.value === "CUSTOM" && !inputCustom.value.trim()) {
            CryptoUX.showToast("Alfabeto Vacío", "Ingresa un alfabeto personalizado para procesar el texto.", "error");
            return;
        }

        ultimaOperacion = operacion;

        stompClient.send("/app/rot13", {}, JSON.stringify({
            texto: texto,
            operacion: operacion,
            idioma: selectIdioma.value,
            alfabetoCustom: inputCustom.value
        }));
    }

    function cifrarDesdeOriginal() {
        ultimoCampoEditado = "original";
        enviarDatos(inputTexto.value, "CIFRAR");
    }

    function descifrarDesdeCifrado() {
        ultimoCampoEditado = "cifrado";
        enviarDatos(outputTexto.value, "DESCIFRAR");
    }

    function recalcularDesdeUltimoCampo() {
        if (ultimoCampoEditado === "cifrado") {
            descifrarDesdeCifrado();
        } else {
            cifrarDesdeOriginal();
        }
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================
    inputTexto.addEventListener("input", cifrarDesdeOriginal);
    outputTexto.addEventListener("input", descifrarDesdeCifrado);

    inputCustom.addEventListener("input", () => {
        actualizarAlfabetos();
        recalcularDesdeUltimoCampo();
    });

    selectIdioma.addEventListener("change", (e) => {
        if (e.target.value === "CUSTOM") {
            customContainer.classList.remove("hidden");
        } else {
            customContainer.classList.add("hidden");
        }

        actualizarAlfabetos();
        recalcularDesdeUltimoCampo();
    });

    // UX: Copiar al portapapeles moderno (Texto Cifrado)
    btnCopiar.addEventListener("click", () => {
        if (!outputTexto.value) {
            CryptoUX.showToast("Aviso", "No hay texto para copiar.", "info");
            return;
        }
        navigator.clipboard.writeText(outputTexto.value).then(() => {
            CryptoUX.showToast("¡Copiado!", "Texto copiado al portapapeles.", "success");
        }).catch(() => {
            outputTexto.select();
            document.execCommand("copy");
        });
    });

    // UX: Pegar desde el portapapeles (Texto Original)
    btnPegar.addEventListener("click", async () => {
        try {
            const textoPortapapeles = await navigator.clipboard.readText();

            if (textoPortapapeles) {
                inputTexto.value = textoPortapapeles;
                cifrarDesdeOriginal();
                inputTexto.focus();
                CryptoUX.showToast("Pegado", "Texto insertado correctamente.", "success");
            }
        } catch (err) {
            CryptoUX.showToast("Permiso denegado", "Concede acceso al portapapeles en tu navegador.", "error");
        }
    });

    // UX: Copiar Texto Original al portapapeles
    btnCopiarOriginal.addEventListener("click", async () => {
        if (!inputTexto.value) {
            CryptoUX.showToast("Aviso", "No hay texto original para copiar.", "info");
            return;
        }
        try {
            await navigator.clipboard.writeText(inputTexto.value);
            CryptoUX.showToast("¡Copiado!", "Texto original copiado al portapapeles.", "success");
        } catch {
            inputTexto.select();
            document.execCommand("copy");
        }
    });

    // UX: Pegar Texto Cifrado desde el portapapeles
    btnPegarCifrado.addEventListener("click", async () => {
        try {
            const textoPortapapeles = await navigator.clipboard.readText();
            if (textoPortapapeles) {
                outputTexto.value = textoPortapapeles;
                descifrarDesdeCifrado();
                outputTexto.focus();
                CryptoUX.showToast("Pegado", "Texto cifrado insertado correctamente.", "success");
            }
        } catch {
            CryptoUX.showToast("Permiso denegado", "Concede acceso al portapapeles en tu navegador.", "error");
        }
    });

    btnLimpiar.addEventListener("click", () => {
        inputTexto.value = "";
        outputTexto.value = "";
        ultimoCampoEditado = "original";
        inputTexto.focus();
    });

    // Inicialización
    actualizarAlfabetos();
    connect();

    // ==========================================
    // TUTORIAL INTERACTIVO
    // ==========================================
    const tutorialData = [
        { element: "#panelParametros", title: "Configuración de Alfabeto", text: "Selecciona el alfabeto base. Para el funcionamiento clásico de ROT13 se aconseja el alfabeto de inglés (26 letras), pero puedes usar español o personalizar uno propio." },
        { element: "#panelSimulador", title: "Alfabetos Equivalentes", text: "Este panel muestra el alfabeto base y, justo debajo, el alfabeto cifrado rotado por un desplazamiento de 13 posiciones." },
        { element: "#panelEntrada", title: "Texto Original", text: "Ingresa el texto en claro aquí para cifrarlo. Cada letra compatible se desplazará 13 lugares hacia adelante de forma dinámica." },
        { element: "#panelSalida", title: "Texto Cifrado", text: "Aquí se muestra el texto cifrado. Dado que ROT13 es su propio inverso en alfabetos de 26 letras, escribir o pegar el criptograma aquí lo descifrará al instante." }
    ];

    let currentStep = 0;
    let activeTarget = null;
    let animationFrameId = null;

    const overlay = document.getElementById("tutorialOverlay");
    const bubble = document.getElementById("tutorialBubble");
    const tutTitle = document.getElementById("tutTitle");
    const tutText = document.getElementById("tutText");
    const btnTutNext = document.getElementById("btnTutNext");
    const btnTutPrev = document.getElementById("btnTutPrev");
    const tutDotsContainer = document.getElementById("tutDots");

    if (tutDotsContainer) {
        tutorialData.forEach(() => {
            const span = document.createElement("span");
            span.className = "w-2 h-2 rounded-full bg-slate-700";
            tutDotsContainer.appendChild(span);
        });
    }

    function stopTracking() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        activeTarget = null;
    }

    function updateBubblePosition() {
        if (!activeTarget || !bubble) return;
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
        document.querySelectorAll(".tutorial-focus").forEach(el => el.classList.remove("tutorial-focus"));
        const target = document.querySelector(selector);
        if (!target) return;
        target.classList.add("tutorial-focus");
        target.scrollIntoView({ behavior: "smooth", block: "center" });

        setTimeout(() => {
            activeTarget = target;
            if (bubble) {
                bubble.classList.remove("hidden");
                updateBubblePosition();
                bubble.classList.remove("opacity-0", "scale-95");
            }
        }, 300);
    }

    function updateTutorial() {
        if (!bubble) return;
        bubble.classList.add("opacity-0", "scale-95");
        setTimeout(() => {
            if (tutTitle) tutTitle.innerHTML = tutorialData[currentStep].title;
            if (tutText) tutText.innerHTML = tutorialData[currentStep].text;

            if (tutDotsContainer) {
                Array.from(tutDotsContainer.children).forEach((dot, i) => {
                    dot.className = i === currentStep
                        ? "w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981] transition-all"
                        : "w-2 h-2 rounded-full bg-slate-700 transition-all";
                });
            }

            if (btnTutPrev) btnTutPrev.classList.toggle("hidden", currentStep === 0);
            
            if (btnTutNext) {
                if (currentStep === tutorialData.length - 1) {
                    btnTutNext.innerHTML = "Terminar ✓";
                    btnTutNext.classList.remove("bg-cyan-600", "hover:bg-cyan-500");
                    btnTutNext.classList.add("bg-emerald-600", "hover:bg-emerald-500");
                } else {
                    btnTutNext.innerHTML = "Siguiente →";
                    btnTutNext.classList.remove("bg-emerald-600", "hover:bg-emerald-500");
                    btnTutNext.classList.add("bg-cyan-600", "hover:bg-cyan-500");
                }
            }

            moverBurbuja(tutorialData[currentStep].element);
        }, 200);
    }

    const btnTutorial = document.getElementById("btnTutorial");
    if (btnTutorial) {
        btnTutorial.addEventListener("click", () => {
            currentStep = 0;
            if (overlay) {
                overlay.classList.remove("hidden");
                setTimeout(() => overlay.classList.remove("opacity-0"), 10);
            }
            updateTutorial();
        });
    }

    function closeTutorial() {
        stopTracking();
        document.querySelectorAll(".tutorial-focus").forEach(el => el.classList.remove("tutorial-focus"));
        if (bubble) bubble.classList.add("opacity-0", "scale-95");
        if (overlay) overlay.classList.add("opacity-0");
        setTimeout(() => {
            if (bubble) bubble.classList.add("hidden");
            if (overlay) overlay.classList.add("hidden");
        }, 300);
    }

    const btnCerrarTutorial = document.getElementById("btnCerrarTutorial");
    if (btnCerrarTutorial) btnCerrarTutorial.addEventListener("click", closeTutorial);
    
    if (btnTutNext) {
        btnTutNext.addEventListener("click", () => {
            currentStep < tutorialData.length - 1 ? (currentStep++, updateTutorial()) : closeTutorial();
        });
    }
    
    if (btnTutPrev) {
        btnTutPrev.addEventListener("click", () => {
            if (currentStep > 0) {
                currentStep--;
                updateTutorial();
            }
        });
    }
});