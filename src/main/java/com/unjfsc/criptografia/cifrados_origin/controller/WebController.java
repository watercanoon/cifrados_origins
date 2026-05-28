package com.unjfsc.criptografia.cifrados_origin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;


@Controller
public class WebController {

    // Ruta principal: Dashboard
    @GetMapping("/")
    public String index() {
        return "index";
    }

    // Ruta para el metodo César
    @GetMapping("/cesar")
    public String cesar() {
        return "cesar";
    }

    // Aquí irán agregando las demás rutas tus compañeros
    // @GetMapping("/vigenere")
    // public String vigenere() { return "vigenere"; }
}