package com.unjfsc.criptografia.cifrados_origin.cifrados.rot47;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class Rot47Controller {

    private final Rot47Service rot47Service;

    public Rot47Controller(Rot47Service rot47Service) {
        this.rot47Service = rot47Service;
    }

    @MessageMapping("/rot47")
    @SendTo("/topic/rot47")
    public CifradoResponse manejarCifradoRot47(CifradoRequest request) {
        if (request.getTexto() == null || request.getTexto().trim().isEmpty()) {
            return new CifradoResponse("", "ROT47", "El texto no puede estar vacío.");
        }

        try {
            // ROT47 no requiere parámetros extra de idioma u operación
            String resultado = rot47Service.procesarRot47(request.getTexto());
            return new CifradoResponse(resultado, "ROT47", null);
        } catch (Exception e) {
            return new CifradoResponse("", "ROT47", "Error interno al procesar ROT47.");
        }
    }
}