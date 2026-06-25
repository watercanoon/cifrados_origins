package com.unjfsc.criptografia.cifrados_origin.cifrados.rot47;

import org.springframework.stereotype.Service;

/**
 * Servicio para el cifrado y descifrado utilizando el algoritmo ROT47.
 * ROT47 es una variante de ROT13 que aplica un desplazamiento de 47 caracteres sobre un rango
 * más amplio de caracteres, específicamente los caracteres ASCII imprimibles (códigos 33 al 126).
 * Al igual que ROT13, es recíproco; cifrar un texto dos veces devuelve el texto original.
 */
@Service
public class Rot47Service {

    /**
     * Procesa el texto aplicando el desplazamiento de ROT47.
     * Dado que es recíproco, la misma función sirve para cifrar y descifrar.
     *
     * @param texto El texto de entrada a procesar.
     * @return El texto procesado tras aplicar la rotación de 47 caracteres en el rango ASCII imprimible.
     */
    public String procesarRot47(String texto) {
        // 🛡️ VALIDACIÓN DE ENTRADA
        if (texto == null || texto.trim().isEmpty()) {
            throw new IllegalArgumentException("El texto a procesar no puede estar vacío.");
        }

        StringBuilder resultado = new StringBuilder();

        for (int i = 0; i < texto.length(); i++) {
            char c = texto.charAt(i);

            // ROT47 solo opera sobre caracteres ASCII imprimibles entre 33 (!) y 126 (~)
            if (c >= 33 && c <= 126) {
                int nuevoC = c + 47;
                // Si excede el límite superior de los caracteres imprimibles, damos la vuelta
                if (nuevoC > 126) {
                    nuevoC = nuevoC - 94; // 94 es la cantidad total de caracteres en este rango
                }
                resultado.append((char) nuevoC);
            } else {
                // Espacios (ASCII 32) y otros caracteres invisibles pasan intactos
                resultado.append(c);
            }
        }
        return resultado.toString();
    }
}