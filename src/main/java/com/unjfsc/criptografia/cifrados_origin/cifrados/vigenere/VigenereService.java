package com.unjfsc.criptografia.cifrados_origin.cifrados.vigenere;

import org.springframework.stereotype.Service;

/**
 * Servicio para el cifrado y descifrado utilizando el algoritmo de Vigenère.
 * El cifrado de Vigenère es un método de cifrado polialfabético que consiste en aplicar
 * una serie de cifrados César basados en las letras de una palabra clave.
 * A diferencia del cifrado César, el desplazamiento cambia carácter a carácter
 * según los caracteres de la clave repetida cíclicamente.
 */
@Service
public class VigenereService {

    // Alfabeto estándar en español con Ñ (27 letras)
    private static final String ALFABETO_ES = "ABCDEFGHIJKLMN\u00d1OPQRSTUVWXYZ";
    // Alfabeto estándar en inglés (26 letras)
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    /**
     * Procesa el texto aplicando el cifrado o descifrado de Vigenère.
     *
     * @param texto          El texto de entrada a procesar.
     * @param clave          La clave de cifrado/descifrado.
     * @param operacion      La operación a realizar ("CIFRAR" o "DESCIFRAR").
     * @param idioma         El idioma del alfabeto ("ES", "EN" o "CUSTOM").
     * @param alfabetoCustom Alfabeto personalizado opcional a usar si el idioma es "CUSTOM".
     * @return El texto procesado resultante.
     */
    public String procesarVigenere(String texto, String clave, String operacion, String idioma, String alfabetoCustom) {
        // 🛡️ VALIDACIONES INICIALES
        if (texto == null || texto.trim().isEmpty()) {
            throw new IllegalArgumentException("El texto a procesar no puede estar vacío.");
        }
        if (clave == null || clave.trim().isEmpty()) {
            throw new IllegalArgumentException("La palabra clave no puede estar vacía.");
        }

        String alfabetoActual = determinarAlfabeto(idioma, alfabetoCustom);
        String claveLimpia = limpiarClave(clave, alfabetoActual);

        // 🛡️ VALIDACIÓN DE CLAVE (Evita división por cero si la clave era puros números, ej "123")
        if (claveLimpia.isEmpty()) {
            throw new IllegalArgumentException("La clave no contiene caracteres válidos del alfabeto seleccionado.");
        }

        int modulo = alfabetoActual.length();
        StringBuilder resultado = new StringBuilder();

        // Índice para llevar el control del carácter actual de la clave
        int j = 0;

        for (int i = 0; i < texto.length(); i++) {
            char c = texto.charAt(i);
            char cUpper = Character.toUpperCase(c);
            int indexTexto = alfabetoActual.indexOf(cUpper);

            if (indexTexto != -1) {
                // Obtener el carácter de la clave correspondiente de forma cíclica
                char charClave = claveLimpia.charAt(j % claveLimpia.length());
                int indexClave = alfabetoActual.indexOf(charClave);

                int nuevoIndex;
                if ("DESCIFRAR".equalsIgnoreCase(operacion)) {
                    // C_i = (P_i - K_i) mod L
                    nuevoIndex = (indexTexto - indexClave + modulo) % modulo;
                } else {
                    // C_i = (P_i + K_i) mod L
                    nuevoIndex = (indexTexto + indexClave) % modulo;
                }

                char cifrado = alfabetoActual.charAt(nuevoIndex);
                // Preservar minúsculas/mayúsculas
                resultado.append(Character.isLowerCase(c) ? Character.toLowerCase(cifrado) : cifrado);
                j++; // Solo se avanza la clave si el carácter fue cifrado
            } else {
                resultado.append(c); // Símbolos, números y espacios pasan intactos
            }
        }

        return resultado.toString();
    }

    /**
     * Determina el alfabeto a utilizar según la configuración del usuario.
     */
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

    /**
     * Limpia el alfabeto personalizado extrayendo solo letras únicas e ignorando duplicados.
     */
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

    /**
     * Filtra la clave para conservar únicamente caracteres pertenecientes al alfabeto seleccionado.
     */
    private String limpiarClave(String clave, String alfabeto) {
        StringBuilder limpia = new StringBuilder();

        for (char c : clave.toUpperCase().toCharArray()) {
            if (alfabeto.indexOf(c) != -1) {
                limpia.append(c);
            }
        }

        return limpia.toString();
    }
}