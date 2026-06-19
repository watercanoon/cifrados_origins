package com.unjfsc.criptografia.cifrados_origin.cifrados.playfair;

import org.springframework.stereotype.Service;

@Service
public class PlayfairService {

    private static final String DEFAULT_ALPHABET = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

    public String procesarPlayfair(String texto, String clave, String operacion, String idioma, String alfabetoCustom) {
        if (texto == null || texto.trim().isEmpty()) {
            throw new IllegalArgumentException("El texto a procesar no puede estar vacío.");
        }
        if (clave == null || clave.isBlank()) clave = "KEYWORD";
        if (idioma == null || idioma.isBlank()) idioma = "ES";

        String baseAlphabet = determinarBaseAlphabet(idioma, alfabetoCustom);

        System.out.println("\n========================================");
        System.out.println("Petición Recibida - Operación: " + operacion.toUpperCase() + ", Idioma: " + idioma.toUpperCase());

        char[][] matrizDefecto = generateMatrix("", baseAlphabet, idioma);
        printMatrix(matrizDefecto, "CUADRO BASE (ALFABETO " + idioma.toUpperCase() + ")");

        char[][] matrix = generateMatrix(clave, baseAlphabet, idioma);
        printMatrix(matrix, "CUADRO ACTUALIZADO CON '" + clave.toUpperCase() + "'");
        System.out.println("========================================\n");

        boolean cifrar = !"DESCIFRAR".equalsIgnoreCase(operacion);

        if (cifrar) {
            return encrypt(texto, matrix, baseAlphabet, idioma);
        } else {
            return decrypt(texto, matrix, baseAlphabet, idioma);
        }
    }

    private String determinarBaseAlphabet(String idioma, String alfabetoCustom) {
        if ("CUSTOM".equalsIgnoreCase(idioma) && alfabetoCustom != null && !alfabetoCustom.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            String upperCustom = alfabetoCustom.toUpperCase().replace("J", "I");
            for (char c : upperCustom.toCharArray()) {
                if (c >= 'A' && c <= 'Z' && sb.indexOf(String.valueOf(c)) == -1) {
                    sb.append(c);
                }
            }
            for (char c : DEFAULT_ALPHABET.toCharArray()) {
                if (sb.length() >= 25) break;
                if (sb.indexOf(String.valueOf(c)) == -1) {
                    sb.append(c);
                }
            }
            return sb.toString();
        }
        return DEFAULT_ALPHABET;
    }

    private String normalizeString(String text, String idioma, String baseAlphabet) {
        if (text == null) return "";
        String normalized = text.toUpperCase().replace("J", "I");
        if ("ES".equalsIgnoreCase(idioma)) {
            normalized = normalized.replace("Ñ", "N");
        }
        StringBuilder cleaned = new StringBuilder();
        for (int i = 0; i < normalized.length(); i++) {
            char c = normalized.charAt(i);
            if (baseAlphabet.indexOf(c) != -1) {
                cleaned.append(c);
            }
        }
        return cleaned.toString();
    }

    private char[][] generateMatrix(String key, String baseAlphabet, String idioma) {
        char[][] matrix = new char[5][5];
        String normalizedKey = normalizeString(key, idioma, baseAlphabet);
        String combined = normalizedKey + baseAlphabet;
        StringBuilder uniqueChars = new StringBuilder();

        for (int i = 0; i < combined.length(); i++) {
            char c = combined.charAt(i);
            if (uniqueChars.indexOf(String.valueOf(c)) == -1) {
                uniqueChars.append(c);
            }
        }

        int index = 0;
        for (int row = 0; row < 5; row++) {
            for (int col = 0; col < 5; col++) {
                matrix[row][col] = uniqueChars.charAt(index++);
            }
        }
        return matrix;
    }

    private void printMatrix(char[][] matrix, String title) {
        System.out.println("--- " + title + " ---");
        for (int row = 0; row < 5; row++) {
            for (int col = 0; col < 5; col++) {
                System.out.print(matrix[row][col] + "  ");
            }
            System.out.println();
        }
    }

    private String prepareTextPairs(String text, String baseAlphabet, String idioma) {
        StringBuilder cleaned = new StringBuilder(normalizeString(text, idioma, baseAlphabet));
        StringBuilder paired = new StringBuilder();

        for (int i = 0; i < cleaned.length(); i += 2) {
            if (i == cleaned.length() - 1) {
                paired.append(cleaned.charAt(i)).append('X');
            } else if (cleaned.charAt(i) == cleaned.charAt(i + 1)) {
                char fillChar = (cleaned.charAt(i) == 'X') ? 'Q' : 'X';
                paired.append(cleaned.charAt(i)).append(fillChar);
                i--;
            } else {
                paired.append(cleaned.charAt(i)).append(cleaned.charAt(i + 1));
            }
        }
        return paired.toString();
    }

    private String encrypt(String text, char[][] matrix, String baseAlphabet, String idioma) {
        String pairedText = prepareTextPairs(text, baseAlphabet, idioma);
        String ciphered = cipherProcess(pairedText, matrix, 1);
        StringBuilder formatted = new StringBuilder();
        for (int i = 0; i < ciphered.length(); i += 2) {
            if (i > 0) formatted.append(" ");
            formatted.append(ciphered.substring(i, Math.min(i + 2, ciphered.length())));
        }
        return formatted.toString();
    }

    private String decrypt(String text, char[][] matrix, String baseAlphabet, String idioma) {
        String preparedText = normalizeString(text, idioma, baseAlphabet);
        if (preparedText.length() % 2 != 0) preparedText += "X";
        return cipherProcess(preparedText, matrix, 4);
    }

    private String cipherProcess(String text, char[][] matrix, int shift) {
        StringBuilder result = new StringBuilder();

        for (int i = 0; i < text.length(); i += 2) {
            char a = text.charAt(i);
            char b = text.charAt(i + 1);

            int[] posA = findPosition(a, matrix);
            int[] posB = findPosition(b, matrix);

            int rowA = posA[0], colA = posA[1];
            int rowB = posB[0], colB = posB[1];

            if (rowA == rowB) {
                result.append(matrix[rowA][(colA + shift) % 5]);
                result.append(matrix[rowB][(colB + shift) % 5]);
            } else if (colA == colB) {
                result.append(matrix[(rowA + shift) % 5][colA]);
                result.append(matrix[(rowB + shift) % 5][colB]);
            } else {
                result.append(matrix[rowA][colB]);
                result.append(matrix[rowB][colA]);
            }
        }
        return result.toString();
    }

    private int[] findPosition(char c, char[][] matrix) {
        for (int row = 0; row < 5; row++) {
            for (int col = 0; col < 5; col++) {
                if (matrix[row][col] == c) {
                    return new int[]{row, col};
                }
            }
        }
        return new int[]{0, 0};
    }
}