package com.unjfsc.criptografia.cifrados_origin.cifrados.grupos;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class GruposController {

    private final GruposService gruposService;

    public GruposController(GruposService gruposService) {
        this.gruposService = gruposService;
    }

    @MessageMapping("/grupos")
    @SendTo("/topic/grupos")
    public CifradoResponse procesarGrupos(CifradoRequest request) {
        CifradoResponse response = new CifradoResponse();
        response.setMetodo("Grupos");

        try {
            if (request.getTexto() == null || request.getTexto().trim().isEmpty()) {
                response.setResultado("");
                return response;
            }

            boolean eliminarEspacios = !"MANTENER".equalsIgnoreCase(request.getIdioma());
            String clave = request.getClave() != null ? request.getClave() : "";

            String resultado = "CIFRAR".equalsIgnoreCase(request.getOperacion())
                    ? gruposService.cifrar(request.getTexto(), clave, eliminarEspacios)
                    : gruposService.descifrar(request.getTexto(), clave, eliminarEspacios);

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
