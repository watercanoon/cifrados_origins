package com.unjfsc.criptografia.cifrados_origin.cifrados.hill;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
public class HillController {

    private static final Logger logger = LoggerFactory.getLogger(HillController.class);
    private final HillService hillService;

    public HillController(HillService hillService) {
        this.hillService = hillService;
    }

    @MessageMapping("/hill")
    @SendTo("/topic/hill")
    public CifradoResponse manejarCifradoHill(CifradoRequest request) {
        logger.info("Petición recibida en Hill - Operación: {}, Idioma: {}", request.getOperacion(), request.getIdioma());

        // 1. Validación de texto vacío
        if (request.getTexto() == null || request.getTexto().trim().isEmpty()) {
            return new CifradoResponse("", "HILL", "El texto de entrada no puede estar vacío.");
        }

        // 2. Procesamiento
        try {
            String resultado = hillService.procesarHill(
                    request.getTexto(),
                    request.getClave(),
                    request.getOperacion(),
                    request.getIdioma(),
                    request.getAlfabetoCustom()
            );
            return new CifradoResponse(resultado, "HILL", null);
        } catch (IllegalArgumentException e) {
            logger.error("Error de validación matemática en Hill: {}", e.getMessage());
            return new CifradoResponse("", "HILL", e.getMessage());
        } catch (Exception e) {
            logger.error("Error inesperado en Hill", e);
            return new CifradoResponse("", "HILL", "Ocurrió un error interno al procesar el cifrado de Hill.");
        }
    }
}
