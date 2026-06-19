package com.unjfsc.criptografia.cifrados_origin.cifrados.alberti;

import org.springframework.stereotype.Service;

@Service
public class AlbertiService {

    // 1. Alfabetos ES (Longitud exacta: 27) - Se corrigió la 'l' faltante en el interior
    private static final String ES_EXT = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    private static final String ES_INT = "cdefghijklmnñopqrstuvwxyzab";

    // 2. Alfabetos EN (Longitud exacta: 26)
    private static final String EN_EXT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String EN_INT = "cdefghijklmnopqrstuvwxyzab";

    public String cifrar(String texto, int giro, String idioma, String alfExtCustom, String alfIntCustom) {
        return procesar(texto, giro, idioma, true, alfExtCustom, alfIntCustom);
    }

    public String descifrar(String texto, int giro, String idioma, String alfExtCustom, String alfIntCustom) {
        return procesar(texto, giro, idioma, false, alfExtCustom, alfIntCustom);
    }

    private String procesar(String texto, int giro, String idioma, boolean isCifrar, String alfExtCustom, String alfIntCustom) {
        if (texto == null || texto.isEmpty()) return "";

        String alfExt = ES_EXT;
        String alfInt = ES_INT;

        if ("EN".equalsIgnoreCase(idioma)) {
            alfExt = EN_EXT;
            alfInt = EN_INT;
        } else if ("CUSTOM".equalsIgnoreCase(idioma)) {
            // Validar que no sean nulos y tengan la misma longitud
            if (alfExtCustom == null || alfIntCustom == null || alfExtCustom.isEmpty()) {
                throw new IllegalArgumentException("Los alfabetos personalizados no pueden estar vacíos.");
            }
            if (alfExtCustom.length() != alfIntCustom.length()) {
                throw new IllegalArgumentException("Ambos alfabetos deben tener exactamente la misma longitud.");
            }
            alfExt = alfExtCustom;
            alfInt = alfIntCustom;
        }

        int moduloLen = alfExt.length();
        StringBuilder resultado = new StringBuilder();

        // En custom respetamos el case original, sino forzamos mayúsculas/minúsculas
        String txt = "CUSTOM".equalsIgnoreCase(idioma) ? texto : (isCifrar ? texto.toUpperCase() : texto.toLowerCase());

        for (char c : txt.toCharArray()) {
            if (isCifrar) {
                int idxExt = alfExt.indexOf(c);
                if (idxExt != -1) {
                    int idxInt = (idxExt + giro) % moduloLen;
                    resultado.append(alfInt.charAt(idxInt));
                } else {
                    resultado.append(c);
                }
            } else {
                int idxInt = alfInt.indexOf(c);
                if (idxInt != -1) {
                    int idxExt = (idxInt - giro) % moduloLen;
                    if (idxExt < 0) idxExt += moduloLen;
                    resultado.append(alfExt.charAt(idxExt));
                } else {
                    resultado.append(c);
                }
            }
        }
        return resultado.toString();
    }
}