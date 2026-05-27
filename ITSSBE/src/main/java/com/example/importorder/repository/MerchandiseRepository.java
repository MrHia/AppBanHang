package com.example.importorder.repository;

import com.example.importorder.entity.Merchandise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MerchandiseRepository extends JpaRepository<Merchandise, Integer> {
    Optional<Merchandise> findByCode(String code);
    boolean existsByCode(String code);
}
