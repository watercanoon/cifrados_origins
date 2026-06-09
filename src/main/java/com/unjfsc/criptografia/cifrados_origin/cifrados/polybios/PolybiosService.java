package com.unjfsc.criptografia.cifrados_origin.cifrados.polybios;

import org.springframework.stereotype.Service;

@Service
public class PolybiosService {

    private static final String ALFABETO_BASE = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

    public String procesarPolybios(String texto, String operacion, String clave, String idioma) {
        if (texto == null || texto.isBlank()) return "";

        String matrizPolybios = generarMatriz(clave, idioma);
        StringBuilder resultado = new StringBuilder();

        if ("CIFRAR".equalsIgnoreCase(operacion)) {
            texto = texto.toUpperCase().replace("J", "I");
            if ("ES".equalsIgnoreCase(idioma)) {
                texto = texto.replace("Ñ", "N");
            }
            texto = texto.replaceAll("[^A-Z]", "");

            for (char caracter : texto.toCharArray()) {
                int index = matrizPolybios.indexOf(caracter);
                if (index != -1) {
                    int fila = (index / 5) + 1;
                    int columna = (index % 5) + 1;
                    resultado.append(fila).append(columna);
                }
            }
        } else {
            String coordenadasLimpias = texto.replaceAll("[^1-5]", "");
            for (int i = 0; i < coordenadasLimpias.length() - 1; i += 2) {
                int fila = Character.getNumericValue(coordenadasLimpias.charAt(i)) - 1;
                int columna = Character.getNumericValue(coordenadasLimpias.charAt(i + 1)) - 1;
                int index = (fila * 5) + columna;
                resultado.append(matrizPolybios.charAt(index));
            }
        }

        return resultado.toString();
    }

    private String generarMatriz(String clave, String idioma) {
        StringBuilder matriz = new StringBuilder();

        if (clave != null && !clave.isBlank()) {
            String claveLimpia = clave.toUpperCase().replace("J", "I");
            if ("ES".equalsIgnoreCase(idioma)) {
                claveLimpia = claveLimpia.replace("Ñ", "N");
            }
            claveLimpia = claveLimpia.replaceAll("[^A-Z]", "");

            for (char c : claveLimpia.toCharArray()) {
                if (matriz.indexOf(String.valueOf(c)) == -1) {
                    matriz.append(c);
                }
            }
        }

        for (char c : ALFABETO_BASE.toCharArray()) {
            if (matriz.indexOf(String.valueOf(c)) == -1) {
                matriz.append(c);
            }
        }

        return matriz.toString();
    }
}