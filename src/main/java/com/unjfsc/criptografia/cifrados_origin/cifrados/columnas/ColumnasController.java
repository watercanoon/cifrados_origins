package com.unjfsc.criptografia.cifrados_origin.cifrados.columnas;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
public class ColumnasController {

    private static final Logger logger = LoggerFactory.getLogger(ColumnasController.class);
    private final ColumnasService columnasService;

    public ColumnasController(ColumnasService columnasService) {
        this.columnasService = columnasService;
    }

    @MessageMapping("/columnas")
    @SendTo("/topic/columnas")
    public CifradoResponse manejarCifradoColumnas(CifradoRequest request) {
        String tipo = request.getTipoColumnas();
        String idioma = request.getIdioma();

        // Soporte de compatibilidad para scripts de cliente antiguos en caché del navegador
        if (tipo == null || tipo.isBlank()) {
            if ("SIMPLE".equalsIgnoreCase(idioma) || "CLAVE".equalsIgnoreCase(idioma)) {
                tipo = idioma;
                idioma = "ES"; // Por defecto
            }
        }

        logger.info("Petición recibida en Columnas - Operación: {}, Tipo: {}, Alfabeto: {}", 
                request.getOperacion(), tipo, idioma);

        // 1. Validación de texto vacío
        if (request.getTexto() == null || request.getTexto().trim().isEmpty()) {
            return new CifradoResponse("", "COLUMNAS", "El texto de entrada no puede estar vacío.");
        }

        // 2. Procesamiento
        try {
            String resultado = columnasService.procesarColumnas(
                    request.getTexto(),
                    request.getClave(),
                    request.getOperacion(),
                    tipo,
                    idioma,
                    request.getAlfabetoCustom()
            );
            return new CifradoResponse(resultado, "COLUMNAS", null);
        } catch (IllegalArgumentException e) {
            logger.error("Error de validación en Columnas: {}", e.getMessage());
            return new CifradoResponse("", "COLUMNAS", e.getMessage());
        } catch (Exception e) {
            logger.error("Error inesperado en Columnas", e);
            return new CifradoResponse("", "COLUMNAS", "Ocurrió un error interno al procesar el cifrado por columnas.");
        }
    }
}
