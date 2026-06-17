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
    public CifradoResponse procesarAlberti(CifradoRequest request) {
        CifradoResponse response = new CifradoResponse();
        response.setMetodo("Alberti");

        try {
            if (request.getTexto() == null || request.getTexto().trim().isEmpty()) {
                response.setResultado("");
                return response;
            }

            String clave = "K(Mb, 4, 3d)";
            if (request.getClave() != null && !request.getClave().trim().isEmpty()) {
                clave = request.getClave().trim();
            }

            // Fallback seguro: Si el frontend no envía idioma, asume Español por defecto
            String idioma = request.getIdioma() != null ? request.getIdioma().toUpperCase() : "ES";

            String resultado = "CIFRAR".equalsIgnoreCase(request.getOperacion())
                    ? albertiService.cifrar(request.getTexto(), clave, idioma, request.getAlfabetoCustomExt(), request.getAlfabetoCustomInt())
                    : albertiService.descifrar(request.getTexto(), clave, idioma, request.getAlfabetoCustomExt(), request.getAlfabetoCustomInt());

            response.setResultado(resultado);

        } catch (IllegalArgumentException e) {
            response.setError(e.getMessage());
            response.setResultado("");
        } catch (Exception e) {
            response.setError("Error crítico en el cálculo del algoritmo.");
            response.setResultado("");
        }
        return response;
    }
}