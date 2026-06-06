package com.example.importorder.service;

import com.example.importorder.dto.*;
import java.util.List;

public interface INotificationService {
    // Role-wide broadcast (recipient_site_id = NULL). Used for WAREHOUSE/OVERSEAS notifications
    // whose users do not have a site.
    void createNotification(String recipientRole, String title, String message, String entityType, Integer entityId);

    // Per-site notification (recipient_site_id = siteId). Used when a notification
    // targets exactly one site, e.g. "PO X has been sent to your site".
    // Pass null for siteId to fall back to broadcast semantics.
    void createNotification(String recipientRole, Integer recipientSiteId, String title, String message, String entityType, Integer entityId);

    // Role-wide read (kept for roles without a site).
    List<NotificationDTO> getNotificationsByRole(String role);
    List<NotificationDTO> getUnreadByRole(String role);
    long getUnreadCount(String role);

    // Per-site read for SITE users. Returns both role-broadcast rows (recipient_site_id IS NULL)
    // and rows targeting exactly the requested site.
    List<NotificationDTO> getNotificationsByRoleAndSite(String role, Integer siteId);
    List<NotificationDTO> getUnreadByRoleAndSite(String role, Integer siteId);
    long getUnreadCountByRoleAndSite(String role, Integer siteId);

    void markAsRead(Integer id);
}
