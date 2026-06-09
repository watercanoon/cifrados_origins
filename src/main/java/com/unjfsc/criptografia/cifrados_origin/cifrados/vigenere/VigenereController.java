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
        if (request.getTexto() == null || request.getTexto().trim().isEmpty()) {
            return new CifradoResponse("", "VIGENÈRE", "El texto no puede estar vacío.");
        }

        if (request.getClave() == null || request.getClave().trim().isEmpty()) {
            return new CifradoResponse("", "VIGENÈRE", "Se requiere una palabra clave.");
        }

        String idioma = (request.getIdioma() != null) ? request.getIdioma() : "ES";

        try {
            String resultado = vigenereService.procesarVigenere(
                    request.getTexto(),
                    request.getClave(),
                    request.getOperacion(),
                    idioma,
                    request.getAlfabetoCustom()
            );
            return new CifradoResponse(resultado, "VIGENÈRE", null);
        } catch (Exception e) {
            return new CifradoResponse("", "VIGENÈRE", "Error interno al procesar Vigenère.");
        }
    }
}