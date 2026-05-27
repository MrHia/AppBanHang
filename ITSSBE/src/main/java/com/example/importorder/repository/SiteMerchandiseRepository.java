package com.example.importorder.repository;

import com.example.importorder.entity.SiteMerchandise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SiteMerchandiseRepository extends JpaRepository<SiteMerchandise, Integer> {
    List<SiteMerchandise> findBySiteId(Integer siteId);
    List<SiteMerchandise> findByMerchandiseId(Integer merchandiseId);
    Optional<SiteMerchandise> findBySiteIdAndMerchandiseId(Integer siteId, Integer merchandiseId);
    boolean existsBySiteIdAndMerchandiseId(Integer siteId, Integer merchandiseId);

    @Query("SELECT sm FROM SiteMerchandise sm WHERE sm.site.id = :siteId AND sm.merchandise.id IN :merchandiseIds AND sm.isActive = true")
    List<SiteMerchandise> findBySiteIdAndMerchandiseIds(@Param("siteId") Integer siteId, @Param("merchandiseIds") List<Integer> merchandiseIds);

    @Query("SELECT DISTINCT sm.site.id FROM SiteMerchandise sm WHERE sm.merchandise.id IN :merchandiseIds AND sm.isActive = true")
    List<Integer> findSiteIdsSellingMerchandise(@Param("merchandiseIds") List<Integer> merchandiseIds);

    List<SiteMerchandise> findBySiteIdAndIsActiveTrue(Integer siteId);
}
