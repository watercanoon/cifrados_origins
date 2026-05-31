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
    public CifradoResponse procesar(CifradoRequest request) {

        String operacion = request.getOperacion() != null
                ? request.getOperacion()
                : "CIFRAR";

        String resultado = rot47Service.procesar(
                request.getTexto(),
                operacion
        );

        return new CifradoResponse(resultado, "rot47");
    }
}