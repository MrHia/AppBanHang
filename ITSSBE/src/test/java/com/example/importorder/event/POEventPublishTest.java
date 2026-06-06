package com.example.importorder.event;

import com.example.importorder.listener.POAuditListener;
import com.example.importorder.listener.POEmailListener;
import com.example.importorder.listener.PONotificationListener;
import com.example.importorder.service.IAuditService;
import com.example.importorder.service.IEmailService;
import com.example.importorder.service.INotificationService;
import org.junit.jupiter.api.Test;

import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

/**
 * Observer pattern (P3) tests — verify each listener correctly reacts to its event.
 *
 * The listeners are wired up via Spring's {@link org.springframework.transaction.event.TransactionalEventListener}.
 * Here we exercise them as plain POJOs to keep tests fast and focused on observer behavior:
 * each test invokes the listener method directly and asserts the downstream service was
 * called with the expected payload from the event record.
 */
class POEventPublishTest {

    @Test
    void notificationListenerCreatesNotificationOnPOConfirmed() {
        INotificationService notificationService = mock(INotificationService.class);
        PONotificationListener listener = new PONotificationListener(notificationService);

        listener.onPOConfirmed(new POConfirmedEvent(123, "PO-001", "Site US", "warehouse@system.com"));

        verify(notificationService).createNotification(
                eq("WAREHOUSE"),
                contains("PO-001"),
                contains("Site US"),
                eq("purchase_order"),
                eq(123)
        );
    }

    @Test
    void notificationListenerCreatesShortageNotificationOnDiscrepancy() {
        INotificationService notificationService = mock(INotificationService.class);
        PONotificationListener listener = new PONotificationListener(notificationService);

        listener.onDiscrepancyCreated(new DiscrepancyCreatedEvent(7, "PO-077", "site@x.com", "Site US", "Item A", 5));

        verify(notificationService).createNotification(
                eq("WAREHOUSE"),
                contains("PO-077"),
                contains("Item A"),
                eq("purchase_order"),
                eq(7)
        );
    }

    @Test
    void emailListenerSendsPOConfirmationEmail() {
        IEmailService emailService = mock(IEmailService.class);
        POEmailListener listener = new POEmailListener(emailService);

        listener.onPOConfirmed(new POConfirmedEvent(1, "PO-001", "Site US", "warehouse@system.com"));

        verify(emailService).sendPOConfirmationEmail("warehouse@system.com", "PO-001", "Site US");
    }

    @Test
    void emailListenerSendsDiscrepancyEmailWhenShortagePositive() {
        IEmailService emailService = mock(IEmailService.class);
        POEmailListener listener = new POEmailListener(emailService);

        listener.onDiscrepancyCreated(new DiscrepancyCreatedEvent(1, "PO-001", "site@x.com", "Site US", "Item A", 3));

        verify(emailService).sendDiscrepancyNotification("site@x.com", "PO-001", "Item A", 3);
    }

    @Test
    void emailListenerSkipsZeroShortageInDiscrepancy() {
        IEmailService emailService = mock(IEmailService.class);
        POEmailListener listener = new POEmailListener(emailService);

        listener.onDiscrepancyCreated(new DiscrepancyCreatedEvent(1, "PO-001", "site@x.com", "Site US", "Item A", 0));

        verifyNoInteractions(emailService);
    }

    @Test
    void auditListenerLogsPOConfirmed() {
        IAuditService auditService = mock(IAuditService.class);
        POAuditListener listener = new POAuditListener(auditService);

        listener.onPOConfirmed(new POConfirmedEvent(99, "PO-099", "Site US", "warehouse@system.com"));

        verify(auditService).log(
                isNull(),
                eq("PO_CONFIRMED"),
                eq("purchase_order"),
                eq(99),
                contains("PO-099")
        );
    }

    @Test
    void auditListenerLogsPORejectedWithReason() {
        IAuditService auditService = mock(IAuditService.class);
        POAuditListener listener = new POAuditListener(auditService);

        listener.onPORejected(new PORejectedEvent(55, "PO-055", "Out of stock"));

        verify(auditService).log(
                isNull(),
                eq("PO_REJECTED"),
                eq("purchase_order"),
                eq(55),
                contains("Out of stock")
        );
    }

    @Test
    void auditListenerLogsPOSent() {
        IAuditService auditService = mock(IAuditService.class);
        POAuditListener listener = new POAuditListener(auditService);

        listener.onPOSent(new POSentEvent(11, "PO-011", 7, "Site US"));

        verify(auditService).log(
                isNull(),
                eq("PO_SENT"),
                eq("purchase_order"),
                eq(11),
                contains("PO-011")
        );
    }

    @Test
    void notificationListenerNotifiesTargetSiteOnPOSent() {
        INotificationService notificationService = mock(INotificationService.class);
        PONotificationListener listener = new PONotificationListener(notificationService);

        listener.onPOSent(new POSentEvent(42, "PO-042", 7, "Site US"));

        // Uses the per-site overload so only Site US's users see the bell update.
        verify(notificationService).createNotification(
                eq("SITE"),
                eq(7),
                contains("PO-042"),
                contains("PO-042"),
                eq("purchase_order"),
                eq(42)
        );
    }
}
