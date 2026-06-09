package com.unjfsc.criptografia.cifrados_origin.cifrados.vigenere;

import org.springframework.stereotype.Service;

@Service
public class VigenereService {

    private static final String ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public String procesarVigenere(String texto, String clave, String operacion, String idioma, String alfabetoCustom) {
        String alfabetoActual = determinarAlfabeto(idioma, alfabetoCustom);
        int modulo = alfabetoActual.length();

        StringBuilder resultado = new StringBuilder();
        String textoUpper = texto.toUpperCase();
        String claveUpper = clave.toUpperCase();

        int j = 0; // Índice para recorrer la clave

        for (int i = 0; i < texto.length(); i++) {
            char c = texto.charAt(i);
            char cUpper = Character.toUpperCase(c);
            int indexTexto = alfabetoActual.indexOf(cUpper);

            if (indexTexto != -1) {
                // Obtenemos el carácter correspondiente de la clave
                char charClave = claveUpper.charAt(j % claveUpper.length());
                int indexClave = alfabetoActual.indexOf(charClave);

                if (indexClave == -1) indexClave = 0;

                int nuevoIndex;
                if ("DESCIFRAR".equalsIgnoreCase(operacion)) {
                    nuevoIndex = (indexTexto - indexClave + modulo) % modulo;
                } else { // CIFRAR
                    nuevoIndex = (indexTexto + indexClave) % modulo;
                }

                char cifrado = alfabetoActual.charAt(nuevoIndex);
                // Respetamos la capitalización original
                resultado.append(Character.isLowerCase(c) ? Character.toLowerCase(cifrado) : cifrado);
                j++; // Solo avanzamos la clave si procesamos una letra válida
            } else {
                // Símbolos y espacios pasan intactos
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
        return ALFABETO_ES;
    }
}