package com.unjfsc.criptografia.cifrados_origin.cifrados.escitala;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class EscitalaServiceTest {

    private final EscitalaService service = new EscitalaService();

    @Test
    void testCifrarEscitalaBasic() {
        // Texto: HOLA MUNDO (len = 10, con espacios = 9 sin espacios)
        // Clave: 4
        // Relleno esperado: HOLAMUNDOXXX (longitud 12)
        // Matriz 3 filas, 4 columnas llenada col-por-col:
        // H A N X
        // O M D X
        // L U O X
        // Lectura fila-por-fila: HANXOMDXLUOX
        String resultado = service.procesarEscitala("HOLA MUNDO", 4, "CIFRAR");
        assertEquals("HANXOMDXLUOX", resultado);
    }

    @Test
    void testDescifrarEscitalaBasic() {
        // Criptograma: HANXOMDXLUOX
        // Clave: 4
        // Debería reconstruirse a: HOLAMUNDOXXX
        String resultado = service.procesarEscitala("HANXOMDXLUOX", 4, "DESCIFRAR");
        assertEquals("HOLAMUNDOXXX", resultado);
    }

    @Test
    void testShortTextOrInvalidColumns() {
        // Un texto corto se rellena con X para completar el diámetro
        assertEquals("HXXX", service.procesarEscitala("H", 4, "CIFRAR"));
        
        // Diámetro menor o igual a 1 debe lanzar una excepción
        assertThrows(IllegalArgumentException.class, () -> {
            service.procesarEscitala("HOLA", 1, "CIFRAR");
        });
    }
}
