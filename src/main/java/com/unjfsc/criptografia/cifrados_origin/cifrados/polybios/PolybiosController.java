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
        // Extraemos la clave y el idioma que el usuario seleccionó en la interfaz
        String clave = (request.getClave() != null) ? request.getClave() : "";
        String idioma = (request.getIdioma() != null) ? request.getIdioma() : "ES"; // Por defecto ES si viene vacío

        // Pasamos los 4 parámetros al servicio: texto, operacion, clave, idioma
        String resultado = polybiosService.procesarPolybios(request.getTexto(), request.getOperacion(), clave, idioma);

        return new CifradoResponse(resultado, "POLYBIOS");
    }
}