package com.unjfsc.criptografia.cifrados_origin.cifrados.playfair;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PlayfairServiceTest {

    private final PlayfairService service = new PlayfairService();

    @Test
    void testEncryptDecryptBasicEN() {
        String pt = "PLAYFAIR";
        String clave = "KEYWORD";
        
        String ct = service.procesarPlayfair(pt, clave, "CIFRAR", "EN", null, false);
        assertNotNull(ct);
        assertNotEquals(pt, ct);

        // Without padding removal
        String decryptedWithout = service.procesarPlayfair(ct, clave, "DESCIFRAR", "EN", null, false);
        assertEquals("playfair", decryptedWithout);
    }

    @Test
    void testEncryptDecryptWithDuplicatesAndPadding() {
        String pt = "HELLO";
        String clave = "KEYWORD";

        String ct = service.procesarPlayfair(pt, clave, "CIFRAR", "EN", null, false);
        assertNotNull(ct);

        // With padding removal disabled (false): should keep 'X'
        String decryptedWithout = service.procesarPlayfair(ct, clave, "DESCIFRAR", "EN", null, false);
        assertEquals("helxlo", decryptedWithout);

        // With padding removal enabled (true): should return 'hello'
        String decryptedWith = service.procesarPlayfair(ct, clave, "DESCIFRAR", "EN", null, true);
        assertEquals("hello", decryptedWith);
    }

    @Test
    void testEncryptDecryptWithLlama() {
        String pt = "LLAMA";
        String clave = "KEYWORD";

        String ct = service.procesarPlayfair(pt, clave, "CIFRAR", "EN", null, false);
        assertNotNull(ct);

        // With padding removal disabled:
        String decryptedWithout = service.procesarPlayfair(ct, clave, "DESCIFRAR", "EN", null, false);
        assertEquals("lxlama", decryptedWithout);

        // With padding removal enabled:
        String decryptedWith = service.procesarPlayfair(ct, clave, "DESCIFRAR", "EN", null, true);
        assertEquals("llama", decryptedWith);
    }

    @Test
    void testCustomAlphabetPlayfair() {
        String pt = "SECRET";
        String clave = "KEY";
        String customAlphabet = "XYZWKVBCDFGHIMNOPQRSTUAEI"; // Custom 25 chars
        
        String ct = service.procesarPlayfair(pt, clave, "CIFRAR", "CUSTOM", customAlphabet, false);
        assertNotNull(ct);

        String decrypted = service.procesarPlayfair(ct, clave, "DESCIFRAR", "CUSTOM", customAlphabet, true);
        assertEquals("secret", decrypted);
    }

    @Test
    void testEmptyTextThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> {
            service.procesarPlayfair("", "KEY", "CIFRAR", "EN", null, false);
        });
    }
}
