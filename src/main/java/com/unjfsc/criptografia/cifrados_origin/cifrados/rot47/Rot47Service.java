package com.unjfsc.criptografia.cifrados_origin.cifrados.rot47;

import org.springframework.stereotype.Service;

@Service
public class Rot47Service {

    public String procesar(String texto, String operacion) {

        if (texto == null || texto.isEmpty()) return "";

        return rot47(texto);
    }

    private String rot47(String input) {

        StringBuilder output = new StringBuilder();

        for (char c : input.toCharArray()) {

            if (c >= 33 && c <= 126) {
                output.append((char) (33 + ((c + 14) % 94)));
            } else {
                output.append(c);
            }
        }

        return output.toString();
    }
}