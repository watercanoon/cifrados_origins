package com.unjfsc.criptografia.cifrados_origin.cifrados.escitala;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoRequest;
import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class EscitalaController {

    private final EscitalaService escitalaService;

    public EscitalaController(EscitalaService escitalaService) {
        this.escitalaService = escitalaService;
    }

    @MessageMapping("/escitala")
    @SendTo("/topic/escitala")
    public CifradoResponse manejarCifradoEscitala(CifradoRequest request) {
        if (request.getTexto() == null || request.getTexto().trim().isEmpty()) {
            return new CifradoResponse("", "ESCÍTALA", "El texto no puede estar vacío.");
        }

        int columnas;
        try {
            if (request.getClave() == null || request.getClave().trim().isEmpty()) {
                throw new IllegalArgumentException("Se requiere el número de caras (columnas).");
            }
            columnas = Integer.parseInt(request.getClave());
            if (columnas < 2) {
                throw new IllegalArgumentException("El número de caras debe ser mayor a 1.");
            }
        } catch (NumberFormatException e) {
            return new CifradoResponse("", "ESCÍTALA", "La clave debe ser un número entero válido.");
        } catch (IllegalArgumentException e) {
            return new CifradoResponse("", "ESCÍTALA", e.getMessage());
        }

        try {
            String resultado = escitalaService.procesarEscitala(
                    request.getTexto(),
                    columnas,
                    request.getOperacion()
            );
            return new CifradoResponse(resultado, "ESCÍTALA", null);
        } catch (Exception e) {
            return new CifradoResponse("", "ESCÍTALA", "Error interno al procesar la Escítala.");
        }
    }
}