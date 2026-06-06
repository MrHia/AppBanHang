package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.mapper.ProcessRequestMapper;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import com.example.importorder.validation.AssignmentContext;
import com.example.importorder.validation.AssignmentValidationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProcessRequestServiceImpl implements IProcessRequestService {

    private final ProcessRequestRepository prRepo;
    private final RequestItemRepository riRepo;
    private final MerchandiseRepository mRepo;
    private final AccountRepository accRepo;
    private final SiteRepository siteRepo;
    private final SiteMerchandiseRepository smRepo;
    private final RequestSiteRepository rsRepo;
    private final PurchaseOrderRepository poRepo;
    private final PODetailRepository podRepo;
    private final IAuditService auditService;
    private final ProcessRequestMapper mapper;
    private final AssignmentValidationService validationService;

    public ProcessRequestServiceImpl(
            ProcessRequestRepository prRepo, RequestItemRepository riRepo,
            MerchandiseRepository mRepo, AccountRepository accRepo,
            SiteRepository siteRepo, SiteMerchandiseRepository smRepo,
            RequestSiteRepository rsRepo, PurchaseOrderRepository poRepo,
            PODetailRepository podRepo, IAuditService auditService,
            ProcessRequestMapper mapper,
            AssignmentValidationService validationService) {
        this.prRepo = prRepo; this.riRepo = riRepo; this.mRepo = mRepo;
        this.accRepo = accRepo; this.siteRepo = siteRepo; this.smRepo = smRepo;
        this.rsRepo = rsRepo; this.poRepo = poRepo; this.podRepo = podRepo;
        this.auditService = auditService; this.mapper = mapper;
        this.validationService = validationService;
    }

    private ProcessRequestDTO toDTOWithItemCount(ProcessRequest pr) {
        ProcessRequestDTO d = mapper.toDTO(pr);
        if (d.itemCount == 0 && pr.getRequestItems() == null) {
            d.itemCount = riRepo.findByProcessRequestId(pr.getId()).size();
        }
        return d;
    }

    @Override public List<ProcessRequestDTO> getAll() { return prRepo.findAll().stream().map(this::toDTOWithItemCount).toList(); }
    @Override public ProcessRequestDTO getById(Integer id) { return toDTOWithItemCount(prRepo.findByIdWithItems(id).orElseThrow()); }
    @Override public List<RequestItemDTO> getItems(Integer requestId) { return mapper.toItemDTOList(riRepo.findByProcessRequestId(requestId)); }

    @Override
    @Transactional
    public ProcessRequestDTO create(ProcessRequestDTO dto, Integer createdById) {
        Account creator = accRepo.findById(createdById).orElseThrow();
        String code = "REQ-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + String.format("%03d", new Random().nextInt(999));
        ProcessRequest pr = new ProcessRequest();
        pr.setCode(code);
        if (dto.desiredDate != null) {
            LocalDate desired = LocalDate.parse(dto.desiredDate);
            if (desired.isBefore(LocalDate.now())) {
                throw new IllegalArgumentException("Desired delivery date cannot be in the past");
            }
            pr.setDesiredDate(desired);
        }
        pr.setNotes(dto.notes);
        pr.setStatus(ProcessRequest.RequestStatus.PENDING);
        pr.setCreatedBy(creator);
        prRepo.save(pr);
        auditService.log(createdById, "CREATE_REQUEST", "process_request", pr.getId(), "Created: " + code);
        return toDTOWithItemCount(pr);
    }

    @Override
    @Transactional
    public void addItem(Integer requestId, RequestItemDTO dto) {
        if (riRepo.existsByProcessRequestIdAndMerchandiseId(requestId, dto.merchandiseId)) {
            throw new RuntimeException("Merchandise already exists in this request");
        }
        if (dto.quantity == null || dto.quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }
        ProcessRequest pr = prRepo.findById(requestId).orElseThrow();
        RequestItem ri = new RequestItem();
        ri.setProcessRequest(pr);
        ri.setMerchandise(mRepo.findById(dto.merchandiseId).orElseThrow());
        ri.setQuantity(dto.quantity);
        ri.setUnit(dto.unit);
        riRepo.save(ri);
    }

    @Override @Transactional
    public void removeItem(Integer id) { riRepo.deleteById(id); }

    @Override
    @Transactional
    public void submit(Integer id) {
        ProcessRequest pr = prRepo.findById(id).orElseThrow();
        List<RequestItem> items = riRepo.findByProcessRequestId(id);
        if (items.isEmpty()) {
            throw new RuntimeException("Cannot submit an empty request");
        }
        pr.setStatus(ProcessRequest.RequestStatus.PROCESSING);
        prRepo.save(pr);
    }

    @Override @Transactional
    public void updateStatus(Integer id, String status) {
        ProcessRequest pr = prRepo.findById(id).orElseThrow();
        pr.setStatus(ProcessRequest.RequestStatus.valueOf(status));
        prRepo.save(pr);
    }

    @Override
    public List<ProcessRequestDTO> getByStatus(String status) {
        return prRepo.findByStatus(ProcessRequest.RequestStatus.valueOf(status)).stream().map(this::toDTOWithItemCount).toList();
    }

    // ============================================================
    // Step 1: Lấy assignments — mỗi mặt hàng đã được gán site
    // Trả kèm stock từ SiteMerchandise.stockQuantity (không cần hỏi site).
    // ============================================================
    @Override
    public List<MerchandiseAssignmentDTO> getMerchandiseAssignments(Integer requestId) {
        ProcessRequest pr = prRepo.findByIdWithItems(requestId).orElseThrow();
        List<RequestItem> items = pr.getRequestItems();

        List<MerchandiseAssignmentDTO> results = new ArrayList<>();
        for (RequestItem item : items) {
            int merchId = item.getMerchandise().getId();

            MerchandiseAssignmentDTO dto = new MerchandiseAssignmentDTO();
            dto.merchandiseId = merchId;
            dto.merchandiseCode = item.getMerchandise().getCode();
            dto.merchandiseName = item.getMerchandise().getName();
            dto.requestedQty = item.getQuantity();
            dto.unit = item.getUnit();

            Optional<RequestSite> existing = rsRepo.findByProcessRequestIdAndMerchandiseId(requestId, merchId);
            if (existing.isPresent()) {
                RequestSite rs = existing.get();
                if (rs.getSite() != null) {
                    dto.assignedSiteId = rs.getSite().getId();
                    dto.assignedSiteCode = rs.getSite().getCode();
                    dto.assignedSiteName = rs.getSite().getName();
                    dto.assignedSiteCountry = rs.getSite().getCountry();
                }
                dto.status = rs.getStatus().name();
                dto.rejectReason = rs.getRejectReason();
            } else {
                dto.status = "PENDING";
            }
            results.add(dto);
        }
        return results;
    }

    @Override
    @Transactional
    public void saveMerchandiseAssignments(Integer requestId, List<MerchandisePickRequest> assignments) {
        ProcessRequest pr = prRepo.findById(requestId).orElseThrow();
        Set<Integer> requestMerchIds = collectRequestMerchandiseIds(requestId);

        AssignmentContext ctx = new AssignmentContext(assignments, requestMerchIds);
        validationService.runAll(ctx);

        for (MerchandisePickRequest asg : assignments) {
            applyAssignment(pr, asg, requestId);
        }
    }

    private Set<Integer> collectRequestMerchandiseIds(Integer requestId) {
        return riRepo.findByProcessRequestId(requestId).stream()
            .map(i -> i.getMerchandise().getId())
            .collect(Collectors.toSet());
    }

    private void applyAssignment(ProcessRequest pr, MerchandisePickRequest asg, Integer requestId) {
        Merchandise merch = mRepo.findById(asg.merchandiseId).orElseThrow();
        RequestSite rs = rsRepo.findByProcessRequestIdAndMerchandiseId(requestId, asg.merchandiseId)
            .orElse(new RequestSite());

        rs.setProcessRequest(pr);
        rs.setMerchandise(merch);

        if (asg.siteId != null) {
            Site site = siteRepo.findById(asg.siteId).orElseThrow();
            rs.setSite(site);
            rs.setStatus(RequestSite.SelectionStatus.PICKED);
            rs.setRejectReason(null);
        } else {
            if (asg.rejectReason == null || asg.rejectReason.isBlank()) {
                throw new IllegalArgumentException("Khi từ chối mặt hàng '" + merch.getCode() + "' phải nhập lý do");
            }
            rs.setSite(null);
            rs.setStatus(RequestSite.SelectionStatus.REJECTED);
            rs.setRejectReason(asg.rejectReason);
        }
        rsRepo.save(rs);
    }

    @Override
    public List<MerchandiseAssignmentDTO> getMerchandiseAssignmentsByRequest(Integer requestId) {
        return getMerchandiseAssignments(requestId);
    }

    @Override
    @Transactional
    public void saveSitePicks(Integer requestId, List<SitePickRequest> picks) {
        if (picks == null || picks.isEmpty()) {
            throw new IllegalArgumentException("Phải chọn ít nhất 1 site cho 1 mặt hàng");
        }
        ProcessRequest pr = prRepo.findById(requestId).orElseThrow();

        List<RequestItem> items = riRepo.findByProcessRequestId(requestId);
        Set<Integer> requestMerchIds = items.stream().map(i -> i.getMerchandise().getId()).collect(Collectors.toSet());
        for (SitePickRequest p : picks) {
            if (p.merchandiseId == null || p.siteId == null) {
                throw new IllegalArgumentException("Lựa chọn không hợp lệ: thiếu mặt hàng hoặc site");
            }
            if (!requestMerchIds.contains(p.merchandiseId)) {
                throw new IllegalArgumentException("Mặt hàng " + p.merchandiseId + " không thuộc request này");
            }
            if (smRepo.findBySiteIdAndMerchandiseId(p.siteId, p.merchandiseId).isEmpty()) {
                throw new IllegalArgumentException("Site " + p.siteId + " không kinh doanh mặt hàng " + p.merchandiseId);
            }
        }

        rsRepo.deleteByProcessRequestId(requestId);

        for (SitePickRequest p : picks) {
            Merchandise merch = mRepo.findById(p.merchandiseId).orElseThrow();
            Site site = siteRepo.findById(p.siteId).orElseThrow();
            RequestSite rs = new RequestSite();
            rs.setProcessRequest(pr);
            rs.setMerchandise(merch);
            rs.setSite(site);
            rs.setStatus(RequestSite.SelectionStatus.PICKED);
            rsRepo.save(rs);
        }
    }

    @Override
    public List<SitePickDTO> getSitePicks(Integer requestId) {
        List<RequestItem> items = riRepo.findByProcessRequestId(requestId);
        Map<Integer, RequestItem> itemByMerch = items.stream()
            .collect(Collectors.toMap(i -> i.getMerchandise().getId(), i -> i, (a, b) -> a));

        List<SitePickDTO> result = new ArrayList<>();
        for (RequestSite rs : rsRepo.findByProcessRequestId(requestId)) {
            if (rs.getSite() == null) continue;
            SitePickDTO d = new SitePickDTO();
            int merchId = rs.getMerchandise().getId();
            d.merchandiseId = merchId;
            d.merchandiseCode = rs.getMerchandise().getCode();
            d.merchandiseName = rs.getMerchandise().getName();
            RequestItem it = itemByMerch.get(merchId);
            d.requestedQty = it != null ? it.getQuantity() : null;
            d.unit = it != null ? it.getUnit() : null;
            d.siteId = rs.getSite().getId();
            d.siteCode = rs.getSite().getCode();
            d.siteName = rs.getSite().getName();
            d.siteCountry = rs.getSite().getCountry();
            d.status = rs.getStatus().name();
            result.add(d);
        }
        return result;
    }

    // ============================================================
    // 1-step workflow: trả thẳng (site × method) đáp ứng được desired_date.
    // Stock đọc thẳng từ SiteMerchandise.stockQuantity — không cần hỏi site.
    // ============================================================
    @Override
    public List<SiteOptionDTO> getSiteOptions(Integer requestId) {
        ProcessRequest pr = prRepo.findByIdWithItems(requestId).orElseThrow();
        LocalDate desired = pr.getDesiredDate();
        LocalDate today = LocalDate.now();

        List<SiteOptionDTO> result = new ArrayList<>();
        for (RequestItem item : pr.getRequestItems()) {
            SiteOptionDTO opt = new SiteOptionDTO();
            opt.merchandiseId = item.getMerchandise().getId();
            opt.merchandiseCode = item.getMerchandise().getCode();
            opt.merchandiseName = item.getMerchandise().getName();
            opt.requestedQty = item.getQuantity();
            opt.unit = item.getUnit();
            opt.rows = new ArrayList<>();

            for (SiteMerchandise sm : smRepo.findActiveStockByMerchandise(opt.merchandiseId)) {
                Site site = sm.getSite();
                addRowIfOnTime(opt.rows, sm, site, "SHIP", site.getShipDays(), today, desired);
                addRowIfOnTime(opt.rows, sm, site, "AIR", site.getAirDays(), today, desired);
            }
            result.add(opt);
        }
        return result;
    }

    private void addRowIfOnTime(List<SiteOptionDTO.SiteRowDTO> rows, SiteMerchandise sm, Site site,
                                String method, Integer days, LocalDate today, LocalDate desired) {
        if (days == null) return;
        LocalDate expected = today.plusDays(days);
        if (desired != null && expected.isAfter(desired)) return;
        SiteOptionDTO.SiteRowDTO row = new SiteOptionDTO.SiteRowDTO();
        row.siteId = site.getId();
        row.siteCode = site.getCode();
        row.siteName = site.getName();
        row.siteCountry = site.getCountry();
        row.siteMerchandiseId = sm.getId();
        row.stockQuantity = sm.getStockQuantity();
        row.deliveryMethod = method;
        row.deliveryDays = days;
        row.expectedDelivery = expected.toString();
        rows.add(row);
    }

    // ============================================================
    // Step 2: Tạo PO batch — đọc tồn từ SiteMerchandise.stockQuantity.
    // ============================================================
    @Override
    @Transactional
    public List<PurchaseOrderDTO> createPOBatch(Integer requestId, CreatePOBatchRequest request) {
        if (request == null || request.orders == null || request.orders.isEmpty()) {
            throw new IllegalArgumentException("Phải có ít nhất 1 đơn đặt hàng (PO)");
        }

        ProcessRequest pr = prRepo.findByIdWithItems(requestId).orElseThrow();

        Map<Integer, Integer> requestedByMerch = new HashMap<>();
        for (RequestItem ri : pr.getRequestItems()) {
            requestedByMerch.merge(ri.getMerchandise().getId(), ri.getQuantity(), Integer::sum);
        }

        Map<Integer, Integer> orderedByMerch = new HashMap<>();
        for (CreatePORequest order : request.orders) {
            if (order.items == null) continue;
            for (POItemRequest it : order.items) {
                if (it.quantity == null || it.quantity <= 0) {
                    throw new IllegalArgumentException("Số lượng đặt phải > 0");
                }
                orderedByMerch.merge(it.merchandiseId, it.quantity, Integer::sum);
            }
        }

        for (Map.Entry<Integer, Integer> e : requestedByMerch.entrySet()) {
            int ordered = orderedByMerch.getOrDefault(e.getKey(), 0);
            if (ordered < e.getValue()) {
                Merchandise m = mRepo.findById(e.getKey()).orElseThrow();
                throw new IllegalArgumentException("Mặt hàng " + m.getCode()
                    + " cần " + e.getValue() + " nhưng mới đặt " + ordered);
            }
        }

        List<PurchaseOrderDTO> createdPOs = new ArrayList<>();

        for (CreatePORequest order : request.orders) {
            Site site = siteRepo.findById(order.siteId).orElseThrow();

            String methodName = order.deliveryMethod != null ? order.deliveryMethod : "SHIP";
            if (!methodName.equals("SHIP") && !methodName.equals("AIR")) {
                throw new IllegalArgumentException("Phương thức vận chuyển phải là SHIP hoặc AIR");
            }
            PurchaseOrder.DeliveryMethod method = PurchaseOrder.DeliveryMethod.valueOf(methodName);

            String code = "PO-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                    + "-" + String.format("%03d", new Random().nextInt(999));

            PurchaseOrder po = new PurchaseOrder();
            po.setCode(code);
            po.setProcessRequest(pr);
            po.setSite(site);
            po.setDeliveryMethod(method);
            if (order.expectedDelivery != null) {
                po.setExpectedDelivery(LocalDate.parse(order.expectedDelivery));
            }
            po.setStatus(PurchaseOrder.POStatus.SENT);
            poRepo.save(po);

            if (order.items != null) {
                for (POItemRequest item : order.items) {
                    if (item.quantity == null || item.quantity <= 0) {
                        throw new IllegalArgumentException("Số lượng đặt phải > 0");
                    }
                    SiteMerchandise sm = smRepo.findBySiteIdAndMerchandiseId(site.getId(), item.merchandiseId)
                        .orElseThrow(() -> new RuntimeException("Site " + site.getCode()
                            + " không kinh doanh mặt hàng " + item.merchandiseId));
                    if (!Boolean.TRUE.equals(sm.getIsActive())) {
                        throw new RuntimeException("Site " + site.getCode()
                            + " đã ngừng kinh doanh mặt hàng " + sm.getMerchandise().getCode());
                    }
                    int stock = sm.getStockQuantity() != null ? sm.getStockQuantity() : 0;
                    if (item.quantity > stock) {
                        throw new RuntimeException("Số lượng " + item.quantity
                            + " vượt tồn kho " + stock + " của site " + site.getCode()
                            + " cho mặt hàng " + sm.getMerchandise().getCode());
                    }
                    sm.setStockQuantity(stock - item.quantity);
                    smRepo.save(sm);

                    PODetail pod = new PODetail();
                    pod.setPurchaseOrder(po);
                    pod.setMerchandise(sm.getMerchandise());
                    pod.setQuantity(item.quantity);
                    pod.setUnit(item.unit);
                    podRepo.save(pod);
                }
            }

            PurchaseOrderDTO dto = new PurchaseOrderDTO();
            dto.id = po.getId();
            dto.code = po.getCode();
            dto.processRequestId = pr.getId();
            dto.processRequestCode = pr.getCode();
            dto.siteId = site.getId();
            dto.siteCode = site.getCode();
            dto.siteName = site.getName();
            dto.status = po.getStatus().name();
            dto.deliveryMethod = po.getDeliveryMethod().name();
            dto.deliveryMeans = po.getDeliveryMethod() == PurchaseOrder.DeliveryMethod.AIR
                ? "air delivery" : "ship delivery";
            dto.expectedDelivery = po.getExpectedDelivery() != null ? po.getExpectedDelivery().toString() : null;
            dto.createdAt = po.getCreatedAt() != null ? po.getCreatedAt().toString() : null;
            createdPOs.add(dto);
        }

        pr.setStatus(ProcessRequest.RequestStatus.DONE);
        prRepo.save(pr);

        return createdPOs;
    }
}
