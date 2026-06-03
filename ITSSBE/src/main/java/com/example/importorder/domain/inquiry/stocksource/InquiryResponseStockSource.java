package com.example.importorder.domain.inquiry.stocksource;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Highest-priority stock source: data the site supplied through an inquiry response.
 * Used only when the site has actually responded.
 */
@Component
@Order(1)
public class InquiryResponseStockSource implements StockSource {

    @Override
    public boolean canProvide(Integer siteId, Integer merchandiseId, StockSourceContext context) {
        if (context == null || siteId == null || merchandiseId == null) {
            return false;
        }
        if (!context.respondedSiteIds.contains(siteId)) {
            return false;
        }
        Map<Integer, Integer> siteStock = context.inquiryStockBySite.get(siteId);
        return siteStock != null && siteStock.containsKey(merchandiseId);
    }

    @Override
    public int getQuantity(Integer siteId, Integer merchandiseId, StockSourceContext context) {
        Integer qty = context.inquiryStockBySite.get(siteId).get(merchandiseId);
        return qty != null ? qty : 0;
    }

    @Override
    public String sourceLabel() {
        return "inquiry";
    }
}
