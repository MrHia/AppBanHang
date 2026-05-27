package com.example.importorder.repository;

import com.example.importorder.entity.RequestSite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RequestSiteRepository extends JpaRepository<RequestSite, Integer> {
    List<RequestSite> findByProcessRequestId(Integer requestId);

    Optional<RequestSite> findByProcessRequestIdAndMerchandiseId(Integer requestId, Integer merchandiseId);

    List<RequestSite> findByProcessRequestIdAndStatus(Integer requestId, RequestSite.SelectionStatus status);

    @Query("SELECT rs FROM RequestSite rs WHERE rs.processRequest.id = :requestId AND rs.status = :status")
    List<RequestSite> findByRequestAndStatus(@Param("requestId") Integer requestId, @Param("status") RequestSite.SelectionStatus status);

    @Query("SELECT DISTINCT rs.site.id FROM RequestSite rs WHERE rs.processRequest.id = :requestId AND rs.status IN :statuses")
    List<Integer> findDistinctSiteIdsByRequestAndStatuses(@Param("requestId") Integer requestId, @Param("statuses") List<RequestSite.SelectionStatus> statuses);

    @Query("SELECT DISTINCT rs.site.id FROM RequestSite rs WHERE rs.processRequest.id = :requestId AND rs.status = :status")
    List<Integer> findDistinctSiteIdsByRequestAndStatus(@Param("requestId") Integer requestId, @Param("status") RequestSite.SelectionStatus status);

    void deleteByProcessRequestId(Integer requestId);
}
