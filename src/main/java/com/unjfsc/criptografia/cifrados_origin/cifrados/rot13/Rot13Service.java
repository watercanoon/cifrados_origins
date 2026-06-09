package com.unjfsc.criptografia.cifrados_origin.cifrados.rot13;

import org.springframework.stereotype.Service;

@Service
public class Rot13Service {

    private static final String ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public String procesarRot13(String texto, String operacion, String idioma, String alfabetoCustom) {
        String alfabetoActual = determinarAlfabeto(idioma, alfabetoCustom);
        int modulo = alfabetoActual.length();
        int desp = 13; // ROT13 siempre es 13

        // Si por alguna razón matemática 13 es mayor que el alfabeto (ej. alfabeto custom corto)
        desp = desp % modulo;

        if ("DESCIFRAR".equalsIgnoreCase(operacion)) {
            desp = modulo - desp;
        }

        StringBuilder resultado = new StringBuilder();

        for (int i = 0; i < texto.length(); i++) {
            char c = texto.charAt(i);
            char cUpper = Character.toUpperCase(c);
            int index = alfabetoActual.indexOf(cUpper);

            if (index != -1) {
                int nuevoIndex = (index + desp) % modulo;
                char cifrado = alfabetoActual.charAt(nuevoIndex);
                resultado.append(Character.isLowerCase(c) ? Character.toLowerCase(cifrado) : cifrado);
            } else {
                resultado.append(c); // Símbolos pasan intactos
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
        return ALFABETO_ES;
    }
}