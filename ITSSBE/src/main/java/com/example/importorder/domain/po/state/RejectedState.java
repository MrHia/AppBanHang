package com.example.importorder.domain.po.state;

import com.example.importorder.entity.PurchaseOrder;
import com.example.importorder.entity.PurchaseOrder.POStatus;

public class RejectedState implements POState {

    @Override
    public void send(PurchaseOrder po) {
        throw new IllegalStateException("Cannot send REJECTED — must reset to DRAFT first");
    }

    @Override
    public void confirm(PurchaseOrder po) {
        throw new IllegalStateException("Cannot confirm REJECTED");
    }

    @Override
    public void reject(PurchaseOrder po, String reason) {
        throw new IllegalStateException("Already REJECTED");
    }

    @Override
    public void resetFromRejected(PurchaseOrder po) {
        // rejectionReason field is preserved — DO NOT clear it!
        po.applyTransition(POStatus.DRAFT, POStateRegistry.get(POStatus.DRAFT));
    }

    @Override
    public void markDone(PurchaseOrder po) {
        throw new IllegalStateException("Cannot markDone REJECTED");
    }
}
