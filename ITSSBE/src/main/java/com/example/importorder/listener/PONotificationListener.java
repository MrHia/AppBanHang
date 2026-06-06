package com.example.importorder.listener;

import com.example.importorder.event.DiscrepancyCreatedEvent;
import com.example.importorder.event.POConfirmedEvent;
import com.example.importorder.event.POSentEvent;
import com.example.importorder.service.INotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class PONotificationListener {

    private final INotificationService notificationService;

    /**
     * Bell-icon notification for the target Site whenever Overseas dispatches
     * a Purchase Order. Published by both the explicit DRAFT→SENT state machine
     * call and by the batch-creation shortcut in ProcessRequestServiceImpl.
     *
     * Uses the per-site overload so only users of that specific site see the
     * unread badge — not every SITE user across all countries.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPOSent(POSentEvent e) {
        notificationService.createNotification(
                "SITE",
                e.siteId(),
                "PO mới - " + e.poCode(),
                "Bạn vừa nhận được PO #" + e.poCode() + " từ Overseas. Vui lòng xem chi tiết và xác nhận.",
                "purchase_order",
                e.poId()
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPOConfirmed(POConfirmedEvent e) {
        notificationService.createNotification(
                "WAREHOUSE",
                "PO đã xác nhận - " + e.poCode(),
                "Site " + e.siteName() + " đã xác nhận PO #" + e.poCode() + ". Vui lòng chuẩn bị nhận hàng.",
                "purchase_order",
                e.poId()
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onDiscrepancyCreated(DiscrepancyCreatedEvent e) {
        notificationService.createNotification(
                "WAREHOUSE",
                "Chênh lệch hàng hóa - " + e.poCode(),
                "PO #" + e.poCode() + ": " + e.merchandiseName() + " thiếu " + e.shortage() + " chiếc. Vui lòng phối hợp với Site " + e.siteName() + " giải quyết.",
                "purchase_order",
                e.poId()
        );
    }
}
