package com.unjfsc.criptografia.cifrados_origin.cifrados.hill;

import org.springframework.stereotype.Service;

@Service
public class HillService {

    private static final String ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"; // 27 letras
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";   // 26 letras

    public String procesarHill(String texto, String clave, String operacion, String idioma, String alfabetoCustom) {
        if (texto == null || texto.trim().isEmpty()) {
            throw new IllegalArgumentException("El texto a procesar no puede estar vacío.");
        }
        if (clave == null || clave.isBlank()) clave = "FORTALEZA"; // Clave por defecto de la guía (9 letras)
        if (idioma == null || idioma.isBlank()) idioma = "ES";

        // 1. Obtener alfabeto
        String alfabeto = obtenerAlfabeto(idioma, alfabetoCustom);
        int m = alfabeto.length();

        // 2. Determinar dimensión del bloque (m x m)
        int keyLen = clave.length();
        int dim = (int) Math.sqrt(keyLen);
        if (dim * dim != keyLen) {
            throw new IllegalArgumentException("La longitud de la clave debe ser un cuadrado perfecto (4, 9, 16, 25...).");
        }

        // 3. Generar la matriz clave numérica
        int[][] keyMatrix = generateKeyMatrix(clave, dim, alfabeto);

        // 4. Verificar si es invertible en módulo m
        int det = determinant(keyMatrix, dim);
        int detMod = (det % m + m) % m;
        int invDet = modInverse(detMod, m);
        if (invDet == -1) {
            throw new IllegalArgumentException("La matriz de la clave no es invertible en módulo " + m + " (determinante: " + detMod + "). Intente con otra clave.");
        }

        boolean cifrar = !"DESCIFRAR".equalsIgnoreCase(operacion);

        if (cifrar) {
            return encrypt(texto, keyMatrix, dim, alfabeto);
        } else {
            return decrypt(texto, keyMatrix, dim, alfabeto);
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
        return ALFABETO_ES; // Por defecto Español (27)
    }

    private int[][] generateKeyMatrix(String clave, int dim, String alfabeto) {
        int[][] matrix = new int[dim][dim];
        String cleanedKey = cleanAndNormalize(clave, alfabeto);
        
        // Si la clave limpia es más corta que la dimensión requerida, la rellenamos con la primera letra del alfabeto
        if (cleanedKey.length() < dim * dim) {
            StringBuilder sb = new StringBuilder(cleanedKey);
            while (sb.length() < dim * dim) {
                sb.append(alfabeto.charAt(0));
            }
            cleanedKey = sb.toString();
        }

        int index = 0;
        for (int r = 0; r < dim; r++) {
            for (int c = 0; c < dim; c++) {
                char ch = cleanedKey.charAt(index++);
                matrix[r][c] = alfabeto.indexOf(ch);
            }
        }
        return matrix;
    }

    private String cleanAndNormalize(String text, String alfabeto) {
        if (text == null) return "";
        StringBuilder sb = new StringBuilder();
        for (char c : text.toUpperCase().toCharArray()) {
            if (alfabeto.indexOf(c) != -1) {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private String encrypt(String text, int[][] keyMatrix, int dim, String alfabeto) {
        String cleaned = cleanAndNormalize(text, alfabeto);
        if (cleaned.isEmpty()) return "";

        // Rellenar con la última letra del alfabeto (o 'X') hasta que sea múltiplo de dim
        StringBuilder sb = new StringBuilder(cleaned);
        char fillChar = alfabeto.contains("X") ? 'X' : alfabeto.charAt(alfabeto.length() - 1);
        while (sb.length() % dim != 0) {
            sb.append(fillChar);
        }
        String padded = sb.toString();

        StringBuilder result = new StringBuilder();
        int m = alfabeto.length();

        for (int i = 0; i < padded.length(); i += dim) {
            int[] vector = new int[dim];
            for (int j = 0; j < dim; j++) {
                vector[j] = alfabeto.indexOf(padded.charAt(i + j));
            }

            int[] cipheredVector = multiplyMatrixVector(keyMatrix, vector, dim, m);
            
            if (i > 0) result.append(" ");
            for (int j = 0; j < dim; j++) {
                result.append(alfabeto.charAt(cipheredVector[j]));
            }
        }

        return result.toString();
    }

    private String decrypt(String text, int[][] keyMatrix, int dim, String alfabeto) {
        String cleaned = cleanAndNormalize(text, alfabeto);
        if (cleaned.isEmpty()) return "";

        int m = alfabeto.length();

        // Rellenar hasta múltiplo de dim si no lo es
        StringBuilder sb = new StringBuilder(cleaned);
        char fillChar = alfabeto.contains("X") ? 'X' : alfabeto.charAt(alfabeto.length() - 1);
        while (sb.length() % dim != 0) {
            sb.append(fillChar);
        }
        String padded = sb.toString();

        // Calcular la matriz inversa en aritmética modular m
        int[][] invMatrix = invertMatrix(keyMatrix, dim, m);
        if (invMatrix == null) {
            throw new IllegalArgumentException("La matriz clave no es invertible. No se puede descifrar.");
        }

        StringBuilder result = new StringBuilder();

        for (int i = 0; i < padded.length(); i += dim) {
            int[] vector = new int[dim];
            for (int j = 0; j < dim; j++) {
                vector[j] = alfabeto.indexOf(padded.charAt(i + j));
            }

            int[] plainVector = multiplyMatrixVector(invMatrix, vector, dim, m);

            for (int j = 0; j < dim; j++) {
                result.append(alfabeto.charAt(plainVector[j]));
            }
        }

        return result.toString();
    }

    private int[] multiplyMatrixVector(int[][] matrix, int[] vector, int dim, int m) {
        int[] result = new int[dim];
        for (int i = 0; i < dim; i++) {
            int sum = 0;
            for (int j = 0; j < dim; j++) {
                sum += matrix[i][j] * vector[j];
            }
            result[i] = (sum % m + m) % m;
        }
        return result;
    }

    // --- Funciones auxiliares de Álgebra Lineal Modular ---

    private int determinant(int[][] matrix, int n) {
        if (n == 1) return matrix[0][0];
        if (n == 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

        int det = 0;
        int[][] temp = new int[n][n];
        int sign = 1;

        for (int f = 0; f < n; f++) {
            getCofactor(matrix, temp, 0, f, n);
            det += sign * matrix[0][f] * determinant(temp, n - 1);
            sign = -sign;
        }
        return det;
    }

    private void getCofactor(int[][] matrix, int[][] temp, int p, int q, int n) {
        int i = 0, j = 0;
        for (int row = 0; row < n; row++) {
            for (int col = 0; col < n; col++) {
                if (row != p && col != q) {
                    temp[i][j++] = matrix[row][col];
                    if (j == n - 1) {
                        j = 0;
                        i++;
                    }
                }
            }
        }
    }

    private int modInverse(int a, int m) {
        a = (a % m + m) % m;
        for (int x = 1; x < m; x++) {
            if ((a * x) % m == 1) {
                return x;
            }
        }
        return -1;
    }

    private int[][] adjugate(int[][] matrix, int n, int m) {
        int[][] adj = new int[n][n];
        if (n == 1) {
            adj[0][0] = 1;
            return adj;
        }
        int sign;
        int[][] temp = new int[n][n];

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                getCofactor(matrix, temp, i, j, n);
                sign = ((i + j) % 2 == 0) ? 1 : -1;
                int cofactor = (sign * determinant(temp, n - 1)) % m;
                adj[j][i] = (cofactor + m) % m; // Transponer al guardar en adj[j][i]
            }
        }
        return adj;
    }

    private int[][] invertMatrix(int[][] matrix, int n, int m) {
        int det = determinant(matrix, n);
        int detMod = (det % m + m) % m;
        int invDet = modInverse(detMod, m);
        if (invDet == -1) return null;

        int[][] adj = adjugate(matrix, n, m);
        int[][] inv = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                inv[i][j] = (adj[i][j] * invDet) % m;
                if (inv[i][j] < 0) {
                    inv[i][j] += m;
                }
            }
        }
        return inv;
    }
}
