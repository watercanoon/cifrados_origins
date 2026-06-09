package com.unjfsc.criptografia.cifrados_origin.cifrados.alberti;

import org.springframework.stereotype.Service;

@Service
public class AlbertiService {

    private final String ALFABETO_EXTERIOR = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    private final String ALFABETO_INTERIOR = "cdefghijkmnñopqrstuvwxyzab"; // Minúsculas clásicas de Alberti

    public String cifrar(String texto, int giro) {
        if (texto == null) return "";
        StringBuilder resultado = new StringBuilder();
        String txt = texto.toUpperCase();

        for (char c : txt.toCharArray()) {
            int idxExt = ALFABETO_EXTERIOR.indexOf(c);
            if (idxExt != -1) {
                // Calcular la posición desplazada en el anillo interior
                int idxInt = (idxExt + giro) % ALFABETO_INTERIOR.length();
                resultado.append(ALFABETO_INTERIOR.charAt(idxInt));
            } else {
                resultado.append(c); // Pasa intacto espacios y caracteres especiales
            }
        }
        return resultado.toString();
    }

    public String descifrar(String texto, int giro) {
        if (texto == null) return "";
        StringBuilder resultado = new StringBuilder();
        String txt = texto.toLowerCase();

        for (char c : txt.toCharArray()) {
            int idxInt = ALFABETO_INTERIOR.indexOf(c);
            if (idxInt != -1) {
                // Deshacer el giro para buscar el carácter original exterior
                int idxExt = (idxInt - giro) % ALFABETO_EXTERIOR.length();
                if (idxExt < 0) idxExt += ALFABETO_EXTERIOR.length();
                resultado.append(ALFABETO_EXTERIOR.charAt(idxExt));
            } else {
                resultado.append(c);
            }
        }
        return resultado.toString();
    }
}