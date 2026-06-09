package com.unjfsc.criptografia.cifrados_origin.cifrados.cesar;

import org.springframework.stereotype.Service;

@Service
public class CesarService {

    // Alfabetos base por defecto
    private static final String ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public String procesarCesar(String texto, int desplazamiento, String operacion, String idioma, String alfabetoCustom) {
        // 1. Determinar el alfabeto a usar
        String alfabetoActual = determinarAlfabeto(idioma, alfabetoCustom);
        int modulo = alfabetoActual.length();

        // 2. Normalizar el desplazamiento
        int desp = desplazamiento % modulo;
        if (desp < 0) {
            desp += modulo;
        }

        // Si es descifrar, invertimos el desplazamiento
        if ("DESCIFRAR".equalsIgnoreCase(operacion)) {
            desp = modulo - desp;
        }

        // 3. Procesamiento
        StringBuilder resultado = new StringBuilder();

        for (int i = 0; i < texto.length(); i++) {
            char c = texto.charAt(i);
            char cUpper = Character.toUpperCase(c); // Evaluamos en mayúscula
            int index = alfabetoActual.indexOf(cUpper);

            if (index != -1) {
                // Es parte del alfabeto, aplicamos César
                int nuevoIndex = (index + desp) % modulo;
                char cifrado = alfabetoActual.charAt(nuevoIndex);

                // Devolvemos en minúscula si el original era minúscula
                resultado.append(Character.isLowerCase(c) ? Character.toLowerCase(cifrado) : cifrado);
            } else {
                // Símbolos, espacios o letras no soportadas se mantienen INTACTOS
                resultado.append(c);
            }
        }

        return resultado.toString();
    }

    private String determinarAlfabeto(String idioma, String alfabetoCustom) {
        if ("CUSTOM".equalsIgnoreCase(idioma) && alfabetoCustom != null && !alfabetoCustom.isEmpty()) {
            return alfabetoCustom.toUpperCase();
        } else if ("EN".equalsIgnoreCase(idioma)) {
            return ALFABETO_EN;
        }
        return ALFABETO_ES; // Por defecto Español
    }
}