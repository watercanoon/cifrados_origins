package com.unjfsc.criptografia.cifrados_origin.cifrados.escitala;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Map;

@Controller
public class EscitalaController {

    @Autowired
    private EscitalaService escitalaService;

    @GetMapping("/escitala")
    public String mostrarPagina() {
        return "escitala";
    }

    @MessageMapping("/cifrar/escitala")
    @SendTo("/topic/escitala")
    public Map<String, String> procesarCifrado(Map<String, String> mensaje) {
        String texto = mensaje.get("texto");
        int caras = Integer.parseInt(mensaje.get("clave"));
        String resultado = escitalaService.cifrar(texto, caras);

        return Map.of("resultado", resultado, "operacion", "cifrar");
    }

    @MessageMapping("/descifrar/escitala")
    @SendTo("/topic/escitala")
    public Map<String, String> procesarDescifrado(Map<String, String> mensaje) {
        String texto = mensaje.get("texto");
        int caras = Integer.parseInt(mensaje.get("clave"));
        String resultado = escitalaService.descifrar(texto, caras);

        return Map.of("resultado", resultado, "operacion", "descifrar");
    }
}