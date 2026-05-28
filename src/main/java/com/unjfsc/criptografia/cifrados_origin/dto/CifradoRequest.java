package com.unjfsc.criptografia.cifrados_origin.dto;

import lombok.Data;

@Data
public class CifradoRequest {
    private String texto;
    private String clave;
    private String operacion; // "CIFRAR" o "DESCIFRAR"
    private String idioma;    // "ES" (Español - 27) o "EN" (Inglés - 26)
}