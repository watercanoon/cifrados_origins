package com.unjfsc.criptografia.cifrados_origin.cifrados.filas;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
public class FilasController {

    private static final Logger logger = LoggerFactory.getLogger(FilasController.class);
    private final FilasService filasService;

    public FilasController(FilasService filasService) {
        this.filasService = filasService;
    }

    @MessageMapping("/filas")
    @SendTo("/topic/filas")
    public CifradoResponse manejarCifradoFilas(CifradoRequest request) {
        String tipo = request.getTipoFilas();
        String idioma = request.getIdioma();

        // Soporte de compatibilidad para scripts de cliente antiguos en caché del navegador
        if (tipo == null || tipo.isBlank()) {
            if ("SIMPLE".equalsIgnoreCase(idioma) || "CLAVE".equalsIgnoreCase(idioma)) {
                tipo = idioma;
                idioma = "ES"; // Por defecto
            }
        }

        logger.info("Petición recibida en Filas - Operación: {}, Tipo: {}, Alfabeto: {}", 
                request.getOperacion(), tipo, idioma);

        // 1. Validación de texto vacío
        if (request.getTexto() == null || request.getTexto().trim().isEmpty()) {
            return new CifradoResponse("", "FILAS", "El texto de entrada no puede estar vacío.");
        }

        // 2. Procesamiento
        try {
            String resultado = filasService.procesarFilas(
                    request.getTexto(),
                    request.getClave(),
                    request.getOperacion(),
                    tipo,
                    idioma,
                    request.getAlfabetoCustom()
            );
            return new CifradoResponse(resultado, "FILAS", null);
        } catch (IllegalArgumentException e) {
            logger.error("Error de validación en Filas: {}", e.getMessage());
            return new CifradoResponse("", "FILAS", e.getMessage());
        } catch (Exception e) {
            logger.error("Error inesperado en Filas", e);
            return new CifradoResponse("", "FILAS", "Ocurrió un error interno al procesar el cifrado por filas.");
        }
    }
}
