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

            int giro = 0;
            if (request.getClave() != null && !request.getClave().trim().isEmpty()) {
                giro = Integer.parseInt(request.getClave().trim());
            }

            // Fallback seguro: Si el frontend no envía idioma, asume Español por defecto
            String idioma = request.getIdioma() != null ? request.getIdioma().toUpperCase() : "ES";

            String resultado = "CIFRAR".equalsIgnoreCase(request.getOperacion())
                    ? albertiService.cifrar(request.getTexto(), giro, idioma, request.getAlfabetoCustomExt(), request.getAlfabetoCustomInt())
                    : albertiService.descifrar(request.getTexto(), giro, idioma, request.getAlfabetoCustomExt(), request.getAlfabetoCustomInt());

            response.setResultado(resultado);

        } catch (NumberFormatException e) {
            // Manejo de error específico para el DTO (capturado por el frontend)
            response.setError("La clave de giro debe ser un valor numérico entero.");
            response.setResultado("");
        } catch (Exception e) {
            response.setError("Error crítico en el cálculo del algoritmo.");
            response.setResultado("");
        }
        return response;
    }
}