package com.unjfsc.criptografia.cifrados_origin.cifrados.polybios;

import org.springframework.stereotype.Service;

@Service
public class PolybiosService {

    // Matriz base de 5x5 (25 letras exactas, sin J y sin Ñ)
    private static final String ALFABETO_BASE = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

    public String procesarPolybios(String texto, String operacion, String idioma) {
        if (texto == null || texto.isBlank()) return "";

        texto = texto.toUpperCase();

        // Regla Universal: J siempre se convierte en I
        texto = texto.replace("J", "I");

        // Regla para Español: Ñ se convierte en N
        if ("ES".equalsIgnoreCase(idioma)) {
            texto = texto.replace("Ñ", "N");
        }

        StringBuilder resultado = new StringBuilder();

        if ("CIFRAR".equalsIgnoreCase(operacion)) {
            for (int i = 0; i < texto.length(); i++) {
                char caracter = texto.charAt(i);
                int index = ALFABETO_BASE.indexOf(caracter);

                if (index != -1) {
                    // Cálculo de coordenadas en matriz 5x5
                    int fila = (index / 5) + 1;
                    int columna = (index % 5) + 1;
                    resultado.append(fila).append(columna).append(" ");
                } else if (caracter != ' ') {
                    // Opcional: mantener números o símbolos especiales
                    resultado.append(caracter).append(" ");
                }
            }
        } else {
            // Lógica de DESCIFRADO
            String[] pares = texto.trim().split("\\s+");
            for (String par : pares) {
                try {
                    // Validar que el par sean dos números del 1 al 5
                    if (par.length() == 2 && par.matches("[1-5]{2}")) {
                        int fila = Character.getNumericValue(par.charAt(0)) - 1;
                        int columna = Character.getNumericValue(par.charAt(1)) - 1;
                        int index = (fila * 5) + columna;
                        resultado.append(ALFABETO_BASE.charAt(index));
                    } else {
                        resultado.append(par); // Mantener caracteres especiales no procesables
                    }
                } catch (Exception e) {
                    resultado.append("?"); // Indicador de error de formato
                }
            }
        }

        return resultado.toString().trim();
    }
}