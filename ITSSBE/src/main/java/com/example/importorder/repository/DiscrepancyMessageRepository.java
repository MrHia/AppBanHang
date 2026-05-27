package com.example.importorder.repository;

import com.example.importorder.entity.DiscrepancyMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DiscrepancyMessageRepository extends JpaRepository<DiscrepancyMessage, Integer> {
    List<DiscrepancyMessage> findByDiscrepancyIdOrderBySentAtAsc(Integer discrepancyId);
}
