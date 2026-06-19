package com.unjfsc.criptografia.cifrados_origin.cifrados.atbash;

import org.springframework.stereotype.Service;

@Service
public class AtbashService {

    private static final String ALFABETO_ES = "ABCDEFGHIJKLMN\u00d1OPQRSTUVWXYZ";
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public String procesarAtbash(String texto, String idioma, String alfabetoCustom) {
        // 🛡️ VALIDACIÓN
        if (texto == null || texto.trim().isEmpty()) {
            throw new IllegalArgumentException("El texto a procesar no puede estar vacío.");
        }

        String alfabeto = obtenerAlfabeto(idioma, alfabetoCustom);
        if (alfabeto.length() < 2) {
            throw new IllegalArgumentException("El alfabeto debe tener al menos 2 caracteres válidos.");
        }

        // ... resto de tu código intacto (StringBuilder resultado = new StringBuilder(); ...)
        StringBuilder resultado = new StringBuilder();

        for (char c : texto.toCharArray()) {
            char upper = Character.toUpperCase(c);
            int index = alfabeto.indexOf(upper);

            if (index != -1) {
                int inverso = alfabeto.length() - 1 - index;
                char nuevo = alfabeto.charAt(inverso);
                resultado.append(Character.isLowerCase(c) ? Character.toLowerCase(nuevo) : nuevo);
            } else {
                resultado.append(c);
            }
        }

        return resultado.toString();
    }

    private String obtenerAlfabeto(String idioma, String alfabetoCustom) {
        if ("CUSTOM".equalsIgnoreCase(idioma) && alfabetoCustom != null && !alfabetoCustom.isBlank()) {
            return limpiarAlfabetoPersonalizado(alfabetoCustom);
        }

        if ("EN".equalsIgnoreCase(idioma)) {
            return ALFABETO_EN;
        }

        return ALFABETO_ES;
    }

    private String limpiarAlfabetoPersonalizado(String valor) {
        StringBuilder limpio = new StringBuilder();

        for (char c : valor.toUpperCase().toCharArray()) {
            if (!Character.isLetter(c)) {
                continue;
            }

            if (limpio.indexOf(String.valueOf(c)) == -1) {
                limpio.append(c);
            }
        }

        return limpio.length() >= 2 ? limpio.toString() : ALFABETO_ES;
    }
}
