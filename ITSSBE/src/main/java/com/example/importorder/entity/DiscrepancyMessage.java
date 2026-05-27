package com.example.importorder.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "discrepancy_message")
public class DiscrepancyMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discrepancy_id", nullable = false)
    private SiteDiscrepancy discrepancy;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false)
    private SenderType senderType;

    @Column(name = "sender_id", nullable = false)
    private Integer senderId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    public enum SenderType { WAREHOUSE, SITE }

    @PrePersist protected void onCreate() { sentAt = LocalDateTime.now(); }
}
