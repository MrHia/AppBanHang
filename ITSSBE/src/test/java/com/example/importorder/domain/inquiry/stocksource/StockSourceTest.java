package com.example.importorder.domain.inquiry.stocksource;

import com.example.importorder.dto.StockInfoDTO;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the Strategy pattern (P3) — StockSource cascade.
 *
 * <p>Verifies the first-match priority cascade in {@link StockSourceResolver}:
 * inquiry response (Order 1) > reference stock (Order 2) > no data sink (Order 3).
 *
 * <p>Built without Spring context — strategies are instantiated directly and
 * injected via the resolver's constructor, which keeps tests fast and deterministic.
 */
class StockSourceTest {

    private final StockSource inquiry = new InquiryResponseStockSource();
    private final StockSource reference = new ReferenceStockSource();
    private final StockSource fallback = new NoDataStockSource();

    /** Resolver wired with the same cascade order Spring would inject via @Order. */
    private final StockSourceResolver resolver =
            new StockSourceResolver(List.of(inquiry, reference, fallback));

    @Test
    void inquiryResponseStrategyProvidesWhenSiteResponded() {
        StockSourceContext ctx = new StockSourceContext(
                inquiryStock(1, 100, 50),
                new HashMap<>(),
                respondedSites(1)
        );

        StockInfoDTO info = resolver.resolve(1, 100, ctx);

        assertThat(info).isNotNull();
        assertThat(info.quantity).isEqualTo(50);
        assertThat(info.source).isEqualTo("inquiry");
    }

    @Test
    void referenceStrategyUsedWhenNoInquiryResponse() {
        StockSourceContext ctx = new StockSourceContext(
                new HashMap<>(),
                referenceStock(2, 100, 30),
                new HashSet<>() // no site has responded
        );

        StockInfoDTO info = resolver.resolve(2, 100, ctx);

        assertThat(info.quantity).isEqualTo(30);
        assertThat(info.source).isEqualTo("reference");
    }

    @Test
    void noDataFallbackWhenAllStrategiesMiss() {
        StockSourceContext ctx = new StockSourceContext();

        StockInfoDTO info = resolver.resolve(99, 999, ctx);

        assertThat(info.quantity).isEqualTo(0);
        assertThat(info.source).isEqualTo("none");
    }

    @Test
    void inquiryHasPriorityOverReference() {
        // Both inquiry and reference have data for the SAME (siteId=1, merchId=100).
        // Inquiry is @Order(1), so it must win.
        StockSourceContext ctx = new StockSourceContext(
                inquiryStock(1, 100, 50),
                referenceStock(1, 100, 30),
                respondedSites(1)
        );

        StockInfoDTO info = resolver.resolve(1, 100, ctx);

        assertThat(info.source).isEqualTo("inquiry");
        assertThat(info.quantity).isEqualTo(50);
    }

    // === helpers ===

    private static Map<Integer, Map<Integer, Integer>> inquiryStock(int siteId, int merchId, int qty) {
        Map<Integer, Map<Integer, Integer>> map = new HashMap<>();
        Map<Integer, Integer> bySite = new HashMap<>();
        bySite.put(merchId, qty);
        map.put(siteId, bySite);
        return map;
    }

    private static Map<Integer, Map<Integer, Integer>> referenceStock(int siteId, int merchId, int qty) {
        return inquiryStock(siteId, merchId, qty); // same shape
    }

    private static Set<Integer> respondedSites(Integer... siteIds) {
        Set<Integer> set = new HashSet<>();
        for (Integer id : siteIds) {
            set.add(id);
        }
        return set;
    }
}
