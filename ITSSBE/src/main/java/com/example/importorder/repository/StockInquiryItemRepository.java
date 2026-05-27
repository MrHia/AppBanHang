package com.example.importorder.repository;

import com.example.importorder.entity.StockInquiryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StockInquiryItemRepository extends JpaRepository<StockInquiryItem, Integer> {
    List<StockInquiryItem> findByStockInquiryId(Integer stockInquiryId);
}
