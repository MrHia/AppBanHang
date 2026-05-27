package com.example.importorder.repository;

import com.example.importorder.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Integer> {
    Optional<PurchaseOrder> findByCode(String code);
    List<PurchaseOrder> findBySiteId(Integer siteId);
    List<PurchaseOrder> findByProcessRequestId(Integer processRequestId);
    List<PurchaseOrder> findByStatus(PurchaseOrder.POStatus status);

    @Query("SELECT po FROM PurchaseOrder po WHERE po.site.id = :siteId AND po.status IN ('SENT','CONFIRMED')")
    List<PurchaseOrder> findActiveForSite(@Param("siteId") Integer siteId);
}
