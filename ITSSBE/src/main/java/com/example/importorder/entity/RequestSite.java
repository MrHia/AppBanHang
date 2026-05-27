package com.example.importorder.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "request_site",
    uniqueConstraints = @UniqueConstraint(columnNames = {"process_request_id", "merchandise_id"}))
public class RequestSite {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_request_id", nullable = false)
    private ProcessRequest processRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = true)
    private Site site;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchandise_id", nullable = false)
    private Merchandise merchandise;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SelectionStatus status = SelectionStatus.PICKED;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum SelectionStatus { PICKED, REJECTED, INQUIRY_SENT, RESPONDED, TIMEOUT }

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
