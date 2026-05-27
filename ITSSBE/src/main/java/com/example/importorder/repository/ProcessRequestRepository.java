package com.example.importorder.repository;

import com.example.importorder.entity.ProcessRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProcessRequestRepository extends JpaRepository<ProcessRequest, Integer> {
    Optional<ProcessRequest> findByCode(String code);
    List<ProcessRequest> findByStatus(ProcessRequest.RequestStatus status);
    List<ProcessRequest> findByCreatedById(Integer createdById);

    @Query("SELECT pr FROM ProcessRequest pr LEFT JOIN FETCH pr.createdBy WHERE pr.id = :id")
    Optional<ProcessRequest> findByIdWithCreator(@Param("id") Integer id);

    @Query("SELECT pr FROM ProcessRequest pr LEFT JOIN FETCH pr.requestItems ri LEFT JOIN FETCH ri.merchandise WHERE pr.id = :id")
    Optional<ProcessRequest> findByIdWithItems(@Param("id") Integer id);
}
