package com.example.importorder.domain.po.state;

import com.example.importorder.entity.PurchaseOrder;
import com.example.importorder.entity.PurchaseOrder.POStatus;
import java.time.LocalDateTime;

public class SentState implements POState {

    @Override
    public void send(PurchaseOrder po) {
        throw new IllegalStateException("Already SENT");
    }

    @Override
    public void confirm(PurchaseOrder po) {
        po.setConfirmedAt(LocalDateTime.now());
        po.applyTransition(POStatus.CONFIRMED, POStateRegistry.get(POStatus.CONFIRMED));
    }

    @Override
    public void reject(PurchaseOrder po, String reason) {
        po.setRejectionReason(reason);
        po.applyTransition(POStatus.REJECTED, POStateRegistry.get(POStatus.REJECTED));
    }

    @Override
    public void resetFromRejected(PurchaseOrder po) {
        throw new IllegalStateException("Cannot resetFromRejected SENT — only REJECTED can be reset");
    }

    @Override
    public void markDone(PurchaseOrder po) {
        throw new IllegalStateException("Cannot markDone SENT — must be CONFIRMED first");
    }
}
