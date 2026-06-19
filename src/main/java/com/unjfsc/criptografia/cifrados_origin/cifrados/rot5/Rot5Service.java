package com.unjfsc.criptografia.cifrados_origin.cifrados.rot5;

import org.springframework.stereotype.Service;

@Service
public class Rot5Service {

    private static final int DESPLAZAMIENTO_ROT5 = 5;

    public String procesarRot5(String texto) {
        if (texto == null || texto.trim().isEmpty()) {
            throw new IllegalArgumentException("El texto a procesar no puede estar vacío.");
        }

        StringBuilder resultado = new StringBuilder();
        for (int i = 0; i < texto.length(); i++) {
            char c = texto.charAt(i);
            if (Character.isDigit(c)) {
                // Es un número, aplicamos ROT5
                int num = Character.getNumericValue(c);
                int nuevoNum = (num + 5) % 10;
                resultado.append(nuevoNum);
            } else {
                // Letras, espacios y símbolos pasan INTACTOS sin conversión
                resultado.append(c);
            }
        }
        return resultado.toString();
    }
}
