package com.example.importorder.domain.po.state;

import com.example.importorder.entity.PurchaseOrder;
import com.example.importorder.entity.PurchaseOrder.POStatus;

public class ConfirmedState implements POState {

    @Override
    public void send(PurchaseOrder po) {
        throw new IllegalStateException("Cannot send CONFIRMED — already confirmed");
    }

    @Override
    public void confirm(PurchaseOrder po) {
        throw new IllegalStateException("Already CONFIRMED");
    }

    @Override
    public void reject(PurchaseOrder po, String reason) {
        throw new IllegalStateException("Cannot reject CONFIRMED");
    }

    @Override
    public void resetFromRejected(PurchaseOrder po) {
        throw new IllegalStateException("Cannot resetFromRejected CONFIRMED");
    }

    @Override
    public void markDone(PurchaseOrder po) {
        po.applyTransition(POStatus.DONE, POStateRegistry.get(POStatus.DONE));
    }
}
