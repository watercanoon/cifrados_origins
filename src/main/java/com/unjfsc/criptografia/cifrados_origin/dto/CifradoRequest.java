package com.unjfsc.criptografia.cifrados_origin.dto;

public class CifradoRequest {
    private String texto;
    private String operacion; // "CIFRAR" o "DESCIFRAR"
    private String clave;
    private String idioma; // "ES", "EN", o "CUSTOM"
    private String alfabetoCustom; // NUEVO: Para recibir alfabetos creados por el usuario
    private String alfabetoCustomExt; // Para el disco fijo (Exterior)
    private String alfabetoCustomInt; // Para el disco móvil (Interior)
    private String tipoColumnas; // NUEVO: Para el modo de transposición por columnas ("SIMPLE" o "CLAVE")
    private String tipoFilas; // NUEVO: Para el modo de transposición por filas ("SIMPLE" o "CLAVE")

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
    public String getAlfabetoCustomExt() { return alfabetoCustomExt; }
    public void setAlfabetoCustomExt(String alfabetoCustomExt) { this.alfabetoCustomExt = alfabetoCustomExt; }

    public String getAlfabetoCustomInt() { return alfabetoCustomInt; }
    public void setAlfabetoCustomInt(String alfabetoCustomInt) { this.alfabetoCustomInt = alfabetoCustomInt; }

    public String getTipoColumnas() { return tipoColumnas; }
    public void setTipoColumnas(String tipoColumnas) { this.tipoColumnas = tipoColumnas; }

    public String getTipoFilas() { return tipoFilas; }
    public void setTipoFilas(String tipoFilas) { this.tipoFilas = tipoFilas; }
}