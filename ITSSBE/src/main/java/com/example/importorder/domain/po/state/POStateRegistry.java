package com.example.importorder.domain.po.state;

import com.example.importorder.entity.PurchaseOrder.POStatus;
import java.util.EnumMap;
import java.util.Map;

/**
 * Singleton registry of POState instances — one per POStatus.
 * Not a Spring bean. Pure static utility because:
 *   1. States are stateless / immutable — safe to share.
 *   2. JPA entities (PurchaseOrder) are not Spring-managed,
 *      so they cannot easily inject a @Component bean.
 *   3. Reusing singletons avoids GC churn on every @PostLoad.
 */
public final class POStateRegistry {

    private static final Map<POStatus, POState> STATES;

    static {
        Map<POStatus, POState> map = new EnumMap<>(POStatus.class);
        map.put(POStatus.DRAFT, new DraftState());
        map.put(POStatus.SENT, new SentState());
        map.put(POStatus.CONFIRMED, new ConfirmedState());
        map.put(POStatus.REJECTED, new RejectedState());
        map.put(POStatus.DONE, new DoneState());
        STATES = Map.copyOf(map);
    }

    private POStateRegistry() {
        // no instances
    }

    public static POState get(POStatus status) {
        POState state = STATES.get(status);
        if (state == null) {
            throw new IllegalStateException("No POState registered for status: " + status);
        }
        return state;
    }
}
