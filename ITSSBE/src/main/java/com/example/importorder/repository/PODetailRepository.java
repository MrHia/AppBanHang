package com.example.importorder.repository;

import com.example.importorder.entity.PODetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PODetailRepository extends JpaRepository<PODetail, Integer> {
    List<PODetail> findByPurchaseOrderId(Integer purchaseOrderId);
    void deleteByPurchaseOrderId(Integer purchaseOrderId);
}
