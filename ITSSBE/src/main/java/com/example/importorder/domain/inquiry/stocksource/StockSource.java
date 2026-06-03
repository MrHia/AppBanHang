package com.example.importorder.domain.inquiry.stocksource;

/**
 * Strategy interface for resolving the stock quantity available at a given site
 * for a given merchandise. Implementations are ordered via Spring {@link org.springframework.core.annotation.Order}
 * and consulted in a FIRST-MATCH cascade by {@link StockSourceResolver}.
 */
public interface StockSource {

    /**
     * @return true if this source can provide stock for this (siteId, merchandiseId), false otherwise
     */
    boolean canProvide(Integer siteId, Integer merchandiseId, StockSourceContext context);

    /**
     * Returns the stock quantity for the (siteId, merchandiseId) pair.
     * Callers MUST first verify {@link #canProvide(Integer, Integer, StockSourceContext)} returns true.
     */
    int getQuantity(Integer siteId, Integer merchandiseId, StockSourceContext context);

    /**
     * Short label identifying the data origin (e.g. "inquiry", "reference", "none").
     * Propagated to {@code StockInfoDTO.source} so the UI can show provenance.
     */
    String sourceLabel();
}
