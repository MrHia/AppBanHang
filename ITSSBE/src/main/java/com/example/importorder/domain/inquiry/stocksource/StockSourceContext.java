package com.example.importorder.domain.inquiry.stocksource;

import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Pre-loaded data passed to every {@link StockSource} when resolving a (siteId, merchandiseId) pair.
 * Holding the data in memory avoids repeated DB lookups during matrix expansion.
 *
 * <p>Public fields by design (Lombok-style POJO consistent with this project's DTO convention).
 */
public class StockSourceContext {

    /** siteId -> merchandiseId -> quantity reported via inquiry response. */
    public Map<Integer, Map<Integer, Integer>> inquiryStockBySite = new HashMap<>();

    /** siteId -> merchandiseId -> reference stock from site_merchandise.stock_quantity. */
    public Map<Integer, Map<Integer, Integer>> referenceStockBySite = new HashMap<>();

    /** IDs of sites whose inquiry has been responded to. */
    public Set<Integer> respondedSiteIds = new HashSet<>();

    public StockSourceContext() {
    }

    public StockSourceContext(Map<Integer, Map<Integer, Integer>> inquiryStockBySite,
                              Map<Integer, Map<Integer, Integer>> referenceStockBySite,
                              Set<Integer> respondedSiteIds) {
        this.inquiryStockBySite = inquiryStockBySite != null ? inquiryStockBySite : new HashMap<>();
        this.referenceStockBySite = referenceStockBySite != null ? referenceStockBySite : new HashMap<>();
        this.respondedSiteIds = respondedSiteIds != null ? respondedSiteIds : new HashSet<>();
    }

    public Map<Integer, Integer> inquiryStockFor(Integer siteId) {
        return inquiryStockBySite.getOrDefault(siteId, Collections.emptyMap());
    }

    public Map<Integer, Integer> referenceStockFor(Integer siteId) {
        return referenceStockBySite.getOrDefault(siteId, Collections.emptyMap());
    }
}
