package com.unjfsc.criptografia.cifrados_origin.cifrados.alberti;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class AlbertiController {

    private final AlbertiService service;

    public AlbertiController(AlbertiService service) {
        this.service = service;
    }

    @MessageMapping("/alberti")
    @SendTo("/topic/alberti")
    public CifradoResponse procesar(CifradoRequest request) {

        return new CifradoResponse(
                service.procesar(
                        request.getTexto(),
                        request.getClave(),
                        request.getGiro(),
                        request.getBloque(),
                        request.getDireccion(),
                        request.getOperacion()
                ),
                "ALBERTI"
        );
    }
}