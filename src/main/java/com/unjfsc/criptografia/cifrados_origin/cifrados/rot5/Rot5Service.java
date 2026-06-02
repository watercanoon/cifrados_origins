package com.unjfsc.criptografia.cifrados_origin.cifrados.rot5;

import org.springframework.stereotype.Service;

@Service
public class Rot5Service {

    private static final int DESPLAZAMIENTO_ROT5 = 5;

    public String procesarRot5(String texto) {
        if (texto == null || texto.isBlank()) {
            return "";
        }

        StringBuilder resultado = new StringBuilder();

        for (char caracter : texto.toCharArray()) {
            if (caracter >= '0' && caracter <= '9') {
                int digito = caracter - '0';
                int nuevoDigito = (digito + DESPLAZAMIENTO_ROT5) % 10;
                resultado.append(nuevoDigito);
            }
        }

        return resultado.toString();
    }
}
