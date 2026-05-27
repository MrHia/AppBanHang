package com.example.importorder.repository;

import com.example.importorder.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByRecipientRoleOrderByCreatedAtDesc(String recipientRole);

    @Query("SELECT n FROM Notification n WHERE n.recipientRole = :role AND n.isRead = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByRole(@Param("role") String role);

    long countByRecipientRoleAndIsReadFalse(String recipientRole);
}
