package com.example.importorder.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "notification")
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "recipient_role", nullable = false, length = 50)
    private String recipientRole;

    // Per-site addressing. NULL = broadcast to every user in the role
    // (preserves the original "WAREHOUSE", "OVERSEAS" notification semantics).
    // Non-null = only the user whose account.site_id matches this value sees it
    // (used for "PO X has been sent to your site" notifications).
    @Column(name = "recipient_site_id")
    private Integer recipientSiteId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "entity_type", length = 50)
    private String entityType;

    @Column(name = "entity_id")
    private Integer entityId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
