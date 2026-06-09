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
        try {
            if (request.getTexto() == null || request.getTexto().trim().isEmpty()) {
                response.setResultado("");
                return response;
            }

            // Validar y parsear la clave como número de posiciones de giro
            int giro = 0;
            if (request.getClave() != null && !request.getClave().trim().isEmpty()) {
                giro = Integer.parseInt(request.getClave().trim());
            }

            String resultado = "CIFRAR".equalsIgnoreCase(request.getOperacion())
                    ? albertiService.cifrar(request.getTexto(), giro)
                    : albertiService.descifrar(request.getTexto(), giro);

            response.setResultado(resultado);
        } catch (NumberFormatException e) {
            response.setError("La clave de giro debe ser un número entero válido.");
        } catch (Exception e) {
            response.setError("Error en el procesamiento del disco Alberti.");
        }
        return response;
    }
}