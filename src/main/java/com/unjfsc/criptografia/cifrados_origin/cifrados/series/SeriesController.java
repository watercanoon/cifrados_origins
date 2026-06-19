package com.unjfsc.criptografia.cifrados_origin.cifrados.series;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class SeriesController {

    private final SeriesService seriesService;

    public SeriesController(SeriesService seriesService) {
        this.seriesService = seriesService;
    }

    @MessageMapping("/series")
    @SendTo("/topic/series")
    public CifradoResponse procesarSeries(CifradoRequest request) {
        CifradoResponse response = new CifradoResponse();
        response.setMetodo("Series");

        try {
            if (request.getTexto() == null || request.getTexto().trim().isEmpty()) {
                response.setResultado("");
                return response;
            }

            String clave = request.getClave() != null ? request.getClave() : "";

            String resultado = "CIFRAR".equalsIgnoreCase(request.getOperacion())
                    ? seriesService.cifrar(request.getTexto(), clave)
                    : seriesService.descifrar(request.getTexto(), clave);

            response.setResultado(resultado);

        } catch (IllegalArgumentException e) {
            response.setError(e.getMessage());
            response.setResultado("");
        } catch (Exception e) {
            response.setError("Error crítico en el cálculo del algoritmo: " + e.getMessage());
            response.setResultado("");
        }
        return response;
    }
}
