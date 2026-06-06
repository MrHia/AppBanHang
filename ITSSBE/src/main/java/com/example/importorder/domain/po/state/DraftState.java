package com.example.importorder.domain.po.state;

import com.example.importorder.entity.PurchaseOrder;
import com.example.importorder.entity.PurchaseOrder.POStatus;

public class DraftState implements POState {

    @Override
    public void send(PurchaseOrder po) {
        po.applyTransition(POStatus.SENT, POStateRegistry.get(POStatus.SENT));
    }

    @Override
    public void confirm(PurchaseOrder po) {
        throw new IllegalStateException("Cannot confirm DRAFT — must send first");
    }

    @Override
    public void reject(PurchaseOrder po, String reason) {
        // Cancellation (DRAFT → REJECTED) — DRAFT POs have not deducted stock yet,
        // so stock-restore is a no-op for them (handled at the service layer).
        po.setRejectionReason(reason);
        po.applyTransition(POStatus.REJECTED, POStateRegistry.get(POStatus.REJECTED));
    }

    @Override
    public void resetFromRejected(PurchaseOrder po) {
        throw new IllegalStateException("Already DRAFT, nothing to reset");
    }

    @Override
    public void markDone(PurchaseOrder po) {
        throw new IllegalStateException("Cannot markDone DRAFT");
    }
}
