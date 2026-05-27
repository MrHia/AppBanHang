package com.example.importorder.repository;

import com.example.importorder.entity.SiteDiscrepancy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SiteDiscrepancyRepository extends JpaRepository<SiteDiscrepancy, Integer> {
    List<SiteDiscrepancy> findByWarehouseReceiptId(Integer warehouseReceiptId);
    List<SiteDiscrepancy> findByStatus(SiteDiscrepancy.DiscrepancyStatus status);

    @Query("SELECT sd FROM SiteDiscrepancy sd " +
           "JOIN sd.warehouseReceipt wr " +
           "JOIN wr.purchaseOrder po " +
           "JOIN po.site s " +
           "WHERE s.id = :siteId " +
           "ORDER BY sd.status ASC, sd.id DESC")
    List<SiteDiscrepancy> findBySiteId(@Param("siteId") Integer siteId);
}
