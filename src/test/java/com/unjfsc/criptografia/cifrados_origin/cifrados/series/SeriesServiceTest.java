package com.unjfsc.criptografia.cifrados_origin.cifrados.series;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SeriesServiceTest {

    private final SeriesService service = new SeriesService();

    @Test
    void testCifrarSeriesSlideExample() {
        String pt = "EL AUTENTICO SOÑADOR ES EL QUE SUEÑA IMPOSIBLES";
        String clave = "MULTIPLOS_4, IMPARES, PARES";
        String ctEsperado = "UTSDSUEMIS EATNIOOAOEEQUEÑIPSBE LECÑRLSAOL";

        String ct = service.cifrar(pt, clave);
        assertEquals(ctEsperado, ct);
    }

    @Test
    void testDescifrarSeriesSlideExample() {
        String ct = "ALZIARINMOEOGNASTLMSEOLUVAJTECEOSIKILTROPRSUD";
        String clave = "PRIMOS, MULTIPLOS_5, NATURALES";
        String ptEsperado = "LA LUZ VIAJA A TRESCIENTOS MIL KILOMETROS POR SEGUNDO";

        String pt = service.descifrar(ct, clave);
        assertEquals(ptEsperado.replaceAll("\\s+", ""), pt.replaceAll("\\s+", ""));
    }

    @Test
    void testCifrarDescifrarGeneral() {
        String pt = "MENSAGESECRETODEPRUEBA";
        String clave = "PRIMOS, IMPARES, PARES";

        String ct = service.cifrar(pt, clave);
        assertNotNull(ct);

        String decrypted = service.descifrar(ct, clave);
        assertEquals(pt.replaceAll("\\s+", ""), decrypted.replaceAll("\\s+", ""));
    }

    @Test
    void testNuevasSeriesMatematicas() {
        String pt = "ABCDEFGHIJ"; // 10 chars
        // FIBONACCI: 1, 2, 3, 5, 8. Characters: A, B, C, E, H. (5 chars)
        // CUADRADOS: 1, 4, 9. 1 already taken. Remaining: 4, 9. Characters: D, I. (2 chars)
        // CUBOS: 1, 8. Both already taken. (0 chars)
        // Leftovers (Naturales): 6, 7, 10. Characters: F, G, J. (3 chars)
        String ct = service.cifrar(pt, "FIBONACCI, CUADRADOS, CUBOS, NATURALES");
        assertEquals("ABCEH DI FGJ", ct);

        String decrypted = service.descifrar("ABCEH DI FGJ", "FIBONACCI, CUADRADOS, CUBOS, NATURALES");
        assertEquals("ABCDEFGHIJ", decrypted);
    }

    @Test
    void testNumerosCompuestosYM3() {
        String pt = "ABCDEFGHIJ"; // 10 chars
        // COMPUESTOS: 4, 6, 8, 9, 10. Characters: D, F, H, I, J. (5 chars)
        // M3 (Múltiplos de 3): 3, 6, 9. 6, 9 taken. Remaining: 3. Character: C. (1 char)
        // Leftovers: 1, 2, 5, 7. Characters: A, B, E, G. (4 chars)
        String ct = service.cifrar(pt, "COMPUESTOS, M3");
        assertEquals("DFHIJ C ABEG", ct);

        String decrypted = service.descifrar("DFHIJ C ABEG", "COMPUESTOS, M3");
        assertEquals("ABCDEFGHIJ", decrypted);
    }

    @Test
    void testClaveInvalidaVacia() {
        assertThrows(IllegalArgumentException.class, () -> {
            service.cifrar("PRUEBA", "");
        });
    }

    @Test
    void testClaveInvalidaDesconocida() {
        assertThrows(IllegalArgumentException.class, () -> {
            service.cifrar("PRUEBA", "SERIE_DESCONOCIDA");
        });
    }
}
