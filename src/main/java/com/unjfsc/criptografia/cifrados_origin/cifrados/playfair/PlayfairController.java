package com.unjfsc.criptografia.cifrados_origin.cifrados.playfair;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class PlayfairController {

    private final PlayfairService playfairService;

    public PlayfairController(PlayfairService playfairService) {
        this.playfairService = playfairService;
    }

    @MessageMapping("/playfair")
    @SendTo("/topic/playfair")
    public CifradoResponse manejarCifradoPlayfair(CifradoRequest request) {
        String resultado = playfairService.procesarPlayfair(
                request.getTexto(),
                request.getClave(),
                request.getOperacion(),
                request.getIdioma(),
                request.getAlfabetoCustom()
        );

        return new CifradoResponse(resultado, "PLAYFAIR");
    }
}