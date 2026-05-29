package com.unjfsc.criptografia.cifrados_origin.cifrados.cesar;

import org.springframework.stereotype.Service;

@Service
public class CesarService {

    private static final String ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public String procesarCesar(String texto, int desplazamiento, String operacion, String idioma) {
        if (texto == null || texto.isBlank()) {
            return "";
        }

        StringBuilder resultado = new StringBuilder();
        String textoNormalizado = texto.toUpperCase();
        String alfabetoUsado = "EN".equalsIgnoreCase(idioma) ? ALFABETO_EN : ALFABETO_ES;
        int modulo = alfabetoUsado.length();
        int desplazamientoNormalizado = Math.floorMod(desplazamiento, modulo);
        boolean cifrar = !"DESCIFRAR".equalsIgnoreCase(operacion);

        for (int i = 0; i < textoNormalizado.length(); i++) {
            char caracter = textoNormalizado.charAt(i);
            int posicionActual = alfabetoUsado.indexOf(caracter);

            if (posicionActual == -1) {
                resultado.append(caracter);
                continue;
            }

            int nuevaPosicion = cifrar
                    ? Math.floorMod(posicionActual + desplazamientoNormalizado, modulo)
                    : Math.floorMod(posicionActual - desplazamientoNormalizado, modulo);
            resultado.append(alfabetoUsado.charAt(nuevaPosicion));
        }

        return resultado.toString();
    }
}
