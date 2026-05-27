package com.example.importorder.repository;

import com.example.importorder.entity.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SiteRepository extends JpaRepository<Site, Integer> {
    Optional<Site> findByCode(String code);
    boolean existsByCode(String code);
    List<Site> findByIsActiveTrue();
}
