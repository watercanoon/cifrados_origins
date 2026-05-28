package com.unjfsc.criptografia.cifrados_origin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CifradoResponse {
    private String resultado;
    private String algoritmo;
}