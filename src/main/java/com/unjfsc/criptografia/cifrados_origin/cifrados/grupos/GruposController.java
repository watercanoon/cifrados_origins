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

            String clave = request.getClave() != null ? request.getClave() : "";
            String idioma = request.getIdioma() != null ? request.getIdioma() : "ES";
            String alfabetoCustom = request.getAlfabetoCustom() != null ? request.getAlfabetoCustom() : "";

            String resultado = "CIFRAR".equalsIgnoreCase(request.getOperacion())
                    ? gruposService.cifrar(request.getTexto(), clave, idioma, alfabetoCustom)
                    : gruposService.descifrar(request.getTexto(), clave, idioma, alfabetoCustom);

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
