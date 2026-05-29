package com.unjfsc.criptografia.cifrados_origin.cifrados.rot13;

import org.springframework.stereotype.Service;

@Service
public class Rot13Service {

    private static final String ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final int DESPLAZAMIENTO_ROT13 = 13;

    public String procesarRot13(String texto, String operacion, String idioma) {
        if (texto == null || texto.isBlank()) {
            return "";
        }

        StringBuilder resultado = new StringBuilder();
        String textoNormalizado = texto.toUpperCase();
        String alfabetoUsado = "ES".equalsIgnoreCase(idioma) ? ALFABETO_ES : ALFABETO_EN;
        boolean descifrar = "DESCIFRAR".equalsIgnoreCase(operacion);

        for (int i = 0; i < textoNormalizado.length(); i++) {
            char caracter = textoNormalizado.charAt(i);
            int posicionActual = alfabetoUsado.indexOf(caracter);

            if (posicionActual == -1) {
                resultado.append(caracter);
                continue;
            }

            int desplazamiento = descifrar ? -DESPLAZAMIENTO_ROT13 : DESPLAZAMIENTO_ROT13;
            int nuevaPosicion = Math.floorMod(posicionActual + desplazamiento, alfabetoUsado.length());
            resultado.append(alfabetoUsado.charAt(nuevaPosicion));
        }

        return resultado.toString();
    }
}
