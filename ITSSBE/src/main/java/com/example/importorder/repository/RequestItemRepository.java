package com.example.importorder.repository;

import com.example.importorder.entity.RequestItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RequestItemRepository extends JpaRepository<RequestItem, Integer> {
    List<RequestItem> findByProcessRequestId(Integer processRequestId);
    void deleteByProcessRequestId(Integer processRequestId);
    boolean existsByProcessRequestIdAndMerchandiseId(Integer processRequestId, Integer merchandiseId);
    List<RequestItem> findByProcessRequestIdAndMerchandiseId(Integer processRequestId, Integer merchandiseId);
}
