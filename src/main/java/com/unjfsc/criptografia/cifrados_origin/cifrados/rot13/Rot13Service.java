package com.unjfsc.criptografia.cifrados_origin.cifrados.rot13;

import org.springframework.stereotype.Service;

/**
 * Servicio para el cifrado y descifrado utilizando el algoritmo ROT13.
 * ROT13 es un caso especial del cifrado César con un desplazamiento fijo de 13 posiciones.
 * Al ser un cifrado simétrico (con un alfabeto estándar de 26 letras), aplicar el algoritmo
 * dos veces devuelve el texto original.
 */
@Service
public class Rot13Service {

    // Alfabeto estándar en español (27 letras)
    private static final String ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    // Alfabeto estándar en inglés (26 letras)
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    /**
     * Procesa el texto aplicando el desplazamiento ROT13.
     *
     * @param texto          El texto de entrada a cifrar o descifrar.
     * @param operacion      La operación a realizar ("CIFRAR" o "DESCIFRAR").
     * @param idioma         El idioma del alfabeto ("ES", "EN" o "CUSTOM").
     * @param alfabetoCustom Alfabeto personalizado opcional a usar si el idioma es "CUSTOM".
     * @return El texto resultante tras aplicar el desplazamiento ROT13.
     */
    public String procesarRot13(String texto, String operacion, String idioma, String alfabetoCustom) {
        // 🛡 VALIDACIÓN DE ENTRADA
        if (texto == null || texto.trim().isEmpty()) {
            throw new IllegalArgumentException("El texto a procesar no puede estar vacío.");
        }

        String alfabetoActual = determinarAlfabeto(idioma, alfabetoCustom);
        int modulo = alfabetoActual.length();
        int desp = 13; // ROT13 siempre es 13

        // Si por alguna razón matemática 13 es mayor que el alfabeto (ej. alfabeto custom corto)
        desp = desp % modulo;

        // Para descifrar, desplazamos hacia adelante el equivalente inverso (modulo - desplazamiento)
        if ("DESCIFRAR".equalsIgnoreCase(operacion)) {
            desp = modulo - desp;
        }

        StringBuilder resultado = new StringBuilder();

        for (int i = 0; i < texto.length(); i++) {
            char c = texto.charAt(i);
            char cUpper = Character.toUpperCase(c);
            int index = alfabetoActual.indexOf(cUpper);

            if (index != -1) {
                // Cálculo de la nueva posición usando aritmética modular
                int nuevoIndex = (index + desp) % modulo;
                char cifrado = alfabetoActual.charAt(nuevoIndex);
                // Mantener el caso original (mayúscula o minúscula) del carácter
                resultado.append(Character.isLowerCase(c) ? Character.toLowerCase(cifrado) : cifrado);
            } else {
                resultado.append(c); // Símbolos y espacios pasan intactos
            }
        }
        return resultado.toString();
    }

    /**
     * Determina el alfabeto a utilizar según la configuración del usuario.
     */
    private String determinarAlfabeto(String idioma, String alfabetoCustom) {
        if ("CUSTOM".equalsIgnoreCase(idioma) && alfabetoCustom != null && !alfabetoCustom.isEmpty()) {
            return alfabetoCustom.toUpperCase();
        } else if ("EN".equalsIgnoreCase(idioma)) {
            return ALFABETO_EN;
        }
        return ALFABETO_ES;
    }
}