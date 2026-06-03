package com.example.importorder.domain.po.state;

import com.example.importorder.entity.PurchaseOrder;
import com.example.importorder.entity.PurchaseOrder.POStatus;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for the State pattern (P2) on PurchaseOrder.
 *
 * Each test exercises ONE transition rule on ONE concrete POState, asserting
 * either a successful transition (status flips + side-effects applied) or a
 * thrown {@link IllegalStateException} for illegal transitions.
 *
 * The public API of {@link PurchaseOrder} (send/confirm/reject/...) delegates
 * to the current {@link POState}; {@code ensureState()} lazily initialises the
 * state holder, so tests can build a PO with just a status and call the
 * transition methods directly — no reflection or JPA lifecycle required.
 */
class POStateTest {

    /**
     * Build a PurchaseOrder pinned to the given starting status.
     * The transient state holder is rehydrated lazily on the first
     * transition call via {@code PurchaseOrder.ensureState()}.
     */
    private PurchaseOrder po(POStatus initialStatus) {
        PurchaseOrder po = new PurchaseOrder();
        po.setStatus(initialStatus);
        return po;
    }

    // --- DRAFT ---------------------------------------------------------------

    @Test
    void draftStateAllowsSend() {
        PurchaseOrder po = po(POStatus.DRAFT);

        po.send();

        assertThat(po.getStatus()).isEqualTo(POStatus.SENT);
    }

    @Test
    void draftStateRejectsConfirm() {
        PurchaseOrder po = po(POStatus.DRAFT);

        assertThatThrownBy(po::confirm)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DRAFT");

        assertThat(po.getStatus()).isEqualTo(POStatus.DRAFT);
    }

    // --- SENT ----------------------------------------------------------------

    @Test
    void sentStateAllowsConfirm() {
        PurchaseOrder po = po(POStatus.SENT);
        assertThat(po.getConfirmedAt()).isNull();

        po.confirm();

        assertThat(po.getStatus()).isEqualTo(POStatus.CONFIRMED);
        assertThat(po.getConfirmedAt())
                .as("confirm() must stamp confirmedAt on the SENT -> CONFIRMED transition")
                .isNotNull();
    }

    @Test
    void sentStateAllowsReject() {
        PurchaseOrder po = po(POStatus.SENT);

        po.reject("out of stock");

        assertThat(po.getStatus()).isEqualTo(POStatus.REJECTED);
        assertThat(po.getRejectionReason()).isEqualTo("out of stock");
    }

    // --- REJECTED ------------------------------------------------------------

    /**
     * The reset-from-rejected transition must preserve the rejectionReason
     * field. This was the original bug encoded into the State pattern:
     * RejectedState.resetFromRejected() intentionally does NOT clear the
     * reason so that history is retained when the PO loops back to DRAFT.
     */
    @Test
    void rejectedStateResetPreservesReason() {
        PurchaseOrder po = po(POStatus.REJECTED);
        po.setRejectionReason("out of stock");

        po.resetFromRejected();

        assertThat(po.getStatus()).isEqualTo(POStatus.DRAFT);
        assertThat(po.getRejectionReason())
                .as("resetFromRejected() must NOT wipe the historical rejectionReason")
                .isEqualTo("out of stock");
    }

    // --- CONFIRMED -----------------------------------------------------------

    @Test
    void confirmedStateAllowsMarkDone() {
        PurchaseOrder po = po(POStatus.CONFIRMED);

        po.markDone();

        assertThat(po.getStatus()).isEqualTo(POStatus.DONE);
    }

    // --- DONE (terminal) -----------------------------------------------------

    @Test
    void doneStateIsTerminal() {
        PurchaseOrder done = po(POStatus.DONE);

        assertThatThrownBy(done::send)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DONE");
        assertThatThrownBy(done::confirm)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DONE");
        assertThatThrownBy(() -> done.reject("late"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DONE");
        assertThatThrownBy(done::resetFromRejected)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DONE");
        assertThatThrownBy(done::markDone)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DONE");

        assertThat(done.getStatus())
                .as("terminal state must not mutate on illegal transition attempts")
                .isEqualTo(POStatus.DONE);
    }
}
