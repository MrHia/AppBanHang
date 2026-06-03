package com.example.importorder.entity;

import com.example.importorder.domain.po.state.POState;
import com.example.importorder.domain.po.state.POStateRegistry;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "purchase_order")
public class PurchaseOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_request_id")
    private ProcessRequest processRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private POStatus status = POStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_method", nullable = false)
    private DeliveryMethod deliveryMethod;

    @Column(name = "expected_delivery")
    private LocalDate expectedDelivery;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PODetail> poDetails;

    public enum POStatus { DRAFT, SENT, CONFIRMED, REJECTED, DONE }
    public enum DeliveryMethod { SHIP, AIR, LAND }

    // === State pattern wiring ===
    // Transient — not persisted; rehydrated on load via POStateRegistry.
    // No Lombok getter on this; access through state-machine methods below.
    @Transient
    @Getter(AccessLevel.NONE) @Setter(AccessLevel.NONE)
    private POState state;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        initState();
    }

    @PostLoad
    protected void initState() {
        this.state = POStateRegistry.get(this.status != null ? this.status : POStatus.DRAFT);
    }

    // === State-machine API ===
    // Delegates to current POState. Existing setStatus(...) is preserved so
    // admin / migration code can still set status directly without going
    // through the state machine.

    public void send() {
        ensureState();
        state.send(this);
    }

    public void confirm() {
        ensureState();
        state.confirm(this);
    }

    public void reject(String reason) {
        ensureState();
        state.reject(this, reason);
    }

    public void resetFromRejected() {
        ensureState();
        state.resetFromRejected(this);
    }

    public void markDone() {
        ensureState();
        state.markDone(this);
    }

    private void ensureState() {
        if (state == null) {
            initState();
        }
    }

    /**
     * Internal transition hook used by POState implementations.
     * Updates both persisted status and in-memory state holder atomically.
     */
    public void applyTransition(POStatus next, POState nextState) {
        this.status = next;
        this.state = nextState;
    }
}
