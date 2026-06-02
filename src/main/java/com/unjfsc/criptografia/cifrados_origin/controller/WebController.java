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

    @GetMapping("/rot5")
    public String rot5() {
        return "rot5";
    }

    @GetMapping("/atbash")
    public String atbash() {return "atbash";}

    @GetMapping("/rot47")
    public String root47() {return "rot47";}

    @GetMapping("/alberti")
    public String alberti() {return "alberti";}

    @GetMapping("/vigenere")
    public String vigenere() { return "vigenere"; }

    @GetMapping("/polybios")
    public String polybios() { return "polybios"; }

    // Aqui iran agregando las demas rutas
    // @GetMapping("/escitala")
    // public String escitala() { return "escitala"; }
}
