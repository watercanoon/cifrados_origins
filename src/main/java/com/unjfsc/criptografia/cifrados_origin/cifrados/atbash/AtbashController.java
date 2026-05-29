package com.unjfsc.criptografia.cifrados_origin.cifrados.atbash;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class AtbashController {

    private final AtbashService atbashService;

    public AtbashController(AtbashService atbashService) {
        this.atbashService = atbashService;
    }

    @MessageMapping("/atbash")
    @SendTo("/topic/atbash")
    public CifradoResponse manejarCifradoAtbash(CifradoRequest request) {
        String idioma = (request.getIdioma() != null) ? request.getIdioma() : "ES";

        String resultado = atbashService.procesarAtbash(request.getTexto(), idioma);

        return new CifradoResponse(resultado, "ATBASH");
    }
}