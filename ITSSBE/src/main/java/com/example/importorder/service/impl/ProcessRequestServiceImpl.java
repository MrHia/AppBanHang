package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final StockInquiryRepository siRepo;
    private final StockInquiryItemRepository siiRepo;
    private final PurchaseOrderRepository poRepo;
    private final PODetailRepository podRepo;
    private final IAuditService auditService;
    private final IStockInquiryService inquiryService;

    public ProcessRequestServiceImpl(
            ProcessRequestRepository prRepo, RequestItemRepository riRepo,
            MerchandiseRepository mRepo, AccountRepository accRepo,
            SiteRepository siteRepo, SiteMerchandiseRepository smRepo,
            RequestSiteRepository rsRepo, StockInquiryRepository siRepo,
            StockInquiryItemRepository siiRepo, PurchaseOrderRepository poRepo,
            PODetailRepository podRepo, IAuditService auditService,
            IStockInquiryService inquiryService) {
        this.prRepo = prRepo; this.riRepo = riRepo; this.mRepo = mRepo;
        this.accRepo = accRepo; this.siteRepo = siteRepo; this.smRepo = smRepo;
        this.rsRepo = rsRepo; this.siRepo = siRepo; this.siiRepo = siiRepo;
        this.poRepo = poRepo; this.podRepo = podRepo; this.auditService = auditService;
        this.inquiryService = inquiryService;
    }

    private ProcessRequestDTO toDTO(ProcessRequest pr) {
        ProcessRequestDTO d = new ProcessRequestDTO();
        d.id = pr.getId(); d.code = pr.getCode();
        d.desiredDate = pr.getDesiredDate() != null ? pr.getDesiredDate().toString() : null;
        d.notes = pr.getNotes(); d.status = pr.getStatus().name();
        d.createdById = pr.getCreatedBy() != null ? pr.getCreatedBy().getId() : null;
        d.createdByName = pr.getCreatedBy() != null ? pr.getCreatedBy().getFirstName() + " " + pr.getCreatedBy().getLastName() : null;
        d.createdAt = pr.getCreatedAt() != null ? pr.getCreatedAt().toString() : null;
        d.itemCount = pr.getRequestItems() != null ? pr.getRequestItems().size() : riRepo.findByProcessRequestId(pr.getId()).size();
        return d;
    }

    private RequestItemDTO toItemDTO(RequestItem ri) {
        RequestItemDTO d = new RequestItemDTO();
        d.id = ri.getId(); d.processRequestId = ri.getProcessRequest().getId();
        d.merchandiseId = ri.getMerchandise().getId();
        d.merchandiseCode = ri.getMerchandise().getCode();
        d.merchandiseName = ri.getMerchandise().getName();
        d.quantity = ri.getQuantity(); d.unit = ri.getUnit();
        return d;
    }

    private RequestSiteDTO toRequestSiteDTO(RequestSite rs) {
        RequestSiteDTO d = new RequestSiteDTO();
        d.id = rs.getId();
        d.processRequestId = rs.getProcessRequest().getId();
        if (rs.getSite() != null) {
            d.siteId = rs.getSite().getId();
            d.siteCode = rs.getSite().getCode();
            d.siteName = rs.getSite().getName();
            d.siteCountry = rs.getSite().getCountry();
        }
        d.merchandiseId = rs.getMerchandise().getId();
        d.merchandiseCode = rs.getMerchandise().getCode();
        d.status = rs.getStatus().name();
        d.rejectReason = rs.getRejectReason();
        d.createdAt = rs.getCreatedAt() != null ? rs.getCreatedAt().toString() : null;
        return d;
    }

    @Override public List<ProcessRequestDTO> getAll() { return prRepo.findAll().stream().map(this::toDTO).toList(); }
    @Override public ProcessRequestDTO getById(Integer id) { return toDTO(prRepo.findByIdWithItems(id).orElseThrow()); }
    @Override public List<RequestItemDTO> getItems(Integer requestId) { return riRepo.findByProcessRequestId(requestId).stream().map(this::toItemDTO).toList(); }

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
        return toDTO(pr);
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
        return prRepo.findByStatus(ProcessRequest.RequestStatus.valueOf(status)).stream().map(this::toDTO).toList();
    }

    // ============================================================
    // Step 1: Lấy assignments — mỗi mặt hàng đã được gán site
    // KHÔNG trả stock — stock chỉ hiển thị khi Site phản hồi (UC10)
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

    // ============================================================
    // Step 1: Lưu assignments — mỗi mặt hàng gán đúng 1 site
    // ============================================================
    @Override
    @Transactional
    public void saveMerchandiseAssignments(Integer requestId, List<MerchandisePickRequest> assignments) {
        if (assignments == null || assignments.isEmpty()) {
            throw new IllegalArgumentException("Phải có ít nhất 1 lựa chọn");
        }

        ProcessRequest pr = prRepo.findById(requestId).orElseThrow();
        List<RequestItem> items = riRepo.findByProcessRequestId(requestId);
        Set<Integer> requestMerchIds = items.stream().map(i -> i.getMerchandise().getId()).collect(Collectors.toSet());

        // Validate: mỗi merch trong request phải có đúng 1 assignment
        Set<Integer> assignedMerchIds = assignments.stream()
            .filter(a -> a.siteId != null)
            .map(a -> a.merchandiseId)
            .collect(Collectors.toSet());

        // Các merch không được assign site = bị reject
        Set<Integer> rejectedMerchIds = assignments.stream()
            .filter(a -> a.siteId == null)
            .map(a -> a.merchandiseId)
            .collect(Collectors.toSet());

        // Kiểm tra không trùng merch (1 merch chỉ xuất hiện 1 lần)
        if (assignments.stream().map(a -> a.merchandiseId).distinct().count() != assignments.size()) {
            throw new IllegalArgumentException("Mỗi mặt hàng chỉ được phép xuất hiện 1 lần trong danh sách lựa chọn");
        }

        // Kiểm tra đủ: mỗi mặt hàng trong request phải có trong assignments
        Set<Integer> allAssignmentMerchIds = assignments.stream()
            .map(a -> a.merchandiseId)
            .collect(Collectors.toSet());
        if (!allAssignmentMerchIds.equals(requestMerchIds)) {
            Set<Integer> missing = new HashSet<>(requestMerchIds);
            missing.removeAll(allAssignmentMerchIds);
            throw new IllegalArgumentException("Thiếu mặt hàng trong danh sách lựa chọn: " + missing);
        }

        for (MerchandisePickRequest asg : assignments) {
            if (!requestMerchIds.contains(asg.merchandiseId)) {
                throw new IllegalArgumentException("Mặt hàng " + asg.merchandiseId + " không thuộc request này");
            }
        }

        for (MerchandisePickRequest asg : assignments) {
            Merchandise merch = mRepo.findById(asg.merchandiseId).orElseThrow();
            Optional<RequestSite> existingOpt = rsRepo.findByProcessRequestIdAndMerchandiseId(requestId, asg.merchandiseId);
            RequestSite rs = existingOpt.orElse(new RequestSite());

            rs.setProcessRequest(pr);
            rs.setMerchandise(merch);

            if (asg.siteId != null) {
                Site site = siteRepo.findById(asg.siteId).orElseThrow();
                rs.setSite(site);
                rs.setStatus(RequestSite.SelectionStatus.PICKED);
                rs.setRejectReason(null);
            } else {
                // Từ chối mặt hàng này
                if (asg.rejectReason == null || asg.rejectReason.isBlank()) {
                    throw new IllegalArgumentException("Khi từ chối mặt hàng '" + merch.getCode()
                        + "' phải nhập lý do");
                }
                rs.setSite(null);
                rs.setStatus(RequestSite.SelectionStatus.REJECTED);
                rs.setRejectReason(asg.rejectReason);
            }
            rsRepo.save(rs);
        }
    }

    @Override
    public List<MerchandiseAssignmentDTO> getMerchandiseAssignmentsByRequest(Integer requestId) {
        return getMerchandiseAssignments(requestId);
    }

    // ============================================================
    // Multi-site: lưu lựa chọn (mặt hàng × site) — 1 mặt hàng có thể hỏi nhiều site
    // ============================================================
    @Override
    @Transactional
    public void saveSitePicks(Integer requestId, List<SitePickRequest> picks) {
        if (picks == null || picks.isEmpty()) {
            throw new IllegalArgumentException("Phải chọn ít nhất 1 site cho 1 mặt hàng");
        }
        ProcessRequest pr = prRepo.findById(requestId).orElseThrow();

        // Không cho sửa lựa chọn sau khi đã gửi yêu cầu (đã tạo inquiry)
        if (!siRepo.findByProcessRequestId(requestId).isEmpty()) {
            throw new IllegalArgumentException("Đã gửi yêu cầu hỏi tồn kho, không thể sửa lại lựa chọn site");
        }

        // Validate: mặt hàng thuộc request, và site có kinh doanh mặt hàng đó
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

        // Ghi đè toàn bộ lựa chọn cũ của request (cho phép sửa lại trước khi gửi)
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
            if (rs.getSite() == null) continue; // bỏ dòng REJECTED (không có site)
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
    // Step 2: Gửi inquiry — mỗi site nhận danh sách mặt hàng được gán cho nó
    // ============================================================
    @Override
    @Transactional
    public void sendInquiries(Integer requestId) {
        ProcessRequest pr = prRepo.findByIdWithItems(requestId).orElseThrow();
        List<RequestSite> pickedAssignments = rsRepo.findByRequestAndStatus(requestId, RequestSite.SelectionStatus.PICKED);

        if (pickedAssignments.isEmpty()) {
            throw new IllegalArgumentException("Chưa có mặt hàng nào được gán site (PICKED). Vui lòng chọn site cho các mặt hàng trước.");
        }

        // Nhóm theo site: siteId -> list<merchId>
        Map<Integer, List<Integer>> siteToMerchIds = pickedAssignments.stream()
            .collect(Collectors.groupingBy(
                rs -> rs.getSite().getId(),
                Collectors.mapping(rs -> rs.getMerchandise().getId(), Collectors.toList())
            ));

        for (Map.Entry<Integer, List<Integer>> entry : siteToMerchIds.entrySet()) {
            int siteId = entry.getKey();
            List<Integer> merchIds = entry.getValue();
            Site site = siteRepo.findById(siteId).orElseThrow();

            // Kiểm tra đã gửi inquiry cho site này chưa
            List<StockInquiry> existing = siRepo.findByRequestAndSite(requestId, siteId);
            if (!existing.isEmpty()) continue;

            List<SiteMerchandise> sms = smRepo.findBySiteIdAndMerchandiseIds(siteId, merchIds);

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

            // Cập nhật trạng thái assignment -> INQUIRY_SENT
            for (RequestSite rs : pickedAssignments) {
                if (rs.getSite() != null && rs.getSite().getId().equals(siteId)) {
                    rs.setStatus(RequestSite.SelectionStatus.INQUIRY_SENT);
                    rsRepo.save(rs);
                }
            }
        }
    }

    // ============================================================
    // Step 3: Trạng thái inquiry theo site
    // ============================================================
    @Override
    public Map<Integer, InquiryStatusDTO> getInquiryStatus(Integer requestId) {
        List<StockInquiry> inquiries = siRepo.findByProcessRequestId(requestId);
        Map<Integer, InquiryStatusDTO> result = new HashMap<>();

        for (StockInquiry si : inquiries) {
            List<StockInquiryItem> items = siiRepo.findByStockInquiryId(si.getId());
            InquiryStatusDTO dto = new InquiryStatusDTO();
            dto.siteId = si.getSite().getId();
            dto.siteCode = si.getSite().getCode();
            dto.siteName = si.getSite().getName();
            dto.timeoutAt = si.getTimeoutAt() != null ? si.getTimeoutAt().toString() : null;

            int total = items.size();
            int responded = (int) items.stream().filter(i -> i.getQuantity() > 0).count();
            dto.totalItems = total;
            dto.respondedCount = responded;

            if (si.getStatus() == StockInquiry.InquiryStatus.TIMEOUT) {
                dto.status = "TIMEOUT";
            } else if (responded == total && total > 0) {
                dto.status = "RESPONDED";
            } else if (responded > 0) {
                dto.status = "PARTIAL";
            } else {
                dto.status = "PENDING";
            }

            if (si.getRespondedAt() != null) {
                dto.respondedAt = si.getRespondedAt().toString();
            }

            result.put(si.getSite().getId(), dto);
        }
        return result;
    }

    // ============================================================
    // Step 4: Inventory matrix
    // ============================================================
    @Override
    public Map<Integer, Map<Integer, StockInfoDTO>> getInventoryMatrix(Integer requestId) {
        return inquiryService.getInventoryMatrix(requestId);
    }

    // ============================================================
    // Tạo PO batch
    // ============================================================
    @Override
    @Transactional
    public List<PurchaseOrderDTO> createPOBatch(Integer requestId, CreatePOBatchRequest request) {
        if (request == null || request.orders == null || request.orders.isEmpty()) {
            throw new IllegalArgumentException("Phải có ít nhất 1 đơn đặt hàng (PO)");
        }

        ProcessRequest pr = prRepo.findById(requestId).orElseThrow();
        List<PurchaseOrderDTO> createdPOs = new ArrayList<>();

        Map<Integer, Map<Integer, StockInfoDTO>> matrix = inquiryService.getInventoryMatrix(requestId);

        for (CreatePORequest order : request.orders) {
            Site site = siteRepo.findById(order.siteId).orElseThrow();

            String code = "PO-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                    + "-" + String.format("%03d", new Random().nextInt(999));

            PurchaseOrder po = new PurchaseOrder();
            po.setCode(code);
            po.setProcessRequest(pr);
            po.setSite(site);
            po.setDeliveryMethod(PurchaseOrder.DeliveryMethod.valueOf(
                    order.deliveryMethod != null ? order.deliveryMethod : "SHIP"));
            if (order.expectedDelivery != null) {
                po.setExpectedDelivery(LocalDate.parse(order.expectedDelivery));
            }
            po.setStatus(PurchaseOrder.POStatus.SENT);
            poRepo.save(po);

            if (order.items != null) {
                for (POItemRequest item : order.items) {
                    if (matrix.containsKey(site.getId()) && matrix.get(site.getId()).containsKey(item.merchandiseId)) {
                        StockInfoDTO stockInfo = matrix.get(site.getId()).get(item.merchandiseId);
                        if ("inquiry".equals(stockInfo.source) && item.quantity > stockInfo.quantity) {
                            throw new RuntimeException(
                                "Quantity " + item.quantity + " exceeds available stock " + stockInfo.quantity
                                + " for merchandise at Site " + site.getCode()
                            );
                        }
                    }
                    PODetail pod = new PODetail();
                    pod.setPurchaseOrder(po);
                    pod.setMerchandise(mRepo.findById(item.merchandiseId).orElseThrow());
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
            dto.expectedDelivery = po.getExpectedDelivery() != null ? po.getExpectedDelivery().toString() : null;
            dto.createdAt = po.getCreatedAt() != null ? po.getCreatedAt().toString() : null;
            createdPOs.add(dto);
        }

        // Nếu tất cả assignments đã responded, đánh dấu request DONE
        List<RequestSite> picked = rsRepo.findByRequestAndStatus(requestId, RequestSite.SelectionStatus.PICKED);
        if (picked.isEmpty()) {
            pr.setStatus(ProcessRequest.RequestStatus.DONE);
            prRepo.save(pr);
        }

        return createdPOs;
    }
}
