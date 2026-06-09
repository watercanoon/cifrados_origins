package com.unjfsc.criptografia.cifrados_origin.dto;

public class CifradoRequest {
    private String texto;
    private String operacion; // "CIFRAR" o "DESCIFRAR"
    private String clave;
    private String idioma; // "ES", "EN", o "CUSTOM"
    private String alfabetoCustom; // NUEVO: Para recibir alfabetos creados por el usuario

    // Genera los Getters y Setters para todos, incluyendo el nuevo:
    public String getAlfabetoCustom() { return alfabetoCustom; }
    public void setAlfabetoCustom(String alfabetoCustom) { this.alfabetoCustom = alfabetoCustom; }

    // (Conserva tus otros getters y setters aquí...)
    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }
    public String getOperacion() { return operacion; }
    public void setOperacion(String operacion) { this.operacion = operacion; }
    public String getClave() { return clave; }
    public void setClave(String clave) { this.clave = clave; }
    public String getIdioma() { return idioma; }
    public void setIdioma(String idioma) { this.idioma = idioma; }
}