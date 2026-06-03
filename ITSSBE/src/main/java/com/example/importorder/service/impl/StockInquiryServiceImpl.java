package com.example.importorder.service.impl;

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

    public StockInquiryServiceImpl(StockInquiryRepository siRepo, StockInquiryItemRepository siiRepo,
            SiteMerchandiseRepository smRepo, ProcessRequestRepository prRepo, SiteRepository siteRepo,
            RequestSiteRepository rsRepo, StockInquiryMapper mapper) {
        this.siRepo = siRepo; this.siiRepo = siiRepo; this.smRepo = smRepo;
        this.prRepo = prRepo; this.siteRepo = siteRepo; this.rsRepo = rsRepo; this.mapper = mapper;
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
     * Priority:
     *  1. stock_inquiry_item.quantity (actual inquiry response from site)
     *  2. site_merchandise.stock_quantity (reference stock from Site's merchandise management page)
     * Also includes sites that have site_merchandise but no inquiry yet.
     *
     * Returns Map<siteId, Map<merchandiseId, StockInfo>>
     * StockInfo has: quantity, source ("inquiry" or "reference")
     */
    @Override
    public Map<Integer, Map<Integer, StockInfoDTO>> getInventoryMatrix(Integer requestId) {
        ProcessRequest pr = prRepo.findByIdWithItems(requestId).orElseThrow();
        List<Integer> merchIds = pr.getRequestItems().stream().map(ri -> ri.getMerchandise().getId()).toList();

        // Build inquiry-based stock from responded inquiries
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

        // Collect all site IDs: responded inquiries + sites with site_merchandise
        Set<Integer> allSiteIds = new HashSet<>(respondedSiteIds);
        List<SiteMerchandise> allSM = smRepo.findAll();
        for (SiteMerchandise sm : allSM) {
            if (merchIds.contains(sm.getMerchandise().getId()) && sm.getIsActive()) {
                allSiteIds.add(sm.getSite().getId());
            }
        }

        // Build site_merchandise stock lookup
        Map<Integer, Map<Integer, Integer>> referenceStock = new HashMap<>();
        for (Integer siteId : allSiteIds) {
            List<SiteMerchandise> sms = smRepo.findBySiteIdAndMerchandiseIds(siteId, merchIds);
            Map<Integer, Integer> siteRefStock = new HashMap<>();
            for (SiteMerchandise sm : sms) {
                siteRefStock.put(sm.getMerchandise().getId(), sm.getStockQuantity() != null ? sm.getStockQuantity() : 0);
            }
            referenceStock.put(siteId, siteRefStock);
        }

        // Build final matrix
        Map<Integer, Map<Integer, StockInfoDTO>> matrix = new HashMap<>();
        for (Integer siteId : allSiteIds) {
            Map<Integer, StockInfoDTO> siteMatrix = new HashMap<>();
            Map<Integer, Integer> inq = inquiryStock.get(siteId);
            Map<Integer, Integer> ref = referenceStock.getOrDefault(siteId, Collections.emptyMap());

            for (Integer merchId : merchIds) {
                StockInfoDTO info = new StockInfoDTO();
                if (inq != null && inq.containsKey(merchId)) {
                    // Site responded — use inquiry response
                    info.quantity = inq.get(merchId);
                    info.source = "inquiry";
                } else if (ref.containsKey(merchId)) {
                    // No inquiry response yet — use reference stock from site_merchandise
                    info.quantity = ref.get(merchId);
                    info.source = "reference";
                } else {
                    // Site doesn't have this merchandise
                    info.quantity = 0;
                    info.source = "none";
                }
                siteMatrix.put(merchId, info);
            }
            matrix.put(siteId, siteMatrix);
        }

        return matrix;
    }
}
