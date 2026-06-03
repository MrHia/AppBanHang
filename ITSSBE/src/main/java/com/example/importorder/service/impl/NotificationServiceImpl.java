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
     * Mapper xử lý pure transformation, còn unreadCount cần query DB nên set ở service layer
     * (giữ Mapper "thin" — SRP: mapper chỉ map field, không truy DB).
     */
    private NotificationDTO toDTOWithUnreadCount(Notification n) {
        NotificationDTO d = mapper.toDTO(n);
        d.unreadCount = notificationRepo.countByRecipientRoleAndIsReadFalse(n.getRecipientRole());
        return d;
    }

    @Override
    @Transactional
    public void createNotification(String recipientRole, String title, String message, String entityType, Integer entityId) {
        Notification n = new Notification();
        n.setRecipientRole(recipientRole);
        n.setTitle(title);
        n.setMessage(message);
        n.setEntityType(entityType);
        n.setEntityId(entityId);
        n.setIsRead(false);
        notificationRepo.save(n);
    }

    @Override
    public List<NotificationDTO> getNotificationsByRole(String role) {
        return notificationRepo.findByRecipientRoleOrderByCreatedAtDesc(role).stream().map(this::toDTOWithUnreadCount).toList();
    }

    @Override
    public List<NotificationDTO> getUnreadByRole(String role) {
        return notificationRepo.findUnreadByRole(role).stream().map(this::toDTOWithUnreadCount).toList();
    }

    @Override
    @Transactional
    public void markAsRead(Integer id) {
        Notification n = notificationRepo.findById(id).orElseThrow();
        n.setIsRead(true);
        notificationRepo.save(n);
    }

    @Override
    public long getUnreadCount(String role) {
        return notificationRepo.countByRecipientRoleAndIsReadFalse(role);
    }
}
