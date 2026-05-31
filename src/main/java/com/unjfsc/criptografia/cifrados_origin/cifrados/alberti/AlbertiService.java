package com.unjfsc.criptografia.cifrados_origin.cifrados.alberti;

import org.springframework.stereotype.Service;

@Service
public class AlbertiService {

    public String procesarAlberti(String texto, String clave, String operacion, String alfabetos) {
        if (texto == null || texto.isBlank()) return "";

        // 1. Separar el disco exterior del interior (vienen separados por "|")
        String[] alfs = alfabetos.split("\\|");
        if (alfs.length != 2) return "ERROR: Alfabetos mal configurados";
        String ext = alfs[0];
        String intAlf = alfs[1];

        // 2. Separar el período y el giro (vienen separados por "-")
        String[] params = clave.split("-");
        if (params.length != 2) return "ERROR: Clave mal configurada";
        int periodo = Integer.parseInt(params[0]);
        int giro = Integer.parseInt(params[1]);

        StringBuilder resultado = new StringBuilder();
        int letrasProcesadas = 0;
        int rotacionActual = 0; // Al inicio los discos están alineados (0)
        boolean cifrar = "CIFRAR".equalsIgnoreCase(operacion);

        for (int i = 0; i < texto.length(); i++) {
            char c = texto.charAt(i);

            // Alberti clásico ignoraba los espacios para el giro de los discos
            if (c == ' ') {
                resultado.append(c);
                continue;
            }

            if (cifrar) {
                // Buscamos la letra en el disco Exterior
                int posExt = ext.indexOf(Character.toUpperCase(c));
                if (posExt == -1) posExt = ext.indexOf(c); // Fallback por si acaso

                if (posExt != -1) {
                    // La posición interior es la exterior más la rotación acumulada
                    int posInt = (posExt + rotacionActual) % intAlf.length();
                    if (posInt < 0) posInt += intAlf.length(); // Evitar negativos en giros inversos

                    resultado.append(intAlf.charAt(posInt));
                    letrasProcesadas++;
                } else {
                    resultado.append(c); // Símbolos especiales pasan intactos
                }
            } else {
                // DESCIFRAR: Buscamos la letra en el disco Interior
                int posInt = intAlf.indexOf(Character.toLowerCase(c));
                if (posInt == -1) posInt = intAlf.indexOf(c);

                if (posInt != -1) {
                    // Revertimos la rotación para hallar la letra Exterior original
                    int posExt = (posInt - rotacionActual) % ext.length();
                    if (posExt < 0) posExt += ext.length();

                    resultado.append(ext.charAt(posExt));
                    letrasProcesadas++;
                } else {
                    resultado.append(c);
                }
            }

            // 3. LA MAGIA DE ALBERTI: Si completamos un período, giramos el disco
            if (letrasProcesadas > 0 && letrasProcesadas % periodo == 0) {
                rotacionActual = (rotacionActual + giro) % intAlf.length();
            }
        }

        return resultado.toString();
    }
}