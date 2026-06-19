package com.unjfsc.criptografia.cifrados_origin.cifrados.grupos;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class GruposServiceTest {

    private final GruposService service = new GruposService();

    @Test
    void testCifrarGruposSlideExample() {
        String pt = "TODAS LAS NACIONES DE LA ONU SON MANTENEDORAS DE LA PAZ";
        String clave = "1 3 5 4 2";
        String ctEsperado = "TDSAO LSANA COENI SEALD OUOSN NMNAA TSEDE LPZAA";

        String ct = service.cifrar(pt, clave, true);
        assertEquals(ctEsperado, ct);
    }

    @Test
    void testDescifrarGruposSlideExample() {
        String ct = "HIELEGNO EQLCAEOU REEEDBYL OONLAETL EEPUQEUD";
        String clave = "8 6 4 2 1 3 5 7";
        String ptEsperado = "EL GENIO HACE LO QUE DEBE Y EL TALENTO LO QUE PUEDE";

        String pt = service.descifrar(ct, clave, true);
        assertEquals(ptEsperado, pt);
    }

    @Test
    void testCifrarDescifrarGeneral() {
        String pt = "PERMUTACIONPERIODICA";
        String clave = "1 3 5 4 2";

        String ct = service.cifrar(pt, clave, true);
        assertNotNull(ct);
        assertNotEquals(pt, ct);

        String decrypted = service.descifrar(ct, clave, true);
        assertEquals(pt, decrypted);
    }

    @Test
    void testClaveInvalidaDuplicado() {
        // Contiene duplicado '3'
        assertThrows(IllegalArgumentException.class, () -> {
            service.cifrar("TODAS", "1 3 3 4 2", true);
        });
    }

    @Test
    void testClaveInvalidaFueraDeRango() {
        // '6' está fuera del rango [1, 5]
        assertThrows(IllegalArgumentException.class, () -> {
            service.cifrar("TODAS", "1 3 6 4 2", true);
        });
    }

    @Test
    void testClaveInvalidaCaracteresNoPermitidos() {
        assertThrows(IllegalArgumentException.class, () -> {
            service.cifrar("TODAS", "1 3 A 4 2", true);
        });
    }
}
