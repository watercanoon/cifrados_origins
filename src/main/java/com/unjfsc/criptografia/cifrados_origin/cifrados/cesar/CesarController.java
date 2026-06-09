package com.unjfsc.criptografia.cifrados_origin.cifrados.cesar;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
public class CesarController {

    private static final Logger logger = LoggerFactory.getLogger(CesarController.class);
    private final CesarService cesarService;

    public CesarController(CesarService cesarService) {
        this.cesarService = cesarService;
    }

    @MessageMapping("/cesar")
    @SendTo("/topic/cesar")
    public CifradoResponse manejarCifradoCesar(CifradoRequest request) {
        logger.info("Petición recibida - Operación: {}, Idioma: {}", request.getOperacion(), request.getIdioma());

        // 1. Validación de campos vacíos (Mejora de UX)
        if (request.getTexto() == null || request.getTexto().trim().isEmpty()) {
            return new CifradoResponse("", "CÉSAR", "El texto de entrada no puede estar vacío.");
        }

        // 2. Validación de la clave con manejo estricto
        int desplazamiento;
        try {
            if (request.getClave() == null || request.getClave().trim().isEmpty()) {
                throw new IllegalArgumentException("La clave es requerida para el cifrado César.");
            }
            desplazamiento = Integer.parseInt(request.getClave());
        } catch (NumberFormatException e) {
            logger.error("Clave inválida proporcionada: {}", request.getClave());
            // En lugar de forzar un 3, devolvemos un error para que la UI lo muestre en rojo
            return new CifradoResponse("", "CÉSAR", "La clave debe ser un número entero válido.");
        } catch (IllegalArgumentException e) {
            return new CifradoResponse("", "CÉSAR", e.getMessage());
        }

        // 3. Normalización de idioma
        String idioma = (request.getIdioma() != null) ? request.getIdioma().toUpperCase() : "ES";

        // 4. Procesamiento
        try {
            String resultado = cesarService.procesarCesar(request.getTexto(), desplazamiento, request.getOperacion(), request.getIdioma(),
                    request.getAlfabetoCustom());
            return new CifradoResponse(resultado, "CÉSAR", null); // null indica que no hay error
        } catch (Exception e) {
            logger.error("Error al procesar el cifrado", e);
            return new CifradoResponse("", "CÉSAR", "Ocurrió un error interno al procesar el texto.");
        }
    }
}