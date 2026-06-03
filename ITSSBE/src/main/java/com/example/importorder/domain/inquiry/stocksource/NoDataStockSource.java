package com.example.importorder.domain.inquiry.stocksource;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Terminal sink: always matches and returns 0. Guarantees the resolver always yields
 * a {@code StockInfoDTO} so callers never have to deal with nulls.
 * Must be the lowest-priority source in the cascade.
 */
@Component
@Order(3)
public class NoDataStockSource implements StockSource {

    @Override
    public boolean canProvide(Integer siteId, Integer merchandiseId, StockSourceContext context) {
        return true;
    }

    @Override
    public int getQuantity(Integer siteId, Integer merchandiseId, StockSourceContext context) {
        return 0;
    }

    @Override
    public String sourceLabel() {
        return "none";
    }
}
