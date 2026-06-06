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
    private final SiteMerchandiseRepository smRepo;
    private final MerchandiseRepository mRepo;
    private final IAuditService auditService;
    private final INotificationService notificationService;
    private final IEmailService emailService;
    private final PurchaseOrderMapper mapper;
    private final ApplicationEventPublisher eventPublisher;

    public PurchaseOrderServiceImpl(PurchaseOrderRepository poRepo, PODetailRepository podRepo,
            ProcessRequestRepository prRepo, SiteRepository siteRepo,
            SiteMerchandiseRepository smRepo,
            MerchandiseRepository mRepo, IAuditService auditService,
            INotificationService notificationService, IEmailService emailService,
            PurchaseOrderMapper mapper, ApplicationEventPublisher eventPublisher) {
        this.poRepo = poRepo;
        this.podRepo = podRepo;
        this.prRepo = prRepo;
        this.siteRepo = siteRepo;
        this.smRepo = smRepo;
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
        if (dto.status != null) po.setStatus(PurchaseOrder.POStatus.valueOf(dto.status));
        poRepo.save(po);
        return mapper.toDTO(po);
    }

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
            podRepo.deleteByPurchaseOrderId(id);
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
        po.send();
        poRepo.save(po);
        eventPublisher.publishEvent(new POSentEvent(po.getId(), po.getCode()));
    }

    @Override
    @Transactional
    public void confirmPO(Integer id) {
        PurchaseOrder po = poRepo.findById(id).orElseThrow();
        po.confirm();
        poRepo.save(po);
        eventPublisher.publishEvent(
            new POConfirmedEvent(po.getId(), po.getCode(), po.getSite().getName(), "warehouse@system.com")
        );
    }

    /**
     * Cancel a PO and cascade the cancellation to the parent ProcessRequest and
     * all sibling POs of the same request.
     *
     * Why: business rule — once any PO of a request is cancelled, the whole
     * request is treated as cancelled (the merchandise allocation no longer
     * matches what Sales asked for). Stock that was deducted at PO creation
     * time is restored on each cancelled non-DRAFT sibling.
     *
     * The cascade is idempotent: re-cancelling an already-REJECTED PO short-
     * circuits at the state machine (`REJECTED is terminal`).
     */
    @Override
    @Transactional
    public void rejectPO(Integer id, String reason) {
        PurchaseOrder po = poRepo.findById(id).orElseThrow();
        PurchaseOrder.POStatus prevStatus = po.getStatus();

        po.reject(reason);
        poRepo.save(po);

        if (consumedStock(prevStatus)) {
            restoreStockForPO(po);
        }

        eventPublisher.publishEvent(new PORejectedEvent(po.getId(), po.getCode(), reason));

        cascadeCancelRequest(po.getProcessRequest(), po, reason);
    }

    @Override
    @Transactional
    public void markDone(Integer id) {
        PurchaseOrder po = poRepo.findById(id).orElseThrow();
        po.markDone();
        poRepo.save(po);
    }

    /**
     * Cancel the parent ProcessRequest and every sibling PO. Stock is
     * restored for any sibling that had previously consumed it (SENT or
     * CONFIRMED). Already-terminal siblings (REJECTED / DONE) are skipped.
     */
    private void cascadeCancelRequest(ProcessRequest pr, PurchaseOrder triggerPo, String reason) {
        if (pr == null) return;
        if (pr.getStatus() == ProcessRequest.RequestStatus.CANCELLED) return;

        pr.setStatus(ProcessRequest.RequestStatus.CANCELLED);
        prRepo.save(pr);
        auditService.log(null, "REQUEST_CANCELLED_CASCADE", "process_request", pr.getId(),
            "Cancelled because PO " + triggerPo.getCode() + " was rejected: " + reason);

        for (PurchaseOrder sibling : poRepo.findByProcessRequestId(pr.getId())) {
            if (Objects.equals(sibling.getId(), triggerPo.getId())) continue;
            PurchaseOrder.POStatus prev = sibling.getStatus();
            if (prev == PurchaseOrder.POStatus.REJECTED || prev == PurchaseOrder.POStatus.DONE) continue;

            String siblingReason = "Cascaded from PO " + triggerPo.getCode() + ": " + reason;
            sibling.reject(siblingReason);
            poRepo.save(sibling);
            if (consumedStock(prev)) {
                restoreStockForPO(sibling);
            }
            auditService.log(null, "PO_CANCELLED_CASCADE", "purchase_order", sibling.getId(), siblingReason);
        }

        notificationService.createNotification(
            "OVERSEAS",
            "Request " + pr.getCode() + " cancelled",
            "PO " + triggerPo.getCode() + " was cancelled — the parent request and all sibling POs were cancelled (stock restored).",
            "process_request",
            pr.getId()
        );
    }

    private boolean consumedStock(PurchaseOrder.POStatus status) {
        return status == PurchaseOrder.POStatus.SENT || status == PurchaseOrder.POStatus.CONFIRMED;
    }

    private void restoreStockForPO(PurchaseOrder po) {
        if (po.getSite() == null) return;
        Integer siteId = po.getSite().getId();
        for (PODetail d : podRepo.findByPurchaseOrderId(po.getId())) {
            Integer merchId = d.getMerchandise() != null ? d.getMerchandise().getId() : null;
            if (merchId == null) continue;
            smRepo.findBySiteIdAndMerchandiseId(siteId, merchId).ifPresent(sm -> {
                int curr = sm.getStockQuantity() != null ? sm.getStockQuantity() : 0;
                sm.setStockQuantity(curr + d.getQuantity());
                smRepo.save(sm);
            });
        }
    }
}
