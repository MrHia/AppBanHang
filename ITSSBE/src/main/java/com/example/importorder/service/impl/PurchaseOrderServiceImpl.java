package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.event.POConfirmedEvent;
import com.example.importorder.event.PORejectedEvent;
import com.example.importorder.event.POSentEvent;
import com.example.importorder.mapper.PurchaseOrderMapper;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
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
    private final PurchaseOrderMapper mapper;
    private final ApplicationEventPublisher eventPublisher;

    public PurchaseOrderServiceImpl(PurchaseOrderRepository poRepo, PODetailRepository podRepo,
            ProcessRequestRepository prRepo, SiteRepository siteRepo,
            MerchandiseRepository mRepo, IAuditService auditService,
            INotificationService notificationService, IEmailService emailService,
            PurchaseOrderMapper mapper, ApplicationEventPublisher eventPublisher) {
        this.poRepo = poRepo;
        this.podRepo = podRepo;
        this.prRepo = prRepo;
        this.siteRepo = siteRepo;
        this.mRepo = mRepo;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public List<PurchaseOrderDTO> getAll() { return mapper.toDTOList(poRepo.findAll()); }

    @Override
    public List<PurchaseOrderDTO> getBySite(Integer siteId) {
        return mapper.toDTOList(poRepo.findBySiteId(siteId));
    }

    @Override
    public List<PurchaseOrderDTO> getByRequest(Integer requestId) {
        return mapper.toDTOList(poRepo.findByProcessRequestId(requestId));
    }

    @Override
    public PurchaseOrderDTO getById(Integer id) { return mapper.toDTO(poRepo.findById(id).orElseThrow()); }

    @Override
    public List<PODetailDTO> getDetails(Integer poId) {
        return mapper.toDetailDTOList(podRepo.findByPurchaseOrderId(poId));
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
        return mapper.toDTO(po);
    }

    @Override
    @Transactional
    public PurchaseOrderDTO update(Integer id, PurchaseOrderDTO dto) {
        PurchaseOrder po = poRepo.findById(id).orElseThrow();
        if (dto.expectedDelivery != null) po.setExpectedDelivery(LocalDate.parse(dto.expectedDelivery));
        if (dto.deliveryMethod != null) po.setDeliveryMethod(PurchaseOrder.DeliveryMethod.valueOf(dto.deliveryMethod));
        if (dto.status != null) po.setStatus(PurchaseOrder.POStatus.valueOf(dto.status)); // admin can thiệp status
        poRepo.save(po);
        return mapper.toDTO(po);
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
        return mapper.toDTO(po);
    }

    @Override
    @Transactional
    public void sendPO(Integer id) {
        PurchaseOrder po = poRepo.findById(id).orElseThrow();
        po.send(); // State pattern: throws if not DRAFT, transitions to SENT
        poRepo.save(po);
        eventPublisher.publishEvent(new POSentEvent(po.getId(), po.getCode()));
    }

    // UC16: When Site confirms PO -> auto-notify WAREHOUSE (via PONotificationListener + POEmailListener)
    @Override
    @Transactional
    public void confirmPO(Integer id) {
        PurchaseOrder po = poRepo.findById(id).orElseThrow();
        po.confirm(); // State pattern: throws if not SENT, transitions to CONFIRMED + sets confirmedAt
        poRepo.save(po);
        eventPublisher.publishEvent(
            new POConfirmedEvent(po.getId(), po.getCode(), po.getSite().getName(), "warehouse@system.com")
        );
    }

    // SRS UC12: PO goes to DRAFT (so Overseas can edit and resend) preserving rejectionReason
    @Override
    @Transactional
    public void rejectPO(Integer id, String reason) {
        PurchaseOrder po = poRepo.findById(id).orElseThrow();
        // State pattern: SENT -> REJECTED -> DRAFT, rejectionReason preserved by RejectedState
        po.reject(reason);
        po.resetFromRejected();
        poRepo.save(po);
        eventPublisher.publishEvent(new PORejectedEvent(po.getId(), po.getCode(), reason));
    }

    @Override
    @Transactional
    public void markDone(Integer id) {
        PurchaseOrder po = poRepo.findById(id).orElseThrow();
        po.markDone(); // State pattern: only CONFIRMED -> DONE
        poRepo.save(po);
    }
}
