package com.unjfsc.criptografia.cifrados_origin.cifrados.escitala;

import org.springframework.stereotype.Service;

@Service
public class EscitalaService {

    public String procesarEscitala(String texto, int columnas, String operacion) {
        if (columnas <= 1 || texto.length() <= 1) {
            return texto; // No hay transposición posible
        }

        // Para evitar problemas con los espacios en la transposición, se recomienda mantenerlos
        // o rellenar la matriz. Optaremos por la transposición matemática directa.
        int longitud = texto.length();
        int filas = (int) Math.ceil((double) longitud / columnas);
        StringBuilder resultado = new StringBuilder();

        if ("CIFRAR".equalsIgnoreCase(operacion)) {
            // Cifrar: Leemos por columnas
            for (int c = 0; c < columnas; c++) {
                for (int f = 0; f < filas; f++) {
                    int index = f * columnas + c;
                    if (index < longitud) {
                        resultado.append(texto.charAt(index));
                    }
                }
            }
        } else {
            // Descifrar: Reconstruimos la matriz original
            // Calculamos cuántas celdas vacías quedarían en la última fila
            int celdasVacias = (filas * columnas) - longitud;
            int columnasCompletas = columnas - celdasVacias;

            int index = 0;
            char[][] matriz = new char[filas][columnas];

            for (int c = 0; c < columnas; c++) {
                // Si la columna actual está en la zona de "celdas vacías", tiene una fila menos
                int limiteFilas = (c < columnasCompletas) ? filas : filas - 1;
                for (int f = 0; f < limiteFilas; f++) {
                    if (index < longitud) {
                        matriz[f][c] = texto.charAt(index++);
                    }
                }
            }

            // Leemos por filas para reconstruir el texto
            for (int f = 0; f < filas; f++) {
                for (int c = 0; c < columnas; c++) {
                    // Evitamos leer posiciones nulas (carácter por defecto '\u0000')
                    if (matriz[f][c] != '\u0000') {
                        resultado.append(matriz[f][c]);
                    }
                }
            }
        }

        return resultado.toString();
    }
}