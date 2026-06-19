package com.unjfsc.criptografia.cifrados_origin.cifrados.polybios;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class PolybiosController {

    private final PolybiosService polybiosService;

    public PolybiosController(PolybiosService polybiosService) {
        this.polybiosService = polybiosService;
    }

    @MessageMapping("/polybios")
    @SendTo("/topic/polybios")
    public CifradoResponse manejarCifradoPolybios(CifradoRequest request) {
        String idioma = request.getIdioma() != null ? request.getIdioma() : "ES";
        String tipoCoordenadas = request.getClave() != null ? request.getClave() : "NUM";
        String resultado = polybiosService.procesarPolybios(
                request.getTexto(),
                request.getOperacion(),
                idioma,
                tipoCoordenadas
        );

        return new CifradoResponse(resultado, "POLYBIOS");
    }

}
