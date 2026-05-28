package com.unjfsc.criptografia.cifrados_origin.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "historial_cifrados")
@Data
@NoArgsConstructor
public class HistorialCifrado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String algoritmo;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String textoOriginal;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String textoResultado;

    @Column(nullable = true)
    private String claveUsada;

    @Column(nullable = false)
    private String operacion; // "CIFRADO" o "DESCIFRADO"

    @Column(nullable = false)
    private LocalDateTime fechaHora;

    @PrePersist
    protected void onCreate() {
        this.fechaHora = LocalDateTime.now();
    }
}