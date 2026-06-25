package com.unjfsc.criptografia.cifrados_origin.cifrados.filas;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Servicio para el cifrado y descifrado utilizando el método de Transposición por Filas.
 * Reorganiza la posición de los caracteres del mensaje escribiéndolo verticalmente
 * columna por columna en una matriz y leyéndolo horizontalmente fila por fila
 * de acuerdo a la clave provista.
 */
@Service
public class FilasService {

    private static final String ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public String procesarFilas(String texto, String clave, String operacion, String tipo, String idioma, String alfabetoCustom) {
        // 🛡️ VALIDACIÓN
        if (texto == null || texto.trim().isEmpty()) {
            throw new IllegalArgumentException("El texto a procesar no puede estar vacío.");
        }
        if (tipo == null || tipo.isBlank()) tipo = "SIMPLE";

        String alfabeto = obtenerAlfabeto(idioma, alfabetoCustom);

        // 2. Determinar número de filas y validar clave
        int numRows;
        String claveLimpia = "";

        if ("SIMPLE".equalsIgnoreCase(tipo)) {
            if (clave == null || clave.isBlank()) clave = "4"; // Valor por defecto
            try {
                numRows = Integer.parseInt(clave.trim());
                if (numRows < 2 || numRows > 30) {
                    throw new IllegalArgumentException("El número de filas debe estar entre 2 y 30.");
                }
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("La clave en modo simple debe ser un número entero válido.");
            }
        } else {
            // Modo CLAVE
            if (clave == null || clave.isBlank()) clave = "SALUDO"; // Clave por defecto
            claveLimpia = cleanAndNormalize(clave, alfabeto);
            if (claveLimpia.isEmpty()) {
                throw new IllegalArgumentException("La palabra clave debe contener caracteres alfabéticos válidos para el alfabeto seleccionado.");
            }
            // Validar que no contenga letras repetidas
            if (hasDuplicates(claveLimpia)) {
                throw new IllegalArgumentException("La palabra clave no debe contener letras repetidas.");
            }
            numRows = claveLimpia.length();
        }

        boolean cifrar = !"DESCIFRAR".equalsIgnoreCase(operacion);

        if (cifrar) {
            return encrypt(texto, claveLimpia, tipo, numRows, alfabeto);
        } else {
            return decrypt(texto, claveLimpia, tipo, numRows, alfabeto);
        }
    }

    private String obtenerAlfabeto(String idioma, String alfabetoCustom) {
        if ("CUSTOM".equalsIgnoreCase(idioma) && alfabetoCustom != null && !alfabetoCustom.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (char c : alfabetoCustom.toUpperCase().toCharArray()) {
                if (sb.indexOf(String.valueOf(c)) == -1) {
                    sb.append(c);
                }
            }
            if (sb.length() < 2) {
                throw new IllegalArgumentException("El alfabeto personalizado debe tener al menos 2 caracteres únicos.");
            }
            return sb.toString();
        } else if ("EN".equalsIgnoreCase(idioma)) {
            return ALFABETO_EN;
        }
        return ALFABETO_ES; // Por defecto Español
    }

    private String cleanAndNormalize(String text, String alfabeto) {
        if (text == null) return "";
        
        String upper = text.toUpperCase();
        
        upper = upper.replace('Á', 'A')
                     .replace('É', 'E')
                     .replace('Í', 'I')
                     .replace('Ó', 'O')
                     .replace('Ú', 'U')
                     .replace('Ü', 'U');
        
        if (alfabeto.indexOf('Ñ') == -1 && alfabeto.indexOf('N') != -1) {
            upper = upper.replace('Ñ', 'N');
        }
        
        StringBuilder sb = new StringBuilder();
        for (char c : upper.toCharArray()) {
            if (alfabeto.indexOf(c) != -1) {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private boolean hasDuplicates(String word) {
        for (int i = 0; i < word.length(); i++) {
            char c = word.charAt(i);
            if (word.indexOf(c, i + 1) != -1) {
                return true;
            }
        }
        return false;
    }

    private int[] obtenerOrdenFilas(String clave, String tipo, int numRows, String alfabeto) {
        if ("SIMPLE".equalsIgnoreCase(tipo)) {
            int[] order = new int[numRows];
            for (int i = 0; i < numRows; i++) {
                order[i] = i;
            }
            return order;
        }

        // Modo con Clave
        int n = clave.length();
        int[] order = new int[n];

        class KeyChar implements Comparable<KeyChar> {
            char c;
            int originalIndex;
            int alphabetIndex;

            KeyChar(char c, int originalIndex, String alfabeto) {
                this.c = c;
                this.originalIndex = originalIndex;
                this.alphabetIndex = alfabeto.indexOf(c);
            }

            @Override
            public int compareTo(KeyChar o) {
                if (this.alphabetIndex != o.alphabetIndex) {
                    return Integer.compare(this.alphabetIndex, o.alphabetIndex);
                }
                return Integer.compare(this.originalIndex, o.originalIndex);
            }
        }

        List<KeyChar> list = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            list.add(new KeyChar(clave.charAt(i), i, alfabeto));
        }
        Collections.sort(list);

        for (int i = 0; i < n; i++) {
            order[i] = list.get(i).originalIndex;
        }
        return order;
    }

    private String encrypt(String text, String clave, String tipo, int numRows, String alfabeto) {
        String cleaned = cleanAndNormalize(text, alfabeto);
        if (cleaned.isEmpty()) return "";

        // Calcular columnas necesarias
        int numCols = (cleaned.length() + numRows - 1) / numRows;
        char[][] grid = new char[numRows][numCols];

        char paddingChar = alfabeto.contains("X") ? 'X' : (alfabeto.isEmpty() ? 'X' : alfabeto.charAt(alfabeto.length() - 1));

        // Llenar la matriz verticalmente (columna por columna)
        int textIndex = 0;
        for (int c = 0; c < numCols; c++) {
            for (int r = 0; r < numRows; r++) {
                if (textIndex < cleaned.length()) {
                    grid[r][c] = cleaned.charAt(textIndex++);
                } else {
                    grid[r][c] = paddingChar;
                }
            }
        }

        // Obtener el orden de lectura de las filas
        int[] order = obtenerOrdenFilas(clave, tipo, numRows, alfabeto);

        // Leer horizontalmente por filas en base al orden prioritario
        StringBuilder cripto = new StringBuilder();
        for (int rowIndex : order) {
            for (int c = 0; c < numCols; c++) {
                cripto.append(grid[rowIndex][c]);
            }
        }

        return cripto.toString();
    }

    private String decrypt(String text, String clave, String tipo, int numRows, String alfabeto) {
        String cleaned = cleanAndNormalize(text, alfabeto);
        if (cleaned.isEmpty()) return "";

        // Validar que la longitud sea múltiplo de las filas
        if (cleaned.length() % numRows != 0) {
            throw new IllegalArgumentException("La longitud del texto cifrado (" + cleaned.length() + ") debe ser un múltiplo de las filas (" + numRows + ").");
        }

        int numCols = cleaned.length() / numRows;
        char[][] grid = new char[numRows][numCols];

        // Obtener el orden de filas
        int[] order = obtenerOrdenFilas(clave, tipo, numRows, alfabeto);

        // Llenar la matriz horizontalmente en base al orden de lectura
        int textIndex = 0;
        for (int rowIndex : order) {
            for (int c = 0; c < numCols; c++) {
                grid[rowIndex][c] = cleaned.charAt(textIndex++);
            }
        }

        // Leer la matriz verticalmente (columna por columna)
        StringBuilder plain = new StringBuilder();
        for (int c = 0; c < numCols; c++) {
            for (int r = 0; r < numRows; r++) {
                plain.append(grid[r][c]);
            }
        }

        return plain.toString();
    }
}
