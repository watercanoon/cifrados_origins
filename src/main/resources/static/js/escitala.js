let stompClient = null;
let caraActual = 0;
const alturaRem = 6;
let intervaloGiro = null;

function conectarWebSocket() {
    const socket = new SockJS('/ws-criptografia');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        const statusCircle = document.getElementById("ws-status");
        if (statusCircle) {
            statusCircle.classList.remove("bg-red-500");
            statusCircle.classList.add("bg-emerald-500");
            statusCircle.classList.replace("shadow-[0_0_8px_rgba(239,68,68,0.8)]", "shadow-[0_0_12px_rgba(16,185,129,0.8)]");
        }

        stompClient.subscribe('/topic/escitala', function (respuesta) {
            const datos = JSON.parse(respuesta.body);
            document.getElementById("textoOutput").value = datos.resultado;

            const panelOutput = document.getElementById("panelOutput");
            panelOutput.classList.add("ring-2", "ring-emerald-500");
            setTimeout(() => panelOutput.classList.remove("ring-2", "ring-emerald-500"), 500);
        });
    }, function (error) {
    });
}

function procesarTexto() {
    const texto = document.getElementById("textoInput").value;
    const clave = document.getElementById("claveInput").value;
    const esCifrar = !document.getElementById("toggleModo").checked;

    if (!texto.trim()) return;

    const ruta = esCifrar ? "/app/cifrar/escitala" : "/app/descifrar/escitala";

    stompClient.send(ruta, {}, JSON.stringify({
        'texto': texto,
        'clave': clave
    }));
}

function generarMatrizVisual(texto = "", caras = 4) {
    const cinta = document.getElementById("cintaBaston");
    const esCifrar = !document.getElementById("toggleModo").checked;
    cinta.innerHTML = "";

    let textoProcesado = texto.replace(/\s+/g, '').toUpperCase();
    let longitudOriginal = textoProcesado.length;
    let filasCount = 8;

    if (longitudOriginal > 0) {
        while (textoProcesado.length % caras !== 0) {
            textoProcesado += "X";
        }
        filasCount = textoProcesado.length / caras;
    }

    // Actualizar Panel de Métricas de Ingeniería
    document.getElementById("statLongitud").textContent = longitudOriginal;
    document.getElementById("statVueltas").textContent = longitudOriginal > 0 ? filasCount : 0;
    document.getElementById("statSecciones").textContent = longitudOriginal > 0 ? (filasCount * caras) : 0;
    document.getElementById("statRelleno").textContent = longitudOriginal > 0 ? (textoProcesado.length - longitudOriginal) : 0;

    let filasDivs = [];

    for (let i = 0; i < caras; i++) {
        const filaDiv = document.createElement("div");
        filaDiv.className = "flex justify-center items-center w-full h-24 shrink-0 bg-gradient-to-b from-[#cb9d6c] via-[#b68450] to-[#986737] border-y border-[#54381b]/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_6px_rgba(0,0,0,0.45)] skew-x-3 transition-all duration-300";

        for (let j = 0; j < filasCount; j++) {
            const celda = document.createElement("div");
            celda.className = "w-11 h-11 mx-2 flex items-center justify-center font-mono text-[#201002] font-black text-2xl border-x border-[#54381b]/20 bg-[#fffbf2]/40 rounded-sm shadow-[0_3px_5px_rgba(0,0,0,0.3)] -skew-x-3 hover:scale-125 hover:bg-amber-100 hover:text-amber-950 hover:z-10 transition-all cursor-default";

            if (longitudOriginal > 0) {
                celda.textContent = esCifrar ? textoProcesado.charAt(j * caras + i) : textoProcesado.charAt(i * filasCount + j);
            } else {
                celda.textContent = "";
                celda.className += " border-dashed border-[#54381b]/40";
            }
            filaDiv.appendChild(celda);
        }
        filasDivs.push(filaDiv);
        cinta.appendChild(filaDiv);
    }

    if (filasDivs.length > 0) {
        const clonFila = filasDivs[0].cloneNode(true);
        cinta.appendChild(clonFila);
    }
}

function inicializarEventos() {
    const btnArriba = document.getElementById("btnArriba");
    const btnAbajo = document.getElementById("btnAbajo");
    const btnAutoGiro = document.getElementById("btnAutoGiro");
    const cinta = document.getElementById("cintaBaston");
    const claveInput = document.getElementById("claveInput");
    const textoInput = document.getElementById("textoInput");
    const toggleModo = document.getElementById("toggleModo");

    toggleModo.addEventListener("change", (e) => {
        const esDescifrar = e.target.checked;
        const lblCifrar = document.getElementById("lblCifrar");
        const lblDescifrar = document.getElementById("lblDescifrar");
        const tituloInput = document.getElementById("tituloInput");
        const tituloOutput = document.getElementById("tituloOutput");
        const btnProcesar = document.getElementById("btnProcesar");

        if (esDescifrar) {
            lblCifrar.classList.replace("font-bold", "font-medium");
            lblCifrar.classList.replace("text-blue-400", "text-slate-500");
            lblDescifrar.classList.replace("font-medium", "font-bold");
            lblDescifrar.classList.replace("text-slate-500", "text-emerald-400");

            tituloInput.textContent = "Texto Cifrado (Entrada)";
            tituloOutput.textContent = "Texto Plano (Resultado)";

            btnProcesar.classList.replace("from-blue-600", "from-emerald-600");
            btnProcesar.classList.replace("to-cyan-600", "to-teal-600");
            btnProcesar.classList.replace("hover:from-blue-500", "hover:from-emerald-500");
            btnProcesar.classList.replace("hover:to-cyan-500", "hover:to-teal-500");
        } else {
            lblDescifrar.classList.replace("font-bold", "font-medium");
            lblDescifrar.classList.replace("text-emerald-400", "text-slate-500");
            lblCifrar.classList.replace("font-medium", "font-bold");
            lblCifrar.classList.replace("text-slate-500", "text-blue-400");

            tituloInput.textContent = "Texto Plano (Entrada)";
            tituloOutput.textContent = "Texto Cifrado (Resultado)";

            btnProcesar.classList.replace("from-emerald-600", "from-blue-600");
            btnProcesar.classList.replace("to-teal-600", "to-cyan-600");
            btnProcesar.classList.replace("hover:from-emerald-500", "hover:from-blue-500");
            btnProcesar.classList.replace("hover:to-teal-500", "hover:to-cyan-500");
        }

        document.getElementById("textoOutput").value = "";
        actualizarSimulador();
    });

    function rotarAbajo() {
        const caras = parseInt(claveInput.value) || 4;
        caraActual++;
        cinta.style.transition = 'transform 300ms ease-in-out';
        cinta.style.transform = `translateY(-${caraActual * alturaRem}rem)`;

        if (caraActual === caras) {
            setTimeout(() => {
                cinta.style.transition = 'none';
                caraActual = 0;
                cinta.style.transform = `translateY(0)`;
            }, 300);
        }
    }

    btnArriba.addEventListener("click", () => {
        const caras = parseInt(claveInput.value) || 4;
        caraActual--;
        if (caraActual < 0) {
            cinta.style.transition = 'none';
            caraActual = caras - 1;
            cinta.style.transform = `translateY(-${caras * alturaRem}rem)`;
            void cinta.offsetWidth;
            cinta.style.transition = 'transform 300ms ease-in-out';
        }
        cinta.style.transform = `translateY(-${caraActual * alturaRem}rem)`;
    });

    btnAbajo.addEventListener("click", rotarAbajo);

    btnAutoGiro.addEventListener("click", () => {
        if (intervaloGiro) {
            clearInterval(intervaloGiro);
            intervaloGiro = null;
            btnAutoGiro.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg> Auto-Giro';
            btnAutoGiro.classList.replace("bg-red-600", "bg-emerald-600");
            btnAutoGiro.classList.replace("hover:bg-red-500", "hover:bg-emerald-500");
        } else {
            intervaloGiro = setInterval(rotarAbajo, 1200);
            btnAutoGiro.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg> Pausar';
            btnAutoGiro.classList.replace("bg-emerald-600", "bg-red-600");
            btnAutoGiro.classList.replace("hover:bg-emerald-500", "hover:bg-red-500");
        }
    });

    function actualizarSimulador() {
        const texto = textoInput.value;
        const caras = parseInt(claveInput.value) || 4;
        caraActual = 0;
        cinta.style.transition = 'none';
        cinta.style.transform = `translateY(0)`;
        generarMatrizVisual(texto, caras);
        setTimeout(() => cinta.style.transition = 'transform 300ms ease-in-out', 50);
    }

    textoInput.addEventListener("input", actualizarSimulador);
    claveInput.addEventListener("input", actualizarSimulador);
    document.getElementById("btnProcesar").addEventListener("click", procesarTexto);
}

window.onload = function() {
    conectarWebSocket();
    generarMatrizVisual("", 4);
    inicializarEventos();
};