package com.unjfsc.criptografia.cifrados_origin.cifrados.escitala;

import org.springframework.stereotype.Service;

@Service
public class EscitalaService {

    public String procesarEscitala(String texto, int columnas, String operacion) {
        // 🛡️ VALIDACIONES
        if (texto == null || texto.trim().isEmpty()) {
            throw new IllegalArgumentException("El texto a procesar no puede estar vacío.");
        }
        if (columnas <= 1) {
            throw new IllegalArgumentException("El diámetro (número de caras) debe ser mayor a 1.");
        }

        String txtLimpio = texto.replaceAll("\\s+", "").toUpperCase();
        if (txtLimpio.isEmpty()) {
            throw new IllegalArgumentException("El texto no contiene caracteres válidos.");
        }

        if ("CIFRAR".equalsIgnoreCase(operacion)) {
            // Relleno con 'X' para que la longitud sea múltiplo de las columnas (diámetro)
            int longitudOriginal = txtLimpio.length();
            int resto = longitudOriginal % columnas;
            if (resto != 0) {
                int relleno = columnas - resto;
                txtLimpio = txtLimpio + "X".repeat(relleno);
            }

            int longitud = txtLimpio.length();
            int filas = longitud / columnas;
            StringBuilder resultado = new StringBuilder();

            // Cifrado físico: el texto se escribe en el bastón por columnas (longitudinalmente)
            // y se lee fila por fila (al desenrollar la cinta).
            for (int f = 0; f < filas; f++) {
                for (int c = 0; c < columnas; c++) {
                    // El carácter en la fila f, columna c proviene del índice c * filas + f
                    // en el texto original que se escribió columna por columna
                    int index = c * filas + f;
                    if (index < longitud) {
                        resultado.append(txtLimpio.charAt(index));
                    }
                }
            }
            return resultado.toString();

        } else {
            // Descifrado físico: la tira recibida (cifrada, leída por filas)
            // se enrolla en el bastón (se escribe fila por fila)
            // y se lee a lo largo de las caras (columna por columna).
            int longitud = txtLimpio.length();
            int filas = (int) Math.ceil((double) longitud / columnas);
            StringBuilder resultado = new StringBuilder();

            int celdasVacias = (filas * columnas) - longitud;
            int columnasCompletas = columnas - celdasVacias;

            char[][] matriz = new char[filas][columnas];
            int index = 0;

            // Se escribe la cinta fila por fila
            for (int f = 0; f < filas; f++) {
                int limiteColumnas = (f == filas - 1) ? columnasCompletas : columnas;
                for (int c = 0; c < limiteColumnas; c++) {
                    if (index < longitud) {
                        matriz[f][c] = txtLimpio.charAt(index++);
                    }
                }
            }

            // Se lee columna por columna (longitudinalmente)
            for (int c = 0; c < columnas; c++) {
                for (int f = 0; f < filas; f++) {
                    if (matriz[f][c] != '\u0000') {
                        resultado.append(matriz[f][c]);
                    }
                }
            }
            return resultado.toString();
        }
    }
}