package com.unjfsc.criptografia.cifrados_origin.cifrados.alberti;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class AlbertiController {

    private final AlbertiService albertiService;

    public AlbertiController(AlbertiService albertiService) {
        this.albertiService = albertiService;
    }

    @MessageMapping("/alberti")
    @SendTo("/topic/alberti")
    public CifradoResponse manejarCifradoAlberti(CifradoRequest request) {
        String resultado = albertiService.procesarAlberti(
                request.getTexto(),
                request.getClave(),
                request.getOperacion(),
                request.getIdioma()
        );

        return new CifradoResponse(resultado, "ALBERTI");
    }
}