package com.example.importorder.domain.inquiry.stocksource;

import com.example.importorder.dto.StockInfoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Resolves the effective stock for a (siteId, merchandiseId) pair by walking through
 * an ordered cascade of {@link StockSource} strategies.
 *
 * <p><b>Important:</b> Spring's {@link org.springframework.core.annotation.Order @Order}
 * here is interpreted as <i>first-match priority</i>, not pipeline filtering. The first
 * source that returns {@code true} from {@link StockSource#canProvide} wins and the
 * remaining sources are skipped. This intentional cascade replaces the hardcoded
 * 3-way priority (inquiry response &gt; reference stock &gt; no data) that previously
 * lived inline in {@code StockInquiryServiceImpl.getInventoryMatrix}.
 *
 * <p>Implementations must therefore include a terminal "always matches" source
 * (see {@link NoDataStockSource}) so the resolver never returns null.
 */
@Component
public class StockSourceResolver {

    private final List<StockSource> sources;

    @Autowired
    public StockSourceResolver(List<StockSource> sources) {
        this.sources = sources;
    }

    /**
     * Walks the ordered list of {@link StockSource} strategies and returns the first match.
     *
     * @return a non-null {@link StockInfoDTO}; falls back to "none" / 0 when nothing matches
     */
    public StockInfoDTO resolve(Integer siteId, Integer merchandiseId, StockSourceContext ctx) {
        for (StockSource source : sources) {
            if (source.canProvide(siteId, merchandiseId, ctx)) {
                StockInfoDTO info = new StockInfoDTO();
                info.quantity = source.getQuantity(siteId, merchandiseId, ctx);
                info.source = source.sourceLabel();
                return info;
            }
        }
        // Defensive: NoDataStockSource should have already matched. Keep a final guard.
        StockInfoDTO fallback = new StockInfoDTO();
        fallback.quantity = 0;
        fallback.source = "none";
        return fallback;
    }
}
