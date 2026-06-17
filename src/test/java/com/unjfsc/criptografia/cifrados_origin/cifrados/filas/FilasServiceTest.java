package com.unjfsc.criptografia.cifrados_origin.cifrados.filas;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class FilasServiceTest {

    private final FilasService service = new FilasService();

    @Test
    void testSimpleRowTransposition() {
        String texto = "TRANSPOSICION POR FILAS";
        String clave = "4";
        String resultado = service.procesarFilas(texto, clave, "CIFRAR", "SIMPLE", "ES", null);
        
        // Esperado del PDF: TSINFSRPCPIXAOIOLXNSORAX
        assertEquals("TSINFSRPCPIXAOIOLXNSORAX", resultado);
    }

    @Test
    void testKeyedRowTransposition() {
        String texto = "BENJAMIN FRANKLIN INVENTO EL PARARRAYOS EN MIL SETECIENTOS CINCUENTA Y DOS";
        String clave = "SALUDO";
        String resultado = service.procesarFilas(texto, clave, "CIFRAR", "CLAVE", "ES", null);
        
        // Esperado del PDF: ENLEPAMEOUDAAIOASSEITXNFINAYICSEOMNNEREENNAXBIKVLRNTTCYJRNTROLICNS
        assertEquals("ENLEPAMEOUDAAIOASSEITXNFINAYICSEOMNNEREENNAXBIKVLRNTTCYJRNTROLICNS", resultado);
    }

    @Test
    void testKeyedRowDecryption() {
        String criptograma = "ENLEPAMEOUDAAIOASSEITXNFINAYICSEOMNNEREENNAXBIKVLRNTTCYJRNTROLICNS";
        String clave = "SALUDO";
        String resultado = service.procesarFilas(criptograma, clave, "DESCIFRAR", "CLAVE", "ES", null);
        
        // El texto original limpio es BENJAMINFRANKLININVENTOELPARARRAYOSENMILSETECIENTOSCINCUENTAYDOS más dos X de relleno al final
        assertEquals("BENJAMINFRANKLININVENTOELPARARRAYOSENMILSETECIENTOSCINCUENTAYDOSXX", resultado);
    }

    @Test
    void testEnglishAlphabetConversion() {
        // En inglés (EN) la Ñ no pertenece al alfabeto, pero se convierte a N si N está en el alfabeto
        String texto = "NIÑO";
        String clave = "2";
        String resultado = service.procesarFilas(texto, clave, "CIFRAR", "SIMPLE", "EN", null);
        
        // Texto limpio: NINO
        // Matriz 2x2:
        // Col 1: N I
        // Col 2: N O
        // Grid:
        // N N
        // I O
        // Lectura por filas: NNIO (Fila 1: NN, Fila 2: IO)
        assertEquals("NNIO", resultado);
    }

    @Test
    void testCustomAlphabetPriority() {
        // Alfabeto al revés: ZYXWVUTSRQPONMLKJIHGFEDCBA
        // Clave: CAB. En este alfabeto, C (index 23) < B (index 24) < A (index 25)
        // Por lo tanto, el orden de lectura de filas es Fila 0 (C), Fila 2 (B), Fila 1 (A) (o sea, indices 0, 2, 1)
        // Texto: HELLO. 5 letras. Relleno con X -> HELLOX. 6 letras totales, 3 filas, 2 columnas.
        // Matriz:
        // Col 1: H E L
        // Col 2: L O X
        // Grid (verticalmente col por col):
        // Fila 0: H L
        // Fila 1: E O
        // Fila 2: L X
        // Lectura de filas en orden 0, 2, 1:
        // Fila 0: HL
        // Fila 2: LX
        // Fila 1: EO
        // Criptograma esperado: HLLXEO
        String alfabetoCustom = "ZYXWVUTSRQPONMLKJIHGFEDCBA";
        String resultado = service.procesarFilas("HELLO", "CAB", "CIFRAR", "CLAVE", "CUSTOM", alfabetoCustom);
        assertEquals("HLLXEO", resultado);
    }
}
