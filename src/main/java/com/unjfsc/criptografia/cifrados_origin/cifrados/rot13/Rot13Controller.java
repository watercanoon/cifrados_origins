package com.unjfsc.criptografia.cifrados_origin.cifrados.rot13;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class Rot13Controller {

    private final Rot13Service rot13Service;

    public Rot13Controller(Rot13Service rot13Service) {
        this.rot13Service = rot13Service;
    }

    @MessageMapping("/rot13")
    @SendTo("/topic/rot13")
    public CifradoResponse manejarCifradoRot13(CifradoRequest request) {
        String idioma = request.getIdioma() != null ? request.getIdioma() : "EN";
        String operacion = request.getOperacion() != null ? request.getOperacion() : "CIFRAR";
        String resultado = rot13Service.procesarRot13(request.getTexto(), operacion, idioma);
        return new CifradoResponse(resultado, "ROT13");
    }
}
