package com.unjfsc.criptografia.cifrados_origin.cifrados.alberti;

import org.springframework.stereotype.Service;

@Service
public class AlbertiService {

    private final String fijo = "ABCDEFGILMNOPQRSTVXZ1234";
    private final String movil = "usqomkhfdbacegilnprtxz&y";

    public String procesar(String texto,
                           String clave,
                           Integer giro,
                           Integer bloque,
                           String direccion,
                           String operacion) {

        if (giro == null) giro = 1;
        if (bloque == null || bloque <= 0) bloque = 4;

        int shift = giro % movil.length();

        if ("IZQ".equalsIgnoreCase(direccion)) {
            shift = movil.length() - shift;
        }

        StringBuilder sb = new StringBuilder();
        int contador = 0;

        for (char c : texto.toCharArray()) {

            char upper = Character.toUpperCase(c);
            int index = fijo.indexOf(upper);

            if (index == -1) {
                sb.append(c);
                continue;
            }

            // 🔥 GIRO POR BLOQUES
            if (contador > 0 && contador % bloque == 0) {
                shift = (shift + 1) % movil.length();

                if ("IZQ".equalsIgnoreCase(direccion)) {
                    shift = movil.length() - shift;
                }
            }

            int newIndex = (index + shift) % fijo.length();
            sb.append(movil.charAt(newIndex));

            contador++;
        }

        return sb.toString();
    }
}