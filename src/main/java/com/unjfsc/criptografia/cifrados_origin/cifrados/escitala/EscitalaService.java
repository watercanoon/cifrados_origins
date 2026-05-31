package com.unjfsc.criptografia.cifrados_origin.cifrados.escitala;

import org.springframework.stereotype.Service;

@Service
public class EscitalaService {

    public String cifrar(String texto, int carasBaston) {
        texto = texto.replace(" ", "").toUpperCase();

        StringBuilder textoModificado = new StringBuilder(texto);
        while (textoModificado.length() % carasBaston != 0) {
            textoModificado.append("X");
        }

        int filas = textoModificado.length() / carasBaston;
        StringBuilder resultado = new StringBuilder();

        for (int i = 0; i < carasBaston; i++) {
            for (int j = 0; j < filas; j++) {
                resultado.append(textoModificado.charAt(j * carasBaston + i));
            }
        }
        return resultado.toString();
    }

    public String descifrar(String texto, int carasBaston) {
        int filas = texto.length() / carasBaston;
        StringBuilder resultado = new StringBuilder();

        for (int i = 0; i < filas; i++) {
            for (int j = 0; j < carasBaston; j++) {
                resultado.append(texto.charAt(j * filas + i));
            }
        }

        return resultado.toString().replaceAll("X+$", "");
    }
}