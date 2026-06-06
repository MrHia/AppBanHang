package com.example.importorder.listener;

import com.example.importorder.event.DiscrepancyCreatedEvent;
import com.example.importorder.event.POConfirmedEvent;
import com.example.importorder.service.INotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class PONotificationListener {

    private final INotificationService notificationService;

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
