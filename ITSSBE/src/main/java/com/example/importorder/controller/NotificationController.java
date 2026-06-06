package com.example.importorder.controller;

import com.example.importorder.dto.*;
import com.example.importorder.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {
    private final INotificationService notificationService;
    public NotificationController(INotificationService notificationService) { this.notificationService = notificationService; }

    // siteId is optional. When present we filter so SITE users only see notifications
    // for their own site (plus role-wide broadcasts); when absent we fall back to the
    // role-only behaviour used by ADMIN/OVERSEAS/WAREHOUSE/SALES.
    @GetMapping
    public ResponseEntity<ApiResponse<Object>> getByRole(@RequestParam String role,
                                                        @RequestParam(required = false) Integer siteId) {
        if (siteId != null) {
            return ResponseEntity.ok(ApiResponse.ok(notificationService.getNotificationsByRoleAndSite(role, siteId)));
        }
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getNotificationsByRole(role)));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<Object>> getUnread(@RequestParam String role,
                                                        @RequestParam(required = false) Integer siteId) {
        if (siteId != null) {
            return ResponseEntity.ok(ApiResponse.ok(notificationService.getUnreadByRoleAndSite(role, siteId)));
        }
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUnreadByRole(role)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Object>> getUnreadCount(@RequestParam String role,
                                                              @RequestParam(required = false) Integer siteId) {
        if (siteId != null) {
            return ResponseEntity.ok(ApiResponse.ok(notificationService.getUnreadCountByRoleAndSite(role, siteId)));
        }
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUnreadCount(role)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Object>> markAsRead(@PathVariable Integer id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.ok("Marked as read", null));
    }
}
