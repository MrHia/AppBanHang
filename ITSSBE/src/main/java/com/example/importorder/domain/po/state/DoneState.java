package com.example.importorder.domain.po.state;

import com.example.importorder.entity.PurchaseOrder;

public class DoneState implements POState {

    @Override
    public void send(PurchaseOrder po) {
        throw new IllegalStateException("Cannot send DONE — terminal state");
    }

    @Override
    public void confirm(PurchaseOrder po) {
        throw new IllegalStateException("Cannot confirm DONE — terminal state");
    }

    @Override
    public void reject(PurchaseOrder po, String reason) {
        throw new IllegalStateException("Cannot reject DONE — terminal state");
    }

    @Override
    public void resetFromRejected(PurchaseOrder po) {
        throw new IllegalStateException("Cannot resetFromRejected DONE — terminal state");
    }

    @Override
    public void markDone(PurchaseOrder po) {
        throw new IllegalStateException("Already DONE — terminal state");
    }
}
