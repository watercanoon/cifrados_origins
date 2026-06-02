package com.unjfsc.criptografia.cifrados_origin.cifrados.playfair;

import org.springframework.stereotype.Service;

@Service
public class PlayfairService {

    private static final String ALPHABET = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // La 'J' se une a la 'I'

    public String procesarPlayfair(String texto, String clave, String operacion) {
        if (texto == null || texto.isBlank()) return "";
        if (clave == null || clave.isBlank()) clave = "KEYWORD";

        System.out.println("\n========================================");
        System.out.println("Petición Recibida - Operación: " + operacion.toUpperCase());

        char[][] matrizDefecto = generateMatrix("");
        printMatrix(matrizDefecto, "CUADRO BASE (ALFABETO EN)");

        char[][] matrix = generateMatrix(clave);
        printMatrix(matrix, "CUADRO ACTUALIZADO CON '" + clave.toUpperCase() + "'");
        System.out.println("========================================\n");

        boolean cifrar = !"DESCIFRAR".equalsIgnoreCase(operacion);

        if (cifrar) {
            return encrypt(texto, matrix);
        } else {
            return decrypt(texto, matrix);
        }
    }

    private char[][] generateMatrix(String key) {
        char[][] matrix = new char[5][5];
        String cleanedKey = prepareString(key) + ALPHABET;
        StringBuilder uniqueChars = new StringBuilder();

        for (int i = 0; i < cleanedKey.length(); i++) {
            char c = cleanedKey.charAt(i);
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

    private String prepareString(String text) {
        text = text.toUpperCase().replace("J", "I");
        StringBuilder cleaned = new StringBuilder();
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (ALPHABET.indexOf(c) != -1) {
                cleaned.append(c);
            }
        }
        return cleaned.toString();
    }

    private String prepareTextPairs(String text) {
        StringBuilder cleaned = new StringBuilder(prepareString(text));
        StringBuilder paired = new StringBuilder();

        for (int i = 0; i < cleaned.length(); i += 2) {
            if (i == cleaned.length() - 1) {
                paired.append(cleaned.charAt(i)).append('X');
            } else if (cleaned.charAt(i) == cleaned.charAt(i + 1)) {
                paired.append(cleaned.charAt(i)).append('X');
                i--;
            } else {
                paired.append(cleaned.charAt(i)).append(cleaned.charAt(i + 1));
            }
        }
        return paired.toString();
    }

    private String encrypt(String text, char[][] matrix) {
        String pairedText = prepareTextPairs(text);
        return cipherProcess(pairedText, matrix, 1);
    }

    private String decrypt(String text, char[][] matrix) {
        String preparedText = prepareString(text);
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