package com.example.importorder.repository;

import com.example.importorder.entity.RequestSite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RequestSiteRepository extends JpaRepository<RequestSite, Integer> {
    List<RequestSite> findByProcessRequestId(Integer requestId);

    Optional<RequestSite> findByProcessRequestIdAndMerchandiseId(Integer requestId, Integer merchandiseId);

    // Multi-site: tra cứu theo (request, merchandise, site) cho luồng chọn nhiều site/mặt hàng
    Optional<RequestSite> findByProcessRequestIdAndMerchandiseIdAndSiteId(Integer requestId, Integer merchandiseId, Integer siteId);

    List<RequestSite> findByProcessRequestIdAndStatus(Integer requestId, RequestSite.SelectionStatus status);

    void deleteByProcessRequestId(Integer requestId);
}
