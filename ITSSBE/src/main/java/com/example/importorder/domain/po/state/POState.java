package com.example.importorder.domain.po.state;

import com.example.importorder.entity.PurchaseOrder;

/**
 * State pattern interface for PurchaseOrder state transitions.
 * Each concrete state implements the legal transitions for that state
 * and throws IllegalStateException for illegal ones.
 */
public interface POState {
    void send(PurchaseOrder po);
    void confirm(PurchaseOrder po);
    void reject(PurchaseOrder po, String reason);
    void resetFromRejected(PurchaseOrder po);
    void markDone(PurchaseOrder po);
}
