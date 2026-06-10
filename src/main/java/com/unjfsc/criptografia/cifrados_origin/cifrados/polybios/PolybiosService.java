package com.unjfsc.criptografia.cifrados_origin.cifrados.polybios;

import org.springframework.stereotype.Service;

@Service
public class PolybiosService {

    private static final String ALFABETO_BASE = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

    public String procesarPolybios(String texto, String operacion, String idioma) {
        if (texto == null || texto.isBlank()) {
            return "";
        }

        String matrizPolybios = generarMatriz();
        StringBuilder resultado = new StringBuilder();

        if ("CIFRAR".equalsIgnoreCase(operacion)) {
            String textoLimpio = normalizarTexto(texto).replaceAll("[^A-Z]", "");

            for (char caracter : textoLimpio.toCharArray()) {
                int index = matrizPolybios.indexOf(caracter);

                if (index != -1) {
                    int fila = (index / 5) + 1;
                    int columna = (index % 5) + 1;

                    if (!resultado.isEmpty()) {
                        resultado.append(" ");
                    }

                    resultado.append(fila).append(columna);
                }
            }
        } else {
            String coordenadasLimpias = texto.replaceAll("[^1-5]", "");

            for (int i = 0; i < coordenadasLimpias.length() - 1; i += 2) {
                int fila = Character.getNumericValue(coordenadasLimpias.charAt(i)) - 1;
                int columna = Character.getNumericValue(coordenadasLimpias.charAt(i + 1)) - 1;
                int index = (fila * 5) + columna;

                if (index >= 0 && index < matrizPolybios.length()) {
                    resultado.append(matrizPolybios.charAt(index));
                }
            }
        }

        return resultado.toString();
    }

    private String generarMatriz() {
        return ALFABETO_BASE;
    }

    private String normalizarTexto(String valor) {
        return valor.toUpperCase()
                .replace('J', 'I')
                .replace('\u00d1', 'N');
    }
}
