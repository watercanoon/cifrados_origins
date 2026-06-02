package com.unjfsc.criptografia.cifrados_origin.cifrados.rot5;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class Rot5Controller {

    private final Rot5Service rot5Service;

    public Rot5Controller(Rot5Service rot5Service) {
        this.rot5Service = rot5Service;
    }

    @MessageMapping("/rot5")
    @SendTo("/topic/rot5")
    public CifradoResponse manejarCifradoRot5(CifradoRequest request) {
        String resultado = rot5Service.procesarRot5(request.getTexto());
        return new CifradoResponse(resultado, "ROT5");
    }
}
