package com.example.importorder.domain.po.state;

import com.example.importorder.entity.PurchaseOrder;

/**
 * REJECTED is a TERMINAL state.
 *
 * Once a PO is cancelled (via Site rejection or Overseas/Admin cancellation),
 * it cannot be revived — and cancelling any PO cascades the parent
 * ProcessRequest to CANCELLED (see PurchaseOrderServiceImpl#rejectPO).
 *
 * This replaces the previous REJECTED → DRAFT revision loop (old UC12):
 * cancellation is now a permanent decision.
 */
public class RejectedState implements POState {

    @Override
    public void send(PurchaseOrder po) {
        throw new IllegalStateException("REJECTED is terminal");
    }

    @Override
    public void confirm(PurchaseOrder po) {
        throw new IllegalStateException("REJECTED is terminal");
    }

    @Override
    public void reject(PurchaseOrder po, String reason) {
        throw new IllegalStateException("REJECTED is terminal");
    }

    @Override
    public void resetFromRejected(PurchaseOrder po) {
        throw new IllegalStateException("REJECTED is terminal — cannot reset");
    }

    @Override
    public void markDone(PurchaseOrder po) {
        throw new IllegalStateException("REJECTED is terminal");
    }
}
