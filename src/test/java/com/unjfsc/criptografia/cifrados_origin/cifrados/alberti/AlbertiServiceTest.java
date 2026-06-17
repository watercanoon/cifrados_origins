package com.unjfsc.criptografia.cifrados_origin.cifrados.alberti;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AlbertiServiceTest {

    private final AlbertiService service = new AlbertiService();

    @Test
    void testCifrarAlbertiLatinExample() {
        String pt = "SI FUERA PRECISO DECIR SI DILO CON VALOR";
        String clave = "K(Mb, 4, 3d)";
        String ctEsperado = "zclx cxhz tmkp etgp fu/vlh sysk itia faik";

        String ct = service.cifrar(pt, clave, "LA", null, null);
        assertEquals(ctEsperado, ct);
    }

    @Test
    void testDescifrarAlbertiLatinExample() {
        String ct = "zclx cxhz tmkp etgp fu/vlh sysk itia faik";
        String clave = "K(Mb, 4, 3d)";
        String ptEsperado = "SI FUERA PRECISO DECIR SI DILO CON VALOR";

        String pt = service.descifrar(ct, clave, "LA", null, null);
        assertEquals(ptEsperado, pt);
    }

    @Test
    void testDescifrarAlbertiLatinAlternativeExample() {
        String ct = "mgm&ifdmebovicqktvz";
        String clave = "K(Am, 3, 5d)";
        String ptEsperado = "A CADA MONARCA SU TRONO";

        String pt = service.descifrar(ct, clave, "LA", null, null);
        assertEquals(ptEsperado, pt);

        // Test alternative variation
        String ct2 = "mgm&ivbdmvboficrktfz";
        String pt2 = service.descifrar(ct2, clave, "LA", null, null);
        assertEquals(ptEsperado, pt2);
    }

    @Test
    void testCifrarDescifrarGeneralEN() {
        String pt = "TESTALBERTI";
        String clave = "K(Aa, 4, 1d)";
        
        String ct = service.cifrar(pt, clave, "EN", null, null);
        assertNotNull(ct);
        assertNotEquals(pt, ct);

        String decrypted = service.descifrar(ct, clave, "EN", null, null);
        assertEquals(pt, decrypted);
    }

    @Test
    void testClaveInvalida() {
        assertThrows(IllegalArgumentException.class, () -> {
            service.cifrar("HELLO", "giro123", "EN", null, null);
        });
    }
}
