package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.event.DiscrepancyCreatedEvent;
import com.example.importorder.mapper.PurchaseOrderMapper;
import com.example.importorder.mapper.WarehouseMapper;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import org.springframework.context.ApplicationEventPublisher;
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
    private final WarehouseMapper mapper;
    private final PurchaseOrderMapper poMapper;
    private final ApplicationEventPublisher eventPublisher;

    public WarehouseServiceImpl(WarehouseReceiptRepository wrRepo, ReceiptItemRepository riRepo,
            PODetailRepository podRepo, PurchaseOrderRepository poRepo,
            SiteDiscrepancyRepository discRepo, DiscrepancyMessageRepository msgRepo,
            AccountRepository accRepo, INotificationService notificationService, IEmailService emailService,
            WarehouseMapper mapper, PurchaseOrderMapper poMapper,
            ApplicationEventPublisher eventPublisher) {
        this.wrRepo = wrRepo;
        this.riRepo = riRepo;
        this.podRepo = podRepo;
        this.poRepo = poRepo;
        this.discRepo = discRepo;
        this.msgRepo = msgRepo;
        this.accRepo = accRepo;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.mapper = mapper;
        this.poMapper = poMapper;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public List<PurchaseOrderDTO> getConfirmedPOs() {
        // SRP — feature envy fix: dùng PurchaseOrderMapper thay vì inline DTO mapping ở đây.
        return poMapper.toDTOList(
            poRepo.findAll().stream()
                .filter(po -> po.getStatus() == PurchaseOrder.POStatus.CONFIRMED)
                .toList()
        );
    }

    @Override
    @Transactional
    public WarehouseReceiptDTO receiveGoods(Integer poId, Integer receivedById) {
        PurchaseOrder po = poRepo.findById(poId).orElseThrow(() -> new RuntimeException("Purchase order not found"));
        // Idempotent: nếu PO đã có phiếu nhận thì DÙNG LẠI, không tạo mới
        // (chống spam bấm "Nhận hàng" tạo nhiều phiếu / nhiều discrepancy).
        List<WarehouseReceipt> existing = wrRepo.findByPurchaseOrderId(poId);
        if (!existing.isEmpty()) return mapper.toDTO(existing.get(0));

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
        return mapper.toDTO(wr);
    }

    @Override
    public List<ReceiptItemDTO> getReceiptItems(Integer receiptId) {
        return mapper.toReceiptItemDTOList(riRepo.findByWarehouseReceiptId(receiptId));
    }

    @Override
    @Transactional
    public WarehouseReceiptDTO receiveWithDetail(Integer receiptId, List<ReceiptItemDTO> items) {
        WarehouseReceipt wr = wrRepo.findById(receiptId).orElseThrow();
        // Chặn xác nhận lặp: chỉ cho xác nhận khi phiếu còn PENDING
        // (nếu không, spam nút "Xác nhận" sẽ tạo discrepancy + notification site nhiều lần).
        if (wr.getStatus() != WarehouseReceipt.ReceiptStatus.PENDING) {
            throw new RuntimeException("Phiếu nhận đã được xác nhận trước đó, không thể xác nhận lại");
        }
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

                // SRS UC19 + UC16: publish DiscrepancyCreatedEvent — POEmailListener sends site email,
                // PONotificationListener creates WAREHOUSE notification.
                String siteEmail = wr.getPurchaseOrder().getSite().getEmail();
                String siteName = wr.getPurchaseOrder().getSite().getName();
                int shortage = item.receivedQuantity < ri.getOrderedQuantity()
                    ? ri.getOrderedQuantity() - item.receivedQuantity : 0;
                eventPublisher.publishEvent(new DiscrepancyCreatedEvent(
                    wr.getPurchaseOrder().getId(), poCode, siteEmail, siteName,
                    ri.getMerchandise().getName(), shortage
                ));
            }
        }

        if (hasDiscrepancy) {
            wr.setStatus(WarehouseReceipt.ReceiptStatus.RESOLVING);
            wrRepo.save(wr);
        } else {
            // Nhận đủ, không chênh lệch → đóng phiếu VÀ đóng đơn PO luôn
            wr.setStatus(WarehouseReceipt.ReceiptStatus.DONE);
            wrRepo.save(wr);
            PurchaseOrder po = wr.getPurchaseOrder();
            po.setStatus(PurchaseOrder.POStatus.DONE);
            poRepo.save(po);
            notificationService.createNotification(
                "WAREHOUSE",
                "PO đã hoàn tất - " + poCode,
                "PO #" + poCode + " đã nhận đủ hàng, không chênh lệch. Đơn đã đóng (DONE).",
                "purchase_order", po.getId()
            );
        }
        return mapper.toDTO(wr);
    }

    @Override
    public List<SiteDiscrepancyDTO> getDiscrepancies(Integer receiptId) {
        return mapper.toDiscrepancyDTOList(discRepo.findByWarehouseReceiptId(receiptId));
    }

    @Override
    public List<SiteDiscrepancyDTO> getAllDiscrepancies() {
        List<SiteDiscrepancyDTO> result = new ArrayList<>();
        for (SiteDiscrepancy sd : discRepo.findAll()) {
            // Mapper xử lý base fields, service compose cross-aggregate fields (poCode, processRequestCode,
            // siteName, orderedQuantity, receivedQuantity) — đây là "view query" cross multiple aggregates.
            SiteDiscrepancyDTO d = mapper.toDiscrepancyDTO(sd);
            WarehouseReceipt wr = sd.getWarehouseReceipt();
            if (wr != null && wr.getPurchaseOrder() != null) {
                d.poCode = wr.getPurchaseOrder().getCode();
                if (wr.getPurchaseOrder().getProcessRequest() != null) d.processRequestCode = wr.getPurchaseOrder().getProcessRequest().getCode();
                if (wr.getPurchaseOrder().getSite() != null) d.siteName = wr.getPurchaseOrder().getSite().getName();
                // lấy số đặt / thực nhận từ receipt item khớp mặt hàng
                riRepo.findByWarehouseReceiptId(wr.getId()).stream()
                    .filter(ri -> ri.getMerchandise().getId().equals(sd.getMerchandise().getId()))
                    .findFirst()
                    .ifPresent(ri -> { d.orderedQuantity = ri.getOrderedQuantity(); d.receivedQuantity = ri.getReceivedQuantity(); });
            }
            result.add(d);
        }
        result.sort((a, b) -> Integer.compare(b.id, a.id)); // mới nhất trước
        return result;
    }

    @Override
    public List<SiteDiscrepancyDTO> getDiscrepanciesBySite(Integer siteId) {
        return mapper.toDiscrepancyDTOList(discRepo.findBySiteId(siteId));
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
