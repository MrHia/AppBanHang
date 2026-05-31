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

@Service
public class PurchaseOrderServiceImpl implements IPurchaseOrderService {

    private final PurchaseOrderRepository poRepo;
    private final PODetailRepository podRepo;
    private final ProcessRequestRepository prRepo;
    private final SiteRepository siteRepo;
    private final MerchandiseRepository mRepo;
    private final IAuditService auditService;
    private final INotificationService notificationService;
    private final IEmailService emailService;

    public PurchaseOrderServiceImpl(PurchaseOrderRepository poRepo, PODetailRepository podRepo,
            ProcessRequestRepository prRepo, SiteRepository siteRepo,
            MerchandiseRepository mRepo, IAuditService auditService,
            INotificationService notificationService, IEmailService emailService) {
        this.poRepo = poRepo;
        this.podRepo = podRepo;
        this.prRepo = prRepo;
        this.siteRepo = siteRepo;
        this.mRepo = mRepo;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    private PurchaseOrderDTO toDTO(PurchaseOrder po) {
        PurchaseOrderDTO d = new PurchaseOrderDTO();
        d.id = po.getId();
        d.code = po.getCode();
        d.processRequestId = po.getProcessRequest() != null ? po.getProcessRequest().getId() : null;
        d.processRequestCode = po.getProcessRequest() != null ? po.getProcessRequest().getCode() : null;
        d.siteId = po.getSite().getId();
        d.siteCode = po.getSite().getCode();
        d.siteName = po.getSite().getName();
        d.status = po.getStatus().name();
        d.deliveryMethod = po.getDeliveryMethod().name();
        d.expectedDelivery = po.getExpectedDelivery() != null ? po.getExpectedDelivery().toString() : null;
        d.rejectionReason = po.getRejectionReason();
        d.createdAt = po.getCreatedAt() != null ? po.getCreatedAt().toString() : null;
        d.confirmedAt = po.getConfirmedAt() != null ? po.getConfirmedAt().toString() : null;
        return d;
    }

    private PODetailDTO toDetailDTO(PODetail pod) {
        PODetailDTO d = new PODetailDTO();
        d.id = pod.getId();
        d.purchaseOrderId = pod.getPurchaseOrder().getId();
        d.merchandiseId = pod.getMerchandise().getId();
        d.merchandiseCode = pod.getMerchandise().getCode();
        d.merchandiseName = pod.getMerchandise().getName();
        d.quantity = pod.getQuantity();
        d.unit = pod.getUnit();
        return d;
    }

    @Override
    public List<PurchaseOrderDTO> getAll() { return poRepo.findAll().stream().map(this::toDTO).toList(); }

    @Override
    public List<PurchaseOrderDTO> getBySite(Integer siteId) {
        return poRepo.findBySiteId(siteId).stream().map(this::toDTO).toList();
    }

    @Override
    public List<PurchaseOrderDTO> getByRequest(Integer requestId) {
        return poRepo.findByProcessRequestId(requestId).stream().map(this::toDTO).toList();
    }

    @Override
    public PurchaseOrderDTO getById(Integer id) { return toDTO(poRepo.findById(id).orElseThrow()); }

    @Override
    public List<PODetailDTO> getDetails(Integer poId) {
        return podRepo.findByPurchaseOrderId(poId).stream().map(this::toDetailDTO).toList();
    }

    @Override
    @Transactional
    public PurchaseOrderDTO create(PurchaseOrderDTO dto) {
        String code = "PO-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + String.format("%03d", new Random().nextInt(999));
        PurchaseOrder po = new PurchaseOrder();
        po.setCode(code);
        if (dto.processRequestId != null) po.setProcessRequest(prRepo.findById(dto.processRequestId).orElse(null));
        po.setSite(siteRepo.findById(dto.siteId).orElseThrow());
        po.setDeliveryMethod(PurchaseOrder.DeliveryMethod.valueOf(dto.deliveryMethod != null ? dto.deliveryMethod : "SHIP"));
        if (dto.expectedDelivery != null) po.setExpectedDelivery(LocalDate.parse(dto.expectedDelivery));
        po.setStatus(PurchaseOrder.POStatus.DRAFT);
        poRepo.save(po);

        if (dto.details != null) {
            for (PODetailDTO det : dto.details) {
                PODetail pod = new PODetail();
                pod.setPurchaseOrder(po);
                pod.setMerchandise(mRepo.findById(det.merchandiseId).orElseThrow());
                pod.setQuantity(det.quantity);
                pod.setUnit(det.unit);
                podRepo.save(pod);
            }
        }
        return toDTO(po);
    }

    @Override
    @Transactional
    public PurchaseOrderDTO update(Integer id, PurchaseOrderDTO dto) {
        PurchaseOrder po = poRepo.findById(id).orElseThrow();
        if (dto.expectedDelivery != null) po.setExpectedDelivery(LocalDate.parse(dto.expectedDelivery));
        if (dto.deliveryMethod != null) po.setDeliveryMethod(PurchaseOrder.DeliveryMethod.valueOf(dto.deliveryMethod));
        if (dto.status != null) po.setStatus(PurchaseOrder.POStatus.valueOf(dto.status)); // admin can thiệp status
        poRepo.save(po);
        return toDTO(po);
    }

    // UC12: Update PO with items when it is in DRAFT status (after rejection)
    @Override
    @Transactional
    public PurchaseOrderDTO updateWithItems(Integer id, PurchaseOrderDTO dto) {
        PurchaseOrder po = poRepo.findById(id).orElseThrow();
        if (po.getStatus() != PurchaseOrder.POStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT POs can be updated with items");
        }
        if (dto.expectedDelivery != null) po.setExpectedDelivery(LocalDate.parse(dto.expectedDelivery));
        if (dto.deliveryMethod != null) po.setDeliveryMethod(PurchaseOrder.DeliveryMethod.valueOf(dto.deliveryMethod));
        poRepo.save(po);

        if (dto.details != null) {
            // Remove existing items
            podRepo.deleteByPurchaseOrderId(id);
            // Add new items
            for (PODetailDTO det : dto.details) {
                PODetail pod = new PODetail();
                pod.setPurchaseOrder(po);
                pod.setMerchandise(mRepo.findById(det.merchandiseId).orElseThrow());
                pod.setQuantity(det.quantity);
                pod.setUnit(det.unit != null ? det.unit : "piece");
                podRepo.save(pod);
            }
        }
        return toDTO(po);
    }

    @Override
    @Transactional
    public void sendPO(Integer id) {
        PurchaseOrder po = poRepo.findById(id).orElseThrow();
        if (po.getStatus() != PurchaseOrder.POStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT POs can be sent");
        }
        po.setStatus(PurchaseOrder.POStatus.SENT);
        poRepo.save(po);
    }

    // UC16: When Site confirms PO -> auto-notify WAREHOUSE
    @Override
    @Transactional
    public void confirmPO(Integer id) {
        PurchaseOrder po = poRepo.findById(id).orElseThrow();
        if (po.getStatus() != PurchaseOrder.POStatus.SENT) {
            throw new RuntimeException("Only SENT POs can be confirmed");
        }
        po.setStatus(PurchaseOrder.POStatus.CONFIRMED);
        po.setConfirmedAt(LocalDateTime.now());
        poRepo.save(po);

        // SRS UC16: System actor "Hệ thống quản lý kho" automatically recognizes
        // the confirmed PO and creates notification for WAREHOUSE
        notificationService.createNotification(
            "WAREHOUSE",
            "PO đã xác nhận - " + po.getCode(),
            "Site " + po.getSite().getName() + " đã xác nhận PO #" + po.getCode() +
            ". Vui lòng chuẩn bị nhận hàng.",
            "purchase_order",
            po.getId()
        );

        // Also send email notification
        emailService.sendPOConfirmationEmail(
            "warehouse@system.com",
            po.getCode(),
            po.getSite().getName()
        );
    }

    // Fix bug: was setting REJECTED then immediately overwriting with DRAFT
    @Override
    @Transactional
    public void rejectPO(Integer id, String reason) {
        PurchaseOrder po = poRepo.findById(id).orElseThrow();
        if (po.getStatus() != PurchaseOrder.POStatus.SENT) {
            throw new RuntimeException("Only SENT POs can be rejected");
        }
        // SRS UC12: PO goes to DRAFT (so Overseas can edit and resend)
        po.setRejectionReason(reason);
        po.setStatus(PurchaseOrder.POStatus.DRAFT);
        poRepo.save(po);
    }

    @Override
    @Transactional
    public void markDone(Integer id) {
        PurchaseOrder po = poRepo.findById(id).orElseThrow();
        po.setStatus(PurchaseOrder.POStatus.DONE);
        poRepo.save(po);
    }
}
