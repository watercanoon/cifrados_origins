package com.unjfsc.criptografia.cifrados_origin.exception;

import com.unjfsc.criptografia.cifrados_origin.dto.CifradoResponse;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.annotation.ControllerAdvice;

@ControllerAdvice
public class WebSocketExceptionHandler {

    @MessageExceptionHandler(IllegalArgumentException.class)
    @SendToUser("/queue/errores") // Enviaremos el error por un canal privado al usuario que se equivocó
    public CifradoResponse handleIllegalArgumentException(IllegalArgumentException ex) {
        return new CifradoResponse(null, "ERROR_VALIDACION", ex.getMessage());
    }

    @MessageExceptionHandler(Exception.class)
    @SendToUser("/queue/errores")
    public CifradoResponse handleGeneralException(Exception ex) {
        return new CifradoResponse(null, "ERROR_SISTEMA", "Ha ocurrido un error inesperado procesando el cifrado.");
    }
}