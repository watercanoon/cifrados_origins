package com.unjfsc.criptografia.cifrados_origin.cifrados.atbash;

import org.springframework.stereotype.Service;

@Service
public class AtbashService {

    private static final String ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public String procesarAtbash(String texto, String idioma) {

        if (texto == null) return "";

        String alfabeto = idioma != null && idioma.equalsIgnoreCase("EN")
                ? ALFABETO_EN
                : ALFABETO_ES;

        StringBuilder resultado = new StringBuilder();

        for (char c : texto.toCharArray()) {

            char upper = Character.toUpperCase(c);
            int index = alfabeto.indexOf(upper);

            if (index != -1) {
                int inverso = alfabeto.length() - 1 - index;
                char nuevo = alfabeto.charAt(inverso);

                // mantener mayúscula/minúscula
                if (Character.isLowerCase(c)) {
                    resultado.append(Character.toLowerCase(nuevo));
                } else {
                    resultado.append(nuevo);
                }

            } else {
                resultado.append(c);
            }
        }

        return resultado.toString();
    }
}