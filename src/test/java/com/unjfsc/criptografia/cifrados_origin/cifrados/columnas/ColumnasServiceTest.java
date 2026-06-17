package com.unjfsc.criptografia.cifrados_origin.cifrados.columnas;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ColumnasServiceTest {

    private final ColumnasService service = new ColumnasService();

    @Test
    void testSimpleEncryption() {
        String texto = "los meridianos y paralelos terrestres forman un preciso sistema de coordenadas.";
        String clave = "7";
        String resultado = service.procesarColumnas(texto, clave, "CIFRAR", "SIMPLE", "ES", null);
        
        // El resultado esperado del PDF es: LDPOSRRIENOIASTMESCASARTRACTODMNAEENIEOAEOLRSUSMRSRSERFNOADXIYLEOPSDEX
        assertEquals("LDPOSRRIENOIASTMESCASARTRACTODMNAEENIEOAEOLRSUSMRSRSERFNOADXIYLEOPSDEX", resultado);
    }

    @Test
    void testKeyedEncryption() {
        String texto = "EL ÉXITO CONSISTE EN VENCER EL TEMOR AL FRACASO";
        String clave = "PERICO";
        String resultado = service.procesarColumnas(texto, clave, "CIFRAR", "CLAVE", "ES", null);
        
        // El resultado esperado del PDF es: ISNROAXLCTNTLSXNEEMRXTIVERCXEOSELAAEOECEFO
        assertEquals("ISNROAXLCTNTLSXNEEMRXTIVERCXEOSELAAEOECEFO", resultado);
    }

    @Test
    void testKeyedDecryption() {
        String criptograma = "AMELSCEATXREKNECTCMOPIKCTHNYAIIDUAAIIUNCLADUENHZAE";
        String clave = "RELOJ";
        String resultado = service.procesarColumnas(criptograma, clave, "DESCIFRAR", "CLAVE", "ES", null);
        
        // El resultado esperado del PDF es: LAPIRAMIDEDEKUKULCANESTAENCHICHENITZAYUCATANMEXICO
        assertEquals("LAPIRAMIDEDEKUKULCANESTAENCHICHENITZAYUCATANMEXICO", resultado);
    }

    @Test
    void testEnglishAlphabetConversion() {
        // En inglés (EN) la Ñ no pertenece al alfabeto, pero se convierte a N si N está en el alfabeto
        String texto = "NIÑO";
        String clave = "2";
        String resultado = service.procesarColumnas(texto, clave, "CIFRAR", "SIMPLE", "EN", null);
        
        // Texto normalizado: NINO
        // Matriz 2x2:
        // N I
        // N O
        // Lectura por columnas secuencial: NNIO
        assertEquals("NNIO", resultado);
    }

    @Test
    void testCustomAlphabetPriority() {
        // Alfabeto personalizado al revés: ZYXWVUTSRQPONMLKJIHGFEDCBA
        // Clave: CAB. En este alfabeto, el orden es C, luego B, luego A (C está más a la izquierda que B, B más que A).
        // Por ende, la lectura de columnas debe ser: col 0 (C), col 2 (B), col 1 (A)
        String texto = "HELLO"; // Normalizado: HELLO. 5 letras. Relleno con X (ya que X está en el alfabeto) -> HELLOX
        // Matriz 2x3 (3 columnas):
        // H E L
        // L O X
        // Orden alfabético: C (col 0), B (col 2), A (col 1)
        // Col 0: HL
        // Col 2: LX
        // Col 1: EO
        // Resultado esperado: HLLXEO (HL + LX + EO).
        String alfabetoCustom = "ZYXWVUTSRQPONMLKJIHGFEDCBA";
        String resultado = service.procesarColumnas("HELLO", "CAB", "CIFRAR", "CLAVE", "CUSTOM", alfabetoCustom);
        assertEquals("HLLXEO", resultado);
    }
}
