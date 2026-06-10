package com.unjfsc.criptografia.cifrados_origin.cifrados.atbash;

import org.springframework.stereotype.Service;

@Service
public class AtbashService {

    private static final String ALFABETO_ES = "ABCDEFGHIJKLMN\u00d1OPQRSTUVWXYZ";
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public String procesarAtbash(String texto, String idioma, String alfabetoCustom) {
        if (texto == null) {
            return "";
        }

        String alfabeto = obtenerAlfabeto(idioma, alfabetoCustom);
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
