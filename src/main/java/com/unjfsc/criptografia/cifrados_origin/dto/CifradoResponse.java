package com.unjfsc.criptografia.cifrados_origin.dto;

public class CifradoResponse {
    private String resultado;
    private String metodo;
    private String error; // Nuevo campo para UX

    public CifradoResponse() {
    }

    // Constructor para respuestas exitosas (Mantiene compatibilidad con otros cifrados)
    public CifradoResponse(String resultado, String metodo) {
        this.resultado = resultado;
        this.metodo = metodo;
        this.error = null;
    }

    // Constructor con manejo de errores
    public CifradoResponse(String resultado, String metodo, String error) {
        this.resultado = resultado;
        this.metodo = metodo;
        this.error = error;
    }

    // Getters y Setters...
    public String getResultado() { return resultado; }
    public void setResultado(String resultado) { this.resultado = resultado; }

    public String getMetodo() { return metodo; }
    public void setMetodo(String metodo) { this.metodo = metodo; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}