package com.unjfsc.criptografia.cifrados_origin.cifrados.atbash;

import org.springframework.stereotype.Service;

@Service
public class AtbashService {

    private static final String ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"; // 27 letras
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";  // 26 letras

    public String procesarAtbash(String texto, String idioma) {
        if (texto == null || texto.isBlank()) return "";

        StringBuilder resultado = new StringBuilder();
        texto = texto.toUpperCase();

        String alfabetoUsado = "EN".equalsIgnoreCase(idioma) ? ALFABETO_EN : ALFABETO_ES;
        int longitudAlfabeto = alfabetoUsado.length();

        for (int i = 0; i < texto.length(); i++) {
            char caracter = texto.charAt(i);
            int indexActual = alfabetoUsado.indexOf(caracter);

            if (indexActual != -1) {
                // Lógica de Atbash: Índice Inverso = (N - 1) - Índice Actual
                int indexInverso = (longitudAlfabeto - 1) - indexActual;
                resultado.append(alfabetoUsado.charAt(indexInverso));
            } else {
                // Mantener espacios, números y símbolos
                resultado.append(caracter);
            }
        }

        return resultado.toString();
    }
}