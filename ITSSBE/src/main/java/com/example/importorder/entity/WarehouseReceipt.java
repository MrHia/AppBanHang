package com.example.importorder.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "warehouse_receipt")
public class WarehouseReceipt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_by", nullable = false)
    private Account receivedBy;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ReceiptStatus status = ReceiptStatus.PENDING;

    @OneToMany(mappedBy = "warehouseReceipt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReceiptItem> receiptItems;

    @OneToMany(mappedBy = "warehouseReceipt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SiteDiscrepancy> discrepancies;

    public enum ReceiptStatus { PENDING, DONE, RESOLVING }

    @PrePersist protected void onCreate() { receivedAt = LocalDateTime.now(); }
}
