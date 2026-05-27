package com.example.importorder.repository;

import com.example.importorder.entity.WarehouseReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WarehouseReceiptRepository extends JpaRepository<WarehouseReceipt, Integer> {
    List<WarehouseReceipt> findByPurchaseOrderId(Integer purchaseOrderId);
    List<WarehouseReceipt> findByStatus(WarehouseReceipt.ReceiptStatus status);
}
