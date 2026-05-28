package com.unjfsc.criptografia.cifrados_origin.repository;

import com.unjfsc.criptografia.cifrados_origin.model.HistorialCifrado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HistorialCifradoRepository extends JpaRepository<HistorialCifrado, Long> {
}