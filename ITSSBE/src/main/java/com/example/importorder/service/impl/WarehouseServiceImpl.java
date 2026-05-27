package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class WarehouseServiceImpl implements IWarehouseService {

    private final WarehouseReceiptRepository wrRepo;
    private final ReceiptItemRepository riRepo;
    private final PODetailRepository podRepo;
    private final PurchaseOrderRepository poRepo;
    private final SiteDiscrepancyRepository discRepo;
    private final DiscrepancyMessageRepository msgRepo;
    private final AccountRepository accRepo;
    private final INotificationService notificationService;
    private final IEmailService emailService;

    public WarehouseServiceImpl(WarehouseReceiptRepository wrRepo, ReceiptItemRepository riRepo,
            PODetailRepository podRepo, PurchaseOrderRepository poRepo,
            SiteDiscrepancyRepository discRepo, DiscrepancyMessageRepository msgRepo,
            AccountRepository accRepo, INotificationService notificationService, IEmailService emailService) {
        this.wrRepo = wrRepo;
        this.riRepo = riRepo;
        this.podRepo = podRepo;
        this.poRepo = poRepo;
        this.discRepo = discRepo;
        this.msgRepo = msgRepo;
        this.accRepo = accRepo;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    private WarehouseReceiptDTO toDTO(WarehouseReceipt wr) {
        WarehouseReceiptDTO d = new WarehouseReceiptDTO();
        d.id = wr.getId();
        d.purchaseOrderId = wr.getPurchaseOrder().getId();
        d.purchaseOrderCode = wr.getPurchaseOrder().getCode();
        d.receivedAt = wr.getReceivedAt() != null ? wr.getReceivedAt().toString() : null;
        d.receivedById = wr.getReceivedBy().getId();
        d.receivedByName = wr.getReceivedBy().getFirstName() + " " + wr.getReceivedBy().getLastName();
        d.status = wr.getStatus().name();
        return d;
    }

    private ReceiptItemDTO toReceiptDTO(ReceiptItem ri) {
        ReceiptItemDTO d = new ReceiptItemDTO();
        d.id = ri.getId();
        d.warehouseReceiptId = ri.getWarehouseReceipt().getId();
        d.merchandiseId = ri.getMerchandise().getId();
        d.merchandiseName = ri.getMerchandise().getName();
        d.orderedQuantity = ri.getOrderedQuantity();
        d.receivedQuantity = ri.getReceivedQuantity();
        return d;
    }

    private SiteDiscrepancyDTO toDiscDTO(SiteDiscrepancy sd) {
        SiteDiscrepancyDTO d = new SiteDiscrepancyDTO();
        d.id = sd.getId();
        d.warehouseReceiptId = sd.getWarehouseReceipt().getId();
        d.merchandiseId = sd.getMerchandise().getId();
        d.merchandiseName = sd.getMerchandise().getName();
        d.shortage = sd.getShortage();
        d.excess = sd.getExcess();
        d.resolutionNotes = sd.getResolutionNotes();
        d.status = sd.getStatus().name();
        d.resolvedById = sd.getResolvedBy() != null ? sd.getResolvedBy().getId() : null;
        d.resolvedByName = sd.getResolvedBy() != null
            ? sd.getResolvedBy().getFirstName() + " " + sd.getResolvedBy().getLastName()
            : null;
        d.resolvedAt = sd.getResolvedAt() != null ? sd.getResolvedAt().toString() : null;
        return d;
    }

    @Override
    public List<PurchaseOrderDTO> getConfirmedPOs() {
        return poRepo.findAll().stream()
            .filter(po -> "CONFIRMED".equals(po.getStatus().name()))
            .map(po -> {
                PurchaseOrderDTO d = new PurchaseOrderDTO();
                d.id = po.getId();
                d.code = po.getCode();
                d.siteId = po.getSite().getId();
                d.siteCode = po.getSite().getCode();
                d.siteName = po.getSite().getName();
                d.expectedDelivery = po.getExpectedDelivery() != null ? po.getExpectedDelivery().toString() : null;
                d.status = po.getStatus().name();
                d.deliveryMethod = po.getDeliveryMethod().name();
                return d;
            }).toList();
    }

    @Override
    @Transactional
    public WarehouseReceiptDTO receiveGoods(Integer poId, Integer receivedById) {
        PurchaseOrder po = poRepo.findById(poId).orElseThrow(() -> new RuntimeException("Purchase order not found"));
        Account receiver = accRepo.findById(receivedById).orElseThrow(() -> new RuntimeException("Account not found"));
        WarehouseReceipt wr = new WarehouseReceipt();
        wr.setPurchaseOrder(po);
        wr.setReceivedBy(receiver);
        wr.setStatus(WarehouseReceipt.ReceiptStatus.PENDING);
        wrRepo.save(wr);

        for (PODetail pod : podRepo.findByPurchaseOrderId(poId)) {
            ReceiptItem ri = new ReceiptItem();
            ri.setWarehouseReceipt(wr);
            ri.setMerchandise(pod.getMerchandise());
            ri.setOrderedQuantity(pod.getQuantity());
            ri.setReceivedQuantity(0);
            riRepo.save(ri);
        }
        return toDTO(wr);
    }

    @Override
    public List<ReceiptItemDTO> getReceiptItems(Integer receiptId) {
        return riRepo.findByWarehouseReceiptId(receiptId).stream().map(this::toReceiptDTO).toList();
    }

    @Override
    @Transactional
    public WarehouseReceiptDTO receiveWithDetail(Integer receiptId, List<ReceiptItemDTO> items) {
        WarehouseReceipt wr = wrRepo.findById(receiptId).orElseThrow();
        boolean hasDiscrepancy = false;
        String poCode = wr.getPurchaseOrder().getCode();

        for (ReceiptItemDTO item : items) {
            ReceiptItem ri = riRepo.findById(item.id).orElseThrow();
            ri.setReceivedQuantity(item.receivedQuantity);
            riRepo.save(ri);

            if (!ri.getOrderedQuantity().equals(item.receivedQuantity)) {
                hasDiscrepancy = true;
                SiteDiscrepancy sd = new SiteDiscrepancy();
                sd.setWarehouseReceipt(wr);
                sd.setMerchandise(ri.getMerchandise());
                if (item.receivedQuantity < ri.getOrderedQuantity()) {
                    sd.setShortage(ri.getOrderedQuantity() - item.receivedQuantity);
                } else {
                    sd.setExcess(item.receivedQuantity - ri.getOrderedQuantity());
                }
                sd.setStatus(SiteDiscrepancy.DiscrepancyStatus.OPEN);
                discRepo.save(sd);

                // SRS UC19: Notify site about discrepancy
                String siteEmail = wr.getPurchaseOrder().getSite().getEmail();
                String siteName = wr.getPurchaseOrder().getSite().getName();
                int shortage = item.receivedQuantity < ri.getOrderedQuantity()
                    ? ri.getOrderedQuantity() - item.receivedQuantity : 0;
                if (shortage > 0) {
                    emailService.sendDiscrepancyNotification(siteEmail, poCode, ri.getMerchandise().getName(), shortage);
                }

                // SRS UC16: Create system notification for WAREHOUSE
                notificationService.createNotification(
                    "WAREHOUSE",
                    "Chênh lệch hàng hóa - " + poCode,
                    "PO #" + poCode + ": " + ri.getMerchandise().getName() +
                    " thiếu " + shortage + " chiếc. Vui lòng phối hợp với Site " + siteName + " giải quyết.",
                    "purchase_order", wr.getPurchaseOrder().getId()
                );
            }
        }

        wr.setStatus(hasDiscrepancy ? WarehouseReceipt.ReceiptStatus.RESOLVING : WarehouseReceipt.ReceiptStatus.DONE);
        wrRepo.save(wr);
        return toDTO(wr);
    }

    @Override
    public List<SiteDiscrepancyDTO> getDiscrepancies(Integer receiptId) {
        return discRepo.findByWarehouseReceiptId(receiptId).stream().map(this::toDiscDTO).toList();
    }

    @Override
    public List<SiteDiscrepancyDTO> getDiscrepanciesBySite(Integer siteId) {
        return discRepo.findBySiteId(siteId).stream().map(this::toDiscDTO).toList();
    }

    @Override
    @Transactional
    public void resolveDiscrepancy(Integer id, String notes, Integer resolvedById) {
        SiteDiscrepancy sd = discRepo.findById(id).orElseThrow(() -> new RuntimeException("Discrepancy not found"));
        sd.setResolutionNotes(notes);
        Account resolver = resolvedById != null ? accRepo.findById(resolvedById).orElse(null) : null;
        sd.setResolvedBy(resolver);
        sd.setResolvedAt(LocalDateTime.now());
        sd.setStatus(SiteDiscrepancy.DiscrepancyStatus.RESOLVED);
        discRepo.save(sd);

        // SRS UC19: Mark PO as DONE when all discrepancies are resolved
        WarehouseReceipt wr = sd.getWarehouseReceipt();
        List<SiteDiscrepancy> allDiscs = discRepo.findByWarehouseReceiptId(wr.getId());
        boolean allResolved = allDiscs.stream()
            .allMatch(d -> d.getStatus() == SiteDiscrepancy.DiscrepancyStatus.RESOLVED);
        if (allResolved) {
            wr.setStatus(WarehouseReceipt.ReceiptStatus.DONE);
            wrRepo.save(wr);

            PurchaseOrder po = wr.getPurchaseOrder();
            po.setStatus(PurchaseOrder.POStatus.DONE);
            poRepo.save(po);

            notificationService.createNotification(
                "WAREHOUSE",
                "PO đã hoàn tất - " + po.getCode(),
                "Tất cả chênh lệch cho PO #" + po.getCode() + " đã được giải quyết. PO đã DONE.",
                "purchase_order", po.getId()
            );
        }
    }
}
