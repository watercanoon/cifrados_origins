package com.unjfsc.criptografia.cifrados_origin.cifrados.cesar;

import com.unjfsc.criptografia.cifrados_origin.model.HistorialCifrado;
import com.unjfsc.criptografia.cifrados_origin.repository.HistorialCifradoRepository;
import org.springframework.stereotype.Service;

@Service
public class CesarService {

    private final HistorialCifradoRepository historialRepository;

    // Definimos ambos alfabetos como constantes
    private static final String ALFABETO_ES = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"; // 27 letras
    private static final String ALFABETO_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";  // 26 letras

    public CesarService(HistorialCifradoRepository historialRepository) {
        this.historialRepository = historialRepository;
    }

    public String procesarCesar(String texto, int desplazamiento, String operacion, String idioma) {
        StringBuilder resultado = new StringBuilder();
        texto = texto.toUpperCase();

        // Selección dinámica del alfabeto
        String alfabetoUsado = "EN".equalsIgnoreCase(idioma) ? ALFABETO_EN : ALFABETO_ES;
        int modulo = alfabetoUsado.length();

        for (int i = 0; i < texto.length(); i++) {
            char caracter = texto.charAt(i);
            int posicionActual = alfabetoUsado.indexOf(caracter);

            if (posicionActual != -1) {
                int nuevaPosicion;
                if (operacion.equalsIgnoreCase("CIFRAR")) {
                    // Ci = (Mi + K) mod N
                    nuevaPosicion = (posicionActual + desplazamiento) % modulo;
                } else {
                    // Mi = (Ci - K) mod N. (Se suma 'modulo' para evitar residuos negativos en Java)
                    nuevaPosicion = (posicionActual - desplazamiento % modulo + modulo) % modulo;
                }
                resultado.append(alfabetoUsado.charAt(nuevaPosicion));
            } else {
                resultado.append(caracter); // Mantener espacios o números intactos
            }
        }

        guardarHistorial(texto, resultado.toString(), String.valueOf(desplazamiento), operacion, idioma);

        return resultado.toString();
    }

    private void guardarHistorial(String original, String resultado, String clave, String operacion, String idioma) {
        HistorialCifrado historial = new HistorialCifrado();
        historial.setAlgoritmo("CÉSAR (" + idioma.toUpperCase() + ")");
        historial.setTextoOriginal(original);
        historial.setTextoResultado(resultado);
        historial.setClaveUsada(clave);
        historial.setOperacion(operacion.toUpperCase());
        historialRepository.save(historial);
    }
}