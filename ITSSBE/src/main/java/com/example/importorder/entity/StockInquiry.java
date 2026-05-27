package com.example.importorder.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "stock_inquiry")
public class StockInquiry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_request_id", nullable = false)
    private ProcessRequest processRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private InquiryStatus status = InquiryStatus.PENDING;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "timeout_at")
    private LocalDateTime timeoutAt;

    @OneToMany(mappedBy = "stockInquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StockInquiryItem> inquiryItems;

    public enum InquiryStatus { PENDING, RESPONDED, PARTIAL, TIMEOUT }

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
