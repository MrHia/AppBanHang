package com.example.importorder.service;

import com.example.importorder.dto.*;
import java.util.List;

public interface IWarehouseService {
    List<PurchaseOrderDTO> getConfirmedPOs();
    WarehouseReceiptDTO receiveGoods(Integer poId, Integer receivedById);
    List<ReceiptItemDTO> getReceiptItems(Integer receiptId);
    WarehouseReceiptDTO receiveWithDetail(Integer receiptId, List<ReceiptItemDTO> items);
    List<SiteDiscrepancyDTO> getDiscrepancies(Integer receiptId);
    void resolveDiscrepancy(Integer id, String notes, Integer resolvedById);
    List<SiteDiscrepancyDTO> getDiscrepanciesBySite(Integer siteId);
}
