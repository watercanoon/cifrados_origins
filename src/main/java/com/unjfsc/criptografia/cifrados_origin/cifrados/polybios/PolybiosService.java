package com.unjfsc.criptografia.cifrados_origin.cifrados.polybios;

import org.springframework.stereotype.Service;

/**
 * Servicio para el cifrado y descifrado utilizando el método de la Cuadrícula de Polibio (Polybios).
 * Este cifrado de sustitución fraccionaria asocia cada letra del alfabeto con sus coordenadas
 * (fila y columna) dentro de una cuadrícula o matriz de 5x5.
 */
@Service
public class PolybiosService {

    // Alfabeto base de 25 caracteres (se omite la 'J' para encajar en una matriz de 5x5, reemplazándola por 'I')
    private static final String ALFABETO_BASE = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

    /**
     * Procesa el texto aplicando el cifrado o descifrado de Polibio según los parámetros.
     *
     * @param texto           El texto de entrada (letras a cifrar o coordenadas a descifrar).
     * @param operacion       La operación a realizar ("CIFRAR" o "DESCIFRAR").
     * @param idioma          El idioma del cifrado (opcional/reservado).
     * @param tipoCoordenadas El formato de salida/entrada de las coordenadas ("LETRA" o "NUM").
     * @return El texto procesado resultante.
     */
    public String procesarPolybios(String texto, String operacion, String idioma, String tipoCoordenadas) {
        // Validación de entrada
        if (texto == null || texto.trim().isEmpty()) {
            throw new IllegalArgumentException("El texto a procesar no puede estar vacío.");
        }

        String matrizPolybios = generarMatriz();
        StringBuilder resultado = new StringBuilder();
        String coordType = tipoCoordenadas != null ? tipoCoordenadas.toUpperCase() : "NUM";

        if ("CIFRAR".equalsIgnoreCase(operacion)) {
            // Normalizar texto eliminando caracteres no pertenecientes al alfabeto A-Z
            String textoLimpio = normalizarTexto(texto).replaceAll("[^A-Z]", "");

            for (char caracter : textoLimpio.toCharArray()) {
                int index = matrizPolybios.indexOf(caracter);

                if (index != -1) {
                    // Cálculo de fila y columna (1-indexed)
                    int fila = (index / 5) + 1;
                    int columna = (index % 5) + 1;

                    if (!resultado.isEmpty()) {
                        resultado.append(" ");
                    }

                    // Representar coordenadas con letras (A-E) o números (1-5)
                    if ("LETRA".equals(coordType)) {
                        char filaChar = (char) ('A' + fila - 1);
                        char colChar = (char) ('A' + columna - 1);
                        resultado.append(filaChar).append(colChar);
                    } else {
                        resultado.append(fila).append(columna);
                    }
                }
            }
        } else {
            String coordenadasLimpias;
            if ("LETRA".equals(coordType)) {
                // Filtrar solo letras válidas de coordenadas (A-E)
                coordenadasLimpias = texto.toUpperCase().replaceAll("[^A-E]", "");

                // Agrupar en parejas de fila y columna
                for (int i = 0; i < coordenadasLimpias.length() - 1; i += 2) {
                    int fila = coordenadasLimpias.charAt(i) - 'A';
                    int columna = coordenadasLimpias.charAt(i + 1) - 'A';
                    int index = (fila * 5) + columna;

                    if (index >= 0 && index < matrizPolybios.length()) {
                        resultado.append(matrizPolybios.charAt(index));
                    }
                }
            } else {
                // Filtrar solo números válidos de coordenadas (1-5)
                coordenadasLimpias = texto.replaceAll("[^1-5]", "");

                // Agrupar en parejas de fila y columna
                for (int i = 0; i < coordenadasLimpias.length() - 1; i += 2) {
                    int fila = Character.getNumericValue(coordenadasLimpias.charAt(i)) - 1;
                    int columna = Character.getNumericValue(coordenadasLimpias.charAt(i + 1)) - 1;
                    int index = (fila * 5) + columna;

                    if (index >= 0 && index < matrizPolybios.length()) {
                        resultado.append(matrizPolybios.charAt(index));
                    }
                }
            }
        }

        return resultado.toString();
    }

    /**
     * Genera la matriz/cuadrícula base de Polibio.
     * En este caso es una representación plana de 25 caracteres.
     */
    private String generarMatriz() {
        return ALFABETO_BASE;
    }

    /**
     * Normaliza el texto de entrada: convierte a mayúsculas, mapea 'J' a 'I' para encajar
     * en la matriz de 5x5, y mapea 'Ñ' a 'N'.
     */
    private String normalizarTexto(String valor) {
        return valor.toUpperCase()
                .replace('J', 'I')
                .replace('\u00d1', 'N');
    }
}

