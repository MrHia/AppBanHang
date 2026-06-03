package com.example.importorder.listener;

import com.example.importorder.event.DiscrepancyCreatedEvent;
import com.example.importorder.event.POConfirmedEvent;
import com.example.importorder.service.IEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class POEmailListener {

    private final IEmailService emailService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPOConfirmed(POConfirmedEvent e) {
        emailService.sendPOConfirmationEmail(e.warehouseEmail(), e.poCode(), e.siteName());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onDiscrepancyCreated(DiscrepancyCreatedEvent e) {
        if (e.shortage() > 0) {
            emailService.sendDiscrepancyNotification(e.siteEmail(), e.poCode(), e.merchandiseName(), e.shortage());
        }
    }
}
