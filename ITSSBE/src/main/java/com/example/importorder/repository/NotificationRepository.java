package com.example.importorder.repository;

import com.example.importorder.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    // Role-only (broadcast). Kept for ADMIN/OVERSEAS/WAREHOUSE/SALES roles
    // whose users have no site_id.
    List<Notification> findByRecipientRoleOrderByCreatedAtDesc(String recipientRole);

    @Query("SELECT n FROM Notification n WHERE n.recipientRole = :role AND n.isRead = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByRole(@Param("role") String role);

    long countByRecipientRoleAndIsReadFalse(String recipientRole);

    // Per-site filtering. A SITE user matches:
    //   (recipientRole = 'SITE') AND (recipientSiteId IS NULL OR recipientSiteId = :siteId)
    // The IS-NULL branch keeps any role-wide SITE broadcast visible to every site.
    @Query("SELECT n FROM Notification n " +
           "WHERE n.recipientRole = :role " +
           "AND (n.recipientSiteId IS NULL OR n.recipientSiteId = :siteId) " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findByRoleAndSite(@Param("role") String role, @Param("siteId") Integer siteId);

    @Query("SELECT n FROM Notification n " +
           "WHERE n.recipientRole = :role " +
           "AND (n.recipientSiteId IS NULL OR n.recipientSiteId = :siteId) " +
           "AND n.isRead = false " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByRoleAndSite(@Param("role") String role, @Param("siteId") Integer siteId);

    @Query("SELECT COUNT(n) FROM Notification n " +
           "WHERE n.recipientRole = :role " +
           "AND (n.recipientSiteId IS NULL OR n.recipientSiteId = :siteId) " +
           "AND n.isRead = false")
    long countUnreadByRoleAndSite(@Param("role") String role, @Param("siteId") Integer siteId);
}
