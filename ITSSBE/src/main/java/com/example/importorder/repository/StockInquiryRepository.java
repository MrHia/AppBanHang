package com.example.importorder.repository;

import com.example.importorder.entity.StockInquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockInquiryRepository extends JpaRepository<StockInquiry, Integer> {
    List<StockInquiry> findByProcessRequestId(Integer processRequestId);
    List<StockInquiry> findBySiteId(Integer siteId);
    List<StockInquiry> findByStatus(StockInquiry.InquiryStatus status);

    @Query("SELECT si FROM StockInquiry si WHERE si.site.id = :siteId AND si.status NOT IN ('RESPONDED','TIMEOUT')")
    List<StockInquiry> findPendingForSite(@Param("siteId") Integer siteId);

    @Query("SELECT si FROM StockInquiry si WHERE si.processRequest.id = :requestId AND si.site.id = :siteId")
    List<StockInquiry> findByRequestAndSite(@Param("requestId") Integer requestId, @Param("siteId") Integer siteId);

    List<StockInquiry> findByStatusAndTimeoutAtBefore(StockInquiry.InquiryStatus status, LocalDateTime before);
}
