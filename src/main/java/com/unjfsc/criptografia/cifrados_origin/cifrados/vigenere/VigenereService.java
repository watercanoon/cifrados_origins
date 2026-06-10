package com.unjfsc.criptografia.cifrados_origin.cifrados.vigenere;

import org.springframework.stereotype.Service;

@Service
public class VigenereService {

    private static final String ALFABETO_ES = "ABCDEFGHIJKLMN\u00d1OPQRSTUVWXYZ";
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public String procesarVigenere(String texto, String clave, String operacion, String idioma, String alfabetoCustom) {
        String alfabetoActual = determinarAlfabeto(idioma, alfabetoCustom);
        String claveLimpia = limpiarClave(clave, alfabetoActual);

        if (texto == null || claveLimpia.isEmpty()) {
            return "";
        }

        int modulo = alfabetoActual.length();
        StringBuilder resultado = new StringBuilder();

        int j = 0;

        for (int i = 0; i < texto.length(); i++) {
            char c = texto.charAt(i);
            char cUpper = Character.toUpperCase(c);
            int indexTexto = alfabetoActual.indexOf(cUpper);

            if (indexTexto != -1) {
                char charClave = claveLimpia.charAt(j % claveLimpia.length());
                int indexClave = alfabetoActual.indexOf(charClave);

                int nuevoIndex;
                if ("DESCIFRAR".equalsIgnoreCase(operacion)) {
                    nuevoIndex = (indexTexto - indexClave + modulo) % modulo;
                } else {
                    nuevoIndex = (indexTexto + indexClave) % modulo;
                }

                char cifrado = alfabetoActual.charAt(nuevoIndex);
                resultado.append(Character.isLowerCase(c) ? Character.toLowerCase(cifrado) : cifrado);
                j++;
            } else {
                resultado.append(c);
            }
        }

        return resultado.toString();
    }

    private String determinarAlfabeto(String idioma, String alfabetoCustom) {
        if ("CUSTOM".equalsIgnoreCase(idioma) && alfabetoCustom != null && !alfabetoCustom.isBlank()) {
            String limpio = limpiarLetrasUnicas(alfabetoCustom);
            return limpio.length() >= 2 ? limpio : ALFABETO_ES;
        }

        if ("EN".equalsIgnoreCase(idioma)) {
            return ALFABETO_EN;
        }

        return ALFABETO_ES;
    }

    private String limpiarLetrasUnicas(String valor) {
        StringBuilder limpio = new StringBuilder();

        for (char c : valor.toUpperCase().toCharArray()) {
            if (!Character.isLetter(c)) {
                continue;
            }

            if (limpio.indexOf(String.valueOf(c)) == -1) {
                limpio.append(c);
            }
        }

        return limpio.toString();
    }

    private String limpiarClave(String clave, String alfabeto) {
        StringBuilder limpia = new StringBuilder();

        if (clave == null) {
            return "";
        }

        for (char c : clave.toUpperCase().toCharArray()) {
            if (alfabeto.indexOf(c) != -1) {
                limpia.append(c);
            }
        }

        return limpia.toString();
    }
}
