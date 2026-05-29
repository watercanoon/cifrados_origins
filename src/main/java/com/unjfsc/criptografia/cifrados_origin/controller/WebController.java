package com.unjfsc.criptografia.cifrados_origin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/cesar")
    public String cesar() {
        return "cesar";
    }

    @GetMapping("/rot13")
    public String rot13() {
        return "rot13";
    }

    @GetMapping("/polybios")
    public String polybios() {return "polybios";}

    @GetMapping("/vigenere")
    public String vigenere() {return "vigenere";}

    @GetMapping("/atbash")
    public String atbash() {return "atbash";}

    // Aqui iran agregando las demas rutas tus companeros
    // @GetMapping("/vigenere")
    // public String vigenere() { return "vigenere"; }
}
