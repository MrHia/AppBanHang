package com.example.importorder.domain.inquiry.stocksource;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Fallback stock source: the reference stock the site maintains on its merchandise
 * management page (site_merchandise.stock_quantity). Consulted when no inquiry response
 * is available for the (siteId, merchandiseId) pair.
 */
@Component
@Order(2)
public class ReferenceStockSource implements StockSource {

    @Override
    public boolean canProvide(Integer siteId, Integer merchandiseId, StockSourceContext context) {
        if (context == null || siteId == null || merchandiseId == null) {
            return false;
        }
        Map<Integer, Integer> siteStock = context.referenceStockBySite.get(siteId);
        return siteStock != null && siteStock.containsKey(merchandiseId);
    }

    @Override
    public int getQuantity(Integer siteId, Integer merchandiseId, StockSourceContext context) {
        Integer qty = context.referenceStockBySite.get(siteId).get(merchandiseId);
        return qty != null ? qty : 0;
    }

    @Override
    public String sourceLabel() {
        return "reference";
    }
}
