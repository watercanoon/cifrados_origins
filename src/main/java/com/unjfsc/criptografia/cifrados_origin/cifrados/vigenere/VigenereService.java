package com.unjfsc.criptografia.cifrados_origin.cifrados.vigenere;

import org.springframework.stereotype.Service;

@Service
public class VigenereService {

    private static final String ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"; // 27 letras
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";  // 26 letras

    public String procesarVigenere(String texto, String clave, String operacion, String idioma) {
        if (texto == null || texto.isBlank()) return "";
        if (clave == null || clave.isBlank()) clave = "A"; // Clave neutra por defecto

        StringBuilder resultado = new StringBuilder();
        String textoNormalizado = texto.toUpperCase();
        String claveNormalizada = clave.toUpperCase();

        String alfabetoUsado = "EN".equalsIgnoreCase(idioma) ? ALFABETO_EN : ALFABETO_ES;
        int modulo = alfabetoUsado.length();
        int indiceClave = 0; // Se mueve independientemente de los espacios en blanco
        boolean cifrar = !"DESCIFRAR".equalsIgnoreCase(operacion);

        for (int i = 0; i < textoNormalizado.length(); i++) {
            char caracter = textoNormalizado.charAt(i);
            int posicionTexto = alfabetoUsado.indexOf(caracter);

            if (posicionTexto != -1) {
                // Obtener posición de la letra de la clave actual
                char charClave = claveNormalizada.charAt(indiceClave % claveNormalizada.length());
                int posicionClave = alfabetoUsado.indexOf(charClave);
                if (posicionClave == -1) posicionClave = 0; // Ignorar caracteres inválidos en la clave

                int nuevaPosicion;
                if (cifrar) {
                    // C_i = (M_i + K_i) mod N
                    nuevaPosicion = Math.floorMod(posicionTexto + posicionClave, modulo);
                } else {
                    // M_i = (C_i - K_i) mod N
                    nuevaPosicion = Math.floorMod(posicionTexto - posicionClave, modulo);
                }

                resultado.append(alfabetoUsado.charAt(nuevaPosicion));
                indiceClave++; // Solo avanza si se procesó una letra válida
            } else {
                resultado.append(caracter); // Mantiene espacios y signos de puntuación
            }
        }

        return resultado.toString();
    }
}