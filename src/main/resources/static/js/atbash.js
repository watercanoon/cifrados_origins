document.addEventListener("DOMContentLoaded", () => {
    let stompClient = null;
    let ultimoCampoEditado = "entrada";

    const inputTexto = document.getElementById("textoEntrada");
    const outputTexto = document.getElementById("textoSalida");
    const idiomaSelect = document.getElementById("idioma");
    const customContainer = document.getElementById("customAlphabetContainer");
    const inputCustom = document.getElementById("alfabetoCustom");

    const gridTop = document.getElementById("alfabetoTop");
    const gridBottom = document.getElementById("alfabetoBottom");
    const charIn = document.getElementById("charIn");
    const charOut = document.getElementById("charOut");
    const connDot = document.getElementById("connDot");
    const connLabel = document.getElementById("connLabel");

    const btnCopiar = document.getElementById("btnCopiar");
    const btnPegar = document.getElementById("btnPegar");
    const btnLimpiar = document.getElementById("btnLimpiar");

    const ALFABETO_ES = "ABCDEFGHIJKLMN\u00d1OPQRSTUVWXYZ";
    const ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    function setConnStatus(online) {
        connDot.classList.toggle("connected", online);
        connLabel.textContent = online ? "online" : "offline";
    }

    function limpiarAlfabeto(valor) {
        const visto = new Set();
        let resultado = "";

        for (const char of (valor || "").toUpperCase()) {
            if (!/[\p{L}]/u.test(char)) continue;
            if (visto.has(char)) continue;

            visto.add(char);
            resultado += char;
        }

        return resultado;
    }

    function obtenerAlfabeto() {
        if (idiomaSelect.value === "CUSTOM") {
            const custom = limpiarAlfabeto(inputCustom.value);
            return custom.length >= 2 ? custom : "";
        }

        return idiomaSelect.value === "EN" ? ALFABETO_EN : ALFABETO_ES;
    }

    function obtenerReflejo(alfabeto) {
        return alfabeto.split("").reverse().join("");
    }

    function actualizarMapa() {
        const alfabeto = obtenerAlfabeto();
        const reflejo = obtenerReflejo(alfabeto);

        gridTop.innerHTML = "";
        gridBottom.innerHTML = "";

        if (!alfabeto) {
            gridTop.innerHTML = '<div class="text-xs text-slate-500 px-2 py-1">Ingresa un alfabeto personalizado valido.</div>';
            gridBottom.innerHTML = "";
            charIn.textContent = "-";
            charOut.textContent = "-";
            return;
        }

        for (let i = 0; i < alfabeto.length; i++) {
            const baseCell = document.createElement("div");
            baseCell.className = "letter-cell base-cell";
            baseCell.textContent = alfabeto[i];
            baseCell.dataset.char = alfabeto[i];
            gridTop.appendChild(baseCell);

            const cipherCell = document.createElement("div");
            cipherCell.className = "letter-cell cipher-cell";
            cipherCell.textContent = reflejo[i];
            cipherCell.dataset.char = reflejo[i];
            gridBottom.appendChild(cipherCell);
        }
    }

    function resaltarCaracter(char) {
        document.querySelectorAll(".active-base, .active-cipher").forEach(el => {
            el.classList.remove("active-base", "active-cipher");
        });

        if (!char) {
            charIn.textContent = "-";
            charOut.textContent = "-";
            return;
        }

        const alfabeto = obtenerAlfabeto();
        if (!alfabeto) return;

        const upper = char.toUpperCase();
        const index = alfabeto.indexOf(upper);

        if (index === -1) {
            charIn.textContent = char === " " ? "ESP" : char;
            charOut.textContent = char === " " ? "ESP" : char;
            return;
        }

        const reflejo = obtenerReflejo(alfabeto);
        const salida = reflejo[index];
        const baseCell = gridTop.children[index];
        const cipherCell = gridBottom.children[index];

        if (baseCell) baseCell.classList.add("active-base");
        if (cipherCell) cipherCell.classList.add("active-cipher");

        charIn.textContent = upper;
        charOut.textContent = salida;
    }

    function connect() {
        const socket = new SockJS("/ws-criptografia");
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function () {
            setConnStatus(true);
            stompClient.subscribe("/topic/atbash", function (response) {
                const data = JSON.parse(response.body);

                if (data.error) {
                    mostrarError(data.error);
                    return;
                }

                if (ultimoCampoEditado === "entrada") {
                    outputTexto.value = data.resultado;
                } else {
                    inputTexto.value = data.resultado;
                }
            });
        }, function () {
            setConnStatus(false);
            mostrarError("Conexion interrumpida. Reconectando...");
            setTimeout(connect, 3000);
        });
    }

    function enviarDatos(origen) {
        ultimoCampoEditado = origen;
        const texto = origen === "entrada" ? inputTexto.value : outputTexto.value;

        actualizarMapa();
        resaltarCaracter(texto.charAt(texto.length - 1));

        if (!texto) {
            if (origen === "entrada") {
                outputTexto.value = "";
            } else {
                inputTexto.value = "";
            }
            return;
        }

        if (idiomaSelect.value === "CUSTOM" && !obtenerAlfabeto()) {
            mostrarError("El alfabeto personalizado necesita al menos 2 letras distintas.");
            return;
        }

        if (!stompClient || !stompClient.connected) return;

        stompClient.send("/app/atbash", {}, JSON.stringify({
            texto,
            operacion: origen === "entrada" ? "CIFRAR" : "DESCIFRAR",
            idioma: idiomaSelect.value,
            alfabetoCustom: limpiarAlfabeto(inputCustom.value)
        }));
    }

    inputTexto.addEventListener("input", () => enviarDatos("entrada"));
    outputTexto.addEventListener("input", () => enviarDatos("salida"));

    idiomaSelect.addEventListener("change", () => {
        customContainer.classList.toggle("hidden", idiomaSelect.value !== "CUSTOM");
        actualizarMapa();
        enviarDatos(ultimoCampoEditado);
    });

    inputCustom.addEventListener("input", () => {
        inputCustom.value = limpiarAlfabeto(inputCustom.value);
        actualizarMapa();
        enviarDatos(ultimoCampoEditado);
    });

    btnPegar.addEventListener("click", async () => {
        try {
            const textoPortapapeles = await navigator.clipboard.readText();
            if (textoPortapapeles) {
                inputTexto.value = textoPortapapeles;
                enviarDatos("entrada");
                inputTexto.focus();
            }
        } catch {
            mostrarError("Permiso de portapapeles denegado.");
        }
    });

    btnLimpiar.addEventListener("click", () => {
        inputTexto.value = "";
        outputTexto.value = "";
        resaltarCaracter("");
        inputTexto.focus();
    });

    btnCopiar.addEventListener("click", async () => {
        if (!outputTexto.value) return;

        try {
            await navigator.clipboard.writeText(outputTexto.value);
            mostrarExito("Texto copiado al portapapeles");
        } catch {
            outputTexto.select();
            document.execCommand("copy");
        }
    });

    function mostrarToast(mensaje, tipo) {
        const container = document.getElementById("toast-container");
        const toast = document.createElement("div");
        const isError = tipo === "error";
        toast.className = `px-4 py-3 rounded-xl shadow-xl border backdrop-blur-sm text-sm font-medium ${
            isError
                ? "bg-red-950/90 text-red-200 border-red-700/50"
                : "bg-emerald-950/90 text-emerald-200 border-emerald-700/50"
        }`;
        toast.textContent = mensaje;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity .35s ease";
            setTimeout(() => toast.remove(), 350);
        }, 2800);
    }

    function mostrarError(mensaje) {
        mostrarToast(mensaje, "error");
    }

    function mostrarExito(mensaje) {
        mostrarToast(mensaje, "ok");
    }

    actualizarMapa();
    connect();
});
