package com.example.importorder.service;

import com.example.importorder.dto.*;
import java.util.List;

public interface INotificationService {
    void createNotification(String recipientRole, String title, String message, String entityType, Integer entityId);
    List<NotificationDTO> getNotificationsByRole(String role);
    List<NotificationDTO> getUnreadByRole(String role);
    void markAsRead(Integer id);
    long getUnreadCount(String role);
}
