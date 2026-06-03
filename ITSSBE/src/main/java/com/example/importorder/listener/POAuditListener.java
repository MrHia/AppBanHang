package com.example.importorder.listener;

import com.example.importorder.event.POConfirmedEvent;
import com.example.importorder.event.PORejectedEvent;
import com.example.importorder.event.POSentEvent;
import com.example.importorder.service.IAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class POAuditListener {

    private final IAuditService auditService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPOConfirmed(POConfirmedEvent e) {
        auditService.log(null, "PO_CONFIRMED", "purchase_order", e.poId(), "PO " + e.poCode() + " confirmed by " + e.siteName());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPORejected(PORejectedEvent e) {
        auditService.log(null, "PO_REJECTED", "purchase_order", e.poId(), "Reason: " + e.reason());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPOSent(POSentEvent e) {
        auditService.log(null, "PO_SENT", "purchase_order", e.poId(), "PO " + e.poCode() + " sent to site");
    }
}
