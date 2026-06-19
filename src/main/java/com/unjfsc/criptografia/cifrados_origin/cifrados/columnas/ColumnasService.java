package com.unjfsc.criptografia.cifrados_origin.cifrados.columnas;

import org.springframework.stereotype.Service;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class ColumnasService {

    private static final String ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public String procesarColumnas(String texto, String clave, String operacion, String tipo, String idioma, String alfabetoCustom) {
        // 🛡️ VALIDACIÓN
        if (texto == null || texto.trim().isEmpty()) {
            throw new IllegalArgumentException("El texto a procesar no puede estar vacío.");
        }
        if (tipo == null || tipo.isBlank()) tipo = "SIMPLE";

        String alfabeto = obtenerAlfabeto(idioma, alfabetoCustom);

        // 2. Determinar número de columnas y validar clave
        int numCols;
        String claveLimpia = "";

        if ("SIMPLE".equalsIgnoreCase(tipo)) {
            if (clave == null || clave.isBlank()) clave = "7"; // Valor por defecto
            try {
                numCols = Integer.parseInt(clave.trim());
                if (numCols < 2 || numCols > 30) {
                    throw new IllegalArgumentException("El número de columnas debe estar entre 2 y 30.");
                }
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("La clave en modo simple debe ser un número entero válido.");
            }
        } else {
            // Modo CLAVE
            if (clave == null || clave.isBlank()) clave = "PERICO"; // Clave por defecto de la guía
            claveLimpia = cleanAndNormalize(clave, alfabeto);
            if (claveLimpia.isEmpty()) {
                throw new IllegalArgumentException("La palabra clave debe contener caracteres alfabéticos válidos para el alfabeto seleccionado.");
            }
            // Validar que no contenga letras repetidas
            if (hasDuplicates(claveLimpia)) {
                throw new IllegalArgumentException("La palabra clave no debe contener letras repetidas.");
            }
            numCols = claveLimpia.length();
        }

        boolean cifrar = !"DESCIFRAR".equalsIgnoreCase(operacion);

        if (cifrar) {
            return encrypt(texto, claveLimpia, tipo, numCols, alfabeto);
        } else {
            return decrypt(texto, claveLimpia, tipo, numCols, alfabeto);
        }
    }

    private String obtenerAlfabeto(String idioma, String alfabetoCustom) {
        if ("CUSTOM".equalsIgnoreCase(idioma) && alfabetoCustom != null && !alfabetoCustom.isEmpty()) {
            // Eliminar caracteres duplicados para el alfabeto personalizado
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
        
        // 1. Convertir a mayúsculas
        String upper = text.toUpperCase();
        
        // 2. Reemplazar vocales acentuadas por vocales sin acento para no afectar la Ñ
        upper = upper.replace('Á', 'A')
                     .replace('É', 'E')
                     .replace('Í', 'I')
                     .replace('Ó', 'O')
                     .replace('Ú', 'U')
                     .replace('Ü', 'U');
        
        // 3. Si el alfabeto no incluye la Ñ pero sí incluye la N, reemplazar la Ñ por N
        if (alfabeto.indexOf('Ñ') == -1 && alfabeto.indexOf('N') != -1) {
            upper = upper.replace('Ñ', 'N');
        }
        
        // 4. Filtrar manteniendo únicamente caracteres presentes en el alfabeto activo
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

    private int[] obtenerOrdenColumnas(String clave, String tipo, int numCols, String alfabeto) {
        if ("SIMPLE".equalsIgnoreCase(tipo)) {
            int[] order = new int[numCols];
            for (int i = 0; i < numCols; i++) {
                order[i] = i;
            }
            return order;
        }

        // Modo con Clave
        int n = clave.length();
        int[] order = new int[n];

        // Par auxiliar para ordenar alfabéticamente conservando estabilidad según el alfabeto
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

    private String encrypt(String text, String clave, String tipo, int numCols, String alfabeto) {
        String cleaned = cleanAndNormalize(text, alfabeto);
        if (cleaned.isEmpty()) return "";

        // Calcular número de filas necesarias
        int numRows = (cleaned.length() + numCols - 1) / numCols;
        char[][] grid = new char[numRows][numCols];

        // Determinar el caracter de relleno (usar 'X' si está en el alfabeto, de lo contrario el último caracter del alfabeto)
        char paddingChar = alfabeto.contains("X") ? 'X' : (alfabeto.isEmpty() ? 'X' : alfabeto.charAt(alfabeto.length() - 1));

        // Llenar la matriz horizontalmente, rellenando con paddingChar las celdas vacías
        int textIndex = 0;
        for (int r = 0; r < numRows; r++) {
            for (int c = 0; c < numCols; c++) {
                if (textIndex < cleaned.length()) {
                    grid[r][c] = cleaned.charAt(textIndex++);
                } else {
                    grid[r][c] = paddingChar;
                }
            }
        }

        // Obtener el orden de lectura de las columnas
        int[] order = obtenerOrdenColumnas(clave, tipo, numCols, alfabeto);

        // Leer verticalmente por columnas en base al orden prioritario
        StringBuilder cripto = new StringBuilder();
        for (int colIndex : order) {
            for (int r = 0; r < numRows; r++) {
                cripto.append(grid[r][colIndex]);
            }
        }

        return cripto.toString();
    }

    private String decrypt(String text, String clave, String tipo, int numCols, String alfabeto) {
        String cleaned = cleanAndNormalize(text, alfabeto);
        if (cleaned.isEmpty()) return "";

        // Validar que la longitud sea múltiplo del número de columnas
        if (cleaned.length() % numCols != 0) {
            throw new IllegalArgumentException("La longitud del texto cifrado (" + cleaned.length() + ") debe ser un múltiplo de las columnas (" + numCols + ").");
        }

        int numRows = cleaned.length() / numCols;
        char[][] grid = new char[numRows][numCols];

        // Obtener el orden de lectura
        int[] order = obtenerOrdenColumnas(clave, tipo, numCols, alfabeto);

        // Llenar la matriz verticalmente según el orden prioritario
        int textIndex = 0;
        for (int colIndex : order) {
            for (int r = 0; r < numRows; r++) {
                grid[r][colIndex] = cleaned.charAt(textIndex++);
            }
        }

        // Leer la matriz horizontalmente (por filas)
        StringBuilder plain = new StringBuilder();
        for (int r = 0; r < numRows; r++) {
            for (int c = 0; c < numCols; c++) {
                plain.append(grid[r][c]);
            }
        }

        return plain.toString();
    }
}
