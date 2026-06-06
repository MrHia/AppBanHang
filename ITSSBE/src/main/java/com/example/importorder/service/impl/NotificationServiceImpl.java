package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.mapper.NotificationMapper;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class NotificationServiceImpl implements INotificationService {

    private final NotificationRepository notificationRepo;
    private final NotificationMapper mapper;

    public NotificationServiceImpl(NotificationRepository notificationRepo, NotificationMapper mapper) {
        this.notificationRepo = notificationRepo;
        this.mapper = mapper;
    }

    /**
     * Mapper xử lý pure transformation; unreadCount cần query DB nên set ở service layer
     * để giữ Mapper "thin" (SRP). When a siteId is known, count per (role, site); otherwise
     * fall back to the role-only count.
     */
    private NotificationDTO toDTOWithUnreadCount(Notification n, Integer siteIdContext) {
        NotificationDTO d = mapper.toDTO(n);
        d.unreadCount = siteIdContext != null
                ? notificationRepo.countUnreadByRoleAndSite(n.getRecipientRole(), siteIdContext)
                : notificationRepo.countByRecipientRoleAndIsReadFalse(n.getRecipientRole());
        return d;
    }

    @Override
    @Transactional
    public void createNotification(String recipientRole, String title, String message, String entityType, Integer entityId) {
        createNotification(recipientRole, null, title, message, entityType, entityId);
    }

    @Override
    @Transactional
    public void createNotification(String recipientRole, Integer recipientSiteId, String title, String message, String entityType, Integer entityId) {
        Notification n = new Notification();
        n.setRecipientRole(recipientRole);
        n.setRecipientSiteId(recipientSiteId);
        n.setTitle(title);
        n.setMessage(message);
        n.setEntityType(entityType);
        n.setEntityId(entityId);
        n.setIsRead(false);
        notificationRepo.save(n);
    }

    @Override
    public List<NotificationDTO> getNotificationsByRole(String role) {
        return notificationRepo.findByRecipientRoleOrderByCreatedAtDesc(role).stream()
                .map(n -> toDTOWithUnreadCount(n, null)).toList();
    }

    @Override
    public List<NotificationDTO> getUnreadByRole(String role) {
        return notificationRepo.findUnreadByRole(role).stream()
                .map(n -> toDTOWithUnreadCount(n, null)).toList();
    }

    @Override
    public long getUnreadCount(String role) {
        return notificationRepo.countByRecipientRoleAndIsReadFalse(role);
    }

    @Override
    public List<NotificationDTO> getNotificationsByRoleAndSite(String role, Integer siteId) {
        return notificationRepo.findByRoleAndSite(role, siteId).stream()
                .map(n -> toDTOWithUnreadCount(n, siteId)).toList();
    }

    @Override
    public List<NotificationDTO> getUnreadByRoleAndSite(String role, Integer siteId) {
        return notificationRepo.findUnreadByRoleAndSite(role, siteId).stream()
                .map(n -> toDTOWithUnreadCount(n, siteId)).toList();
    }

    @Override
    public long getUnreadCountByRoleAndSite(String role, Integer siteId) {
        return notificationRepo.countUnreadByRoleAndSite(role, siteId);
    }

    @Override
    @Transactional
    public void markAsRead(Integer id) {
        Notification n = notificationRepo.findById(id).orElseThrow();
        n.setIsRead(true);
        notificationRepo.save(n);
    }
}
