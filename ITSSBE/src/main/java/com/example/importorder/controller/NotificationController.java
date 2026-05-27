package com.example.importorder.controller;

import com.example.importorder.dto.*;
import com.example.importorder.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {
    private final INotificationService notificationService;
    public NotificationController(INotificationService notificationService) { this.notificationService = notificationService; }

    @GetMapping
    public ResponseEntity<ApiResponse<Object>> getByRole(@RequestParam String role) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getNotificationsByRole(role)));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<Object>> getUnread(@RequestParam String role) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUnreadByRole(role)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Object>> getUnreadCount(@RequestParam String role) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUnreadCount(role)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Object>> markAsRead(@PathVariable Integer id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.ok("Marked as read", null));
    }
}
