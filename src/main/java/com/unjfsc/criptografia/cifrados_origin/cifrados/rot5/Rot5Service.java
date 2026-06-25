package com.unjfsc.criptografia.cifrados_origin.cifrados.rot5;

import org.springframework.stereotype.Service;

/**
 * Servicio para el cifrado y descifrado utilizando el algoritmo ROT5.
 * ROT5 es un algoritmo de cifrado simple simétrico que aplica un desplazamiento de 5 posiciones
 * exclusivamente a los caracteres numéricos (dígitos del '0' al '9'). Las letras y caracteres especiales
 * permanecen inalterados. Al igual que ROT13, es recíproco por lo que aplicar el cifrado dos veces
 * devuelve el número original.
 */
@Service
public class Rot5Service {

    // Desplazamiento fijo para ROT5
    private static final int DESPLAZAMIENTO_ROT5 = 5;

    /**
     * Procesa el texto aplicando el algoritmo ROT5 sobre todos los caracteres numéricos.
     * Dado que el algoritmo es recíproco, realiza tanto el cifrado como el descifrado.
     *
     * @param texto El texto de entrada a cifrar o descifrar.
     * @return El texto procesado donde cada dígito ha sido rotado por 5 posiciones en módulo 10.
     */
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
                int nuevoNum = (num + DESPLAZAMIENTO_ROT5) % 10;
                resultado.append(nuevoNum);
            } else {
                // Letras, espacios y símbolos pasan INTACTOS sin conversión
                resultado.append(c);
            }
        }
        return resultado.toString();
    }
}

