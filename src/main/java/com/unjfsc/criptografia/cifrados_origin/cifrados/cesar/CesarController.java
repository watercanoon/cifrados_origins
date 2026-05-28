package com.unjfsc.criptografia.cifrados_origin.cifrados.cesar;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class CesarController {

    private final CesarService cesarService;

    public CesarController(CesarService cesarService) {
        this.cesarService = cesarService;
    }

    @MessageMapping("/cesar")
    @SendTo("/topic/cesar")
    public CifradoResponse manejarCifradoCesar(CifradoRequest request) {
        int desplazamiento = 3;
        try {
            if (request.getClave() != null && !request.getClave().isEmpty()) {
                desplazamiento = Integer.parseInt(request.getClave());
            }
        } catch (NumberFormatException e) {
            desplazamiento = 3;
        }

        // Aseguramos un idioma por defecto si viene nulo
        String idioma = (request.getIdioma() != null) ? request.getIdioma() : "ES";

        String resultado = cesarService.procesarCesar(request.getTexto(), desplazamiento, request.getOperacion(), idioma);
        return new CifradoResponse(resultado, "CÉSAR");
    }
}