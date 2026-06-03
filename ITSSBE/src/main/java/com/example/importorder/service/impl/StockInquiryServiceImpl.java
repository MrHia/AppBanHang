package com.example.importorder.service.impl;

import com.example.importorder.domain.inquiry.stocksource.StockSourceContext;
import com.example.importorder.domain.inquiry.stocksource.StockSourceResolver;
import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.mapper.StockInquiryMapper;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class StockInquiryServiceImpl implements IStockInquiryService {

    private final StockInquiryRepository siRepo;
    private final StockInquiryItemRepository siiRepo;
    private final SiteMerchandiseRepository smRepo;
    private final ProcessRequestRepository prRepo;
    private final SiteRepository siteRepo;
    private final RequestSiteRepository rsRepo;
    private final StockInquiryMapper mapper;
    private final StockSourceResolver resolver;

    public StockInquiryServiceImpl(StockInquiryRepository siRepo, StockInquiryItemRepository siiRepo,
            SiteMerchandiseRepository smRepo, ProcessRequestRepository prRepo, SiteRepository siteRepo,
            RequestSiteRepository rsRepo, StockInquiryMapper mapper, StockSourceResolver resolver) {
        this.siRepo = siRepo; this.siiRepo = siiRepo; this.smRepo = smRepo;
        this.prRepo = prRepo; this.siteRepo = siteRepo; this.rsRepo = rsRepo; this.mapper = mapper;
        this.resolver = resolver;
    }

    @Override public List<StockInquiryDTO> getAll() { return mapper.toDTOList(siRepo.findAll()); }
    @Override public List<StockInquiryDTO> getByRequest(Integer requestId) { return mapper.toDTOList(siRepo.findByProcessRequestId(requestId)); }
    @Override public List<StockInquiryDTO> getPendingForSite(Integer siteId) { return mapper.toDTOList(siRepo.findPendingForSite(siteId)); }
    @Override public StockInquiryDTO getById(Integer id) { return mapper.toDTO(siRepo.findById(id).orElseThrow()); }
    @Override public List<StockInquiryItemDTO> getItems(Integer inquiryId) { return mapper.toItemDTOList(siiRepo.findByStockInquiryId(inquiryId)); }

    @Override
    @Transactional
    public void createInquiriesForRequest(Integer requestId) {
        ProcessRequest pr = prRepo.findByIdWithItems(requestId).orElseThrow();
        List<Integer> merchIds = pr.getRequestItems().stream().map(ri -> ri.getMerchandise().getId()).toList();
        List<Integer> siteIds = smRepo.findSiteIdsSellingMerchandise(merchIds);

        for (Integer siteId : siteIds) {
            List<SiteMerchandise> sms = smRepo.findBySiteIdAndMerchandiseIds(siteId, merchIds);
            if (sms.isEmpty()) continue;

            Site site = siteRepo.findById(siteId).orElseThrow();

            StockInquiry si = new StockInquiry();
            si.setProcessRequest(pr);
            si.setSite(site);
            si.setStatus(StockInquiry.InquiryStatus.PENDING);
            si.setTimeoutAt(LocalDateTime.now().plusHours(48));
            siRepo.save(si);

            for (SiteMerchandise sm : sms) {
                StockInquiryItem sii = new StockInquiryItem();
                sii.setStockInquiry(si);
                sii.setMerchandise(sm.getMerchandise());
                sii.setQuantity(0);
                siiRepo.save(sii);
            }
        }
    }

    @Override
    @Transactional
    public void respondToInquiry(Integer inquiryId, List<StockInquiryItemDTO> items) {
        StockInquiry si = siRepo.findById(inquiryId).orElseThrow();
        for (StockInquiryItemDTO item : items) {
            StockInquiryItem sii = siiRepo.findById(item.id).orElseThrow();
            sii.setQuantity(item.quantity);
            siiRepo.save(sii);
        }

        // Recalculate status: RESPONDED if all items responded, PARTIAL otherwise
        List<StockInquiryItem> allItems = siiRepo.findByStockInquiryId(inquiryId);
        long respondedCount = allItems.stream().filter(i -> i.getQuantity() > 0).count();
        if (respondedCount == allItems.size()) {
            si.setStatus(StockInquiry.InquiryStatus.RESPONDED);
            si.setRespondedAt(LocalDateTime.now());
            // Also update the RequestSite status so FE step auto-advances
            List<RequestSite> assignments = rsRepo.findByProcessRequestIdAndStatus(
                si.getProcessRequest().getId(), RequestSite.SelectionStatus.INQUIRY_SENT);
            for (RequestSite rs : assignments) {
                if (rs.getSite().getId().equals(si.getSite().getId())) {
                    rs.setStatus(RequestSite.SelectionStatus.RESPONDED);
                    rsRepo.save(rs);
                }
            }
        } else {
            si.setStatus(StockInquiry.InquiryStatus.PARTIAL);
        }
        siRepo.save(si);
    }

    /**
     * Returns inventory matrix for a process request.
     * Cascade priority is now encoded by {@link com.example.importorder.domain.inquiry.stocksource.StockSource}
     * Strategy beans (ordered via @Order):
     *  1. InquiryResponseStockSource — actual inquiry response from site
     *  2. ReferenceStockSource — site_merchandise.stock_quantity (reference)
     *  3. NoDataStockSource — terminal fallback returning 0
     * Also includes sites that have site_merchandise but no inquiry yet.
     *
     * Returns Map<siteId, Map<merchandiseId, StockInfo>>
     */
    @Override
    public Map<Integer, Map<Integer, StockInfoDTO>> getInventoryMatrix(Integer requestId) {
        ProcessRequest pr = prRepo.findByIdWithItems(requestId).orElseThrow();
        List<Integer> merchIds = pr.getRequestItems().stream().map(ri -> ri.getMerchandise().getId()).toList();

        // Step 1: build StockSourceContext (data fetching — same queries as before)
        StockSourceContext ctx = buildStockSourceContext(requestId, merchIds);

        // Step 2: collect siteIds (responded inquiries + sites with site_merchandise covering merchIds)
        Set<Integer> allSiteIds = collectAllSiteIds(ctx);

        // Step 3: resolve via Strategy cascade
        Map<Integer, Map<Integer, StockInfoDTO>> matrix = new HashMap<>();
        for (Integer siteId : allSiteIds) {
            Map<Integer, StockInfoDTO> siteMatrix = new HashMap<>();
            for (Integer merchId : merchIds) {
                siteMatrix.put(merchId, resolver.resolve(siteId, merchId, ctx));
            }
            matrix.put(siteId, siteMatrix);
        }
        return matrix;
    }

    /**
     * Builds the {@link StockSourceContext} by loading inquiry responses and reference stock
     * (same data-fetching logic that previously lived inline in {@code getInventoryMatrix}).
     */
    private StockSourceContext buildStockSourceContext(Integer requestId, List<Integer> merchIds) {
        // Inquiry-based stock from responded inquiries
        List<StockInquiry> inquiries = siRepo.findByProcessRequestId(requestId);
        Map<Integer, Map<Integer, Integer>> inquiryStock = new HashMap<>();
        Set<Integer> respondedSiteIds = new HashSet<>();
        for (StockInquiry si : inquiries) {
            if (si.getStatus() != StockInquiry.InquiryStatus.RESPONDED) continue;
            respondedSiteIds.add(si.getSite().getId());
            Map<Integer, Integer> siteStock = new HashMap<>();
            for (StockInquiryItem sii : siiRepo.findByStockInquiryId(si.getId())) {
                siteStock.put(sii.getMerchandise().getId(), sii.getQuantity());
            }
            inquiryStock.put(si.getSite().getId(), siteStock);
        }

        // Collect candidate siteIds: responded + sites with active site_merchandise for these merchIds
        Set<Integer> candidateSiteIds = new HashSet<>(respondedSiteIds);
        for (SiteMerchandise sm : smRepo.findAll()) {
            if (merchIds.contains(sm.getMerchandise().getId()) && sm.getIsActive()) {
                candidateSiteIds.add(sm.getSite().getId());
            }
        }

        // Reference stock lookup
        Map<Integer, Map<Integer, Integer>> referenceStock = new HashMap<>();
        for (Integer siteId : candidateSiteIds) {
            Map<Integer, Integer> siteRefStock = new HashMap<>();
            for (SiteMerchandise sm : smRepo.findBySiteIdAndMerchandiseIds(siteId, merchIds)) {
                siteRefStock.put(
                    sm.getMerchandise().getId(),
                    sm.getStockQuantity() != null ? sm.getStockQuantity() : 0
                );
            }
            referenceStock.put(siteId, siteRefStock);
        }

        return new StockSourceContext(inquiryStock, referenceStock, respondedSiteIds);
    }

    /**
     * Set of all siteIds to include in the matrix: union of responded inquiry sites
     * and sites with reference stock (already collected in ctx.referenceStockBySite.keySet()).
     */
    private Set<Integer> collectAllSiteIds(StockSourceContext ctx) {
        Set<Integer> all = new HashSet<>(ctx.respondedSiteIds);
        all.addAll(ctx.referenceStockBySite.keySet());
        return all;
    }
}
