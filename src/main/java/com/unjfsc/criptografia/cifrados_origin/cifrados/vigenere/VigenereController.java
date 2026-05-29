package com.unjfsc.criptografia.cifrados_origin.cifrados.vigenere;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class VigenereController {

    private final VigenereService vigenereService;

    public VigenereController(VigenereService vigenereService) {
        this.vigenereService = vigenereService;
    }

    @MessageMapping("/vigenere")
    @SendTo("/topic/vigenere")
    public CifradoResponse manejarCifradoVigenere(CifradoRequest request) {
        String idioma = (request.getIdioma() != null) ? request.getIdioma() : "ES";
        String resultado = vigenereService.procesarVigenere(request.getTexto(), request.getClave(), request.getOperacion(), idioma);

        return new CifradoResponse(resultado, "VIGENÉRE");
    }
}